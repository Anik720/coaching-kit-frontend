// src/components/attendancePage/AttendancePage.tsx
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAttendance } from "@/hooks/useAttendance";
import { clearError, clearSuccess } from "@/api/attendanceApi/attendanceSlice";
import { toastManager } from "@/utils/toastConfig";
import styles from './Attendance.module.css';
import ConfirmationModal from "../common/ConfirmationModal";
import attendanceApi from "@/api/attendanceApi/attendanceApi";
import Link from 'next/link';

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

interface ClassItem { _id: string; classname: string; }
interface BatchItem { _id: string; batchName: string; sessionYear: string; }
interface StudentItem {
  _id: string;
  registrationId: string;
  nameEnglish: string;
  class: { _id: string; classname: string; };
  batch: { _id: string; batchName: string; };
}

export default function AttendancePage() {
  const {
    attendanceRecords,
    loading,
    error,
    success,
    total,
    totalPages,
    dispatch,
    fetchAttendanceRecords,
    clearError: clearAttendanceError,
    clearSuccess: clearAttendanceSuccess,
  } = useAttendance();

  // Filter dropdown state
  const [filterClasses, setFilterClasses] = useState<ClassItem[]>([]);
  const [filterBatches, setFilterBatches] = useState<BatchItem[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");

  // Detail modal state
  const [detailSession, setDetailSession] = useState<any | null>(null);

  // Delete state
  const [attendanceToDelete, setAttendanceToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // ── Load filter classes ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await attendanceApi.getClasses();
        const raw = res.data?.data || res.data?.classes || res.data || [];
        setFilterClasses(Array.isArray(raw) ? raw : []);
      } catch { /* silent */ }
    };
    load();
  }, []);

  // ── Load filter batches when class filter changes ────────────────
  useEffect(() => {
    if (!classFilter) { setFilterBatches([]); setBatchFilter(""); return; }
    const load = async () => {
      try {
        const res = await attendanceApi.getBatches(classFilter);
        const raw = res.data?.data || res.data?.batches || res.data || [];
        setFilterBatches(Array.isArray(raw) ? raw : []);
        setBatchFilter("");
      } catch (err: any) {
        if (err.response?.status !== 404) console.error(err);
        setFilterBatches([]);
      }
    };
    load();
  }, [classFilter]);

  // ── Fetch attendance records ─────────────────────────────────────
  useEffect(() => {
    const filters: any = {
      page: currentPage,
      limit: 10,
      sortBy: 'attendanceDate',
      sortOrder: 'desc',
    };
    if (debouncedSearchTerm) filters.search = debouncedSearchTerm;
    if (dateFilter) filters.attendanceDate = dateFilter;
    if (classFilter) filters.classId = classFilter;
    if (batchFilter) filters.batchId = batchFilter;
    fetchAttendanceRecords(filters);
  }, [debouncedSearchTerm, currentPage, dateFilter, classFilter, batchFilter]);

  // ── Toast notifications ──────────────────────────────────────────
  useEffect(() => {
    if (success) { toastManager.showSuccess('Done!'); dispatch(clearAttendanceSuccess()); }
    if (error) { toastManager.showError(error); dispatch(clearAttendanceError()); }
  }, [success, error]);

  // ── Helpers ──────────────────────────────────────────────────────
  const getStudentName = (student: any) => {
    if (!student) return 'Unknown';
    if (student.nameEnglish) return student.nameEnglish;
    const f = student.firstName || '', l = student.lastName || '';
    return (f + ' ' + l).trim() || student.studentId || 'Unknown';
  };

  const formatDate = (d: string) => {
    if (!d) return 'N/A';
    try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' }); }
    catch { return d; }
  };

  const statusClass = (s: string) => {
    switch (s) {
      case 'present': return styles.present;
      case 'absent': return styles.absent;
      case 'late': return styles.late;
      default: return styles.halfDay;
    }
  };

  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : 'N/A';

  // ── Session summary from records[] ───────────────────────────────
  const sessionSummary = (session: any) => {
    const recs: any[] = Array.isArray(session.records) ? session.records : [];
    return {
      total: recs.length,
      present: recs.filter(r => r.status === 'present').length,
      absent: recs.filter(r => r.status === 'absent').length,
      late: recs.filter(r => r.status === 'late').length,
    };
  };

  // ── Overall stats (from loaded page) ─────────────────────────────
  const overallStats = useMemo(() => {
    let total = 0, present = 0, absent = 0, late = 0;
    attendanceRecords.forEach((s: any) => {
      const recs: any[] = Array.isArray(s.records) ? s.records : [];
      total += recs.length;
      recs.forEach((r: any) => {
        if (r.status === 'present') present++;
        else if (r.status === 'absent') absent++;
        else if (r.status === 'late') late++;
      });
    });
    return { total, present, absent, late };
  }, [attendanceRecords]);

  // ── Pagination ───────────────────────────────────────────────────
  const handlePageChange = useCallback((p: number) => {
    if (p >= 1 && p <= totalPages) { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }, [totalPages]);

  // ── Delete ───────────────────────────────────────────────────────
  const handleDeleteClick = (id: string) => setAttendanceToDelete(id);
  const handleDeleteCancel = () => setAttendanceToDelete(null);
  const handleDeleteConfirm = useCallback(async () => {
    if (!attendanceToDelete) return;
    setIsDeleting(true);
    const tid = toastManager.showLoading('Deleting...');
    try {
      await attendanceApi.deleteAttendance(attendanceToDelete);
      toastManager.safeUpdateToast(tid, 'Deleted!', 'success');
      fetchAttendanceRecords({ page: currentPage, limit: 10, sortBy: 'attendanceDate', sortOrder: 'desc' });
    } catch {
      toastManager.safeUpdateToast(tid, 'Failed to delete', 'error');
    } finally {
      setIsDeleting(false);
      setAttendanceToDelete(null);
    }
  }, [attendanceToDelete, currentPage]);

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>Students Attendance</h1>
            <p className={styles.pageSubtitle}>Track and manage student attendance records</p>
          </div>
          <Link href="/dashboard/student-attendance/submit" className={styles.btnPrimary}>
            <svg className={styles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Take Attendance
          </Link>
        </div>
      </div>

      {/* Stats cards (summary of current page) */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>👨‍🎓</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Students</p>
            <p className={styles.statValue}>{overallStats.total}</p>
            <span className={styles.statSubtext}>Across loaded sessions</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>✅</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Present</p>
            <p className={styles.statValue}>{overallStats.present}</p>
            <span className={styles.statSubtext}>{overallStats.total > 0 ? ((overallStats.present / overallStats.total) * 100).toFixed(1) : 0}% rate</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>⏰</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Late</p>
            <p className={styles.statValue}>{overallStats.late}</p>
            <span className={styles.statSubtext}>{overallStats.total > 0 ? ((overallStats.late / overallStats.total) * 100).toFixed(1) : 0}% late rate</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>❌</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Absent</p>
            <p className={styles.statValue}>{overallStats.absent}</p>
            <span className={styles.statSubtext}>{overallStats.total > 0 ? ((overallStats.absent / overallStats.total) * 100).toFixed(1) : 0}% absence</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterCard}>
        <h3 className={styles.filterTitle}>Filter Attendance Records</h3>
        <div className={styles.filterGrid}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Date</label>
            <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setCurrentPage(1); }} className={styles.filterInput} />
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Class</label>
            <select value={classFilter} onChange={e => { setClassFilter(e.target.value); setCurrentPage(1); }} className={styles.filterSelect}>
              <option value="">All Classes</option>
              {filterClasses.map(c => <option key={c._id} value={c._id}>{c.classname}</option>)}
            </select>
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Batch</label>
            <select value={batchFilter} onChange={e => { setBatchFilter(e.target.value); setCurrentPage(1); }} className={styles.filterSelect} disabled={!classFilter}>
              <option value="">All Batches</option>
              {filterBatches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
            </select>
          </div>
          <div className={styles.filterActions}>
            <button onClick={() => { setDateFilter(""); setClassFilter(""); setBatchFilter(""); setCurrentPage(1); }} className={styles.btnSecondary} type="button">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            Attendance Records <span className={styles.tableCount}>({total} sessions)</span>
          </h2>
          {/* Search */}
          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by remarks..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              disabled={loading}
            />
            {searchTerm && (
              <button onClick={() => { setSearchTerm(""); if (searchInputRef.current) searchInputRef.current.focus(); }} className={styles.searchClear} type="button">✕</button>
            )}
            {loading && <div className={styles.searchLoading}><div className={styles.spinnerSmall}></div></div>}
          </div>
        </div>

        {loading && !attendanceRecords.length ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinnerLarge}></div>
            <p className={styles.loadingText}>Loading attendance records...</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              {attendanceRecords.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📊</div>
                  <h3 className={styles.emptyTitle}>No attendance records found</h3>
                  <p className={styles.emptyDescription}>
                    {dateFilter || classFilter || batchFilter || searchTerm
                      ? "No records match your filters."
                      : "No attendance records yet. Start by taking attendance!"}
                  </p>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Attendance Name</th>
                      <th>Class</th>
                      <th>Batch</th>
                      <th>Total</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Time</th>
                      <th>Recorded By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((session: any, idx: number) => {
                      const summary = sessionSummary(session);
                      const date = formatDate(session.attendanceDate);
                      const className = session.class?.classname || 'N/A';
                      const batchName = session.batch?.batchName || 'N/A';
                      const serialNo = (currentPage - 1) * 10 + idx + 1;
                      return (
                        <tr key={session._id}>
                          <td>{serialNo}</td>
                          <td>
                            <button
                              className={styles.attendanceNameBtn}
                              onClick={() => setDetailSession(session)}
                              title="Click to view student details"
                              type="button"
                            >
                              {className} : {batchName} &bull; {date}
                            </button>
                          </td>
                          <td>
                            <span className={styles.classBadge}>{className}</span>
                          </td>
                          <td>
                            <button
                              className={styles.batchBadgeBtn}
                              onClick={() => setDetailSession(session)}
                              title="Click to view student attendance"
                              type="button"
                            >
                              {batchName}
                            </button>
                          </td>
                          <td><strong>{summary.total}</strong></td>
                          <td><span className={`${styles.countBadge} ${styles.presentBadge}`}>{summary.present}</span></td>
                          <td><span className={`${styles.countBadge} ${styles.absentBadge}`}>{summary.absent}</span></td>
                          <td className={styles.timeCell}>
                            {session.classStartTime || '--:--'} - {session.classEndTime || '--:--'}
                          </td>
                          <td>
                            <div className={styles.userCell}>
                              <div className={styles.userAvatar}>
                                {session.createdBy?.username?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div className={styles.userInfo}>
                                <span className={styles.userName}>{session.createdBy?.username || 'Unknown'}</span>
                                <span className={styles.userRole}>{session.createdBy?.role || ''}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className={styles.actionButtons}>
                              <button onClick={() => setDetailSession(session)} className={styles.btnEdit} title="View Details" type="button">👁️</button>
                              <button onClick={() => handleDeleteClick(session._id)} className={styles.btnDelete} title="Delete" disabled={loading || isUpdating} type="button">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button onClick={() => handlePageChange(1)} disabled={currentPage === 1 || loading} className={styles.paginationButton} type="button">First</button>
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} className={styles.paginationButton} type="button">Previous</button>
                <div className={styles.paginationPages}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 5) p = i + 1;
                    else if (currentPage <= 3) p = i + 1;
                    else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
                    else p = currentPage - 2 + i;
                    return (
                      <button key={p} onClick={() => handlePageChange(p)} className={`${styles.pageNumber} ${currentPage === p ? styles.activePage : ''}`} type="button">{p}</button>
                    );
                  })}
                </div>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || loading} className={styles.paginationButton} type="button">Next</button>
                <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages || loading} className={styles.paginationButton} type="button">Last</button>
                <span className={styles.paginationInfo}>Page {currentPage} of {totalPages}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!attendanceToDelete}
        title="Delete Attendance Session"
        message="Are you sure you want to delete this entire attendance session? All student records will be removed."
        confirmText="Delete Session"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isConfirming={isDeleting}
        isDanger={true}
        icon="danger"
      />

      {/* Batch Detail Modal */}
      {detailSession && (
        <div className={styles.modalOverlay} onClick={() => setDetailSession(null)}>
          <div className={styles.modal} style={{ maxWidth: '800px', width: '95vw' }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Attendance Details</h2>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '4px' }}>
                  {detailSession.class?.classname} &bull; {detailSession.batch?.batchName} &bull; {formatDate(detailSession.attendanceDate)}
                  {detailSession.classStartTime && ` • ${detailSession.classStartTime} - ${detailSession.classEndTime || ''}`}
                </p>
              </div>
              <button onClick={() => setDetailSession(null)} className={styles.modalClose} type="button">✕</button>
            </div>

            {/* Session summary badges */}
            <div style={{ display: 'flex', gap: '12px', padding: '12px 0', flexWrap: 'wrap' }}>
              {(() => {
                const sm = sessionSummary(detailSession);
                return (
                  <>
                    <span style={{ background: '#f3f4f6', padding: '4px 12px', borderRadius: '999px', fontSize: '0.85rem' }}>Total: <strong>{sm.total}</strong></span>
                    <span style={{ background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: '999px', fontSize: '0.85rem' }}>Present: <strong>{sm.present}</strong></span>
                    <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 12px', borderRadius: '999px', fontSize: '0.85rem' }}>Absent: <strong>{sm.absent}</strong></span>
                    <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '999px', fontSize: '0.85rem' }}>Late: <strong>{sm.late}</strong></span>
                  </>
                );
              })()}
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.8rem' }}>Recorded by: <strong>{detailSession.createdBy?.username || 'Unknown'}</strong></p>

            <div className={styles.modalBody} style={{ padding: '0', maxHeight: '60vh', overflowY: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(detailSession.records) ? detailSession.records : []).length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>No student records found</td></tr>
                  ) : (
                    (detailSession.records as any[]).map((rec: any, i: number) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>
                          <div className={styles.studentCell}>
                            <div className={styles.studentAvatar}>
                              {getStudentName(rec.student).charAt(0).toUpperCase()}
                            </div>
                            <span className={styles.studentName}>{getStudentName(rec.student)}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                          {rec.student?.registrationId || rec.student?.studentId || 'N/A'}
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${statusClass(rec.status)}`}>
                            {capitalize(rec.status)}
                          </span>
                        </td>
                        <td style={{ color: '#6b7280' }}>{rec.remarks || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setDetailSession(null)} className={styles.btnSecondary} type="button">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}