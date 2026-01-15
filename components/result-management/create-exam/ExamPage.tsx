// app/result-management/exam/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toastManager } from "@/utils/toastConfig";
import styles from "./ExamPage.module.css";
import ConfirmationModal from "@/components/common/ConfirmationModal";

import {
  clearExamError,
  clearExamSuccess,
  createExam,
  deleteExam,
  fetchActiveBatches,
  fetchClasses,
  fetchExamCategories,
  fetchExams,
  fetchSubjects,
  toggleExamActive,
  updateExam,
} from "@/api/result-management/create-exam/examSlice";
import { useExam } from "@/hooks/result-management/useExam";
import { CreateExamDto, Exam } from "@/api/result-management/create-exam/types/exam.types";
import api from "@/api/axios";

import ExamModal from "./ExamModal";

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

export default function ExamPage() {
  const {
    exams,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    classes,
    batches,
    subjects,
    examCategories,
    activeBatches,
    dispatch,
  } = useExam();

  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  console.log("classes",classes)

  console.log("subjecyt", subjects)
  console.log("examCategories",examCategories)
  // Fetch dropdown data on mount
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        await Promise.all([
          dispatch(fetchClasses()),
          dispatch(fetchSubjects()),
          dispatch(fetchExamCategories()),
          dispatch(fetchActiveBatches()),
        ]);
        setDropdownsLoaded(true);
      } catch (error: any) {
        console.error('Failed to load dropdown data:', error);
        toastManager.showError('Failed to load some dropdown data');
      }
    };

    loadDropdownData();
  }, [dispatch]);

  // Fetch exams
  useEffect(() => {
    dispatch(
      fetchExams({
        search: debouncedSearchTerm || undefined,
        page: currentPage,
        limit: 10,
        sortBy: "examDate",
        sortOrder: "desc",
      })
    );
  }, [dispatch, debouncedSearchTerm, currentPage]);

  // Toast notifications
  useEffect(() => {
    if (success) {
      toastManager.showSuccess("Operation completed successfully");
      dispatch(clearExamSuccess());
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearExamError());
    }
  }, [success, error, dispatch]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreateExam = useCallback(
    async (data: CreateExamDto) => {
      const toastId = toastManager.showLoading("Creating exam...");
      try {
        await dispatch(createExam(data)).unwrap();
        toastManager.updateToast(toastId, "Exam created successfully!", "success");
        setExamModalOpen(false);
      } catch (error: any) {
        toastManager.updateToast(toastId, error || "Failed to create exam", "error");
      }
    },
    [dispatch]
  );

  const handleUpdateExam = useCallback(
    async (data: CreateExamDto) => {
      if (!editingExam) return;
      
      setIsUpdating(true);
      const toastId = toastManager.showLoading("Updating exam...");
      try {
        await dispatch(updateExam({ id: editingExam._id, data })).unwrap();
        toastManager.updateToast(toastId, "Exam updated successfully!", "success");
        setEditingExam(null);
        setExamModalOpen(false);
      } catch (error: any) {
        toastManager.updateToast(toastId, error || "Failed to update exam", "error");
      } finally {
        setIsUpdating(false);
      }
    },
    [dispatch, editingExam]
  );

  const handleDeleteClick = useCallback((id: string) => {
    setExamToDelete(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!examToDelete) return;
    setIsDeleting(true);
    const toastId = toastManager.showLoading("Deleting exam...");
    try {
      await dispatch(deleteExam(examToDelete)).unwrap();
      toastManager.updateToast(toastId, "Exam deleted successfully!", "success");
    } catch (error: any) {
      toastManager.updateToast(toastId, error || "Failed to delete exam", "error");
    } finally {
      setIsDeleting(false);
      setExamToDelete(null);
    }
  }, [dispatch, examToDelete]);

  const handleToggleActive = useCallback(
    async (id: string) => {
      const toastId = toastManager.showLoading("Updating status...");
      try {
        await dispatch(toggleExamActive(id)).unwrap();
        toastManager.updateToast(toastId, "Status updated successfully!", "success");
      } catch (error: any) {
        toastManager.updateToast(toastId, error || "Failed to update status", "error");
      }
    },
    [dispatch]
  );

  const startEdit = (exam: Exam) => {
    setEditingExam(exam);
    setExamModalOpen(true);
  };

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [totalPages]
  );

  // Function to fetch batches by class
  const fetchBatchesForClass = useCallback(async (classId: string) => {
    try {
      const response = await api.get(`/batches/class/${classId}`);
      console.log('Batch response for class', classId, ':', response.data);
      
      // Handle API response format
      if (response.data.data) {
        return response.data.data.map((batch: any) => ({
          _id: batch._id,
          name: batch.batchName || batch.name,
        }));
      } else if (Array.isArray(response.data)) {
        return response.data.map((batch: any) => ({
          _id: batch._id,
          name: batch.batchName || batch.name,
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch batches:', error);
      return [];
    }
  }, []);

  // Stats (using real exam data)
  const stats = useMemo(() => {
    const totalExams = total;
    const activeExams = exams.filter((e) => e.isActive).length;
    const upcomingExams = exams.filter(e => {
      if (!e.examDate) return false;
      const examDate = new Date(e.examDate);
      const today = new Date();
      return examDate >= today;
    }).length;
    const completedExams = exams.filter(e => {
      if (!e.examDate) return false;
      const examDate = new Date(e.examDate);
      const today = new Date();
      return examDate < today;
    }).length;

    return { totalExams, activeExams, upcomingExams, completedExams };
  }, [exams, total]);

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>Exam Management</h1>
            <p className={styles.pageSubtitle}>Create, manage and track all examinations</p>
          </div>
          <button
            onClick={() => {
              setEditingExam(null);
              setExamModalOpen(true);
            }}
            className={styles.btnPrimary}
            disabled={loading || isUpdating || !dropdownsLoaded}
            type="button"
            title={!dropdownsLoaded ? "Loading dropdown data..." : "Create new exam"}
          >
            {loading || isUpdating ? (
              <span className={styles.spinnerSmall}></span>
            ) : (
              <>
                <svg className={styles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Exam
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            📝
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Exams</p>
            <p className={styles.statValue}>{stats.totalExams}</p>
            <span className={styles.statSubtext}>{stats.activeExams} active</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" }}>
            📅
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Upcoming Exams</p>
            <p className={styles.statValue}>{stats.upcomingExams}</p>
            <span className={styles.statSubtext}>Scheduled</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }}>
            ✅
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Completed</p>
            <p className={styles.statValue}>{stats.completedExams}</p>
            <span className={styles.statSubtext}>Finished</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            All Exams <span className={styles.tableCount}>({total} total)</span>
          </h2>
          {/* Search Input */}
          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by exam name, topic, class, or subject..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading || isUpdating}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className={styles.searchClear}
                title="Clear search"
                disabled={loading || isUpdating}
                type="button"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {loading && !exams.length ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinnerLarge}></div>
            <p className={styles.loadingText}>Loading exams...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📅</div>
            <h3 className={styles.emptyTitle}>No exams found</h3>
            <p className={styles.emptyDescription}>
              {debouncedSearchTerm
                ? `No exams found for "${debouncedSearchTerm}". Try a different search term.`
                : "You haven't created any exams yet. Get started by creating your first exam!"}
            </p>
            {!debouncedSearchTerm && (
              <button
                onClick={() => setExamModalOpen(true)}
                className={styles.btnPrimary}
                disabled={!dropdownsLoaded}
                type="button"
              >
                Create First Exam
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Exam Name</th>
                    <th>Topic</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Total Marks</th>
                    <th>Batches</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam._id}>
                      <td>
                        <span className={styles.examName}>{exam.examName}</span>
                      </td>
                      <td>
                        {exam.topicName || "—"}
                      </td>
                      <td>{exam.class?.classname || "—"}</td>
                      <td>{exam.subject?.subjectName || "—"}</td>
                      <td>{exam.examCategory?.categoryName || "—"}</td>
                      <td>
                        {formatDate(exam.examDate)}
                      </td>
                      <td>{exam.totalMarks}</td>
                      <td>
                        <div className={styles.batchesCell}>
                          {exam.batches && exam.batches.length > 0 ? (
                            <>
                              {exam.batches.slice(0, 2).map((batch, index) => (
                                <span key={index} className={styles.batchTag}>
                                  {batch.batchName || batch.name}
                                </span>
                              ))}
                              {exam.batches.length > 2 && (
                                <span className={styles.moreBatches}>
                                  +{exam.batches.length - 2} more
                                </span>
                              )}
                            </>
                          ) : (
                            "—"
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            exam.isActive ? styles.active : styles.inactive
                          }`}
                        >
                          {exam.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => startEdit(exam)}
                            className={styles.btnEdit}
                            disabled={loading || isUpdating}
                            type="button"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleToggleActive(exam._id)}
                            className={styles.btnToggle}
                            disabled={loading || isUpdating}
                            type="button"
                            title={exam.isActive ? "Deactivate" : "Activate"}
                          >
                            {exam.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleDeleteClick(exam._id)}
                            className={styles.btnDelete}
                            disabled={loading || isUpdating}
                            type="button"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`${styles.pageNumber} ${currentPage === pageNum ? styles.activePage : ""}`}
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

      {/* Exam Modal */}
      <ExamModal
        isOpen={examModalOpen}
        onClose={() => {
          setExamModalOpen(false);
          setEditingExam(null);
        }}
        onSubmit={editingExam ? handleUpdateExam : handleCreateExam}
        loading={loading || isUpdating}
        exam={editingExam}
        classes={classes}
        activeBatches={activeBatches}
        subjects={subjects}
        examCategories={examCategories}
        dropdownsLoaded={dropdownsLoaded}
        fetchBatchesByClass={fetchBatchesForClass}
      />

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!examToDelete}
        title="Delete Exam"
        message="Are you sure you want to delete this exam? This action cannot be undone."
        confirmText="Delete Exam"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setExamToDelete(null)}
        isConfirming={isDeleting}
        isDanger={true}
        icon="danger"
      />
    </div>
  );
}