"use client";
import { useState, useEffect } from "react";
import { useFinance } from "@/hooks/useFinance";
import { toastManager } from "@/utils/toastConfig";
import styles from "@/components/employeePage/Employee.module.css";
import Link from "next/link";

export default function ManageExpenseCategoryPage() {
  const {
    categories,
    categoriesLoading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useFinance();

  const [form, setForm] = useState({ categoryName: "", status: "published" });
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories({ type: "expense" });
  }, []);

  const expenseCategories = categories.filter((c) => c.type === "expense");

  const handleSubmit = async () => {
    if (!form.categoryName.trim()) {
      toastManager.showError("Category name is required");
      return;
    }
    setSubmitting(true);
    const tid = toastManager.showLoading(
      editId ? "Updating..." : "Creating..."
    );
    try {
      if (editId) {
        const result = await updateCategory(editId, form);
        // @ts-ignore
        if (result?.type?.endsWith("/rejected"))
          throw new Error(result.payload as string || "Failed");
        toastManager.safeUpdateToast(tid, "Category updated!", "success");
        setEditId(null);
      } else {
        const result = await createCategory({ ...form, type: "expense" });
        // @ts-ignore
        if (result?.type?.endsWith("/rejected"))
          throw new Error(result.payload as string || "Failed");
        toastManager.safeUpdateToast(tid, "Category created!", "success");
      }
      setForm({ categoryName: "", status: "published" });
      fetchCategories({ type: "expense" });
    } catch (err: any) {
      toastManager.safeUpdateToast(tid, err.message || "Failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cat: any) => {
    setEditId(cat._id);
    setForm({ categoryName: cat.categoryName, status: cat.status });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const tid = toastManager.showLoading("Deleting...");
    try {
      await deleteCategory(id);
      toastManager.safeUpdateToast(tid, "Deleted!", "success");
    } catch {
      toastManager.safeUpdateToast(tid, "Failed", "error");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>
            {editId ? "Edit Expense Category" : "Add New Expense Category"}
          </h1>
          <p>Manage expense categories</p>
        </div>
        <Link
          href="/dashboard/finance/expense/new"
          className={styles.btnSecondary}
        >
          ← Back
        </Link>
      </div>

      {/* ── Form Card ── */}
      <div className={styles.sectionCard}>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>* Category Name</label>
            <input
              type="text"
              className={styles.formInput}
              value={form.categoryName}
              onChange={(e) =>
                setForm((p) => ({ ...p, categoryName: e.target.value }))
              }
              placeholder="Category name"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Status</label>
            <select
              className={styles.formSelect}
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value }))
              }
            >
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>
        </div>

        <div className={styles.formActions} style={{ marginTop: 16 }}>
          <button
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={submitting || categoriesLoading}
          >
            {submitting
              ? "Saving..."
              : editId
              ? "Update Category"
              : "Create Category"}
          </button>
          {editId && (
            <button
              className={styles.btnSecondary}
              onClick={() => {
                setEditId(null);
                setForm({ categoryName: "", status: "published" });
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* ── Categories Table ── */}
      <div className={styles.tableCard} style={{ marginTop: 20 }}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Finance Categories (Expense)</h2>
          <span className={styles.tableCount}>
            {expenseCategories.length} categories
          </span>
        </div>

        {categoriesLoading ? (
          <div className={styles.loadingWrapper}>
            <div className={styles.spinner} />
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Category Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenseCategories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: "30px",
                        color: "#9ca3af",
                      }}
                    >
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  expenseCategories.map((cat, i) => (
                    <tr key={cat._id}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{cat.categoryName}</td>
                      <td>
                        <span
                          style={{
                            background: "#fef3c7",
                            color: "#92400e",
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          Expense
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            background:
                              cat.status === "published"
                                ? "#d1fae5"
                                : "#f3f4f6",
                            color:
                              cat.status === "published"
                                ? "#065f46"
                                : "#6b7280",
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {cat.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionGroup}>
                          <button
                            className={styles.actionBtnEdit}
                            onClick={() => handleEdit(cat)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className={styles.actionBtnDelete}
                            onClick={() => handleDelete(cat._id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
