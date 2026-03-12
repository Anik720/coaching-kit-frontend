// components/result-management/exam-category/ExamCategoriesPage.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toastManager } from "@/utils/toastConfig";
import styles from "./ExamCategories.module.css";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import {
  clearExamCategoryError,
  clearExamCategorySuccess,
  clearCategoryStatus,
  createExamCategory,
  deleteExamCategory,
  fetchExamCategories,
  fetchExamCategoryById,
  fetchExamCategoryStatus,
  toggleExamCategoryActive,
  updateExamCategory,
} from "@/api/result-management/exam-category/examCategorySlice";
import { ExamCategoryItem } from "@/api/result-management/exam-category/types/examCategory.types";
import { useExamCategory } from "@/hooks/ressult-management/useExamCategory";


// ─── Debounce Hook ─────────────────────────────────────────────────────────────
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function ExamCategoriesPage() {
  const {
    categories,
    loading,
    error,
    success,
    total,
    totalPages,
    categoryStatus,
    statusLoading,
    dispatch,
  } = useExamCategory();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [statusModalId, setStatusModalId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inline edit state
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
    description: string;
  } | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({ categoryName: "", description: "" });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebounce(searchTerm, 500);

  // ─── Fetch on filter/page change ───────────────────────────────────────────
  useEffect(() => {
    dispatch(
      fetchExamCategories({
        search: debouncedSearch || undefined,
        isActive: filterActive === "" ? undefined : filterActive === "true",
        page: currentPage,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      })
    );
  }, [dispatch, debouncedSearch, filterActive, currentPage]);

  // ─── Toast feedback ────────────────────────────────────────────────────────
  useEffect(() => {
    if (success) {
      toastManager.showSuccess("Operation completed successfully");
      dispatch(clearExamCategorySuccess());
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearExamCategoryError());
    }
  }, [success, error, dispatch]);

  // ─── Create ────────────────────────────────────────────────────────────────
  const handleCreate = useCallback(async () => {
    if (!createForm.categoryName.trim()) {
      toastManager.showError("Category name is required");
      return;
    }
    const toastId = toastManager.showLoading("Creating category...");
    try {
      await dispatch(
        createExamCategory({
          categoryName: createForm.categoryName.trim(),
          description: createForm.description.trim() || undefined,
        })
      ).unwrap();
      toastManager.updateToast(toastId, "Category created successfully!", "success");
      setModalOpen(false);
      setCreateForm({ categoryName: "", description: "" });
    } catch (err: any) {
      toastManager.updateToast(toastId, err || "Failed to create category", "error");
    }
  }, [dispatch, createForm]);

  // ─── Update ────────────────────────────────────────────────────────────────
  const handleUpdate = useCallback(async () => {
    if (!editingCategory) return;
    if (!editingCategory.name.trim()) {
      toastManager.showError("Category name is required");
      return;
    }
    const toastId = toastManager.showLoading("Updating category...");
    try {
      await dispatch(
        updateExamCategory({
          id: editingCategory.id,
          data: {
            categoryName: editingCategory.name.trim(),
            description: editingCategory.description.trim() || undefined,
          },
        })
      ).unwrap();
      toastManager.updateToast(toastId, "Category updated successfully!", "success");
      setEditingCategory(null);
    } catch (err: any) {
      toastManager.updateToast(toastId, err || "Failed to update category", "error");
    }
  }, [dispatch, editingCategory]);

  // ─── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = useCallback(async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    const toastId = toastManager.showLoading("Deleting category...");
    try {
      await dispatch(deleteExamCategory(categoryToDelete)).unwrap();
      toastManager.updateToast(toastId, "Category deleted successfully!", "success");
    } catch (err: any) {
      toastManager.updateToast(toastId, err || "Failed to delete category", "error");
    } finally {
      setIsDeleting(false);
      setCategoryToDelete(null);
    }
  }, [dispatch, categoryToDelete]);

  // ─── Toggle Active ─────────────────────────────────────────────────────────
  const handleToggleActive = useCallback(
    async (id: string, currentStatus: boolean) => {
      const toastId = toastManager.showLoading(
        currentStatus ? "Deactivating category..." : "Activating category..."
      );
      try {
        await dispatch(toggleExamCategoryActive(id)).unwrap();
        toastManager.updateToast(
          toastId,
          `Category ${currentStatus ? "deactivated" : "activated"} successfully!`,
          "success"
        );
      } catch (err: any) {
        toastManager.updateToast(toastId, err || "Failed to toggle status", "error");
      }
    },
    [dispatch]
  );

  // ─── Status Modal ──────────────────────────────────────────────────────────
  const handleViewStatus = useCallback(
    async (id: string) => {
      setStatusModalId(id);
      dispatch(clearCategoryStatus());
      await dispatch(fetchExamCategoryStatus(id));
    },
    [dispatch]
  );

  const closeStatusModal = () => {
    setStatusModalId(null);
    dispatch(clearCategoryStatus());
  };

  // ─── Pagination ────────────────────────────────────────────────────────────
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const activeCategories = categories.filter((c) => c.isActive).length;
    return { total, activeCategories };
  }, [categories, total]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.pageContainer}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.pageTitle}>Exam Categories</h1>
            <p className={styles.pageSubtitle}>Manage different types of examinations</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className={styles.btnPrimary}
            disabled={loading}
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🏷️</div>
          <div>
            <p className={styles.statLabel}>Total Categories</p>
            <p className={styles.statValue}>{stats.total}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div>
            <p className={styles.statLabel}>Active Categories</p>
            <p className={styles.statValue}>{stats.activeCategories}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🚫</div>
          <div>
            <p className={styles.statLabel}>Inactive Categories</p>
            <p className={styles.statValue}>{categories.filter((c) => !c.isActive).length}</p>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className={styles.tableCard}>
        {/* Table toolbar */}
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>All Exam Categories</h2>
          <div className={styles.toolbarRight}>
            <select
              className={styles.filterSelect}
              value={filterActive}
              onChange={(e) => {
                setFilterActive(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="Search categories..."
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
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading && !categories.length ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className={styles.emptyState}>
            <p>🗂️ No exam categories found</p>
            <p className={styles.emptySubtext}>
              {searchTerm ? "Try a different search term" : "Click '+ Add Category' to get started"}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Updated By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, index) => (
                    <tr key={cat._id}>
                      <td>{index + 1}</td>
                      <td>
                        {editingCategory?.id === cat._id ? (
                          <input
                            value={editingCategory.name}
                            onChange={(e) =>
                              setEditingCategory((prev) =>
                                prev ? { ...prev, name: e.target.value } : null
                              )
                            }
                            className={styles.editInput}
                          />
                        ) : (
                          <span className={styles.categoryName}>{cat.categoryName}</span>
                        )}
                      </td>
                      <td>
                        {editingCategory?.id === cat._id ? (
                          <input
                            value={editingCategory.description}
                            onChange={(e) =>
                              setEditingCategory((prev) =>
                                prev ? { ...prev, description: e.target.value } : null
                              )
                            }
                            className={styles.editInput}
                          />
                        ) : (
                          cat.description || "—"
                        )}
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${cat.isActive ? styles.active : styles.inactive}`}
                        >
                          {cat.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{cat.createdBy?.username ?? "—"}</td>
                      <td>{cat.updatedBy?.username ?? "—"}</td>
                      <td className={styles.actions}>
                        {editingCategory?.id === cat._id ? (
                          <>
                            <button
                              className={styles.btnSave}
                              onClick={handleUpdate}
                              disabled={loading}
                            >
                              Save
                            </button>
                            <button
                              className={styles.btnCancel}
                              onClick={() => setEditingCategory(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className={styles.btnEdit}
                              onClick={() =>
                                setEditingCategory({
                                  id: cat._id,
                                  name: cat.categoryName,
                                  description: cat.description || "",
                                })
                              }
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className={`${styles.btnToggle} ${cat.isActive ? styles.btnDeactivate : styles.btnActivate}`}
                              onClick={() => handleToggleActive(cat._id, cat.isActive)}
                            >
                              {cat.isActive ? "🚫 Deactivate" : "✅ Activate"}
                            </button>
                            <button
                              className={styles.btnStatus}
                              onClick={() => handleViewStatus(cat._id)}
                            >
                              📊 Status
                            </button>
                            <button
                              className={styles.btnDelete}
                              onClick={() => setCategoryToDelete(cat._id)}
                            >
                              🗑️ Delete
                            </button>
                          </>
                        )}
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
                  className={styles.pageBtn}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${p === currentPage ? styles.pageBtnActive : ""}`}
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className={styles.pageBtn}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Create Modal ── */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add Exam Category</h2>
              <button className={styles.modalClose} onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Category Name <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Quarterly Exams"
                  value={createForm.categoryName}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, categoryName: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  placeholder="Optional description..."
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnSecondary}
                onClick={() => {
                  setModalOpen(false);
                  setCreateForm({ categoryName: "", description: "" });
                }}
              >
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Status Modal ── */}
      {statusModalId && (
        <div className={styles.modalOverlay} onClick={closeStatusModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>📊 Category Status</h2>
              <button className={styles.modalClose} onClick={closeStatusModal}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              {statusLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.spinner} />
                  <p>Loading status...</p>
                </div>
              ) : categoryStatus ? (
                <div className={styles.statusContent}>
                  <div className={styles.statusRow}>
                    <span className={styles.statusLabel}>Category Name</span>
                    <span className={styles.statusValue}>
                      {categoryStatus.category.categoryName}
                    </span>
                  </div>
                  <div className={styles.statusRow}>
                    <span className={styles.statusLabel}>Status</span>
                    <span
                      className={`${styles.badge} ${
                        categoryStatus.category.isActive ? styles.active : styles.inactive
                      }`}
                    >
                      {categoryStatus.category.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className={styles.statusRow}>
                    <span className={styles.statusLabel}>Created By</span>
                    <span className={styles.statusValue}>
                      {categoryStatus.category.createdBy?.username ?? "—"} (
                      {categoryStatus.category.createdBy?.role})
                    </span>
                  </div>
                  <div className={styles.statusRow}>
                    <span className={styles.statusLabel}>Updated By</span>
                    <span className={styles.statusValue}>
                      {categoryStatus.category.updatedBy?.username
                        ? `${categoryStatus.category.updatedBy.username} (${categoryStatus.category.updatedBy.role})`
                        : "—"}
                    </span>
                  </div>
                  <div className={styles.statusDivider} />
                  <div className={styles.statusStatsGrid}>
                    <div className={styles.statusStatCard}>
                      <p className={styles.statusStatValue}>{categoryStatus.totalExams}</p>
                      <p className={styles.statusStatLabel}>Total Exams</p>
                    </div>
                    <div className={styles.statusStatCard}>
                      <p className={styles.statusStatValue}>{categoryStatus.activeExams}</p>
                      <p className={styles.statusStatLabel}>Active Exams</p>
                    </div>
                    <div className={styles.statusStatCard}>
                      <p className={styles.statusStatValue}>
                        {categoryStatus.totalExams - categoryStatus.activeExams}
                      </p>
                      <p className={styles.statusStatLabel}>Inactive Exams</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className={styles.emptyState}>Failed to load status.</p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={closeStatusModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
     <ConfirmationModal
        isOpen={!!categoryToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCategoryToDelete(null)}
        title="Delete Exam Category"
        message="Are you sure you want to delete this exam category? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        isConfirming={isDeleting}   // ← was isLoading
        isDanger                     // ← optional but good for red button styling
      />
    </div>
  );
}