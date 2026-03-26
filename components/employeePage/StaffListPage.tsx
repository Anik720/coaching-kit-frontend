"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEmployee } from "@/hooks/useEmployee";
import { clearError, clearSuccess } from "@/api/employeeApi/employeeSlice";
import { toastManager } from "@/utils/toastConfig";
import employeeApi from "@/api/employeeApi/employeeApi";
import styles from "./Employee.module.css";
import Link from "next/link";
import ConfirmationModal from "@/components/common/ConfirmationModal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const useDebounce = (value: string, delay: number) => {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
};

const formatDate = (d?: string) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
};

const capitalize = (s: string) =>
  s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "active": return styles.badgeActive;
    case "inactive": return styles.badgeInactive;
    case "suspended": return styles.badgeSuspended;
    case "resigned": return styles.badgeResigned;
    case "on_leave": return styles.badgeOnLeave;
    default: return styles.badgeInactive;
  }
}

const DESIGNATIONS = [
  "manager", "accountant", "receptionist", "office_assistant",
  "security_guard", "peon", "librarian", "it_staff", "admin_staff",
  "cleaner", "driver", "cook", "other",
];

export default function StaffListPage() {
  const { employees, loading, error, success, total, totalPages, statistics, dispatch, fetchAll, fetchStatistics, remove } =
    useEmployee();

  const [search, setSearch] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(search, 500);

  const PAGE_LIMIT = 10;

  const loadEmployees = useCallback(() => {
    const params: any = { page: currentPage, limit: PAGE_LIMIT };
    if (debouncedSearch) params.search = debouncedSearch;
    if (designationFilter) params.designation = designationFilter;
    if (statusFilter) params.status = statusFilter;
    fetchAll(params);
  }, [currentPage, debouncedSearch, designationFilter, statusFilter]);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);
  useEffect(() => { fetchStatistics(); }, []);

  useEffect(() => {
    if (success) { toastManager.showSuccess("Done!"); dispatch(clearSuccess()); }
    if (error) { toastManager.showError(error); dispatch(clearError()); }
  }, [success, error]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const tid = toastManager.showLoading("Deleting...");
    try {
      await remove(deleteTarget);
      toastManager.safeUpdateToast(tid, "Staff deleted!", "success");
      loadEmployees();
    } catch {
      toastManager.safeUpdateToast(tid, "Failed to delete", "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleClearFilters = () => {
    setSearch(""); setDesignationFilter(""); setStatusFilter(""); setCurrentPage(1);
  };

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) { setCurrentPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  return (
    <div className={styles.pageContainerWide}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Staff List</h1>
          <p>Manage all employee profiles</p>
        </div>
        <Link href="/dashboard/employee/add" className={styles.btnPrimary}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Staff
        </Link>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" }}>👥</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Staff</p>
            <p className={styles.statValue}>{statistics?.total ?? total ?? 0}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>✅</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Active</p>
            <p className={styles.statValue}>{statistics?.active ?? 0}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}>⏸</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Inactive</p>
            <p className={styles.statValue}>{statistics?.inactive ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterCard}>
        <div className={styles.filterRow}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Designation</label>
            <select
              className={styles.filterSelect}
              value={designationFilter}
              onChange={(e) => { setDesignationFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Designations</option>
              {DESIGNATIONS.map((d) => <option key={d} value={d}>{capitalize(d)}</option>)}
            </select>
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Status</label>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="resigned">Resigned</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
          <div className={styles.filterActions}>
            <button className={styles.btnSecondary} onClick={handleClearFilters} type="button">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            Employees <span className={styles.tableCount}>({total})</span>
          </h2>
          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search name, contact, email..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.loadingWrapper}><div className={styles.spinner} /></div>
          ) : employees.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>👥</span>
              <p className={styles.emptyText}>No staff found. Add your first staff member!</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Contact</th>
                  <th>Designation</th>
                  <th>Salary</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id}>
                    <td>
                      <div className={styles.staffInfo}>
                        <div className={styles.staffAvatar}>
                          {emp.profilePicture ? (
                            <img
                              src={`${API_BASE}${emp.profilePicture}`}
                              alt={emp.fullName}
                              className={styles.staffAvatarImg}
                            />
                          ) : (
                            <span>👤</span>
                          )}
                        </div>
                        <div>
                          <div className={styles.staffName}>{emp.fullName}</div>
                          <div className={styles.staffEmail}>{emp.systemEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.contactNumber || "—"}</td>
                    <td>{capitalize(emp.designation)}</td>
                    <td>{emp.salary ? `${emp.salary.toLocaleString()} ৳` : "—"}</td>
                    <td>{formatDate(emp.joiningDate)}</td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(emp.status)}`}>
                        {capitalize(emp.status)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        <button
                          className={styles.actionBtnDelete}
                          onClick={() => setDeleteTarget(emp._id)}
                          type="button"
                          title="Delete"
                        >
                          Delete
                        </button>
                      </div>
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
              Page {currentPage} of {totalPages} · {total} staff
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

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmationModal
          isOpen={true}
          title="Delete Staff Member"
          message="Are you sure you want to permanently delete this staff profile? This cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isConfirming={deleting}
          isDanger={true}
        />
      )}
    </div>
  );
}
