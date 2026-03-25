"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTeacher } from "@/hooks/useTeacher";
import {
  fetchTeachers,
  createTeacher,
  deleteTeacher,
  updateTeacherStatus,
  clearError,
  clearSuccess,
} from "@/api/teacherApi/teacherSlice";
import { toastManager } from "@/utils/toastConfig";
import CreateTeacherModal from "./CreateTeacherModal";
import ConfirmationModal from "../common/ConfirmationModal";
import {
  TeacherItem,
  TeacherStatus,
  CreateTeacherDto,
} from "@/api/teacherApi/types/teacher.types";
import styles from "./TeacherListPage.module.css";

const STATUS_COLORS: Record<TeacherStatus, string> = {
  [TeacherStatus.ACTIVE]: "#28a745",
  [TeacherStatus.INACTIVE]: "#6c757d",
  [TeacherStatus.SUSPENDED]: "#dc3545",
  [TeacherStatus.RESIGNED]: "#fd7e14",
  [TeacherStatus.ON_LEAVE]: "#ffc107",
};

const formatLabel = (val: string) =>
  val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

export default function TeacherListPage() {
  const router = useRouter();
  const { teachers, loading, error, success, total, totalPages, dispatch } = useTeacher();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TeacherStatus | "">("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Load teachers
  useEffect(() => {
    dispatch(
      fetchTeachers({
        page: currentPage,
        limit: 15,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      })
    );
  }, [dispatch, currentPage, debouncedSearch, statusFilter]);

  // Toast on success/error
  useEffect(() => {
    if (success) {
      toastManager.showSuccess("Operation completed successfully!");
      dispatch(clearSuccess());
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch]);

  // Close status dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCreate = useCallback(
    async (data: CreateTeacherDto) => {
      const id = toastManager.showLoading("Creating teacher...");
      try {
        await dispatch(createTeacher(data)).unwrap();
        toastManager.updateToast(id, "Teacher created successfully!", "success");
        setShowCreate(false);
      } catch (err: any) {
        toastManager.safeUpdateToast(id, err.message || "Failed to create teacher", "error");
      }
    },
    [dispatch]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const id = toastManager.showLoading("Deleting teacher...");
    try {
      await dispatch(deleteTeacher(deleteTarget)).unwrap();
      toastManager.safeUpdateToast(id, "Teacher deleted!", "success");
    } catch (err: any) {
      toastManager.safeUpdateToast(id, err.message || "Failed to delete", "error");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [dispatch, deleteTarget]);

  const handleStatusFilter = (status: TeacherStatus | "") => {
    setStatusFilter(status);
    setCurrentPage(1);
    setShowStatusDropdown(false);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Teacher List</h1>
        <div className={styles.headerActions}>
          {/* Teacher Status Filter */}
          <div className={styles.statusDropdownWrap} ref={statusDropdownRef}>
            <button
              className={styles.btnStatus}
              onClick={() => setShowStatusDropdown((p) => !p)}
              type="button"
            >
              {statusFilter ? formatLabel(statusFilter) : "Teacher Status"}
              <span className={styles.chevron}>▾</span>
            </button>
            {showStatusDropdown && (
              <div className={styles.statusDropdown}>
                <button
                  className={`${styles.statusOption} ${statusFilter === "" ? styles.active : ""}`}
                  onClick={() => handleStatusFilter("")}
                >
                  All Status
                </button>
                {Object.values(TeacherStatus).map((s) => (
                  <button
                    key={s}
                    className={`${styles.statusOption} ${statusFilter === s ? styles.active : ""}`}
                    onClick={() => handleStatusFilter(s)}
                  >
                    <span
                      className={styles.statusDot}
                      style={{ background: STATUS_COLORS[s] }}
                    />
                    {formatLabel(s)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add New Teacher */}
          <button
            className={styles.btnAdd}
            onClick={() => setShowCreate(true)}
            type="button"
            disabled={loading}
          >
            + Add New Teacher
          </button>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <svg
            className={styles.searchIcon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              className={styles.searchClear}
              onClick={() => setSearchTerm("")}
              type="button"
            >
              ✕
            </button>
          )}
        </div>
        <span className={styles.totalCount}>Total: {total}</span>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Profile Pic</th>
              <th>Staff Name</th>
              <th>Designation</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && teachers.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.loadingCell}>
                  <div className={styles.spinner} />
                  <span>Loading teachers...</span>
                </td>
              </tr>
            ) : teachers.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyCell}>
                  <div className={styles.emptyIcon}>👨‍🏫</div>
                  <p>
                    {searchTerm || statusFilter
                      ? "No teachers match your search."
                      : "Not Found"}
                  </p>
                  {!searchTerm && !statusFilter && (
                    <button
                      className={styles.btnAdd}
                      onClick={() => setShowCreate(true)}
                      type="button"
                    >
                      + Add New Teacher
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              teachers.map((teacher, idx) => (
                <TeacherRow
                  key={teacher._id}
                  serial={(currentPage - 1) * 15 + idx + 1}
                  teacher={teacher}
                  onDelete={() => setDeleteTarget(teacher._id)}
                  onView={() => router.push(`/dashboard/teachers/${teacher._id}`)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={currentPage === 1 || loading}
            onClick={() => setCurrentPage((p) => p - 1)}
            type="button"
          >
            ← Prev
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} / {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={currentPage === totalPages || loading}
            onClick={() => setCurrentPage((p) => p + 1)}
            type="button"
          >
            Next →
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateTeacherModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
          loading={loading}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isConfirming={isDeleting}
        isDanger={true}
        icon="danger"
      />
    </div>
  );
}

/* ─── TeacherRow ─── */
function TeacherRow({
  serial,
  teacher,
  onDelete,
  onView,
}: {
  serial: number;
  teacher: TeacherItem;
  onDelete: () => void;
  onView: () => void;
}) {
  const initials = teacher.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const statusColor = STATUS_COLORS[teacher.status] ?? "#6c757d";

  return (
    <tr className={styles.row}>
      <td className={styles.serial}>{serial}</td>
      <td>
        <div className={styles.avatar}>
          {teacher.profilePicture ? (
            <Image
              src={teacher.profilePicture}
              alt={teacher.fullName}
              width={40}
              height={40}
              className={styles.avatarImg}
            />
          ) : (
            <span className={styles.avatarInitials}>{initials}</span>
          )}
        </div>
      </td>
      <td>
        <div className={styles.nameCell}>
          <span className={styles.name}>{teacher.fullName}</span>
          <span className={styles.nameId}>{teacher.nationalId}</span>
        </div>
      </td>
      <td>
        <span className={styles.designation}>{formatLabel(teacher.designation)}</span>
      </td>
      <td>
        <div className={styles.phoneCell}>
          <span>{teacher.contactNumber}</span>
        </div>
      </td>
      <td>
        <span className={styles.email}>{teacher.email}</span>
      </td>
      <td>
        <span
          className={styles.statusBadge}
          style={{ background: statusColor + "22", color: statusColor, border: `1px solid ${statusColor}44` }}
        >
          {formatLabel(teacher.status)}
        </span>
      </td>
      <td>
        <div className={styles.actions}>
          <button
            className={styles.btnView}
            onClick={onView}
            title="View Details"
            type="button"
          >
            👁
          </button>
          <button
            className={styles.btnDelete}
            onClick={onDelete}
            title="Delete"
            type="button"
          >
            🗑
          </button>
        </div>
      </td>
    </tr>
  );
}
