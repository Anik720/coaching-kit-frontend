"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSubject } from "@/hooks/useSubject";
import { toastManager } from "@/utils/toastConfig";
import styles from "./Subjects.module.css";
import ConfirmationModal from "../common/ConfirmationModal";
import {
  clearError,
  clearSuccess,
  createSubject,
  deleteSubject,
  fetchSubjects,
  updateSubject,
} from "@/api/subjectApi/subjectSlice";

// Reuse your existing debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function SubjectsPage() {
  const {
    subjects,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    dispatch,
  } = useSubject();

  const [open, setOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<{
    id: string;
    subjectName: string;
    description: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "my">("all");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch subjects on component mount and when filters change
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        await dispatch(
          fetchSubjects({
            search: debouncedSearchTerm || undefined,
            page: currentPage,
            limit: 10,
            sortBy: "createdAt",
            sortOrder: "desc",
            isActive: viewMode === "all" ? undefined : true,
          })
        ).unwrap();
      } catch (error: any) {
        console.error("Failed to load subjects:", error);
      }
    };

    loadSubjects();
  }, [dispatch, debouncedSearchTerm, currentPage, viewMode]);

  // Handle success/error messages with toast
  useEffect(() => {
    if (success) {
      dispatch(clearSuccess());
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch]);

  const handleCreateSubject = useCallback(
    async (subjectData: { subjectName: string; description: string }) => {
      const toastId = toastManager.showLoading("Creating subject...");

      try {
        await dispatch(createSubject(subjectData)).unwrap();
        toastManager.updateToast(
          toastId,
          "Subject created successfully!",
          "success"
        );

        setOpen(false);
      } catch (error: any) {
        toastManager.safeUpdateToast(
          toastId,
          "Failed to create subject",
          "error"
        );
      }
    },
    [dispatch]
  );

  const handleUpdateSubject = useCallback(
    async (
      id: string,
      subjectData: { subjectName?: string; description?: string }
    ) => {
      setIsUpdating(true);
      const toastId = toastManager.showLoading("Updating subject...");

      try {
        await dispatch(updateSubject({ id, subjectData })).unwrap();
        toastManager.safeUpdateToast(
          toastId,
          "Subject updated successfully!",
          "success"
        );
        setEditingSubject(null);
      } catch (error: any) {
        toastManager.safeUpdateToast(
          toastId,
          "Failed to update subject",
          "error"
        );
      } finally {
        setIsUpdating(false);
      }
    },
    [dispatch]
  );

  const handleDeleteClick = useCallback((id: string) => {
    setSubjectToDelete(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!subjectToDelete) return;

    setIsDeleting(true);
    const toastId = toastManager.showLoading("Deleting subject...");

    try {
      await dispatch(deleteSubject(subjectToDelete)).unwrap();
      toastManager.safeUpdateToast(
        toastId,
        "Subject deleted successfully!",
        "success"
      );
    } catch (error: any) {
      toastManager.safeUpdateToast(
        toastId,
        "Failed to delete subject",
        "error"
      );
    } finally {
      setIsDeleting(false);
      setSubjectToDelete(null);
    }
  }, [dispatch, subjectToDelete]);

  const handleDeleteCancel = useCallback(() => {
    setSubjectToDelete(null);
  }, []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchTerm("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [totalPages]
  );

  const startEdit = (subject: (typeof subjects)[0]) => {
    setEditingSubject({
      id: subject._id,
      subjectName: subject.subjectName,
      description: subject.description,
    });
  };

  const cancelEdit = () => {
    setEditingSubject(null);
  };

  const saveEdit = () => {
    if (editingSubject) {
      handleUpdateSubject(editingSubject.id, {
        subjectName: editingSubject.subjectName,
        description: editingSubject.description,
      });
    }
  };

  // Calculate statistics safely
  const stats = useMemo(() => {
    // Get current user from localStorage
    const userStr = localStorage.getItem("user");
    let currentUser = null;
    
    if (userStr) {
      try {
        currentUser = JSON.parse(userStr);
      } catch (error) {
        console.error("Failed to parse user:", error);
        currentUser = null;
      }
    }

    const totalSubjects = total || 0;
    
    // Count active subjects
    const activeSubjects = subjects.reduce((count, subject) => {
      return count + (subject?.isActive ? 1 : 0);
    }, 0);
    
    // Count "my subjects"
    const mySubjects = subjects.reduce((count, subject) => {
      if (!subject || !subject.createdBy || !currentUser) return count;
      
      // Check if this subject was created by current user
      // Use ID comparison as it's more reliable
      const isMySubject = subject.createdBy._id === currentUser.id;
      
      return count + (isMySubject ? 1 : 0);
    }, 0);
    
    // Placeholder data - you should fetch this from your API
    const totalBatches = 0;
    
    const avgBatchesPerSubject = totalSubjects > 0 
      ? (totalBatches / totalSubjects).toFixed(1) 
      : "0";

    return { 
      totalSubjects, 
      activeSubjects, 
      mySubjects, 
      totalBatches, 
      avgBatchesPerSubject 
    };
  }, [subjects, total]);

  // Toggle subject active status
  const handleToggleActive = useCallback(
    async (id: string) => {
      const toastId = toastManager.showLoading("Updating subject status...");

      try {
        // You need to add toggleSubjectActive action to your slice
        // await dispatch(toggleSubjectActive(id)).unwrap();
        toastManager.safeUpdateToast(
          toastId,
          "Subject status updated!",
          "success"
        );
      } catch (error: any) {
        toastManager.safeUpdateToast(
          toastId,
          "Failed to update status",
          "error"
        );
      }
    },
    [dispatch]
  );

  const searchInput = (
    <div className={styles.searchBox}>
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
        ref={searchInputRef}
        type="text"
        placeholder="Search by subject name..."
        className={styles.searchInput}
        value={searchTerm}
        onChange={handleSearch}
        disabled={loading || isUpdating}
      />
      {searchTerm && (
        <button
          onClick={handleSearchClear}
          className={styles.searchClear}
          title="Clear search"
          disabled={loading || isUpdating}
          type="button"
        >
          ✕
        </button>
      )}
      {(loading || isUpdating) && (
        <div className={styles.searchLoading}>
          <div className={styles.spinnerSmall}></div>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>Subject Management</h1>
            <p className={styles.pageSubtitle}>
              Manage and organize academic subjects
            </p>
            <div className={styles.searchStats}>
              {debouncedSearchTerm && (
                <span className={styles.searchResultInfo}>
                  Showing results for "{debouncedSearchTerm}"
                </span>
              )}
              {loading && (
                <span className={styles.loadingIndicator}>
                  <div className={styles.spinnerSmall}></div>
                  Loading...
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className={styles.btnPrimary}
            disabled={loading || isUpdating}
            type="button"
          >
            {loading || isUpdating ? (
              <span className={styles.spinnerSmall}></span>
            ) : (
              <>
                <svg
                  className={styles.btnIcon}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create New Subject
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            📚
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Subjects</p>
            <p className={styles.statValue}>{stats.totalSubjects}</p>
            <span className={styles.statSubtext}>
              {stats.activeSubjects} active
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            }}
          >
            📝
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Batches</p>
            <p className={styles.statValue}>{stats.totalBatches}</p>
            <span className={styles.statSubtext}>
              Avg: {stats.avgBatchesPerSubject} per subject
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            }}
          >
            👤
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>My Subjects</p>
            <p className={styles.statValue}>{stats.mySubjects}</p>
            <span className={styles.statSubtext}>Created by you</span>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className={styles.viewToggle}>
        <button
          onClick={() => setViewMode("all")}
          className={`${styles.viewButton} ${
            viewMode === "all" ? styles.active : ""
          }`}
          type="button"
        >
          All Subjects
        </button>
        <button
          onClick={() => setViewMode("my")}
          className={`${styles.viewButton} ${
            viewMode === "my" ? styles.active : ""
          }`}
          type="button"
        >
          My Subjects
        </button>
      </div>

      {/* Subjects Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            {viewMode === "all" ? "All Subjects" : "My Subjects"}
            <span className={styles.tableCount}>({total} total)</span>
          </h2>
          {searchInput}
        </div>

        {loading && !subjects.length ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinnerLarge}></div>
            <p className={styles.loadingText}>Loading subjects...</p>
            <p className={styles.loadingSubtext}>
              Please wait while we fetch your data
            </p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              {subjects.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📚</div>
                  <h3 className={styles.emptyTitle}>No subjects found</h3>
                  <p className={styles.emptyDescription}>
                    {debouncedSearchTerm
                      ? `No subjects found for "${debouncedSearchTerm}". Try a different search term.`
                      : "You haven't created any subjects yet. Get started by creating your first subject!"}
                  </p>
                  {!debouncedSearchTerm && (
                    <button
                      onClick={() => setOpen(true)}
                      className={styles.btnPrimary}
                      type="button"
                    >
                      Create First Subject
                    </button>
                  )}
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Subject Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Created By</th>
                      <th>Created Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject) => (
                      <tr
                        key={subject._id}
                        className={
                          editingSubject?.id === subject._id
                            ? styles.editingRow
                            : ""
                        }
                      >
                        <td>
                          {editingSubject?.id === subject._id ? (
                            <input
                              type="text"
                              value={editingSubject.subjectName}
                              onChange={(e) =>
                                setEditingSubject({
                                  ...editingSubject,
                                  subjectName: e.target.value,
                                })
                              }
                              className={styles.editInput}
                              autoFocus
                              disabled={isUpdating}
                            />
                          ) : (
                            <div className={styles.subjectNameCell}>
                              <span className={styles.subjectIcon}>📖</span>
                              <span className={styles.subjectName}>
                                {subject.subjectName}
                              </span>
                            </div>
                          )}
                        </td>
                        <td>
                          {editingSubject?.id === subject._id ? (
                            <input
                              type="text"
                              value={editingSubject.description}
                              onChange={(e) =>
                                setEditingSubject({
                                  ...editingSubject,
                                  description: e.target.value,
                                })
                              }
                              className={styles.editInput}
                              disabled={isUpdating}
                            />
                          ) : (
                            <span className={styles.description}>
                              {subject.description}
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleActive(subject._id)}
                            className={`${styles.statusBadge} ${
                              subject.isActive ? styles.active : styles.inactive
                            }`}
                            type="button"
                            title={
                              subject.isActive
                                ? "Click to deactivate"
                                : "Click to activate"
                            }
                          >
                            {subject.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td>
                          <div className={styles.userCell}>
                            <div className={styles.userAvatar}>
                              {subject?.createdBy?.username?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div className={styles.userInfo}>
                              <span className={styles.userName}>
                                {subject?.createdBy?.username || "Unknown"}
                              </span>
                              <span className={styles.userRole}>
                                {subject?.createdBy?.role || "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className={styles.dateCell}>
                          {new Date(subject.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            {editingSubject?.id === subject._id ? (
                              <>
                                <button
                                  onClick={saveEdit}
                                  className={styles.btnSave}
                                  title="Save"
                                  disabled={isUpdating}
                                  type="button"
                                >
                                  {isUpdating ? (
                                    <span
                                      className={styles.spinnerSmall}
                                    ></span>
                                  ) : (
                                    "✓"
                                  )}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className={styles.btnCancel}
                                  title="Cancel"
                                  disabled={isUpdating}
                                  type="button"
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(subject)}
                                  className={styles.btnEdit}
                                  title="Edit"
                                  disabled={loading || isUpdating}
                                  type="button"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(subject._id)}
                                  className={styles.btnDelete}
                                  title="Delete"
                                  disabled={loading || isUpdating}
                                  type="button"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
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
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || loading || isUpdating}
                  className={styles.paginationButton}
                  type="button"
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading || isUpdating}
                  className={styles.paginationButton}
                  type="button"
                >
                  Previous
                </button>
                <div className={styles.paginationPages}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`${styles.pageNumber} ${
                          currentPage === pageNum ? styles.activePage : ""
                        }`}
                        disabled={loading || isUpdating}
                        type="button"
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading || isUpdating}
                  className={styles.paginationButton}
                  type="button"
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || loading || isUpdating}
                  className={styles.paginationButton}
                  type="button"
                >
                  Last
                </button>
                <span className={styles.paginationInfo}>
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Subject Modal */}
      {open && (
        <CreateSubjectModal
          onClose={() => setOpen(false)}
          onCreate={handleCreateSubject}
          loading={loading || isUpdating}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!subjectToDelete}
        title="Delete Subject"
        message="Are you sure you want to delete this subject? This action cannot be undone and all associated data will be permanently removed."
        confirmText="Delete Subject"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isConfirming={isDeleting}
        isDanger={true}
        icon="danger"
      />
    </div>
  );
}

// Create Subject Modal Component
function CreateSubjectModal({
  onClose,
  onCreate,
  loading,
}: {
  onClose: () => void;
  onCreate: (subjectData: { subjectName: string; description: string }) => void;
  loading: boolean;
}) {
  const [subjectName, setSubjectName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{
    subjectName?: string;
    description?: string;
  }>({});
  const [touched, setTouched] = useState({
    subjectName: false,
    description: false,
  });

  const validateField = (
    name: "subjectName" | "description",
    value: string
  ) => {
    if (!touched[name]) return "";

    if (name === "subjectName") {
      if (!value.trim()) return "Subject name is required";
      if (value.trim().length < 2)
        return "Subject name must be at least 2 characters";
      if (value.trim().length > 50)
        return "Subject name must be less than 50 characters";
    }

    if (name === "description") {
      if (!value.trim()) return "Description is required";
      if (value.trim().length < 10)
        return "Description must be at least 10 characters";
      if (value.trim().length > 500)
        return "Description must be less than 500 characters";
    }

    return "";
  };

  const validateForm = () => {
    const newErrors = {
      subjectName: validateField("subjectName", subjectName),
      description: validateField("description", description),
    };

    setErrors(newErrors);
    return !newErrors.subjectName && !newErrors.description;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ subjectName: true, description: true });

    if (validateForm()) {
      onCreate({
        subjectName: subjectName.trim(),
        description: description.trim(),
      });
    }
  };

  const handleBlur = (field: "subjectName" | "description") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(
      field,
      field === "subjectName" ? subjectName : description
    );
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (
    field: "subjectName" | "description",
    value: string
  ) => {
    if (field === "subjectName") {
      setSubjectName(value);
    } else {
      setDescription(value);
    }

    // Clear error when user starts typing
    if (touched[field] && errors[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const getValidationIcon = (field: "subjectName" | "description") => {
    const value = field === "subjectName" ? subjectName : description;
    const error = validateField(field, value);

    if (!touched[field]) return null;

    if (error) {
      return (
        <span className={`${styles.validationIcon} ${styles.invalid}`}>✗</span>
      );
    } else if (value.trim().length > 0) {
      return (
        <span className={`${styles.validationIcon} ${styles.valid}`}>✓</span>
      );
    }

    return null;
  };

  const isFormValid = () => {
    return (
      subjectName.trim().length >= 2 &&
      description.trim().length >= 10 &&
      !errors.subjectName &&
      !errors.description
    );
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create New Subject</h2>
          <button
            onClick={onClose}
            className={styles.modalClose}
            disabled={loading}
            type="button"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className={styles.modalLoading}>
            <div className={styles.spinnerLarge}></div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formField}>
              <label className={styles.label} htmlFor="subjectName">
                Subject Name
                <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="subjectName"
                  type="text"
                  value={subjectName}
                  onChange={(e) => handleChange("subjectName", e.target.value)}
                  onBlur={() => handleBlur("subjectName")}
                  placeholder="e.g., Mathematics, Physics, Chemistry"
                  className={`${styles.input} ${
                    touched.subjectName &&
                    !errors.subjectName &&
                    subjectName.trim()
                      ? styles.successBorder
                      : errors.subjectName
                      ? styles.inputError
                      : ""
                  }`}
                  autoFocus
                  disabled={loading}
                  maxLength={50}
                />
                {getValidationIcon("subjectName")}
              </div>
              {touched.subjectName && errors.subjectName && (
                <div className={styles.errorMessage}>{errors.subjectName}</div>
              )}
              <div className={styles.helpText}>
                Enter a unique name for your subject (2-50 characters)
              </div>
              <div className={styles.charCounter}>
                <span
                  className={`${styles.charCount} ${
                    subjectName.length >= 45 ? styles.warning : ""
                  }`}
                >
                  {subjectName.length}/50 characters
                </span>
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.label} htmlFor="description">
                Description
                <span className={styles.required}>*</span>
              </label>
              <div
                className={`${styles.inputWrapper} ${styles.textareaWrapper}`}
              >
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  onBlur={() => handleBlur("description")}
                  placeholder="Describe the subject curriculum, objectives, and requirements..."
                  className={`${styles.textarea} ${
                    touched.description &&
                    !errors.description &&
                    description.trim()
                      ? styles.successBorder
                      : errors.description
                      ? styles.inputError
                      : ""
                  }`}
                  rows={4}
                  disabled={loading}
                  maxLength={500}
                />
                {getValidationIcon("description")}
              </div>
              {touched.description && errors.description && (
                <div className={styles.errorMessage}>{errors.description}</div>
              )}
              <div className={styles.helpText}>
                Provide detailed information about this subject (10-500
                characters)
              </div>
              <div className={styles.charCounter}>
                <span
                  className={`${styles.charCount} ${
                    description.length > 450
                      ? styles.warning
                      : description.length >= 500
                      ? styles.error
                      : ""
                  }`}
                >
                  {description.length}/500 characters
                </span>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnSecondary}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading || !isFormValid()}
            >
              {loading ? (
                <>
                  <span className={styles.spinnerSmall}></span>
                  Creating...
                </>
              ) : (
                "Create Subject"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}