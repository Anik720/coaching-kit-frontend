'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './Salary.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { toastManager } from '@/utils/toastConfig';
import { fetchEmployees } from '@/api/employeeApi/employeeSlice';
import { fetchTeachers } from '@/api/teacherApi/teacherSlice';
import { createSalary } from '@/api/salaryApi/salarySlice';
import { fetchStaffAttendances } from '@/api/employeeAttendanceApi/employeeAttendanceSlice';
import { fetchTeacherAttendances } from '@/api/teacherAttendanceApi/teacherAttendanceSlice';
import { fetchAssignments } from '@/api/teacherApi/teacherSlice';

export default function CreateSalaryForm() {
  const dispatch = useDispatch<any>();
  const { employees, loading: empLoading } = useSelector((state: any) => state.employee);
  const { teachers, loading: teacherLoading } = useSelector((state: any) => state.teacher);
  const { attendances: empAttendances, loading: empAttLoading } = useSelector((state: any) => state.staffAttendance);
  const { attendances: teacherAttendances, loading: teacherAttLoading } = useSelector((state: any) => state.teacherAttendance);
  const { loading: payLoading } = useSelector((state: any) => state.salary);

  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    userType: 'staff' as 'staff' | 'teacher',
    userId: '',
    month: '',
    allowance: 0,
    method: 'cash' as 'cash' | 'bank' | 'mobile_banking',
  });

  const [calculation, setCalculation] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchEmployees({ limit: 1000 }));
    dispatch(fetchTeachers({ limit: 1000 }));
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'userType') {
      setFormData(prev => ({ ...prev, userId: '' }));
      setStep(1);
    }
    if (e.target.name === 'month' || e.target.name === 'userId') {
      setStep(1); // Back to calculation if they change input
    }
  };

  const getOptions = () => formData.userType === 'staff' ? employees : teachers;
  const selectedUser = useMemo(() => getOptions()?.find((u: any) => u._id === formData.userId), [formData.userId, employees, teachers, formData.userType]);

  const calculateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId) return toastManager.showError('Please select a staff member first');
    if (!formData.month) return toastManager.showError('Please select a month');

    const tid = toastManager.showLoading('Calculating salary details...');

    // Fetch attendance based on type and month to calculate days
    // The backend might not support start/end date filters natively depending on implementation, 
    // so we will fetch and filter client-side for strict accuracy.
    try {
      // Fetch attendance without strict employee param, because the backend filter might not interpret ObjectId properly in some controller setups.
      let fetchedAtts: any[] = [];
      if (formData.userType === 'staff') {
        const res: any = await dispatch(fetchStaffAttendances({ limit: 5000 })).unwrap();
        fetchedAtts = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : (Array.isArray(res.items) ? res.items : []));
      } else {
        const res: any = await dispatch(fetchTeacherAttendances({ limit: 5000 })).unwrap();
        fetchedAtts = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : (Array.isArray(res.items) ? res.items : []));
      }

      // Completely bulletproof lookup matching: checking if stringified object contains ID.
      // This bypasses any inconsistencies in whether `employee` is an ID string, an unpopulated ObjectId, or a populated document.
      const userAtts = fetchedAtts.filter(a => {
        try {
          return JSON.stringify(a).includes(formData.userId);
        } catch {
          return false;
        }
      });

      const [year, month] = formData.month.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();

      let presentDays = 0;
      let absentDays = daysInMonth;
      let offDays = 0;
      let leaveDays = 0;

      if (userAtts.length > 0) {
         // Bulletproof date matching by formatting any unknown `new Date()` format back into YYYY-MM string
         const monthMatch = userAtts.filter((a: any) => {
           if (!a.date) return false;
           if (a.date.startsWith(formData.month)) return true;
           try {
             return new Date(a.date).toISOString().startsWith(formData.month);
           } catch {
             return false;
           }
         });
         if (formData.userType === 'staff') {
           presentDays = monthMatch.filter((a: any) => a.status === 'Present').length;
           leaveDays = monthMatch.filter((a: any) => a.status === 'Leave').length;
           offDays = monthMatch.filter((a: any) => a.status === 'Off Day').length;
           
           const explicitAbsents = monthMatch.filter((a: any) => a.status === 'Absent').length;
           absentDays = Math.max(explicitAbsents, daysInMonth - presentDays - leaveDays - offDays);
         } else {
           // For Teachers: Attendance represents classes rather than simple present/absent strings.
           // They might have multiple records a day, or one record with attendedClasses > 0.
           const presentDates = new Set();
           monthMatch.forEach((a: any) => {
             if (a.attendedClasses > 0 || a.status === 'Present') {
               try {
                 const d = new Date(a.date).toISOString().split('T')[0];
                 presentDates.add(d);
               } catch {
                 presentDates.add(a.date);
               }
             }
           });
           presentDays = presentDates.size;
           leaveDays = monthMatch.filter((a: any) => a.status === 'Leave').length;
           offDays = monthMatch.filter((a: any) => a.status === 'Off Day').length;
           
           const explicitAbsents = monthMatch.filter((a: any) => a.status === 'Absent' || (a.attendedClasses === 0 && a.totalClasses > 0)).length;
           absentDays = Math.max(explicitAbsents, daysInMonth - presentDays - leaveDays - offDays);
         }
      }

      // --- Base Salary ---
      // For Staff: use the salary field on their profile.
      // For Teachers: sum up all active assignments since they're paid per assignment, not flat salary.
      let baseSalary = selectedUser?.salary || 0;
      let assignmentNote = '';
      let perDaySalary = 0;
      let deduction = 0;
      let payableAfterDeduction = 0;

      if (formData.userType === 'teacher') {
        try {
          // Fetch ALL assignments for this teacher without status filter, so we can check
          const assignRes: any = await dispatch(fetchAssignments({ teacher: formData.userId, limit: 500 })).unwrap();
          const allAssignments: any[] = assignRes?.assignments || [];
          const activeAssignments = allAssignments.filter((a: any) => a.status === 'active' || a.status === 'Active' || a.status === 'ACTIVE');
          
          console.debug('[Salary Calc] Total assignments fetched:', allAssignments.length, 'active:', activeAssignments.length);
          console.debug('[Salary Calc] Raw assignments:', JSON.stringify(allAssignments));
          
          if (activeAssignments.length > 0) {
            baseSalary = activeAssignments.reduce((sum: number, a: any) => sum + (Number(a.amount) || 0), 0);
            assignmentNote = `Calculated from ${activeAssignments.length} active assignment(s)`;
          } else if (allAssignments.length > 0) {
            // No active ones, use all
            baseSalary = allAssignments.reduce((sum: number, a: any) => sum + (Number(a.amount) || 0), 0);
            assignmentNote = `Calculated from ${allAssignments.length} assignment(s)`;
          }
          
          // For Teachers: if they have assignments, pay for PRESENT DAYS proportionally
          // Teacher gets: (baseSalary / daysInMonth) * presentDays
          // This is more logical than deducting absent days from flat salary
          perDaySalary = baseSalary > 0 ? (baseSalary / daysInMonth) : 0;
          payableAfterDeduction = Math.round(perDaySalary * presentDays * 100) / 100;
          deduction = Math.round((baseSalary - payableAfterDeduction) * 100) / 100;
        } catch (err) {
          console.warn('Assignment fetch failed, using profile salary:', err);
          perDaySalary = baseSalary > 0 ? (baseSalary / daysInMonth) : 0;
          deduction = absentDays * perDaySalary;
          payableAfterDeduction = Math.max(0, baseSalary - deduction);
        }
      } else {
        // Staff: classic deduction model
        perDaySalary = baseSalary > 0 ? (baseSalary / daysInMonth) : 0;
        deduction = Math.round(absentDays * perDaySalary * 100) / 100;
        payableAfterDeduction = Math.max(0, baseSalary - deduction);
      }
      
      console.debug('[Salary Calc] baseSalary:', baseSalary, 'perDaySalary:', perDaySalary, 'presentDays:', presentDays, 'deduction:', deduction, 'payable:', payableAfterDeduction);
      
      // Assuming advance deducted might be fetched from another API, using 0 for now
      const advanceDeducted = 0;
      const finalPayable = payableAfterDeduction - advanceDeducted;

      setCalculation({
        baseSalary,
        perDaySalary,
        presentDays,
        absentDays,
        leaveDays,
        offDays,
        deduction,
        payableAfterDeduction,
        advanceDeducted,
        finalPayable
      });

      toastManager.safeUpdateToast(tid, 'Calculation complete', 'success');
      setStep(2);
    } catch (error) {
      toastManager.safeUpdateToast(tid, 'Failed to calculate attendance', 'error');
    }
  };

  const handleConfirmPay = async () => {
    if (!calculation) return;

    const tid = toastManager.showLoading('Processing salary payment...');
    const finalAmount = calculation.finalPayable + Number(formData.allowance || 0);

    try {
      await dispatch(createSalary({
        userType: formData.userType,
        userId: formData.userId,
        month: formData.month,
        amount: finalAmount,
        paymentType: 'regular',
        method: formData.method,
        note: `Attendance deduction: ৳${calculation.deduction.toFixed(2)}. Allowance: ৳${formData.allowance}.`,
      })).unwrap();

      toastManager.updateToast(tid, 'Successfully Paid Salary!', 'success');
      setStep(1);
      setFormData(prev => ({ ...prev, userId: '', month: '', allowance: 0 }));
    } catch (error: any) {
      toastManager.safeUpdateToast(tid, error || 'Failed to process payment', 'error');
    }
  };

  const isLoading = empLoading || teacherLoading || empAttLoading || teacherAttLoading || payLoading;

  return (
    <div className={styles.pageContainer}>
      <div style={{ maxWidth: '650px', margin: '40px auto', background: 'transparent' }}>
        
        {step === 1 && (
          <div style={{ background: 'white', padding: '32px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
              Calculate {formData.userType === 'staff' ? 'Staff' : 'Teacher'} Salary
            </h2>
            
            <form onSubmit={calculateSalary}>
              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                <span style={{ fontSize: '15px', color: '#374151', fontWeight: 500 }}>Select Type:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#374151' }}>
                  <input type="radio" name="userType" value="staff" checked={formData.userType === 'staff'} onChange={handleChange} /> Staff
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#374151' }}>
                  <input type="radio" name="userType" value="teacher" checked={formData.userType === 'teacher'} onChange={handleChange} /> Teacher
                </label>
              </div>

              <div style={{ marginBottom: '0' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#4b5563', fontWeight: 500 }}>
                  Select {formData.userType === 'staff' ? 'Staff' : 'Teacher'}
                </label>
                <select 
                  name="userId" 
                  value={formData.userId} 
                  onChange={handleChange} 
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '6px 6px 0 0', marginBottom: '-1px', outline: 'none', background: 'white', fontSize: '15px' }}
                  disabled={isLoading}
                >
                  <option value="">-- Choose {formData.userType === 'staff' ? 'Staff' : 'Teacher'} --</option>
                  {getOptions()?.map((user: any) => (
                    <option key={user._id} value={user._id}>{user.fullName}</option>
                  ))}
                </select>
                
                <input 
                  type="month" 
                  name="month" 
                  value={formData.month} 
                  onChange={handleChange} 
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '0 0 6px 6px', outline: 'none', fontSize: '15px', marginBottom: '24px' }}
                />
              </div>

              <button 
                type="submit"
                style={{ width: '100%', padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '16px', cursor: 'pointer' }}
                disabled={isLoading}
              >
                Calculate Salary
              </button>
            </form>
          </div>
        )}

        {step === 2 && calculation && selectedUser && (
          <div style={{ background: 'white', padding: '32px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '24px', fontSize: '20px', fontWeight: 'bold' }}>
              {formData.userType === 'staff' ? 'Staff' : 'Teacher'} Salary Report
            </h2>

            {/* Attendance Summary */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#3b82f6', marginBottom: '12px' }}>Attendance Summary</h3>
              <div style={{ border: '1px solid #f3f4f6', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#4b5563', fontSize: '14px' }}>Staff</span>
                  <span style={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}>{selectedUser.fullName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#4b5563', fontSize: '14px' }}>Month</span>
                  <span style={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}>{formData.month}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#f0fdf4', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#4b5563', fontSize: '14px' }}>Per Day Salary</span>
                  <span style={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}>৳ {calculation.perDaySalary.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#4b5563', fontSize: '14px' }}>Present Days</span>
                  <span style={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}>{calculation.presentDays} days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#eff6ff', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#4b5563', fontSize: '14px' }}>Leave Days</span>
                  <span style={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}>{calculation.leaveDays} days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#4b5563', fontSize: '14px' }}>Off Days</span>
                  <span style={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}>{calculation.offDays} days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#fef2f2' }}>
                  <span style={{ color: '#b91c1c', fontSize: '14px' }}>Absent Days</span>
                  <span style={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}>{calculation.absentDays} days</span>
                </div>
              </div>
            </div>

            {/* Salary Summary */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#3b82f6', marginBottom: '12px' }}>Salary Summary</h3>
              <div style={{ border: '1px solid #f3f4f6', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#f0fdf4', borderBottom: '1px solid white' }}>
                  <span style={{ color: '#4b5563', fontSize: '14px' }}>Base Salary</span>
                  <span style={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}>৳ {calculation.baseSalary.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#fef2f2', borderBottom: '1px solid white' }}>
                  <span style={{ color: '#b91c1c', fontSize: '14px' }}>Deduction</span>
                  <span style={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}>- ৳ {calculation.deduction.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#fef9c3', borderBottom: '1px solid white' }}>
                  <span style={{ color: '#854d0e', fontSize: '14px' }}>Payable After Deduction</span>
                  <span style={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}>৳ {calculation.payableAfterDeduction.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#fdf4ff', borderBottom: '1px solid white' }}>
                  <span style={{ color: '#86198f', fontSize: '14px' }}>Advance Deducted</span>
                  <span style={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}>- ৳ {calculation.advanceDeducted.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#dcfce7' }}>
                  <span style={{ color: '#166534', fontSize: '14px', fontWeight: 600 }}>Final Payable</span>
                  <span style={{ color: '#166534', fontSize: '14px', fontWeight: 600 }}>৳ {calculation.finalPayable.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Process Payment Section */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#111827', fontWeight: 500 }}>Extra Allowance (Optional)</label>
              <input 
                type="number" 
                name="allowance" 
                value={formData.allowance} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '4px', outline: 'none' }}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>This amount will be added to final payable salary.</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#111827', fontWeight: 500 }}>Payment Method</label>
              <select 
                name="method" 
                value={formData.method} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '4px', outline: 'none' }}
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="mobile_banking">Mobile Banking</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#dbeafe', borderRadius: '6px', marginBottom: '24px' }}>
              <span style={{ color: '#1e40af', fontSize: '14px', fontWeight: 500 }}>Total Payable After Allowance</span>
              <span style={{ background: '#2563eb', color: 'white', padding: '6px 16px', borderRadius: '4px', fontWeight: 600 }}>
                ৳ {(calculation.finalPayable + Number(formData.allowance || 0)).toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setStep(1)} 
                style={{ padding: '12px 24px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}
              >
                Back
              </button>
              <button 
                onClick={handleConfirmPay} 
                style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}
                disabled={isLoading}
              >
                Confirm & Pay
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
