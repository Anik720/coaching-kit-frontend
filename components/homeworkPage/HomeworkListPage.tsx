"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import homeworkApi from "@/api/homeworkApi/homeworkApi";
import { toastManager } from "@/utils/toastConfig";
import styles from "../attendancePage/Attendance.module.css";

function fmtDate(d: any) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function HomeworkListPage() {
  const router = useRouter();
  const [list,    setList]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const limit = 15;

  // Delete modal
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const r = await homeworkApi.getHomeworkList({ page, limit, sortBy: "homeworkDate", sortOrder: "desc" });
      const d = r.data;
      setList(d.data || []);
      setTotal(d.total || 0);
    } catch {
      toastManager.showError("Failed to load homework list");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await homeworkApi.deleteHomework(deleteId);
      toastManager.showSuccess("Homework deleted");
      setDeleteId(null);
      fetchList();
    } catch {
      toastManager.showError("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
              }}>📋</div>
              <div>
                <h1 className={styles.pageTitle}>Homework List</h1>
                <p className={styles.pageSubtitle}>All homework assignments — {total} total</p>
              </div>
            </div>
            <button
              className={styles.btnPrimary}
              onClick={() => router.push("/dashboard/homework/add")}
            >
              + Add New Homework
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
            <span className={styles.spinnerSmall} /> Loading…
          </div>
        ) : list.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af", fontSize: 15 }}>
            No homework found. Click "+ Add New Homework" to create one.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {["Homework Date", "Title", "Subject", "Class", "Batches", "Actions"].map(h => (
                    <th key={h} className={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map(hw => (
                  <tr key={hw._id} className={styles.tr}>
                    <td className={styles.td} style={{ whiteSpace: "nowrap" }}>{fmtDate(hw.homeworkDate)}</td>
                    <td className={styles.td} style={{ fontWeight: 600 }}>{hw.homeworkName}</td>
                    <td className={styles.td}>{hw.subject?.subjectName || hw.subject || "—"}</td>
                    <td className={styles.td}>{hw.class?.classname || hw.class || "—"}</td>
                    <td className={styles.td}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {Array.isArray(hw.batches)
                          ? hw.batches.map((b: any) => (
                            <span key={b._id || b} style={{
                              padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                              background: "#eef2ff", color: "#6366f1", border: "1px solid #c7d2fe",
                            }}>
                              {b.batchName || b}
                            </span>
                          ))
                          : "—"}
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className={styles.btnSecondary}
                          style={{ padding: "4px 12px", fontSize: 12 }}
                          onClick={() => router.push(`/dashboard/homework/add?edit=${hw._id}`)}
                        >
                          Edit
                        </button>
                        <button
                          className={styles.btnSecondary}
                          style={{ padding: "4px 12px", fontSize: 12, borderColor: "#6366f1", color: "#6366f1" }}
                          onClick={() => router.push(`/dashboard/homework/${hw._id}/view`)}
                        >
                          View
                        </button>
                        <button
                          className={styles.btnPrimary}
                          style={{ padding: "4px 12px", fontSize: 12, background: "linear-gradient(135deg,#059669,#047857)" }}
                          onClick={() => router.push(`/dashboard/homework/${hw._id}/submissions`)}
                        >
                          Input
                        </button>
                        <button
                          style={{
                            padding: "4px 10px", fontSize: 12, border: "none", borderRadius: 6,
                            background: "#fee2e2", color: "#dc2626", cursor: "pointer",
                          }}
                          onClick={() => setDeleteId(hw._id)}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "1rem" }}>
            <button disabled={page === 1} className={styles.btnSecondary} style={{ padding: "6px 14px" }}
              onClick={() => setPage(p => p - 1)}>‹ Prev</button>
            <span style={{ lineHeight: "36px", fontSize: 13, color: "#6b7280" }}>
              Page {page} of {totalPages}
            </span>
            <button disabled={page === totalPages} className={styles.btnSecondary} style={{ padding: "6px 14px" }}
              onClick={() => setPage(p => p + 1)}>Next ›</button>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className={styles.modalOverlay} onClick={() => setDeleteId(null)}>
          <div className={styles.modal} style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Delete Homework?</h3>
              <button className={styles.modalClose} onClick={() => setDeleteId(null)}>×</button>
            </div>
            <div className={styles.modalBody} style={{ padding: "20px 28px" }}>
              <p style={{ color: "#6b7280", fontSize: 14 }}>This action cannot be undone.</p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setDeleteId(null)}>Cancel</button>
              <button
                disabled={deleting}
                onClick={handleDelete}
                style={{
                  padding: "8px 20px", borderRadius: 8, border: "none",
                  background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 600,
                }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
