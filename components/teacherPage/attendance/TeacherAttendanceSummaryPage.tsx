"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTeacherAttendance } from "@/hooks/useTeacherAttendance";
import { clearError } from "@/api/teacherAttendanceApi/teacherAttendanceSlice";
import { toastManager } from "@/utils/toastConfig";
import teacherAttendanceApi from "@/api/teacherAttendanceApi/teacherAttendanceApi";
import styles from "./TeacherAttendance.module.css";
import Link from "next/link";

interface Teacher { _id: string; fullName: string; }

const formatDate = (d: string | Date) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return String(d);
  }
};

export default function TeacherAttendanceSummaryPage() {
  const router = useRouter();
  const { records, loading, error, total, dispatch, fetchAll, clearError: ce } =
    useTeacherAttendance();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherFilter, setTeacherFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_LIMIT = 15;
  const totalPages = Math.ceil(total / PAGE_LIMIT) || 1;

  // Load teachers dropdown
  useEffect(() => {
    teacherAttendanceApi
      .getTeachers()
      .then((res) => {
        const data = res.data?.teachers || res.data?.data || res.data || [];
        setTeachers(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  // Fetch records
  const loadRecords = useCallback(() => {
    const params: any = { page: currentPage, limit: PAGE_LIMIT };
    if (teacherFilter) params.teacher = teacherFilter;
    if (dateFilter) params.date = dateFilter;
    fetchAll(params);
  }, [currentPage, teacherFilter, dateFilter]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    if (error) { toastManager.showError(error); dispatch(ce()); }
  }, [error]);

  const handleFilter = () => { setCurrentPage(1); loadRecords(); };

  const handleReset = () => {
    setTeacherFilter("");
    setDateFilter("");
    setCurrentPage(1);
    fetchAll({ page: 1, limit: PAGE_LIMIT });
  };

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Teacher Attendance Summary</h1>
          <p>View and manage teacher attendance records</p>
        </div>
        <Link href="/dashboard/teachers/take-attendance" className={styles.btnPrimary}>
          <svg className={styles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Take Attendance
        </Link>
      </div>

      {/* Filters */}
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Select Teacher</label>
            <select
              className={styles.filterSelect}
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
            >
              <option value="">-- All Teachers --</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.fullName}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Select Date</label>
            <input
              type="date"
              className={styles.filterInput}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <div className={styles.filterActions}>
            <button className={styles.btnPrimary} onClick={handleFilter} type="button" style={{ padding: "10px 20px" }}>
              Filter
            </button>
            <button className={styles.btnSecondary} onClick={handleReset} type="button">
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            Attendance Records <span className={styles.tableCount}>({total})</span>
          </h2>
        </div>
        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.loadingWrapper}><div className={styles.spinner} /></div>
          ) : records.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📋</span>
              <p className={styles.emptyText}>No attendance records found</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>👨‍🏫 Teacher</th>
                  <th>📅 Date</th>
                  <th>✅ Attendance Count</th>
                  <th>Approval Status</th>
                  <th>🔍 Details</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id}>
                    <td>
                      <strong>{record.teacher?.fullName || "—"}</strong>
                    </td>
                    <td>{formatDate(record.date)}</td>
                    <td>{record.totalClasses ?? record.attendanceDetails?.length ?? 0}</td>
                    <td>
                      <span className={`${styles.badge} ${getApprovalBadgeClass(record.approvalStatus)}`}>
                        {record.approvalStatus || "submitted"}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.actionBtnView}
                        onClick={() =>
                          router.push(
                            `/dashboard/teachers/attendance-list/detail?teacherId=${record.teacher?._id}&date=${record.date}&recordId=${record._id}`
                          )
                        }
                        type="button"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Page {currentPage} of {totalPages} &nbsp;·&nbsp; {total} records
            </span>
            <div className={styles.paginationButtons}>
              <button className={styles.pageBtn} onClick={() => handlePageChange(1)} disabled={currentPage === 1}>«</button>
              <button className={styles.pageBtn} onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                return p <= totalPages ? (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${p === currentPage ? styles.active : ""}`}
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </button>
                ) : null;
              })}
              <button className={styles.pageBtn} onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
              <button className={styles.pageBtn} onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getApprovalBadgeClass(status: string) {
  switch (status) {
    case "approved": return styles.badgeApproved;
    case "rejected": return styles.badgeRejected;
    case "pending": return styles.badgePending;
    default: return styles.badgeSubmitted;
  }
}
