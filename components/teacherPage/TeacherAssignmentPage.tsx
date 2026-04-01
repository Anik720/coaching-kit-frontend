"use client";

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import {
  fetchTeachers,
  createBulkAssignments,
  updateTeacher,
  updateAssignment,
  deleteAssignment,
} from '../../api/teacherApi/teacherSlice';
import { fetchClasses } from '../../api/classApi/classSlice';
import { fetchBatches } from '../../api/batchApi/batchSlice';
import { fetchSubjects } from '../../api/subjectApi/subjectSlice';
import { PaymentType, CreateAssignmentDto, TeacherItem, TeacherAssignment } from '../../api/teacherApi/types/teacher.types';
import styles from './TeacherAssignment.module.css';
import { toast } from 'react-toastify';
import api from '../../api/axios';

interface SubjectAssignmentRow {
  id: string;                   // React key
  _id?: string;                 // DB assignment ID — present for existing assignments
  classId: string;
  batchId: string;
  subjectId: string;
  paymentType: PaymentType | '';
  ratePerClass: string;
  durationMinutes: string;
  totalClassesPerMonth: string;
}

const emptyRow = (): SubjectAssignmentRow => ({
  id: `new-${Date.now()}-${Math.random()}`,
  classId: '', batchId: '', subjectId: '', paymentType: '',
  ratePerClass: '', durationMinutes: '', totalClassesPerMonth: '',
});

const mapAssignmentToRow = (a: TeacherAssignment): SubjectAssignmentRow => ({
  id: a._id,
  _id: a._id,
  classId: a.class?._id || '',
  batchId: a.batch?._id || '',
  subjectId: a.subject?._id || '',
  paymentType: a.paymentType,
  ratePerClass: String(a.ratePerClass ?? ''),
  durationMinutes: String(a.durationMinutes ?? ''),
  totalClassesPerMonth: String(a.totalClassesPerMonth ?? ''),
});

const TeacherAssignmentPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { teachers, loading: teacherLoading } = useSelector((state: RootState) => state.teacher);
  const { classes } = useSelector((state: RootState) => state.class);
  const { batches } = useSelector((state: RootState) => state.batch);
  const { subjects } = useSelector((state: RootState) => state.subject);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Tracks DB IDs that were loaded so we can detect removals
  const [originalIds, setOriginalIds] = useState<Set<string>>(new Set());

  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState<PaymentType[]>([]);
  const [monthlyHourlySetup, setMonthlyHourlySetup] = useState({ totalHours: '', totalPayment: '' });
  const [dailySetup, setDailySetup] = useState({ totalClass: '', totalPayment: '' });
  const [monthlySetup, setMonthlySetup] = useState({ amount: '', hasTotalClass: false, totalClassesPerMonth: '' });
  const [assignmentRows, setAssignmentRows] = useState<SubjectAssignmentRow[]>([emptyRow()]);
  const [enableExtraPayment, setEnableExtraPayment] = useState<boolean>(false);

  useEffect(() => {
    dispatch(fetchTeachers({ limit: 1000 }));
    dispatch(fetchClasses({ limit: 1000 }));
    dispatch(fetchBatches({ limit: 1000 }));
    dispatch(fetchSubjects({ limit: 1000 }));
  }, [dispatch]);

  // When teacher changes: fetch their existing assignments and populate the form
  useEffect(() => {
    if (!selectedTeacherId) {
      setSelectedPaymentTypes([]);
      setMonthlyHourlySetup({ totalHours: '', totalPayment: '' });
      setDailySetup({ totalClass: '', totalPayment: '' });
      setMonthlySetup({ amount: '', hasTotalClass: false, totalClassesPerMonth: '' });
      setEnableExtraPayment(false);
      setAssignmentRows([emptyRow()]);
      setOriginalIds(new Set());
      return;
    }

    // Pre-populate enableExtraPayment from teacher record
    const teacher = teachers.find((t: TeacherItem) => t._id === selectedTeacherId);
    if (teacher) setEnableExtraPayment(teacher.enableExtraPayment ?? false);

    const loadAssignments = async () => {
      setLoadingAssignments(true);
      try {
        const res = await api.get('/teacher-assignments', {
          params: { teacher: selectedTeacherId, status: 'active', limit: 500 },
        });
        const assignments: TeacherAssignment[] = res.data?.assignments ?? [];

        if (!assignments.length) {
          setSelectedPaymentTypes([]);
          setMonthlyHourlySetup({ totalHours: '', totalPayment: '' });
          setDailySetup({ totalClass: '', totalPayment: '' });
          setMonthlySetup({ amount: '', hasTotalClass: false, totalClassesPerMonth: '' });
          setAssignmentRows([emptyRow()]);
          setOriginalIds(new Set());
          return;
        }

        // Collect all payment types present in existing assignments
        const types = [...new Set(assignments.map(a => a.paymentType))];
        setSelectedPaymentTypes(types);

        // Populate global setups from the first assignment of each relevant type
        const mh = assignments.find(a => a.paymentType === PaymentType.MONTHLY_HOURLY);
        if (mh) {
          setMonthlyHourlySetup({
            totalHours: String(mh.totalHoursPerMonth ?? ''),
            totalPayment: String(mh.amount ?? ''),
          });
        }
        const daily = assignments.find(a => a.paymentType === PaymentType.DAILY);
        if (daily) {
          setDailySetup({
            totalClass: String(daily.totalClassPerDay ?? ''),
            totalPayment: String(daily.amount ?? ''),
          });
        }
        const monthly = assignments.find(a => a.paymentType === PaymentType.MONTHLY);
        if (monthly) {
          setMonthlySetup({
            amount: String(monthly.amount ?? ''),
            hasTotalClass: monthly.hasTotalClass ?? false,
            totalClassesPerMonth: String(monthly.totalClassesPerMonth ?? ''),
          });
        }

        setAssignmentRows(assignments.map(mapAssignmentToRow));
        setOriginalIds(new Set(assignments.map(a => a._id)));
      } catch {
        toast.error('Failed to load existing assignments');
        setAssignmentRows([emptyRow()]);
        setOriginalIds(new Set());
      } finally {
        setLoadingAssignments(false);
      }
    };

    loadAssignments();
  }, [selectedTeacherId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePaymentTypeToggle = (type: PaymentType) => {
    setSelectedPaymentTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleAddRow = () => {
    setAssignmentRows(prev => [...prev, emptyRow()]);
  };

  const handleRemoveRow = (id: string) => {
    if (assignmentRows.length > 1) {
      setAssignmentRows(prev => prev.filter(row => row.id !== id));
    }
  };

  const handleRowChange = (id: string, field: keyof SubjectAssignmentRow, value: string) => {
    setAssignmentRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      if (field === 'classId') return { ...row, classId: value, batchId: '' };
      return { ...row, [field]: value };
    }));
  };

  const getBatchesForClass = (classId: string) => {
    if (!classId) return [];
    return batches.filter(b => {
      const bClassId = typeof b.className === 'object' ? (b.className as any)._id : b.className;
      return bClassId === classId;
    });
  };

  const buildAssignmentData = (row: SubjectAssignmentRow): CreateAssignmentDto => {
    const base: CreateAssignmentDto = {
      teacher: selectedTeacherId,
      subject: row.subjectId,
      paymentType: row.paymentType as PaymentType,
      amount: 0,
      effectiveFrom: new Date().toISOString(),
    };
    if (row.classId) base.class = row.classId;
    if (row.batchId) base.batch = row.batchId;

    switch (row.paymentType) {
      case PaymentType.MONTHLY_HOURLY:
        base.totalHoursPerMonth = Number(monthlyHourlySetup.totalHours) || 0;
        base.amount = Number(monthlyHourlySetup.totalPayment) || 0;
        break;
      case PaymentType.DAILY:
        base.totalClassPerDay = Number(dailySetup.totalClass) || 0;
        base.amount = Number(dailySetup.totalPayment) || 0;
        break;
      case PaymentType.MONTHLY:
        base.amount = Number(monthlySetup.amount) || 0;
        base.hasTotalClass = monthlySetup.hasTotalClass;
        if (monthlySetup.hasTotalClass) {
          base.totalClassesPerMonth = Number(monthlySetup.totalClassesPerMonth) || 0;
        }
        break;
      case PaymentType.PER_CLASS_HOURLY: {
        const hourlyRate  = Number(row.ratePerClass) || 0;
        const durMins     = Number(row.durationMinutes) || 0;
        const clsPerMonth = Number(row.totalClassesPerMonth) || 0;
        base.ratePerClass = hourlyRate;   // stored here for backward compat
        base.ratePerHour  = hourlyRate;   // also store as ratePerHour explicitly
        base.durationMinutes = durMins;
        base.totalClassesPerMonth = clsPerMonth;
        // amount = hourlyRate × (duration in hours) × classes per month
        base.amount = hourlyRate * (durMins / 60) * clsPerMonth;
        break;
      }
      case PaymentType.PER_CLASS:
        base.ratePerClass = Number(row.ratePerClass) || 0;
        base.totalClassesPerMonth = Number(row.totalClassesPerMonth) || 0;
        base.amount = Number(row.ratePerClass) || 0;
        break;
    }
    return base;
  };

  const handleSubmit = async () => {
    if (!selectedTeacherId) return toast.error('Please select a teacher');
    if (assignmentRows.some(r => !r.subjectId || !r.paymentType)) {
      return toast.error('Please complete all assignment rows (Subject and Payment Type are required)');
    }

    try {
      const currentIds = new Set(assignmentRows.filter(r => r._id).map(r => r._id!));

      // Assignments that were removed from the form → delete from DB
      const toDelete = [...originalIds].filter(id => !currentIds.has(id));

      // Rows with a DB ID → update
      const toUpdate = assignmentRows.filter(r => r._id);

      // Rows without a DB ID → create
      const toCreate = assignmentRows.filter(r => !r._id);

      // Run deletes, updates, creates in parallel where safe
      await Promise.all(toDelete.map(id => dispatch(deleteAssignment(id)).unwrap()));
      await Promise.all(
        toUpdate.map(row =>
          dispatch(updateAssignment({ id: row._id!, assignmentData: buildAssignmentData(row) })).unwrap()
        )
      );
      if (toCreate.length > 0) {
        await dispatch(createBulkAssignments(toCreate.map(buildAssignmentData))).unwrap();
      }

      await dispatch(updateTeacher({
        id: selectedTeacherId,
        teacherData: { enableExtraPayment },
      })).unwrap();

      toast.success('Assignments saved successfully');

      // Refresh form state to reflect DB IDs for any newly created rows
      const res = await api.get('/teacher-assignments', {
        params: { teacher: selectedTeacherId, status: 'active', limit: 500 },
      });
      const refreshed: TeacherAssignment[] = res.data?.assignments ?? [];
      setOriginalIds(new Set(refreshed.map(a => a._id)));
      setAssignmentRows(refreshed.length > 0 ? refreshed.map(mapAssignmentToRow) : [emptyRow()]);
    } catch (error: any) {
      toast.error(error || 'Failed to save assignments');
    }
  };

  const isLoading = teacherLoading || loadingAssignments;

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
          <button className={styles.submitBtnTop} onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Submit'}
          </button>
        </div>
        <div className={styles.cardBody}>
          <select
            className={styles.selectInput}
            value={selectedTeacherId}
            onChange={e => setSelectedTeacherId(e.target.value)}
            disabled={isLoading}
          >
            <option value="">Select a Teacher</option>
            {teachers.map((t: TeacherItem) => (
              <option key={t._id} value={t._id}>{t.fullName} ({t.designation})</option>
            ))}
          </select>
          {loadingAssignments && (
            <p style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
              ⏳ Loading existing assignments...
            </p>
          )}
          {!loadingAssignments && selectedTeacherId && originalIds.size > 0 && (
            <p style={{ marginTop: '8px', fontSize: '13px', color: '#059669' }}>
              ✅ {originalIds.size} existing assignment{originalIds.size !== 1 ? 's' : ''} loaded — you can edit, add, or remove.
            </p>
          )}
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
                    onChange={e => setMonthlyHourlySetup({ ...monthlyHourlySetup, totalHours: e.target.value })}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Total Payment</label>
                  <input
                    type="number"
                    value={monthlyHourlySetup.totalPayment}
                    onChange={e => setMonthlyHourlySetup({ ...monthlyHourlySetup, totalPayment: e.target.value })}
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
                    onChange={e => setDailySetup({ ...dailySetup, totalClass: e.target.value })}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Total Payment Per Day</label>
                  <input
                    type="number"
                    value={dailySetup.totalPayment}
                    onChange={e => setDailySetup({ ...dailySetup, totalPayment: e.target.value })}
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
                      onChange={e => setMonthlySetup({ ...monthlySetup, hasTotalClass: e.target.checked })}
                    />
                  </label>
                </div>
                <div className={styles.inputGroup}>
                  <label>Amount</label>
                  <input
                    type="number"
                    value={monthlySetup.amount}
                    onChange={e => setMonthlySetup({ ...monthlySetup, amount: e.target.value })}
                  />
                </div>
                {monthlySetup.hasTotalClass && (
                  <div className={styles.inputGroup}>
                    <label>Total Class Per Month</label>
                    <input
                      type="number"
                      value={monthlySetup.totalClassesPerMonth}
                      onChange={e => setMonthlySetup({ ...monthlySetup, totalClassesPerMonth: e.target.value })}
                      placeholder="e.g. 24"
                    />
                  </div>
                )}
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
              const isExisting = !!row._id;

              return (
                <div key={row.id} className={styles.assignmentRow}>
                  {/* Existing badge */}
                  {isExisting && (
                    <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                      existing
                    </span>
                  )}

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
                      <option key={pt} value={pt}>{pt.replace(/_/g, ' ').toUpperCase()}</option>
                    ))}
                  </select>

                  {/* Per Class: rate + classes/month */}
                  {row.paymentType === PaymentType.PER_CLASS && (
                    <div className={styles.inlineRateGroup}>
                      <span className={styles.inlineRateLabel}>Per Class</span>
                      <input
                        type="number"
                        className={styles.inlineRateInput}
                        placeholder="Classes/Month"
                        min="0"
                        value={row.totalClassesPerMonth}
                        onChange={e => handleRowChange(row.id, 'totalClassesPerMonth', e.target.value)}
                      />
                      <input
                        type="number"
                        className={styles.inlineRateInput}
                        placeholder="৳ Rate/Class"
                        min="0"
                        value={row.ratePerClass}
                        onChange={e => handleRowChange(row.id, 'ratePerClass', e.target.value)}
                      />
                    </div>
                  )}

                  {/* Per Class Hourly: duration + classes/month + rate */}
                  {row.paymentType === PaymentType.PER_CLASS_HOURLY && (
                    <div className={styles.inlineRateGroup}>
                      <span className={styles.inlineRateLabel}>Per Class Hourly</span>
                      <input
                        type="number"
                        className={styles.inlineRateInput}
                        placeholder="Duration (min)"
                        min="0"
                        value={row.durationMinutes}
                        onChange={e => handleRowChange(row.id, 'durationMinutes', e.target.value)}
                      />
                      <input
                        type="number"
                        className={styles.inlineRateInput}
                        placeholder="Classes/Month"
                        min="0"
                        value={row.totalClassesPerMonth}
                        onChange={e => handleRowChange(row.id, 'totalClassesPerMonth', e.target.value)}
                      />
                      <input
                        type="number"
                        className={styles.inlineRateInput}
                        placeholder="৳ Rate/Hour"
                        min="0"
                        value={row.ratePerClass}
                        onChange={e => handleRowChange(row.id, 'ratePerClass', e.target.value)}
                      />
                    </div>
                  )}

                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleRemoveRow(row.id)}
                    title={isExisting ? 'Remove Assignment (will be deleted from DB on submit)' : 'Remove Row'}
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
