"use client";

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { 
  fetchTeachers, 
  createBulkAssignments,
  updateTeacher
} from '../../api/teacherApi/teacherSlice';
import { fetchClasses } from '../../api/classApi/classSlice';
import { fetchBatches } from '../../api/batchApi/batchSlice';
import { fetchSubjects } from '../../api/subjectApi/subjectSlice';
import { PaymentType, CreateAssignmentDto, TeacherItem } from '../../api/teacherApi/types/teacher.types';
import styles from './TeacherAssignment.module.css';
import { toast } from 'react-toastify';

interface SubjectAssignmentRow {
  id: string; // unique ID for React keys
  classId: string;
  batchId: string;
  subjectId: string;
  paymentType: PaymentType | '';
}

const TeacherAssignmentPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { teachers, loading: teacherLoading } = useSelector((state: RootState) => state.teacher);
  const { classes } = useSelector((state: RootState) => state.class);
  const { batches } = useSelector((state: RootState) => state.batch);
  const { subjects } = useSelector((state: RootState) => state.subject);

  // Form State
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  
  // Payment Type Setup State
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState<PaymentType[]>([]);
  
  const [monthlyHourlySetup, setMonthlyHourlySetup] = useState({ totalHours: '', totalPayment: '' });
  const [dailySetup, setDailySetup] = useState({ totalClass: '', totalPayment: '' });
  const [monthlySetup, setMonthlySetup] = useState({ amount: '', hasTotalClass: false });
  const [perClassHourlySetup, setPerClassHourlySetup] = useState({ minutes: '', amount: '' });
  
  // Dynamic Assignment Rows
  const [assignmentRows, setAssignmentRows] = useState<SubjectAssignmentRow[]>([
    { id: Date.now().toString(), classId: '', batchId: '', subjectId: '', paymentType: '' }
  ]);

  // Extra Payment State
  const [enableExtraPayment, setEnableExtraPayment] = useState<boolean>(false);

  useEffect(() => {
    dispatch(fetchTeachers({ limit: 1000 }));
    dispatch(fetchClasses({ limit: 1000 }));
    dispatch(fetchBatches({ limit: 1000 }));
    dispatch(fetchSubjects({ limit: 1000 }));
  }, [dispatch]);

  const handlePaymentTypeToggle = (type: PaymentType) => {
    if (selectedPaymentTypes.includes(type)) {
      setSelectedPaymentTypes(prev => prev.filter(t => t !== type));
    } else {
      setSelectedPaymentTypes(prev => [...prev, type]);
    }
  };

  const handleAddRow = () => {
    setAssignmentRows([
      ...assignmentRows, 
      { id: Date.now().toString(), classId: '', batchId: '', subjectId: '', paymentType: '' }
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (assignmentRows.length > 1) {
      setAssignmentRows(assignmentRows.filter(row => row.id !== id));
    }
  };

  const handleRowChange = (id: string, field: keyof SubjectAssignmentRow, value: string) => {
    setAssignmentRows(prev => prev.map(row => {
      if (row.id === id) {
        // If class changes, reset the batch
        if (field === 'classId') {
          return { ...row, [field]: value, batchId: '' };
        }
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const getBatchesForClass = (classId: string) => {
    if (!classId) return [];
    return batches.filter(b => {
      const bClassId = typeof b.className === 'object' ? b.className._id : b.className;
      return bClassId === classId;
    });
  };

  const handleSubmit = async () => {
    if (!selectedTeacherId) {
      toast.error('Please select a teacher');
      return;
    }

    if (assignmentRows.some(r => !r.subjectId || !r.paymentType)) {
      toast.error('Please complete all assignment rows (Subject and Payment Type are required)');
      return;
    }

    // Build the bulk payload
    const payload: CreateAssignmentDto[] = assignmentRows.map(row => {
      const baseAssignment: CreateAssignmentDto = {
        teacher: selectedTeacherId,
        subject: row.subjectId,
        paymentType: row.paymentType as PaymentType,
        amount: 0,
        effectiveFrom: new Date().toISOString(),
      };
      
      if (row.classId) baseAssignment.class = row.classId;
      if (row.batchId) baseAssignment.batch = row.batchId;

      // Extract amount and specific config based on the selected payment type
      switch (row.paymentType) {
        case PaymentType.MONTHLY_HOURLY:
          baseAssignment.totalHoursPerMonth = Number(monthlyHourlySetup.totalHours) || 0;
          baseAssignment.amount = Number(monthlyHourlySetup.totalPayment) || 0;
          break;
        case PaymentType.DAILY:
          baseAssignment.totalClassPerDay = Number(dailySetup.totalClass) || 0;
          baseAssignment.amount = Number(dailySetup.totalPayment) || 0;
          break;
        case PaymentType.MONTHLY:
          baseAssignment.amount = Number(monthlySetup.amount) || 0;
          baseAssignment.hasTotalClass = monthlySetup.hasTotalClass;
          break;
        case PaymentType.PER_CLASS_HOURLY:
          baseAssignment.ratePerHour = Number(perClassHourlySetup.amount) || 0; // Or standard amount
          baseAssignment.amount = Number(perClassHourlySetup.amount) || 0;
          break;
        case PaymentType.PER_CLASS:
          // Implement standard Per Class if needed, defaulting amount to 0 for now unless there's a setup
          baseAssignment.amount = 0;
          break;
      }
      return baseAssignment;
    });

    try {
      // 1. Bulk Assignments
      await dispatch(createBulkAssignments(payload)).unwrap();
      
      // 2. Update Teacher Extra Payment Flag
      await dispatch(updateTeacher({ 
        id: selectedTeacherId, 
        teacherData: { enableExtraPayment } 
      })).unwrap();
      
      toast.success('Assignments and Payment Setups Saved Successfully');
    } catch (error: any) {
      toast.error(error || 'Failed to save setups');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.headerIcon}>👩‍🏫</span>
          <h2>Teacher Salary & Assignment System (Premium)</h2>
        </div>
      </div>

      {/* Section 1: Select Teacher */}
      <div className={`${styles.card} ${styles.blueCard}`}>
        <div className={styles.cardHeader}>
          <div className={`${styles.stepNumber} ${styles.blueStep}`}>1</div>
          <h3>Select Teacher</h3>
          <button className={styles.submitBtnTop} onClick={handleSubmit} disabled={teacherLoading}>
            {teacherLoading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
        <div className={styles.cardBody}>
          <select 
            className={styles.selectInput} 
            value={selectedTeacherId} 
            onChange={(e) => setSelectedTeacherId(e.target.value)}
          >
            <option value="">Select a Teacher</option>
            {teachers.map((t: TeacherItem) => (
              <option key={t._id} value={t._id}>{t.fullName} ({t.designation})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Section 2: Payment Type */}
      <div className={`${styles.card} ${styles.yellowCard}`}>
        <div className={styles.cardHeader}>
          <div className={`${styles.stepNumber} ${styles.yellowStep}`}>2</div>
          <h3>Payment Type (Multiple)</h3>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.checkboxGrid}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={selectedPaymentTypes.includes(PaymentType.PER_CLASS)}
                onChange={() => handlePaymentTypeToggle(PaymentType.PER_CLASS)}
              />
              Per Class
            </label>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={selectedPaymentTypes.includes(PaymentType.PER_CLASS_HOURLY)}
                onChange={() => handlePaymentTypeToggle(PaymentType.PER_CLASS_HOURLY)}
              />
              Per Class Hourly
            </label>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={selectedPaymentTypes.includes(PaymentType.MONTHLY)}
                onChange={() => handlePaymentTypeToggle(PaymentType.MONTHLY)}
              />
              Monthly
            </label>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={selectedPaymentTypes.includes(PaymentType.MONTHLY_HOURLY)}
                onChange={() => handlePaymentTypeToggle(PaymentType.MONTHLY_HOURLY)}
              />
              Monthly Hourly
            </label>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={selectedPaymentTypes.includes(PaymentType.DAILY)}
                onChange={() => handlePaymentTypeToggle(PaymentType.DAILY)}
              />
              Daily
            </label>
          </div>

          <div className={styles.setupsContainer}>
            {selectedPaymentTypes.includes(PaymentType.MONTHLY_HOURLY) && (
              <div className={styles.setupBox}>
                <h4>Monthly Hourly Payment Setup</h4>
                <div className={styles.inputGroup}>
                  <label>Total Hours Per Month</label>
                  <input 
                    type="number" 
                    value={monthlyHourlySetup.totalHours} 
                    onChange={e => setMonthlyHourlySetup({...monthlyHourlySetup, totalHours: e.target.value})} 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Total Payment</label>
                  <input 
                    type="number" 
                    value={monthlyHourlySetup.totalPayment} 
                    onChange={e => setMonthlyHourlySetup({...monthlyHourlySetup, totalPayment: e.target.value})} 
                  />
                </div>
              </div>
            )}

            {selectedPaymentTypes.includes(PaymentType.DAILY) && (
              <div className={styles.setupBox}>
                <h4>Daily Payment Setup</h4>
                <div className={styles.inputGroup}>
                  <label>Total Class Per Day</label>
                  <input 
                    type="number" 
                    value={dailySetup.totalClass} 
                    onChange={e => setDailySetup({...dailySetup, totalClass: e.target.value})} 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Total Payment Per Day</label>
                  <input 
                    type="number" 
                    value={dailySetup.totalPayment} 
                    onChange={e => setDailySetup({...dailySetup, totalPayment: e.target.value})} 
                  />
                </div>
              </div>
            )}

            {selectedPaymentTypes.includes(PaymentType.MONTHLY) && (
              <div className={styles.setupBox}>
                <div className={styles.setupHeaderFlex}>
                  <h4>Monthly Salary Setup</h4>
                  <label className={styles.checkboxLabelSmall}>
                    Has Total Class
                    <input 
                      type="checkbox" 
                      checked={monthlySetup.hasTotalClass}
                      onChange={e => setMonthlySetup({...monthlySetup, hasTotalClass: e.target.checked})}
                    />
                  </label>
                </div>
                <div className={styles.inputGroup}>
                  <label>Amount</label>
                  <input 
                    type="number" 
                    value={monthlySetup.amount} 
                    onChange={e => setMonthlySetup({...monthlySetup, amount: e.target.value})} 
                  />
                </div>
              </div>
            )}

            {selectedPaymentTypes.includes(PaymentType.PER_CLASS_HOURLY) && (
              <div className={styles.setupBox}>
                <h4>Per Class Hourly</h4>
                <div className={styles.flexRow}>
                  <input 
                    type="number" 
                    className={styles.flexInput}
                    placeholder="E.g. 60"
                    value={perClassHourlySetup.minutes} 
                    onChange={e => setPerClassHourlySetup({...perClassHourlySetup, minutes: e.target.value})} 
                  />
                  <input 
                    type="number" 
                    className={styles.flexInput}
                    placeholder="Amount"
                    value={perClassHourlySetup.amount} 
                    onChange={e => setPerClassHourlySetup({...perClassHourlySetup, amount: e.target.value})} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Class - Batch - Subject Assign */}
      <div className={`${styles.card} ${styles.purpleCard}`}>
        <div className={styles.cardHeader}>
          <div className={`${styles.stepNumber} ${styles.purpleStep}`}>3</div>
          <h3>Class · Batch · Subject Assign</h3>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.assignmentRows}>
            {assignmentRows.map((row) => {
              const rowBatches = getBatchesForClass(row.classId);
              
              return (
                <div key={row.id} className={styles.assignmentRow}>
                  <select 
                    className={styles.smallSelect} 
                    value={row.classId} 
                    onChange={e => handleRowChange(row.id, 'classId', e.target.value)}
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => (
                      <option key={c._id} value={c._id}>{c.classname}</option>
                    ))}
                  </select>
                  
                  <select 
                    className={styles.smallSelect} 
                    value={row.batchId} 
                    onChange={e => handleRowChange(row.id, 'batchId', e.target.value)}
                    disabled={!row.classId}
                  >
                    <option value="">Select Batch</option>
                    {rowBatches.map(b => (
                      <option key={b._id} value={b._id}>{b.batchName}</option>
                    ))}
                  </select>

                  <select 
                    className={styles.smallSelect} 
                    value={row.subjectId} 
                    onChange={e => handleRowChange(row.id, 'subjectId', e.target.value)}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s._id} value={s._id}>{s.subjectName}</option>
                    ))}
                  </select>

                  <select 
                    className={styles.largeSelect} 
                    value={row.paymentType} 
                    onChange={e => handleRowChange(row.id, 'paymentType', e.target.value)}
                  >
                    <option value="">Select Payment Setup</option>
                    {selectedPaymentTypes.map(pt => (
                      <option key={pt} value={pt}>{pt.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>

                  <button 
                    className={styles.deleteBtn} 
                    onClick={() => handleRemoveRow(row.id)}
                    title="Remove Assignment"
                  >
                    X
                  </button>
                </div>
              );
            })}
          </div>
          <button className={styles.addAssignmentBtn} onClick={handleAddRow}>
            + Add Assignment
          </button>
        </div>
      </div>

      {/* Section 4: Extra Payment Setup */}
      <div className={`${styles.card} ${styles.greenCard}`}>
        <div className={styles.cardHeader}>
          <div className={`${styles.stepNumber} ${styles.greenStep}`}>4</div>
          <h3>Extra Payment Setup</h3>
        </div>
        <div className={styles.cardBody}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={enableExtraPayment}
              onChange={e => setEnableExtraPayment(e.target.checked)}
            />
            Enable Extra Payment
          </label>
        </div>
      </div>
      
    </div>
  );
};

export default TeacherAssignmentPage;
