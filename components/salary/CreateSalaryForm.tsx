'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './Salary.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { toastManager } from '@/utils/toastConfig';
import { fetchEmployees } from '@/api/employeeApi/employeeSlice';
import { fetchTeachers } from '@/api/teacherApi/teacherSlice';
import { createSalary } from '@/api/salaryApi/salarySlice';
import api from '@/api/axios';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Extract a flat array from any API response shape */
function extractArray(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  // { data: [...] }  or  { attendances: [...] }  or  { assignments: [...] }  etc.
  if (Array.isArray(res.data))        return res.data;
  if (Array.isArray(res.attendances)) return res.attendances;
  if (Array.isArray(res.assignments)) return res.assignments;
  if (Array.isArray(res.items))       return res.items;
  if (Array.isArray(res.records))     return res.records;
  return [];
}

/** Check if an attendance record belongs to the given userId */
function recordBelongsToUser(record: any, userId: string): boolean {
  const emp = record.employee ?? record.teacher ?? record.staff;
  if (!emp) return JSON.stringify(record).includes(userId);
  if (typeof emp === 'string') return emp === userId;
  if (typeof emp === 'object') return emp._id === userId;
  return false;
}

/** Count working days in a month, excluding Fridays (treated as holiday) */
function getWorkingDays(year: number, month: number): number {
  const days = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= days; d++) {
    if (new Date(year, month - 1, d).getDay() !== 5) count++; // 5 = Friday
  }
  return count;
}

/** Check if a date string belongs to a YYYY-MM month */
function dateInMonth(dateStr: string, yearMonth: string): boolean {
  if (!dateStr) return false;
  if (dateStr.startsWith(yearMonth)) return true;
  try { return new Date(dateStr).toISOString().startsWith(yearMonth); } catch { return false; }
}

