// src/components/attendancePage/MonthlyGridPage.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAttendance } from '@/hooks/useAttendance';
import attendanceApi from '@/api/attendanceApi/attendanceApi';
import { toastManager } from '@/utils/toastConfig';
import styles from './Attendance.module.css';
import Link from 'next/link';

interface ClassItem { _id: string; classname: string; }
interface BatchItem { _id: string; batchName: string; sessionYear?: string; }

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  P:  { label: 'Present', bg: 'rgba(16,185,129,0.12)',  color: '#065f46', dot: '#10b981' },
  A:  { label: 'Absent',  bg: 'rgba(239,68,68,0.12)',   color: '#991b1b', dot: '#ef4444' },
  L:  { label: 'Late',    bg: 'rgba(245,158,11,0.12)',  color: '#92400e', dot: '#f59e0b' },
  LV: { label: 'Leave',   bg: 'rgba(59,130,246,0.12)',  color: '#1e40af', dot: '#3b82f6' },
};

export default function MonthlyGridPage() {
  const { monthlyGridData, loading, error, fetchMonthlyGrid, clearError } = useAttendance();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedMonthYear, setSelectedMonthYear] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // ── Load classes ─────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingClasses(true);
      try {
        const res = await attendanceApi.getClasses();
        const raw = res.data?.data || res.data?.classes || res.data || [];
        setClasses(Array.isArray(raw) ? raw : []);
      } catch {
        toastManager.showError('Failed to load classes');
      } finally {
        setLoadingClasses(false);
      }
    };
    load();
  }, []);

  // ── Load batches when class changes ──────────────────────────────
  useEffect(() => {
    if (!selectedClass) { setBatches([]); setSelectedBatch(''); return; }
    const load = async () => {
      setLoadingBatches(true);
      try {
        const res = await attendanceApi.getBatches(selectedClass);
        const raw = res.data?.data || res.data?.batches || res.data || [];
        setBatches(Array.isArray(raw) ? raw : []);
        setSelectedBatch('');
      } catch (err: any) {
        if (err?.response?.status !== 404) toastManager.showError('Failed to load batches');
        setBatches([]);
      } finally {
        setLoadingBatches(false);
      }
    };
    load();
  }, [selectedClass]);

  // ── Show error toast ──────────────────────────────────────────────
  useEffect(() => {
    if (error) { toastManager.showError(error); clearError(); }
  }, [error, clearError]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleSearch = () => {
    if (!selectedClass || !selectedBatch || !selectedMonthYear) {
      toastManager.showError('Please select class, batch, and month');
      return;
    }
    const [year, month] = selectedMonthYear.split('-');
    setHasSearched(true);
    fetchMonthlyGrid(selectedClass, selectedBatch, parseInt(month, 10), parseInt(year, 10));
  };

  const handleReset = () => {
    setSelectedClass('');
    setSelectedBatch('');
    const now = new Date();
    setSelectedMonthYear(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    setSearchTerm('');
    setHasSearched(false);
  };

  // ── Filtered students ─────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    const students: any[] = monthlyGridData?.students ?? [];
    if (!searchTerm.trim()) return students;
    const q = searchTerm.toLowerCase();
    return students.filter((s: any) =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.registrationId || '').toLowerCase().includes(q)
    );
  }, [monthlyGridData, searchTerm]);

  // ── Per-student summary ───────────────────────────────────────────
  const getStudentSummary = (student: any) => {
    const vals = Object.values(student.attendance || {}) as string[];
    return {
      present: vals.filter(v => v === 'P').length,
      absent:  vals.filter(v => v === 'A').length,
      late:    vals.filter(v => v === 'L').length,
      leave:   vals.filter(v => v === 'LV').length,
      total:   vals.filter(v => v !== '').length,
    };
  };

  // ── Header data ───────────────────────────────────────────────────
  const headerClass = classes.find(c => c._id === (monthlyGridData?.classId || selectedClass))?.classname || '';
  const headerBatch = batches.find(b => b._id === (monthlyGridData?.batchId || selectedBatch))?.batchName || '';
  const headerMonth = monthlyGridData
    ? `${new Date(monthlyGridData.year, monthlyGridData.month - 1).toLocaleString('default', { month: 'long' })} ${monthlyGridData.year}`
    : '';

  // ── Overall stats ─────────────────────────────────────────────────
  const overallStats = useMemo(() => {
    if (!monthlyGridData?.students) return null;
    let present = 0, absent = 0, late = 0, leave = 0;
    monthlyGridData.students.forEach((s: any) => {
      const sum = getStudentSummary(s);
      present += sum.present;
      absent  += sum.absent;
      late    += sum.late;
      leave   += sum.leave;
    });
    const total = present + absent + late + leave;
    return { present, absent, late, leave, total };
  }, [monthlyGridData]);

  return (
    <div className={styles.pageContainer}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <Link
                href="/dashboard/student-attendance"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6366f1', fontWeight: 600, textDecoration: 'none', padding: '4px 10px', background: 'rgba(99,102,241,0.08)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)', transition: 'all .2s' }}
              >
                ← Back
              </Link>
            </div>
            <h1 className={styles.pageTitle}>Monthly Attendance Sheet</h1>
            <p className={styles.pageSubtitle}>View full-month attendance grid for any class &amp; batch</p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className={styles.filterCard}>
        <h3 className={styles.filterTitle} style={{ marginBottom: '1rem' }}>Select Class, Batch &amp; Month</h3>
        <div className={styles.filterGrid}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Class <span style={{ color: '#ef4444' }}>*</span></label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className={styles.filterSelect}
              disabled={loadingClasses}
            >
              <option value="">{loadingClasses ? 'Loading...' : 'Select Class'}</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.classname}</option>)}
            </select>
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Batch <span style={{ color: '#ef4444' }}>*</span></label>
            <select
              value={selectedBatch}
              onChange={e => setSelectedBatch(e.target.value)}
              className={styles.filterSelect}
              disabled={!selectedClass || loadingBatches}
            >
              <option value="">
                {!selectedClass ? 'Select class first' : loadingBatches ? 'Loading...' : batches.length === 0 ? 'No batches' : 'Select Batch'}
              </option>
              {batches.map(b => <option key={b._id} value={b._id}>{b.batchName}{b.sessionYear ? ` (${b.sessionYear})` : ''}</option>)}
            </select>
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Month &amp; Year <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              type="month"
              value={selectedMonthYear}
              onChange={e => setSelectedMonthYear(e.target.value)}
              className={styles.filterInput}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <button onClick={handleSearch} className={styles.btnPrimary} type="button" disabled={loading || !selectedClass || !selectedBatch || !selectedMonthYear}>
            {loading ? (
              <><span className={styles.spinnerSmall}></span> Loading...</>
            ) : (
              <>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                View Attendance
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className={styles.btnSecondary}
            type="button"
            style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Result area ── */}
      {hasSearched && (
        <>
          {/* Stats strip */}
          {overallStats && !loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Total Entries', val: overallStats.total, bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', icon: '📊' },
                { label: 'Present',       val: overallStats.present, bg: 'linear-gradient(135deg,#10b981,#059669)', icon: '✅' },
                { label: 'Absent',        val: overallStats.absent,  bg: 'linear-gradient(135deg,#ef4444,#dc2626)', icon: '❌' },
                { label: 'Late',          val: overallStats.late,    bg: 'linear-gradient(135deg,#f59e0b,#d97706)', icon: '⏰' },
                { label: 'Leave',         val: overallStats.leave,   bg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', icon: '🏖️' },
              ].map(item => (
                <div key={item.label} className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: item.bg }}>{item.icon}</div>
                  <div className={styles.statContent}>
                    <p className={styles.statLabel}>{item.label}</p>
                    <p className={styles.statValue}>{item.val}</p>
                    {overallStats.total > 0 && item.label !== 'Total Entries' && (
                      <span className={styles.statSubtext}>{((item.val / overallStats.total) * 100).toFixed(1)}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.tableCard}>
            {/* Table header row */}
            <div className={styles.tableHeader} style={{ marginBottom: 16 }}>
              <div>
                <h2 className={styles.tableTitle}>
                  {headerClass && headerBatch ? (
                    <>{headerClass} &bull; {headerBatch} &bull; <span style={{ color: '#6366f1' }}>{headerMonth}</span></>
                  ) : (
                    <>Monthly Grid</>
                  )}
                </h2>
                {monthlyGridData && (
                  <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>
                    {monthlyGridData.students?.length ?? 0} student{(monthlyGridData.students?.length ?? 0) !== 1 ? 's' : ''} &bull; {monthlyGridData.dates?.length ?? 0} class day{(monthlyGridData.dates?.length ?? 0) !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Search */}
              {monthlyGridData && (
                <div className={styles.searchBox} style={{ maxWidth: 300 }}>
                  <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name or ID…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className={styles.searchClear} type="button">✕</button>
                  )}
                </div>
              )}
            </div>

            {/* Legend */}
            {monthlyGridData && !loading && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                {Object.entries(STATUS_CONFIG).map(([code, cfg]) => (
                  <span key={code} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 600, border: `1px solid ${cfg.dot}33` }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                    {code} = {cfg.label}
                  </span>
                ))}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280', fontSize: 12, fontWeight: 600, border: '1px solid #e5e7eb' }}>
                  — = Not recorded
                </span>
              </div>
            )}

            <div className={styles.tableWrapper}>
              {loading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.spinnerLarge}></div>
                  <p className={styles.loadingText}>Loading attendance grid…</p>
                  <p className={styles.loadingSubtext}>Fetching records for {headerMonth || 'selected month'}</p>
                </div>
              ) : !monthlyGridData ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📅</div>
                  <h3 className={styles.emptyTitle}>No data found</h3>
                  <p className={styles.emptyDescription}>No attendance records were found for the selected filters. Try a different month or batch.</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🔍</div>
                  <h3 className={styles.emptyTitle}>No students match</h3>
                  <p className={styles.emptyDescription}>No students found for "{searchTerm}". Try a different search term.</p>
                </div>
              ) : (
                <table className={styles.table} style={{ minWidth: Math.max(800, 300 + monthlyGridData.dates.length * 44 + 180) }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center', width: 44 }}>#</th>
                      <th style={{ minWidth: 160 }}>Student</th>
                      <th style={{ minWidth: 120 }}>Reg. ID</th>
                      {monthlyGridData.dates.map((dateStr: string) => {
                        const d = new Date(dateStr + 'T00:00:00');
                        const day = d.getDate();
                        const dow = DAY_ABBR[d.getDay()];
                        const isWeekend = d.getDay() === 5 || d.getDay() === 6;
                        return (
                          <th key={dateStr} style={{ textAlign: 'center', width: 44, minWidth: 44, padding: '10px 4px', background: isWeekend ? 'rgba(99,102,241,0.06)' : undefined }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: isWeekend ? '#6366f1' : '#1f2937' }}>{day}</div>
                            <div style={{ fontSize: 10, color: isWeekend ? '#6366f1' : '#9ca3af', fontWeight: 500 }}>{dow}</div>
                          </th>
                        );
                      })}
                      <th style={{ textAlign: 'center', minWidth: 44 }} title="Present">P</th>
                      <th style={{ textAlign: 'center', minWidth: 44 }} title="Absent">A</th>
                      <th style={{ textAlign: 'center', minWidth: 44 }} title="Late">L</th>
                      <th style={{ textAlign: 'center', minWidth: 80 }}>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student: any, index: number) => {
                      const sum = getStudentSummary(student);
                      const rate = sum.total > 0 ? Math.round((sum.present / sum.total) * 100) : 0;
                      const rateColor = rate >= 75 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';

                      return (
                        <tr key={student._id}>
                          <td style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>{index + 1}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                                {(student.name || '?').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#1f2937', fontSize: 14 }}>{student.name || '—'}</div>
                                {student.institute && <div style={{ fontSize: 11, color: '#9ca3af' }}>{student.institute}</div>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(99,102,241,0.2)' }}>
                              {student.registrationId || '—'}
                            </span>
                          </td>
                          {monthlyGridData.dates.map((dateStr: string) => {
                            const status = student.attendance[dateStr] || '';
                            const cfg = STATUS_CONFIG[status];
                            const d = new Date(dateStr + 'T00:00:00');
                            const isWeekend = d.getDay() === 5 || d.getDay() === 6;
                            return (
                              <td key={dateStr} style={{ textAlign: 'center', padding: '8px 4px', background: isWeekend ? 'rgba(99,102,241,0.03)' : undefined }}>
                                {cfg ? (
                                  <span style={{ display: 'inline-flex', width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', background: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 11 }}>
                                    {status}
                                  </span>
                                ) : (
                                  <span style={{ color: '#d1d5db', fontSize: 14 }}>—</span>
                                )}
                              </td>
                            );
                          })}
                          {/* Summary columns */}
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ display: 'inline-flex', width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.12)', color: '#065f46', fontWeight: 700, fontSize: 12 }}>
                              {sum.present}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ display: 'inline-flex', width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.12)', color: '#991b1b', fontWeight: 700, fontSize: 12 }}>
                              {sum.absent}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ display: 'inline-flex', width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', background: 'rgba(245,158,11,0.12)', color: '#92400e', fontWeight: 700, fontSize: 12 }}>
                              {sum.late}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                              <span style={{ fontWeight: 700, fontSize: 13, color: rateColor }}>{rate}%</span>
                              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e7eb', overflow: 'hidden' }}>
                                <div style={{ width: `${rate}%`, height: '100%', background: rateColor, borderRadius: 2, transition: 'width .3s' }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Initial empty state */}
      {!hasSearched && (
        <div className={styles.tableCard}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📅</div>
            <h3 className={styles.emptyTitle}>Monthly Attendance Grid</h3>
            <p className={styles.emptyDescription}>Select a class, batch and month above, then click <strong>View Attendance</strong> to see the full grid.</p>
          </div>
        </div>
      )}
    </div>
  );
}
