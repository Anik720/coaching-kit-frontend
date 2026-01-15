"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toastManager } from "@/utils/toastConfig";
import styles from "./ExamCategories.module.css";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import {
  clearExamCategoryError,
  clearExamCategorySuccess,
  createExamCategory,
  deleteExamCategory,
  fetchExamCategories,
  updateExamCategory,
} from "@/api/result-management/exam-category/examCategorySlice";
import { ExamCategoryItem } from "@/api/result-management/exam-category/types/examCategory.types";
import { useExamCategory } from "@/hooks/result-management/useExamCategory";

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

export default function ExamCategoriesPage() {
  const { categories, loading, error, success, total, page, totalPages, dispatch } = useExamCategory();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
    description: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    dispatch(
      fetchExamCategories({
        search: debouncedSearch || undefined,
        page: currentPage,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      })
    );
  }, [dispatch, debouncedSearch, currentPage]);

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

  const handleCreate = useCallback(
    async (data: { categoryName: string; description: string }) => {
      const toastId = toastManager.showLoading("Creating category...");
      try {
        await dispatch(createExamCategory(data)).unwrap();
        toastManager.updateToast(toastId, "Category created successfully!", "success");
        setModalOpen(false);
      } catch {
        toastManager.updateToast(toastId, "Failed to create category", "error");
      }
    },
    [dispatch]
  );

  const handleUpdate = useCallback(
    async (id: string, data: { categoryName?: string; description?: string }) => {
      const toastId = toastManager.showLoading("Updating category...");
      try {
        await dispatch(updateExamCategory({ id, data })).unwrap();
        toastManager.updateToast(toastId, "Category updated successfully!", "success");
        setEditingCategory(null);
      } catch {
        toastManager.updateToast(toastId, "Failed to update category", "error");
      }
    },
    [dispatch]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    const toastId = toastManager.showLoading("Deleting category...");
    try {
      await dispatch(deleteExamCategory(categoryToDelete)).unwrap();
      toastManager.updateToast(toastId, "Category deleted successfully!", "success");
    } catch {
      toastManager.updateToast(toastId, "Failed to delete category", "error");
    } finally {
      setIsDeleting(false);
      setCategoryToDelete(null);
    }
  }, [dispatch, categoryToDelete]);

  // ──────────────────────────────────────────────────────────────────────────────
  // UI Handlers
  // ──────────────────────────────────────────────────────────────────────────────

  const startEdit = (cat: ExamCategoryItem) => {
    setEditingCategory({
      id: cat._id,
      name: cat.categoryName,
      description: cat.description || "",
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const stats = useMemo(() => {
    const totalCategories = total;
    const activeCategories = categories.filter((c) => c.isActive).length;
    return { totalCategories, activeCategories };
  }, [categories, total]);

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
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

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🏷️</div>
          <div>
            <p className={styles.statLabel}>Total Categories</p>
            <p className={styles.statValue}>{stats.totalCategories}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div>
            <p className={styles.statLabel}>Active Categories</p>
            <p className={styles.statValue}>{stats.activeCategories}</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>All Exam Categories</h2>
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
          </div>
        </div>

        {loading && !categories.length ? (
          <div className={styles.loadingContainer}>Loading...</div>
        ) : categories.length === 0 ? (
          <div className={styles.emptyState}>No exam categories found</div>
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
                            value={editingCategory?.name ?? ""}
                            onChange={(e) =>
                              setEditingCategory((prev) =>
                                prev ? { ...prev, name: e.target.value } : null
                              )
                            }
                            className={styles.editInput}
                          />
                        ) : (
                          cat.categoryName
                        )}
                      </td>
                      <td>
                        {editingCategory?.id === cat._id ? (
                          <input
                            value={editingCategory?.description ?? ""}
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
                        <span className={`${styles.badge} ${cat.isActive ? styles.active : styles.inactive}`}>
                          {cat.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{cat.createdBy?.username ?? "Unknown"}</td>
                      <td className={styles.actions}>
                        {editingCategory?.id === cat._id ? (
                          <>
                            <button
                              onClick={() =>
                                editingCategory &&
                                handleUpdate(cat._id, {
                                  categoryName: editingCategory.name,
                                  description: editingCategory.description || undefined,
                                })
                              }
                              className={styles.btnSave}
                              disabled={!editingCategory?.name.trim()}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              className={styles.btnCancel}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(cat)} className={styles.btnEdit}>
                              Edit
                            </button>
                            <button
                              onClick={() => setCategoryToDelete(cat._id)}
                              className={styles.btnDelete}
                            >
                              Delete
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
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <CreateExamCategoryModal
          onClose={() => setModalOpen(false)}
          onCreate={handleCreate}
          loading={loading}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!categoryToDelete}
        title="Delete Exam Category"
        message="Are you sure you want to delete this exam category? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCategoryToDelete(null)}
        isConfirming={isDeleting}
        isDanger={true}
      />
    </div>
  );
}

// Create Modal remains unchanged - it's already safe
function CreateExamCategoryModal({
  onClose,
  onCreate,
  loading,
}: {
  onClose: () => void;
  onCreate: (data: { categoryName: string; description: string }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ categoryName: name.trim(), description: description.trim() });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Add Exam Category</h2>
          <button onClick={onClose} className={styles.modalClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label>Category Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Class Test, Monthly Test"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading || !name.trim()}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}