/** Format ৳ amount */
const taka = (n: number) => `৳ ${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Payment-type label (same logic as TeacherDetailsModal) ──────────────────
function payTypeLabel(pt: string): string {
  switch (pt) {
    case 'monthly':          return 'Monthly';
    case 'monthly_hourly':   return 'Monthly Hourly';
    case 'per_class':        return 'Per Class';
    case 'per_class_hourly': return 'Per Class Hourly';
    case 'daily':            return 'Daily';
    default:                 return pt;
  }
}

// ─── Per-assignment salary calculation ───────────────────────────────────────
interface AssignmentCalc {
  label: string;
  payType: string;
  baseSalary: number;       // full/expected monthly amount for this assignment
  earnedAmount: number;     // actual amount earned based on attendance
  presentCount: number;     // how many classes/days were actually attended
  note: string;
  mhData?: { totalMonthHours: number; hourlyRate: number; hoursWorked: number };
  dailyData?: {
    dailyRate: number;
    daysPresent: number;
    totalClassPerDay: number;
    perClassRate: number;
    totalPresentClasses: number;
    perDayBreakdown: Array<{ date: string; classesPresent: number; earned: number }>;
  };
  monthlyData?: {
    isClassBased: boolean;
    totalClasses?: number;
    classesAttended?: number;
    perClassRate?: number;
    effectiveWorkDays?: number;
    daysAttended?: number;
    perDayRate?: number;
  };
  groupedAssignments?: Array<{ subjectName: string; className: string; batchName: string }>;
}

function calcAssignmentSalary(a: any, monthAtts: any[], globalPresentDays: number, daysInMonth: number, globalAbsentDays: number, workingDays: number, totalClassesAttended: number): AssignmentCalc {
  const amount   = Number(a.amount) || 0;
  const payType  = (a.paymentType as string) || '';
  
  let label = `${a.subject?.subjectName ?? '?'} (${a.class?.classname ?? ''} ${a.batch?.batchName ?? ''})`.trim();
  if (a._isGrouped && a._count > 1) {
    const names = a._groups.map((g:any) => g.subject?.subjectName).filter(Boolean);
    const uniqueNames = Array.from(new Set(names)).join(', ');
    label = `${a._count} Assignments - ${uniqueNames}`.substring(0, 40) + '...';
  }

  let presentCount = 0;
  let absentCount = 0;
  let hasDetails = false;

  monthAtts.forEach((record: any) => {
    if (record.attendanceDetails && record.attendanceDetails.length > 0) {
      hasDetails = true;
      record.attendanceDetails.forEach((det: any) => {
        if (a._isGrouped) {
          const match = a._groups.some((g: any) => {
            const sid = g.subject?._id ?? g.subject;
            const cid = g.class?._id ?? g.class;
            const bid = g.batch?._id ?? g.batch;
            return (!sid || sid === (det.subject?._id ?? det.subject)) &&
                   (!cid || cid === (det.class?._id ?? det.class)) &&
                   (!bid || bid === (det.batch?._id ?? det.batch));
          });
          if (match) {
            if (det.status?.toLowerCase() === 'present') presentCount++;
            else if (det.status?.toLowerCase() === 'absent') absentCount++;
          }
        } else {
          const sid = a.subject?._id ?? a.subject;
          const cid = a.class?._id ?? a.class;
          const bid = a.batch?._id ?? a.batch;

          const dsid = det.subject?._id ?? det.subject;
          const dcid = det.class?._id ?? det.class;
          const dbid = det.batch?._id ?? det.batch;

          if ((!sid || sid === dsid) && (!cid || cid === dcid) && (!bid || bid === dbid)) {
            if (det.status?.toLowerCase() === 'present') presentCount++;
            else if (det.status?.toLowerCase() === 'absent') absentCount++;
          }
        }
      });
    }
  });

  if (!hasDetails) {
    presentCount = globalPresentDays;
    absentCount  = globalAbsentDays;
  }


  let baseSalary = 0;
  let earnedAmount = 0;
  let note = '';
  let mhData: AssignmentCalc['mhData'] = undefined;
  let dailyData: AssignmentCalc['dailyData'] = undefined;
  let monthlyData: AssignmentCalc['monthlyData'] = undefined;
  const groupedAssignments: AssignmentCalc['groupedAssignments'] = (a._isGrouped && Array.isArray(a._groups))
    ? a._groups.map((g: any) => ({
        subjectName: g.subject?.subjectName ?? '?',
        className:   g.class?.classname    ?? '',
        batchName:   g.batch?.batchName    ?? '',
      }))
    : undefined;

  switch (payType) {
    case 'per_class': {
      const classes     = Number(a.totalClassesPerMonth) || 0;
      const ratePerCls  = Number(a.ratePerClass) || 0;
      const rate        = ratePerCls > 0 ? ratePerCls : (classes > 0 ? amount / classes : amount);
      baseSalary   = classes > 0 ? classes * rate : amount;
      // Cap: cannot earn more than base salary (no over-payment if extra attendance recorded)
      const effectivePresent = classes > 0 ? Math.min(presentCount, classes) : presentCount;
      earnedAmount = effectivePresent * rate;
      note = `${effectivePresent} attended × ${taka(rate)}/class = ${taka(earnedAmount)}`;
      break;
    }

    case 'per_class_hourly': {
      const classes     = Number(a.totalClassesPerMonth) || 0;
      const duration    = Number(a.durationMinutes)      || 0;
      // hourly rate: ratePerHour if set, otherwise ratePerClass is treated as hourly rate
      const hourlyRate  = Number(a.ratePerHour) > 0 ? Number(a.ratePerHour) : (Number(a.ratePerClass) || 0);
      const durationHrs = duration > 0 ? duration / 60 : 0;
      // Earned per class = hourlyRate × (duration in hours)
      const earnedPerClass = hourlyRate * durationHrs;
      baseSalary = classes > 0 ? classes * earnedPerClass : amount;
      const effectivePresent = classes > 0 ? Math.min(presentCount, classes) : presentCount;
      earnedAmount = effectivePresent * earnedPerClass;
      note = `${effectivePresent} attended × ৳${hourlyRate}/hr × ${duration}min = ${taka(earnedAmount)}`;
      break;
    }

    case 'monthly_hourly': {
      // Global setup: totalHoursPerMonth & totalPayment apply across all assignments
      const totalMonthHours = Number(a.totalHoursPerMonth) || 0;
      const rate            = totalMonthHours > 0 ? amount / totalMonthHours : 0;

      baseSalary = amount; // full monthly potential salary

      const groups: any[] = a._isGrouped && Array.isArray(a._groups) ? a._groups : [a];

      // Single pass: per assignment → count its own present classes → compute hours
      type GroupResult = { durationMin: number; effectivePresent: number; hrs: number };
      const groupResults: GroupResult[] = groups.map(g => {
        const gDurationMin = Number(g.durationMinutes) || 0;
        const gExpectedCls = Number(g.totalClassesPerMonth) || 0;

        let gPresentCount = 0;
        let gHasDetails   = false;

        monthAtts.forEach((record: any) => {
          if (record.attendanceDetails && record.attendanceDetails.length > 0) {
            gHasDetails = true;
            record.attendanceDetails.forEach((det: any) => {
              const sid  = g.subject?._id ?? g.subject;
              const cid  = g.class?._id   ?? g.class;
              const bid  = g.batch?._id   ?? g.batch;
              if ((!sid || sid === (det.subject?._id ?? det.subject)) &&
                  (!cid || cid === (det.class?._id   ?? det.class))   &&
                  (!bid || bid === (det.batch?._id   ?? det.batch))) {
                if (det.status?.toLowerCase() === 'present') gPresentCount++;
              }
            });
          }
        });

        if (!gHasDetails) gPresentCount = globalPresentDays;

        const effectivePresent = gExpectedCls > 0 ? Math.min(gPresentCount, gExpectedCls) : gPresentCount;
        const hrs              = Math.round((gDurationMin / 60) * effectivePresent * 100) / 100;
        return { durationMin: gDurationMin, effectivePresent, hrs };
      });

      const rawWorkedHours      = groupResults.reduce((sum, r) => sum + r.hrs, 0);
      const effectiveWorkedHours = totalMonthHours > 0
        ? Math.min(rawWorkedHours, totalMonthHours)
        : rawWorkedHours;

      earnedAmount = Math.round(effectiveWorkedHours * rate * 100) / 100;

      const hoursBreakdown = groupResults
        .map(r => `${r.effectivePresent}cls×${r.durationMin}min=${Math.round(r.hrs * 10) / 10}h`)
        .join(' + ');

      note = `Rate: ${taka(amount)}÷${totalMonthHours}h=${taka(rate)}/h | Hours: ${hoursBreakdown} = ${Math.round(effectiveWorkedHours * 10) / 10}h | Earned: ${Math.round(effectiveWorkedHours * 10) / 10}h×${taka(rate)}=${taka(earnedAmount)}`;
      mhData = { totalMonthHours, hourlyRate: Math.round(rate * 100) / 100, hoursWorked: Math.round(effectiveWorkedHours * 100) / 100 };
      break;
    }

    case 'daily': {
      // Daily: salary = (classes actually attended) × (dailyRate ÷ totalClassPerDay)
      const totalClassPerDay = Number(a.totalClassPerDay) || 1;
      const perClassRate     = Math.round((amount / totalClassPerDay) * 100) / 100;
      const groups: any[]    = a._isGrouped && Array.isArray(a._groups) ? a._groups : [a];

      // Per-day breakdown: { date → classesPresent }
      const datePresentMap: Record<string, number> = {};
      let hasAttDetails = false;

      for (const g of groups) {
        monthAtts.forEach((record: any) => {
          if (record.attendanceDetails && record.attendanceDetails.length > 0) {
            hasAttDetails = true;
            let d: string;
            try { d = new Date(record.date).toISOString().split('T')[0]; } catch { d = String(record.date); }

            record.attendanceDetails.forEach((det: any) => {
              const sid  = g.subject?._id ?? g.subject;
              const cid  = g.class?._id   ?? g.class;
              const bid  = g.batch?._id   ?? g.batch;
              if ((!sid || sid === (det.subject?._id ?? det.subject)) &&
                  (!cid || cid === (det.class?._id   ?? det.class))   &&
                  (!bid || bid === (det.batch?._id   ?? det.batch))) {
                if (det.status?.toLowerCase() === 'present') {
                  datePresentMap[d] = (datePresentMap[d] || 0) + 1;
                }
              }
            });
          }
        });
      }

      // Fallback: no attendance details → assume full attendance on present days
      if (!hasAttDetails) {
        monthAtts.forEach((record: any) => {
          if (String(record.status).toLowerCase() === 'present') {
            let d: string;
            try { d = new Date(record.date).toISOString().split('T')[0]; } catch { d = String(record.date); }
            datePresentMap[d] = (datePresentMap[d] || 0) + totalClassPerDay;
          }
        });
      }

      const perDayBreakdown = Object.entries(datePresentMap)
        .sort(([da], [db]) => da.localeCompare(db))
        .map(([date, classesPresent]) => ({
          date,
          classesPresent,
          earned: Math.round(classesPresent * perClassRate * 100) / 100,
        }));

      const totalPresentClasses = perDayBreakdown.reduce((s, r) => s + r.classesPresent, 0);
      earnedAmount = Math.round(totalPresentClasses * perClassRate * 100) / 100;
      baseSalary   = earnedAmount;
      dailyData    = { dailyRate: amount, daysPresent: perDayBreakdown.length, totalClassPerDay, perClassRate, totalPresentClasses, perDayBreakdown };
      note = `${taka(amount)} ÷ ${totalClassPerDay} classes/day = ${taka(perClassRate)}/class · ${totalPresentClasses} classes × ${taka(perClassRate)} = ${taka(earnedAmount)}`;
      break;
    }

    case 'monthly':
    default: {
      baseSalary = amount;

      if (a.hasTotalClass && Number(a.totalClassesPerMonth) > 0) {
        // ── Class-based mode ──────────────────────────────────────────────────
        // salary is earned proportionally to classes attended vs total classes/month
        const totalClsPerMonth = Number(a.totalClassesPerMonth);
        const perClassRate     = Math.round((baseSalary / totalClsPerMonth) * 100) / 100;
        const clsAttended      = Math.min(presentCount, totalClsPerMonth);
        earnedAmount           = Math.round(clsAttended * perClassRate * 100) / 100;
        
        monthlyData = {
           isClassBased: true,
           totalClasses: totalClsPerMonth,
           classesAttended: clsAttended,
           perClassRate: perClassRate,
        };

        note = `${taka(amount)} ÷ ${totalClsPerMonth} classes/month = ${taka(perClassRate)}/class · ${clsAttended} classes attended × ${taka(perClassRate)} = ${taka(earnedAmount)}`;
      } else {
        // ── Day-based mode (Fridays = holiday) ───────────────────────────────
        // salary is earned proportionally to days attended vs working days in month
        const effectiveWorkDays = workingDays > 0 ? workingDays : daysInMonth;
        const perDayRate        = Math.round((baseSalary / effectiveWorkDays) * 100) / 100;
        const daysAttended      = Math.min(globalPresentDays, effectiveWorkDays);
        earnedAmount            = Math.round(daysAttended * perDayRate * 100) / 100;
        presentCount            = globalPresentDays;

        monthlyData = {
           isClassBased: false,
           effectiveWorkDays,
           daysAttended,
           perDayRate
        };

        note = `${taka(amount)} ÷ ${effectiveWorkDays} working days (excl. Fri) = ${taka(perDayRate)}/day · ${daysAttended} days attended × ${taka(perDayRate)} = ${taka(earnedAmount)}`;
      }
      break;
    }
  }

  return { label, payType, baseSalary, earnedAmount, presentCount, note, mhData, dailyData, monthlyData, groupedAssignments };
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function CreateSalaryForm() {
  const dispatch = useDispatch<any>();
  const { employees, loading: empLoading } = useSelector((s: any) => s.employee);
  const { teachers, loading: teacherLoading } = useSelector((s: any) => s.teacher);
  const { loading: payLoading } = useSelector((s: any) => s.salary);

  const [step, setStep] = useState<1 | 2>(1);
  const [calcLoading, setCalcLoading] = useState(false);

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

  const userList = formData.userType === 'staff' ? employees : teachers;
  const selectedUser = useMemo(
    () => userList?.find((u: any) => u._id === formData.userId),
    [formData.userId, employees, teachers, formData.userType]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'userType') {
      setFormData(prev => ({ ...prev, userType: value as any, userId: '' }));
      setStep(1);
    }
    if (name === 'month' || name === 'userId') setStep(1);
  };

  // ─── Calculate ─────────────────────────────────────────────────────────────
  const calculateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId) return toastManager.showError('Please select a person first');
    if (!formData.month)  return toastManager.showError('Please select a month');

    const tid = toastManager.showLoading('Calculating salary...');
    setCalcLoading(true);

    try {
      const [year, mon] = formData.month.split('-').map(Number);
      const daysInMonth = new Date(year, mon, 0).getDate();
      const workingDays = getWorkingDays(year, mon);

      // ── 1. Fetch attendance directly from API (bypass Redux, avoid stale data) ──
      let allAtts: any[] = [];
      if (formData.userType === 'staff') {
        const res = await api.get('/staff-attendance', { params: { limit: 5000, employee: formData.userId } });
        allAtts = extractArray(res.data);
      } else {
        const res = await api.get('/teacher-attendance', { params: { limit: 5000, teacher: formData.userId } });
        allAtts = extractArray(res.data);
      }

      // ── 2. Filter by user & month ──────────────────────────────────────────
      const userAtts = allAtts.filter(a => recordBelongsToUser(a, formData.userId));
      const monthAtts = userAtts.filter(a => dateInMonth(a.date, formData.month));

      // ── 2b. Teacher: only APPROVED attendance counts for salary ────────────
      // Rejected or pending attendance must NOT be included in salary calculation
      const effectiveAtts = formData.userType === 'teacher'
        ? monthAtts.filter(a => a.approvalStatus === 'approved')
        : monthAtts;

      // ── 3. Count attendance days ───────────────────────────────────────────
      let presentDays = 0, leaveDays = 0, offDays = 0, absentDays = 0;

      if (formData.userType === 'staff') {
        presentDays = effectiveAtts.filter(a => a.status === 'Present').length;
        leaveDays   = effectiveAtts.filter(a => a.status === 'Leave').length;
        offDays     = effectiveAtts.filter(a => a.status === 'Off Day' || a.status === 'off_day').length;
        absentDays  = effectiveAtts.filter(a => a.status === 'Absent').length;

        // Fill absent days if no explicit absent records
        const accountedDays = presentDays + leaveDays + offDays + absentDays;
        if (accountedDays < daysInMonth) {
          absentDays = Math.max(absentDays, daysInMonth - presentDays - leaveDays - offDays);
        }
      } else {
        // Teacher: count only approved attendance records
        const presentDates = new Set<string>();
        const absentDates  = new Set<string>();

        effectiveAtts.forEach(a => {
          let d: string;
          try { d = new Date(a.date).toISOString().split('T')[0]; } catch { d = a.date; }

          if (a.status === 'Leave') { leaveDays++; return; }
          if (a.status === 'Off Day' || a.status === 'off_day') { offDays++; return; }

          const attended = Number(a.attendedClasses) || 0;
          const total    = Number(a.totalClasses)    || 0;

          if (attended > 0 || String(a.status).toLowerCase() === 'present') presentDates.add(d);
          else if (String(a.status).toLowerCase() === 'absent') absentDates.add(d);
          else if (total > 0 && attended === 0) absentDates.add(d); 
        });

        presentDays = presentDates.size;
        // A day is present if ANY batch was attended — remove those dates from absent set
        presentDates.forEach(d => absentDates.delete(d));
        // Absent = remaining days in month not accounted for (day-based, not class-based)
        absentDays = Math.max(0, daysInMonth - presentDays - leaveDays - offDays);
      }

      // ── 3b. Total classes attended (for class-based monthly calculation) ─────
      const totalClassesAttended = formData.userType === 'teacher'
        ? effectiveAtts.reduce((sum: number, a: any) => sum + (Number(a.attendedClasses) || 0), 0)
        : 0;

      // ── 4. Salary calculation ──────────────────────────────────────────────
      let baseSalary = 0;
      let perDaySalary = 0;
      let deduction = 0;
      let payableAfterDeduction = 0;
      let assignmentBreakdown: AssignmentCalc[] = [];
      let assignmentNote = '';
      let expectedClassesPerMonth = 0;  // total classes allowed per month across all assignments

      if (formData.userType === 'staff') {
        baseSalary    = Number(selectedUser?.salary) || 0;
        perDaySalary  = baseSalary > 0 ? Math.round((baseSalary / daysInMonth) * 100) / 100 : 0;
        deduction     = Math.round(absentDays * perDaySalary * 100) / 100;
        payableAfterDeduction = Math.max(0, Math.round((baseSalary - deduction) * 100) / 100);

      } else {
        // Teacher: fetch active assignments and calculate per type
        const assignRes: any = await api.get('/teacher-assignments', {
          params: { teacher: formData.userId, limit: 500 }
        });
        const allAssignments: any[] = extractArray(assignRes.data);

        const activeAssignments = allAssignments.filter(
          (a: any) => !a.status || a.status.toLowerCase() === 'active'
        );
        const usedAssignments = activeAssignments.length > 0 ? activeAssignments : allAssignments;

        let mhAssignedHours = 0;
        let mhLimitHours = -1;
        usedAssignments.forEach((a: any) => {
          if (a.paymentType === 'monthly_hourly') {
             if (mhLimitHours === -1) mhLimitHours = Number(a.totalHoursPerMonth) || 0;
             const dur = Number(a.durationMinutes) || 0;
             const cls = Number(a.totalClassesPerMonth) || 0;
             mhAssignedHours += (dur / 60) * cls;
          }
        });
        
        if (mhLimitHours !== -1 && mhAssignedHours > mhLimitHours) {
           throw new Error("Total assigned class hours exceed the allowed monthly limit.");
        }

        // Total classes allowed per month across all assignments
        // Exclude monthly_hourly — its totalClassesPerMonth is class count per assignment, not a salary divisor
        expectedClassesPerMonth = usedAssignments
          .filter((a: any) => a.paymentType !== 'monthly_hourly')
          .reduce((sum: number, a: any) => sum + (Number(a.totalClassesPerMonth) || 0), 0);

        // Group global payment types to prevent duplicate base salaries
        const dedupedAssignments: any[] = [];
        const typeMap: any = { monthly: null, monthly_hourly: null, daily: null };
        
        usedAssignments.forEach((a: any) => {
          if (typeMap.hasOwnProperty(a.paymentType)) {
             if (!typeMap[a.paymentType]) {
               typeMap[a.paymentType] = { ...a, _isGrouped: true, _count: 1, _groups: [a] };
             } else {
               typeMap[a.paymentType]._count++;
               typeMap[a.paymentType]._groups.push(a);
             }
          } else {
             dedupedAssignments.push(a);
          }
        });
        
        if (typeMap.monthly) dedupedAssignments.push(typeMap.monthly);
        if (typeMap.monthly_hourly) dedupedAssignments.push(typeMap.monthly_hourly);
        if (typeMap.daily) dedupedAssignments.push(typeMap.daily);

        // Calculate expected monthly salary AND actual earned per assignment
        // Pass only approved attendance records (effectiveAtts) to salary calculation
        assignmentBreakdown = dedupedAssignments.map(a => calcAssignmentSalary(a, effectiveAtts, presentDays, daysInMonth, absentDays, workingDays, totalClassesAttended));

        baseSalary            = assignmentBreakdown.reduce((sum, a) => sum + a.baseSalary, 0);
        payableAfterDeduction = assignmentBreakdown.reduce((sum, a) => sum + a.earnedAmount, 0);

        assignmentNote = usedAssignments.length > 0
          ? `${usedAssignments.length} active assignment(s)`
          : 'No assignments found';

        // Not earned = difference between potential and actually earned (info only, not deduction)
        deduction = Math.max(0, Math.round((baseSalary - payableAfterDeduction) * 100) / 100);

        // Rate display: per-class if class-based monthly, per-day (excl. Fri) otherwise
        if (expectedClassesPerMonth > 0) {
          perDaySalary = Math.round((baseSalary / expectedClassesPerMonth) * 100) / 100;
        } else if (baseSalary > 0 && workingDays > 0) {
          perDaySalary = Math.round((baseSalary / workingDays) * 100) / 100;
        }
        // absentDays already set as day-based above (daysInMonth - presentDays - leave - offDays)
      }

      // ── Fetch advance salary ───────────────────────────────────────────────
      let advanceDeducted = 0;
      try {
        const advanceRes = await api.get('/salaries', {
          params: {
            userType: formData.userType,
            userId: formData.userId,
            month: formData.month,
            paymentType: 'advance',
            limit: 1000,
          }
        });
        const advances = extractArray(advanceRes.data);
        advanceDeducted = advances.reduce((sum: number, adv: any) => sum + (Number(adv.amount) || 0), 0);
      } catch (err) {
        console.warn('Failed to fetch advance salary:', err);
      }

      // Extract monthly_hourly and daily summary for display
      const mhBreakdown = formData.userType === 'teacher'
        ? assignmentBreakdown.find(a => a.payType === 'monthly_hourly')
        : undefined;
      const monthlyHourlyInfo = mhBreakdown?.mhData ?? null;

      const dailyBreakdown = formData.userType === 'teacher'
        ? assignmentBreakdown.find(a => a.payType === 'daily')
        : undefined;
      const dailyInfo = dailyBreakdown?.dailyData ?? null;

      const monthlyBreakdown = formData.userType === 'teacher'
        ? assignmentBreakdown.find(a => a.payType === 'monthly')
        : undefined;
      const monthlyInfo = monthlyBreakdown?.monthlyData ?? null;

      // Final Payable = actual earned (after all deductions) minus advance
      const finalPayable = Math.round((payableAfterDeduction - advanceDeducted) * 100) / 100;

      setCalculation({
        monthlyHourlyInfo,
        dailyInfo,
        monthlyInfo,
        baseSalary,
        perDaySalary,
        presentDays,
        absentDays,
        leaveDays,
        offDays,
        daysInMonth,
        workingDays,
        expectedClassesPerMonth,
        totalClassesAttended,
        deduction,
        payableAfterDeduction,
        advanceDeducted,
        finalPayable,
        assignmentBreakdown,
        assignmentNote,
        totalAttendanceRecords: effectiveAtts.length,
        totalSubmittedRecords: monthAtts.length,
      });

      toastManager.safeUpdateToast(tid, 'Calculation complete ✓', 'success');
      setStep(2);
    } catch (err: any) {
      console.error('[Salary Calc] Error:', err);
      toastManager.safeUpdateToast(tid, err?.response?.data?.message || err?.message || 'Failed to calculate salary', 'error');
    } finally {
      setCalcLoading(false);
    }
  };

  // ─── Confirm Pay ───────────────────────────────────────────────────────────
  const handleConfirmPay = async () => {
    if (!calculation) return;
    const tid = toastManager.showLoading('Processing payment...');
    const finalAmount = Math.round((calculation.finalPayable + Number(formData.allowance || 0)) * 100) / 100;

    try {
      await dispatch(createSalary({
        userType: formData.userType,
        userId: formData.userId,
        month: formData.month,
        amount: finalAmount,
        paymentType: 'regular',
        method: formData.method,
        note: formData.userType === 'staff'
          ? `Absent: ${calculation.absentDays}d, Deduction: ${taka(calculation.deduction)}, Advance Deducted: ${taka(calculation.advanceDeducted)}, Allowance: ${taka(Number(formData.allowance || 0))}`
          : calculation.hasPerClassHourly 
            ? `Absent: ${calculation.absentDays}d, (Missed Classes/Days): ${taka(calculation.deduction)}, Advance Deducted: ${taka(calculation.advanceDeducted)}, Allowance: ${taka(Number(formData.allowance || 0))}`
            : `Absent: ${calculation.absentDays}d, Deduction: ${taka(calculation.deduction)}, Advance Deducted: ${taka(calculation.advanceDeducted)}, Allowance: ${taka(Number(formData.allowance || 0))}`,
      })).unwrap();

      toastManager.updateToast(tid, 'Salary Paid Successfully!', 'success');
      setStep(1);
      setCalculation(null);
      setFormData(prev => ({ ...prev, userId: '', month: '', allowance: 0 }));
    } catch (err: any) {
      toastManager.safeUpdateToast(tid, err || 'Failed to process payment', 'error');
    }
  };

  const isLoading = empLoading || teacherLoading || payLoading || calcLoading;

  // ─── Row component ─────────────────────────────────────────────────────────
  const Row = ({ label, value, bg, labelColor, valueColor, bold }: any) => (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 16px', background: bg || '#f9fafb', borderBottom:'1px solid #f3f4f6' }}>
      <span style={{ color: labelColor || '#4b5563', fontSize:'14px', fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span style={{ color: valueColor || '#111827', fontSize:'14px', fontWeight: bold ? 600 : 500 }}>{value}</span>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.pageContainer}>
      <div style={{ maxWidth:'680px', margin:'40px auto' }}>

        {/* ── Step 1: Input Form ── */}
        {step === 1 && (
          <div style={{ background:'white', padding:'32px', borderRadius:'12px', boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}>
            <h2 style={{ textAlign:'center', marginBottom:'32px', fontSize:'22px', fontWeight:'bold', color:'#111827' }}>
              💰 Salary Calculator
            </h2>

            <form onSubmit={calculateSalary}>
              {/* Type toggle */}
              <div style={{ marginBottom:'24px', display:'flex', alignItems:'center', gap:'24px', background:'#f3f4f6', padding:'12px 16px', borderRadius:'8px' }}>
                <span style={{ fontSize:'14px', color:'#374151', fontWeight:600 }}>Person Type:</span>
                {(['staff', 'teacher'] as const).map(t => (
                  <label key={t} style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', color:formData.userType===t?'#2563eb':'#374151', fontWeight:formData.userType===t?600:400 }}>
                    <input type="radio" name="userType" value={t} checked={formData.userType===t} onChange={handleChange} />
                    {t === 'staff' ? '👷 Staff' : '👩‍🏫 Teacher'}
                  </label>
                ))}
              </div>

              {/* Select person */}
              <div style={{ marginBottom:'16px' }}>
                <label style={{ display:'block', fontSize:'14px', marginBottom:'6px', color:'#374151', fontWeight:500 }}>
                  Select {formData.userType === 'staff' ? 'Staff' : 'Teacher'}
                </label>
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  disabled={isLoading}
                  style={{ width:'100%', padding:'11px 14px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'15px', outline:'none', background:'white', color: formData.userId ? '#111827' : '#6b7280' }}
                >
                  <option value="">-- Choose {formData.userType === 'staff' ? 'Staff' : 'Teacher'} --</option>
                  {userList?.map((u: any) => (
                    <option key={u._id} value={u._id}>{u.fullName} {u.designation ? `(${u.designation})` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Month picker */}
              <div style={{ marginBottom:'24px' }}>
                <label style={{ display:'block', fontSize:'14px', marginBottom:'6px', color:'#374151', fontWeight:500 }}>Month</label>
                <input
                  type="month"
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  style={{ width:'100%', padding:'11px 14px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'15px', outline:'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !formData.userId || !formData.month}
                style={{ width:'100%', padding:'14px', background: isLoading ? '#9ca3af' : '#2563eb', color:'white', border:'none', borderRadius:'8px', fontWeight:600, fontSize:'16px', cursor: isLoading ? 'not-allowed' : 'pointer' }}
              >
                {calcLoading ? '⏳ Calculating...' : '🔢 Calculate Salary'}
              </button>
            </form>
          </div>
        )}

        {/* ── Step 2: Result ── */}
        {step === 2 && calculation && selectedUser && (
          <div style={{ background:'white', padding:'32px', borderRadius:'12px', boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}>
            <h2 style={{ textAlign:'center', marginBottom:'24px', fontSize:'20px', fontWeight:'bold', color:'#111827' }}>
              {formData.userType === 'staff' ? '👷 Staff' : '👩‍🏫 Teacher'} Salary Report
            </h2>

            {/* Employee Info */}
            <div style={{ marginBottom:'20px' }}>
              <h3 style={{ fontSize:'14px', fontWeight:600, color:'#6b7280', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Employee</h3>
              <div style={{ border:'1px solid #e5e7eb', borderRadius:'8px', overflow:'hidden' }}>
                <Row label="Name"  value={selectedUser.fullName} />
                <Row label="Month" value={formData.month} />
                <Row label="Days in Month" value={`${calculation.daysInMonth} days`} />
              </div>
            </div>

            {/* Attendance */}
            <div style={{ marginBottom:'20px' }}>
              <h3 style={{ fontSize:'14px', fontWeight:600, color:'#6b7280', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Attendance</h3>
              <div style={{ border:'1px solid #e5e7eb', borderRadius:'8px', overflow:'hidden' }}>
                <Row label="✅ Present Days / Classes"  value={`${calculation.presentDays}`}  bg="#f0fdf4" />
                <Row label="🟡 Leave"    value={`${calculation.leaveDays}`}    bg="#eff6ff" />
                <Row label="⚪ Off Days"      value={`${calculation.offDays}`}      bg="#f9fafb" />
                <Row label="❌ Absent / Missed"   value={`${calculation.absentDays}`}   bg="#fef2f2" labelColor="#b91c1c" />
                {calculation.totalAttendanceRecords === 0 && (
                  <div style={{ padding:'10px 16px', background:'#fffbeb', fontSize:'13px', color:'#92400e' }}>
                    ⚠️ No attendance records found for this month. Calculation defaults to zero earnings.
                  </div>
                )}
                {formData.userType === 'teacher' && calculation.totalSubmittedRecords > calculation.totalAttendanceRecords && (
                  <div style={{ padding:'10px 16px', background:'#fff7ed', fontSize:'13px', color:'#c2410c' }}>
                    ℹ️ {calculation.totalSubmittedRecords} submitted → {calculation.totalAttendanceRecords} approved (rejected/pending excluded from salary)
                  </div>
                )}
              </div>
            </div>

            {/* Assignment breakdown (teacher only) */}
            {formData.userType === 'teacher' && calculation.assignmentBreakdown?.length > 0 && (
              <div style={{ marginBottom:'20px' }}>
                <h3 style={{ fontSize:'14px', fontWeight:600, color:'#6b7280', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Assignments ({calculation.assignmentNote})</h3>
                <div style={{ border:'1px solid #e5e7eb', borderRadius:'8px', overflow:'hidden' }}>
                  {calculation.assignmentBreakdown.map((a: AssignmentCalc, i: number) => (
                    <div key={i} style={{ padding:'10px 16px', background: i%2===0?'#fafafa':'#f3f4f6', borderBottom:'1px solid #e5e7eb' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                        <span style={{ fontSize:'13px', fontWeight:600, color:'#111827' }}>{a.label}</span>
                        <span style={{ fontSize:'13px', color:'#7c3aed', fontWeight:600 }}>{taka(a.earnedAmount)}</span>
                      </div>
                      {/* Individual assignment details for grouped entries */}
                      {a.groupedAssignments && a.groupedAssignments.length > 0 && (
                        <div style={{ marginBottom:'5px', paddingLeft:'8px', borderLeft:'2px solid #d8b4fe' }}>
                          {a.groupedAssignments.map((g, gi) => (
                            <div key={gi} style={{ fontSize:'11px', color:'#374151', lineHeight:'1.6' }}>
                              📚 <span style={{ color:'#6b7280' }}>Subject:</span> <strong>{g.subjectName}</strong>{g.className ? <> &nbsp;·&nbsp; <span style={{ color:'#6b7280' }}>Class:</span> <strong>{g.className}</strong></> : ''}{g.batchName ? <> &nbsp;·&nbsp; <span style={{ color:'#6b7280' }}>Batch:</span> <strong>{g.batchName}</strong></> : ''}
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                        <span style={{ fontSize:'11px', background:'#ede9fe', color:'#6d28d9', padding:'1px 6px', borderRadius:'4px' }}>{payTypeLabel(a.payType)}</span>
                        <span style={{ fontSize:'11px', color:'#6b7280' }}>{a.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Salary Summary */}
            <div style={{ marginBottom:'20px' }}>
              <h3 style={{ fontSize:'14px', fontWeight:600, color:'#6b7280', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Salary Calculation</h3>
              <div style={{ border:'1px solid #e5e7eb', borderRadius:'8px', overflow:'hidden' }}>
                {formData.userType === 'staff' ? (
                  <>
                    <Row label="Base Salary (Expected Max)"                                                   value={taka(calculation.baseSalary)}            bg="#f0fdf4" />
                    <Row label={`Per Day Rate (÷ ${calculation.daysInMonth} days)`}                          value={taka(calculation.perDaySalary)}           bg="#f9fafb" />
                    <Row label={`Deduction (${calculation.absentDays} absent × ${taka(calculation.perDaySalary)})`} value={`- ${taka(calculation.deduction)}`} bg="#fef2f2" labelColor="#b91c1c" valueColor="#b91c1c" />
                    <Row label="Payable After Deduction"                                                      value={taka(calculation.payableAfterDeduction)}  bg="#fef9c3" labelColor="#854d0e" />
                  </>
                ) : (
                  <>
                    {calculation.dailyInfo ? (
                      // ── Daily: per-class rate breakdown ──────────────────────────
                      <>
                        <Row label="Total Payment Per Day"                                                    value={taka(calculation.dailyInfo.dailyRate)}                                 bg="#f0fdf4" />
                        <Row label={`Per Class Rate (÷ ${calculation.dailyInfo.totalClassPerDay} classes/day)`} value={taka(calculation.dailyInfo.perClassRate)}                           bg="#f9fafb" />
                        <Row label="Days Present"                                                             value={`${calculation.dailyInfo.daysPresent} days`}                          bg="#f0f9ff" />
                        <Row label="Total Classes Attended"                                                   value={`${calculation.dailyInfo.totalPresentClasses} classes`}                bg="#f0f9ff" />
                        {/* Per-day breakdown table */}
                        {calculation.dailyInfo.perDayBreakdown?.length > 0 && (
                          <div style={{ padding:'10px 16px', background:'#f8faff', borderBottom:'1px solid #e5e7eb' }}>
                            <div style={{ fontSize:'12px', fontWeight:600, color:'#4b5563', marginBottom:'6px' }}>📅 Per-Day Attendance Breakdown</div>
                            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                              <thead>
                                <tr style={{ background:'#e0e7ff' }}>
                                  <th style={{ padding:'5px 8px', textAlign:'left', color:'#3730a3', fontWeight:600 }}>Date</th>
                                  <th style={{ padding:'5px 8px', textAlign:'center', color:'#3730a3', fontWeight:600 }}>Classes Present / Total</th>
                                  <th style={{ padding:'5px 8px', textAlign:'right', color:'#3730a3', fontWeight:600 }}>Earned</th>
                                </tr>
                              </thead>
                              <tbody>
                                {calculation.dailyInfo.perDayBreakdown.map((row: { date: string; classesPresent: number; earned: number }, ri: number) => (
                                  <tr key={ri} style={{ background: ri % 2 === 0 ? '#f5f7ff' : '#eef2ff' }}>
                                    <td style={{ padding:'4px 8px', color:'#374151' }}>{row.date}</td>
                                    <td style={{ padding:'4px 8px', textAlign:'center', color:'#1d4ed8', fontWeight:600 }}>
                                      {row.classesPresent} / {calculation.dailyInfo.totalClassPerDay}
                                    </td>
                                    <td style={{ padding:'4px 8px', textAlign:'right', color:'#166534' }}>{taka(row.earned)}</td>
                                  </tr>
                                ))}
                                <tr style={{ background:'#dbeafe', fontWeight:700 }}>
                                  <td style={{ padding:'5px 8px', color:'#1e3a8a' }}>Total</td>
                                  <td style={{ padding:'5px 8px', textAlign:'center', color:'#1e3a8a' }}>{calculation.dailyInfo.totalPresentClasses} classes</td>
                                  <td style={{ padding:'5px 8px', textAlign:'right', color:'#166534' }}>{taka(calculation.payableAfterDeduction)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                        <Row label="Net Earned"                                                               value={taka(calculation.payableAfterDeduction)}                              bg="#fef9c3" labelColor="#854d0e" bold />
                      </>
                    ) : (
                      <>
                        <Row label={calculation.monthlyHourlyInfo ? "Total Salary Per Month" : "Base Salary (Expected Max)"} value={taka(calculation.baseSalary)}         bg="#f0fdf4" />
                        {calculation.monthlyHourlyInfo ? (
                          // ── Monthly Hourly: rate + hours worked breakdown ───────────
                          <>
                            <Row label="Total Hours Per Month"                                               value={`${calculation.monthlyHourlyInfo.totalMonthHours} hours`}              bg="#f9fafb" />
                            <Row label="Per Hour Rate"                                                       value={taka(calculation.monthlyHourlyInfo.hourlyRate)}                        bg="#f9fafb" />
                            <Row label="Hours Worked"                                                        value={`${calculation.monthlyHourlyInfo.hoursWorked} hours`}                  bg="#f0f9ff" />
                          </>
                        ) : calculation.monthlyInfo ? (
                          // ── Monthly ──────────────────────────────────────────────────
                          calculation.monthlyInfo.isClassBased ? (
                            <>
                              <Row label={`Per Class Rate (÷ ${calculation.monthlyInfo.totalClasses} classes/month)`} value={taka(calculation.monthlyInfo.perClassRate)} bg="#f9fafb" />
                              <Row label="Classes Attended"                                                    value={`${calculation.monthlyInfo.classesAttended} classes`}                        bg="#f0f9ff" />
                            </>
                          ) : (
                            <>
                              <Row label={`Per Day Rate (÷ ${calculation.monthlyInfo.effectiveWorkDays} working days, excl. Fri)`} value={taka(calculation.monthlyInfo.perDayRate)}        bg="#f9fafb" />
                              <Row label="Days Attended"                                                       value={`${calculation.monthlyInfo.daysAttended} days`}        bg="#f0f9ff" />
                            </>
                          )
                        ) : calculation.expectedClassesPerMonth > 0 ? (
                          // ── Class-based fallback ─────────────────────────────────────
                          <>
                            <Row label={`Per Class Rate (÷ ${calculation.expectedClassesPerMonth} classes/month)`} value={taka(calculation.perDaySalary)}    bg="#f9fafb" />
                            <Row label="Classes Attended"                                                    value={`${calculation.totalClassesAttended} classes`}                        bg="#f0f9ff" />
                          </>
                        ) : (
                          // ── Day-based fallback ──────────────────
                          <>
                            <Row label={`Per Day Rate (÷ ${calculation.workingDays} working days, excl. Fri)`} value={taka(calculation.perDaySalary)}        bg="#f9fafb" />
                            <Row label="Days Attended"                                                       value={`${calculation.presentDays} days`}        bg="#f0f9ff" />
                          </>
                        )}
                        {calculation.deduction > 0 && (
                          <Row label="Deduction (Missed Classes/Days)"                                       value={`- ${taka(calculation.deduction)}`}       bg="#fef2f2" labelColor="#b91c1c" valueColor="#b91c1c" />
                        )}
                        <Row label="Net Earned"                                                              value={taka(calculation.payableAfterDeduction)}  bg="#fef9c3" labelColor="#854d0e" bold />
                      </>
                    )}
                  </>
                )}
                <Row label="Advance Deducted"                                                                 value={`- ${taka(calculation.advanceDeducted)}`} bg="#fdf4ff" labelColor="#86198f" />
                <Row label="Final Payable"                                                                    value={taka(calculation.finalPayable)}           bg="#dcfce7" labelColor="#166534" valueColor="#166534" bold />
              </div>
            </div>

            {/* Extra allowance */}
            <div style={{ marginBottom:'16px' }}>
              <label style={{ display:'block', fontSize:'14px', marginBottom:'6px', color:'#111827', fontWeight:500 }}>Extra Allowance (Optional)</label>
              <input
                type="number"
                name="allowance"
                value={formData.allowance}
                onChange={handleChange}
                min="0"
                style={{ width:'100%', padding:'10px 14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', fontSize:'15px' }}
              />
              <p style={{ fontSize:'12px', color:'#6b7280', marginTop:'4px' }}>Will be added to final payable salary.</p>
            </div>

            {/* Payment Method */}
            <div style={{ marginBottom:'20px' }}>
              <label style={{ display:'block', fontSize:'14px', marginBottom:'6px', color:'#111827', fontWeight:500 }}>Payment Method</label>
              <select
                name="method"
                value={formData.method}
                onChange={handleChange}
                style={{ width:'100%', padding:'10px 14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', fontSize:'15px', background:'white' }}
              >
                <option value="cash">💵 Cash</option>
                <option value="bank">🏦 Bank</option>
                <option value="mobile_banking">📱 Mobile Banking</option>
              </select>
            </div>

            {/* Total payable */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px', background:'#dbeafe', borderRadius:'8px', marginBottom:'24px' }}>
              <span style={{ color:'#1e40af', fontSize:'15px', fontWeight:600 }}>Total Payable (incl. allowance)</span>
              <span style={{ background:'#2563eb', color:'white', padding:'8px 20px', borderRadius:'6px', fontWeight:700, fontSize:'16px' }}>
                {taka(calculation.finalPayable + Number(formData.allowance || 0))}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display:'flex', gap:'12px' }}>
              <button
                onClick={() => setStep(1)}
                style={{ padding:'12px 24px', background:'#f3f4f6', color:'#4b5563', border:'none', borderRadius:'8px', fontWeight:600, cursor:'pointer' }}
              >
                ← Back
              </button>
              <button
                onClick={handleConfirmPay}
                disabled={isLoading}
                style={{ flex:1, padding:'12px', background: isLoading ? '#9ca3af' : '#16a34a', color:'white', border:'none', borderRadius:'8px', fontWeight:700, fontSize:'16px', cursor: isLoading ? 'not-allowed' : 'pointer' }}
              >
                ✅ Confirm & Pay {taka(calculation.finalPayable + Number(formData.allowance || 0))}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
