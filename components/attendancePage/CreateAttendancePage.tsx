// src/components/attendancePage/CreateAttendancePage.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAttendance } from '@/hooks/useAttendance';
import attendanceApi from '@/api/attendanceApi/attendanceApi';
import { toastManager } from '@/utils/toastConfig';
import styles from './Attendance.module.css';

interface Class { _id: string; classname: string; }
interface Batch { _id: string; batchName: string; sessionYear: string; }

const STATUS_OPTIONS = [
  { key: 'present', label: 'P',  fullLabel: 'Present',  color: '#059669', bg: '#d1fae5', activeBg: '#059669' },
  { key: 'absent',  label: 'A',  fullLabel: 'Absent',   color: '#dc2626', bg: '#fee2e2', activeBg: '#dc2626' },
  { key: 'late',    label: 'L',  fullLabel: 'Late',     color: '#d97706', bg: '#fef3c7', activeBg: '#d97706' },
  { key: 'leave',   label: 'LV', fullLabel: 'Leave',    color: '#7c3aed', bg: '#ede9fe', activeBg: '#7c3aed' },
];

export default function CreateAttendancePage() {
  const { loading, error, success, submitAttendance, clearError, clearSuccess } = useAttendance();

  const [classes, setClasses]           = useState<Class[]>([]);
  const [batches, setBatches]           = useState<Batch[]>([]);
  const [students, setStudents]         = useState<any[]>([]);
  const [selectedClass, setSelectedClass]   = useState('');
  const [selectedBatch, setSelectedBatch]   = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [classStartingTime, setClassStartingTime] = useState('');
  const [classEndingTime, setClassEndingTime]     = useState('');
  const [studentAttendance, setStudentAttendance] = useState<Record<string, string>>({});
  const [studentRemarks, setStudentRemarks]       = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery]             = useState('');
  const [formErrors, setFormErrors]               = useState<Record<string, string>>({});
  const [batchSummary, setBatchSummary]           = useState<{
    totalClasses: number;
    students: Array<{ studentId: string; present: number; absent: number; late: number; leave: number }>;
  } | null>(null);

  // ── Data loading ─────────────────────────────────────────────────────────

  useEffect(() => {
    attendanceApi.getClasses().then(r => {
      const d = r.data?.data || r.data?.classes || r.data || [];
      setClasses(Array.isArray(d) ? d : []);
    }).catch(() => toastManager.showError('Failed to load classes'));
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setBatches([]); setSelectedBatch(''); setStudents([]); setBatchSummary(null);
      return;
    }
    attendanceApi.getBatches(selectedClass).then(r => {
      const d = r.data?.data || r.data?.batches || r.data || [];
      setBatches(Array.isArray(d) ? d : []);
      setSelectedBatch(''); setStudents([]); setBatchSummary(null);
    }).catch(() => toastManager.showError('Failed to load batches'));
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !selectedBatch) return;
    attendanceApi.getStudentsByClassBatch(selectedClass, selectedBatch).then(r => {
      const raw = r.data?.data || r.data?.students || r.data || [];
      const list = Array.isArray(raw) ? raw : [];
      setStudents(list);
      const init: Record<string, string> = {};
      list.forEach((s: any) => { init[s._id] = 'present'; });
      setStudentAttendance(init);
      setStudentRemarks({});
      setFormErrors({});
    }).catch(() => { toastManager.showError('Failed to load students'); setStudents([]); });
  }, [selectedClass, selectedBatch]);

  useEffect(() => {
    if (!selectedBatch || !attendanceDate) { setBatchSummary(null); return; }
    attendanceApi.getBatchAttendanceSummary(selectedBatch, attendanceDate)
      .then(r => setBatchSummary(r.data || null))
      .catch(() => setBatchSummary(null));
  }, [selectedBatch, attendanceDate]);

  useEffect(() => {
    if (error) { toastManager.showError(error); clearError(); }
  }, [error, clearError]);

  useEffect(() => {
    if (success) {
      toastManager.showSuccess('Attendance submitted successfully');
      clearSuccess();
      setSelectedClass(''); setSelectedBatch(''); setStudents([]);
    }
  }, [success, clearSuccess]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const summaryMap = useMemo(() => {
    if (!batchSummary) return new Map<string, { present: number; absent: number; late: number; leave: number }>();
    return new Map(batchSummary.students.map(s => [s.studentId, s]));
  }, [batchSummary]);

  const getPrevBadge = (studentId: string) => {
    if (!batchSummary || batchSummary.totalClasses === 0) return null;
    const total = batchSummary.totalClasses;
    const rec   = summaryMap.get(studentId);
    const present = rec?.present ?? 0;
    const pct   = Math.round((present / total) * 100);
    const isGood = pct >= 80;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        marginTop: 3, padding: '2px 8px', borderRadius: 999,
        fontSize: 11, fontWeight: 700, letterSpacing: '0.2px',
        background: isGood ? '#d1fae5' : '#fee2e2',
        color: isGood ? '#065f46' : '#991b1b',
        border: `1px solid ${isGood ? '#6ee7b7' : '#fca5a5'}`,
      }}>
        {isGood ? '▲' : '▼'} Prev {present}/{total} ({pct}%)
      </span>
    );
  };

  const handleAttendanceChange = (id: string, type: string) =>
    setStudentAttendance(prev => ({ ...prev, [id]: type }));

  const handleRemarkChange = (id: string, val: string) =>
    setStudentRemarks(prev => ({ ...prev, [id]: val }));

  const setAllStatus = (type: string) => {
    const next: Record<string, string> = {};
    students.forEach(s => { next[s._id] = type; });
    setStudentAttendance(next);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!selectedClass)      errors.class     = 'Please select a class';
    if (!selectedBatch)      errors.batch     = 'Please select a batch';
    if (!attendanceDate)     errors.date      = 'Date is required';
    if (!classStartingTime)  errors.startTime = 'Start time is required';
    if (!classEndingTime)    errors.endTime   = 'End time is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) { toastManager.showError('Please fill all required fields'); return; }
    if (students.length === 0) { toastManager.showError('No students to submit attendance for'); return; }
    submitAttendance({
      class: selectedClass,
      batch: selectedBatch,
      attendanceDate,
      classStartTime: classStartingTime,
      classEndTime:   classEndingTime,
      records: students.map(s => ({
        student: s._id,
        status:  studentAttendance[s._id] || 'present',
        remarks: studentRemarks[s._id]    || '',
      })),
    });
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s =>
      s.nameEnglish?.toLowerCase().includes(q) ||
      s.registrationId?.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // ── Live stats ────────────────────────────────────────────────────────────

  const liveCounts = useMemo(() => {
    const counts: Record<string, number> = { present: 0, absent: 0, late: 0, leave: 0 };
    Object.values(studentAttendance).forEach(s => { if (counts[s] !== undefined) counts[s]++; });
    return counts;
  }, [studentAttendance]);

  const selectedBatchName = batches.find(b => b._id === selectedBatch)?.batchName;
  const selectedClassName  = classes.find(c => c._id === selectedClass)?.classname;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.pageContainer}>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className={styles.pageHeader} style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', marginBottom: 24 }}>
        <div className={styles.headerContent}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, backdropFilter: 'blur(4px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}>📋</div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>
                Submit Attendance
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0 0', fontSize: 14 }}>
                {selectedClassName && selectedBatchName
                  ? `${selectedClassName} · ${selectedBatchName} · ${attendanceDate}`
                  : 'Select class and batch to begin'}
              </p>
            </div>
          </div>

          {students.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={styles.btnPrimary}
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.35)', boxShadow: 'none' }}
            >
              {loading ? <><span className={styles.spinnerSmall}/> Submitting…</> : '✓ Submit Attendance'}
            </button>
          )}
        </div>
      </div>

      {/* ── Configuration Form ───────────────────────────────────────────── */}
      <div className={styles.filterCard} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 18 }}>⚙️</span>
          <h2 className={styles.filterTitle} style={{ margin: 0 }}>Session Setup</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Row 1: Class + Batch */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>
                Class <span className={styles.required}>*</span>
              </label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className={`${styles.filterSelect} ${formErrors.class ? styles.inputError : ''}`}
                disabled={loading}
              >
                <option value="">— Select Class —</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.classname}</option>)}
              </select>
              {formErrors.class && <span className={styles.errorMessage}>{formErrors.class}</span>}
            </div>

            <div className={styles.filterField}>
              <label className={styles.filterLabel}>
                Batch <span className={styles.required}>*</span>
              </label>
              <select
                value={selectedBatch}
                onChange={e => setSelectedBatch(e.target.value)}
                className={`${styles.filterSelect} ${formErrors.batch ? styles.inputError : ''}`}
                disabled={loading || !selectedClass}
              >
                <option value="">— Select Batch —</option>
                {batches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
              </select>
              {formErrors.batch && <span className={styles.errorMessage}>{formErrors.batch}</span>}
            </div>
          </div>

          {/* Row 2: Date + Start + End + Quick-mark */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr', gap: '1.25rem' }}>
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>
                Attendance Date <span className={styles.required}>*</span>
              </label>
              <input
                type="date"
                value={attendanceDate}
                onChange={e => setAttendanceDate(e.target.value)}
                className={`${styles.filterInput} ${formErrors.date ? styles.inputError : ''}`}
                disabled={loading}
              />
              {formErrors.date && <span className={styles.errorMessage}>{formErrors.date}</span>}
            </div>

            <div className={styles.filterField}>
              <label className={styles.filterLabel}>
                Start Time <span className={styles.required}>*</span>
              </label>
              <input
                type="time"
                value={classStartingTime}
                onChange={e => setClassStartingTime(e.target.value)}
                className={`${styles.filterInput} ${formErrors.startTime ? styles.inputError : ''}`}
                disabled={loading}
              />
              {formErrors.startTime && <span className={styles.errorMessage}>{formErrors.startTime}</span>}
            </div>

            <div className={styles.filterField}>
              <label className={styles.filterLabel}>
                End Time <span className={styles.required}>*</span>
              </label>
              <input
                type="time"
                value={classEndingTime}
                onChange={e => setClassEndingTime(e.target.value)}
                className={`${styles.filterInput} ${formErrors.endTime ? styles.inputError : ''}`}
                disabled={loading}
              />
              {formErrors.endTime && <span className={styles.errorMessage}>{formErrors.endTime}</span>}
            </div>

            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Quick-Mark All</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setAllStatus(opt.key)}
                    disabled={loading || students.length === 0}
                    style={{
                      flex: 1, padding: '9px 0',
                      border: `2px solid ${opt.color}`,
                      borderRadius: 8, background: opt.bg,
                      color: opt.color, fontWeight: 700, fontSize: 13,
                      cursor: students.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: students.length === 0 ? 0.5 : 1,
                      transition: 'all 0.2s',
                    }}
                    title={`Mark all as ${opt.fullLabel}`}
                    onMouseOver={e => { if (students.length > 0) (e.currentTarget.style.background = opt.activeBg); (e.currentTarget.style.color = '#fff'); }}
                    onMouseOut={e  => { (e.currentTarget.style.background = opt.bg); (e.currentTarget.style.color = opt.color); }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ── Live Stats ───────────────────────────────────────────────────── */}
      {students.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total',   value: students.length, color: '#6366f1', bg: '#eef2ff', icon: '👥' },
            { label: 'Present', value: liveCounts.present, color: '#059669', bg: '#d1fae5', icon: '✅' },
            { label: 'Absent',  value: liveCounts.absent,  color: '#dc2626', bg: '#fee2e2', icon: '❌' },
            { label: 'Late',    value: liveCounts.late,    color: '#d97706', bg: '#fef3c7', icon: '⏰' },
            { label: 'Leave',   value: liveCounts.leave,   color: '#7c3aed', bg: '#ede9fe', icon: '📅' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: '#fff', borderRadius: 14, padding: '16px 20px',
              border: `1px solid ${stat.color}22`,
              boxShadow: `0 2px 8px ${stat.color}14`,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: stat.bg, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, marginTop: 2 }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Student Table ────────────────────────────────────────────────── */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            Students
            {students.length > 0 && (
              <span className={styles.tableCount}>
                &nbsp;({filteredStudents.length}{searchQuery ? ` of ${students.length}` : ''})
              </span>
            )}
          </h2>

          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name or ID…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              disabled={students.length === 0}
            />
            {searchQuery && (
              <button className={styles.searchClear} onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>
        </div>

        <div className={styles.tableWrapper}>
          {loading && students.length === 0 ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinnerLarge}/>
              <p className={styles.loadingText}>Loading students…</p>
              <p className={styles.loadingSubtext}>Please wait</p>
            </div>
          ) : students.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎒</div>
              <h3 className={styles.emptyTitle}>No Students Yet</h3>
              <p className={styles.emptyDescription}>Select a class and batch above to load the student list.</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔍</div>
              <h3 className={styles.emptyTitle}>No Match Found</h3>
              <p className={styles.emptyDescription}>No student matches "{searchQuery}"</p>
            </div>
          ) : (
            <table className={styles.table} style={{ minWidth: 860 }}>
              <thead>
                <tr>
                  <th style={{ width: 48, textAlign: 'center' }}>#</th>
                  <th>Student</th>
                  <th style={{ textAlign: 'center', minWidth: 240 }}>Attendance Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, idx) => {
                  const status  = studentAttendance[student._id] || 'present';
                  const opt     = STATUS_OPTIONS.find(o => o.key === status)!;
                  const rowBg   = `${opt.activeBg}0d`; // ~5% tint

                  return (
                    <tr key={student._id} style={{ background: rowBg, transition: 'background 0.2s' }}>

                      {/* Serial */}
                      <td style={{ textAlign: 'center', color: '#9ca3af', fontWeight: 600, fontSize: 13 }}>
                        {idx + 1}
                      </td>

                      {/* Student info */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className={styles.studentAvatar} style={{ flexShrink: 0 }}>
                            {student.nameEnglish?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className={styles.studentName}>{student.nameEnglish}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                              {student.registrationId && (
                                <span style={{
                                  fontSize: 11, fontWeight: 600, color: '#6366f1',
                                  background: '#eef2ff', borderRadius: 4, padding: '1px 6px',
                                }}>#{student.registrationId}</span>
                              )}
                              {student.instituteName && (
                                <span style={{ fontSize: 11, color: '#9ca3af' }}>{student.instituteName}</span>
                              )}
                            </div>
                            {getPrevBadge(student._id)}
                          </div>
                        </div>
                      </td>

                      {/* Status toggle buttons */}
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          {STATUS_OPTIONS.map(o => {
                            const isActive = status === o.key;
                            return (
                              <button
                                key={o.key}
                                type="button"
                                onClick={() => handleAttendanceChange(student._id, o.key)}
                                disabled={loading}
                                title={o.fullLabel}
                                style={{
                                  minWidth: 46, padding: '6px 10px',
                                  border: `2px solid ${isActive ? o.activeBg : o.color + '55'}`,
                                  borderRadius: 8,
                                  background: isActive ? o.activeBg : 'transparent',
                                  color: isActive ? '#fff' : o.color,
                                  fontWeight: 700, fontSize: 12,
                                  cursor: loading ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.18s',
                                  boxShadow: isActive ? `0 3px 10px ${o.activeBg}66` : 'none',
                                }}
                              >
                                {o.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Remarks */}
                      <td>
                        <input
                          type="text"
                          placeholder="Add remark…"
                          value={studentRemarks[student._id] || ''}
                          onChange={e => handleRemarkChange(student._id, e.target.value)}
                          className={styles.remarkInput}
                          disabled={loading}
                          style={{ width: '100%', minWidth: 140 }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Submit Footer ──────────────────────────────────────────────── */}
        {students.length > 0 && (
          <div style={{
            marginTop: 24, paddingTop: 20,
            borderTop: '2px solid #e5e7eb',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {STATUS_OPTIONS.map(o => (
                <span key={o.key} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 999,
                  background: o.bg, color: o.color,
                  fontWeight: 700, fontSize: 13,
                }}>
                  <span style={{ background: o.activeBg, color: '#fff', borderRadius: 4, padding: '0 5px', fontSize: 11 }}>{o.label}</span>
                  {liveCounts[o.key]}
                </span>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={styles.btnPrimary}
              style={{ minWidth: 180, justifyContent: 'center' }}
            >
              {loading
                ? <><span className={styles.spinnerSmall}/>&nbsp;Submitting…</>
                : '✓ Submit Attendance'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
