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

export default function ClassTaskListPage() {
  const router = useRouter();
  const [list,     setList]     = useState<any[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const limit = 15;

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const r = await homeworkApi.getClassTasks({ page, limit, sortBy: "taskDate", sortOrder: "desc" });
      setList(r.data?.data || []);
      setTotal(r.data?.total || 0);
    } catch {
      toastManager.showError("Failed to load class tasks");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await homeworkApi.deleteClassTask(deleteId);
      toastManager.showSuccess("Task deleted");
      setDeleteId(null);
      fetchList();
    } catch {
      toastManager.showError("Failed to delete task");
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
                background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
              }}>📝</div>
              <div>
                <h1 className={styles.pageTitle}>Class Task List</h1>
                <p className={styles.pageSubtitle}>{total} task{total !== 1 ? "s" : ""} total</p>
              </div>
            </div>
            <button
              className={styles.btnPrimary}
              onClick={() => router.push("/dashboard/homework/create-task")}
            >
              + Create Class Task
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
            No class tasks yet. Click &ldquo;+ Create Class Task&rdquo; to get started.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} style={{ width: 48 }}>#</th>
                  <th className={styles.th}>Task Name</th>
                  <th className={styles.th}>Class</th>
                  <th className={styles.th}>Batch</th>
                  <th className={styles.th}>Subject</th>
                  <th className={styles.th} style={{ width: 100, textAlign: "center" }}>Total Marks</th>
                  <th className={styles.th} style={{ width: 120 }}>Date</th>
                  <th className={styles.th} style={{ width: 120, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((task, idx) => (
                  <tr key={task._id} className={styles.tr}>

                    {/* # */}
                    <td className={styles.td} style={{ textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                      {(page - 1) * limit + idx + 1}
                    </td>

                    {/* Name */}
                    <td className={styles.td}>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{task.name}</span>
                    </td>

                    {/* Class */}
                    <td className={styles.td} style={{ fontSize: 13, color: "#64748b" }}>
                      {task.class?.classname || "—"}
                    </td>

                    {/* Batch */}
                    <td className={styles.td}>
                      {task.batch?.batchName ? (
                        <span style={{
                          padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: "#eef2ff", color: "#6366f1", border: "1px solid #c7d2fe",
                        }}>
                          {task.batch.batchName}
                        </span>
                      ) : "—"}
                    </td>

                    {/* Subject */}
                    <td className={styles.td} style={{ fontSize: 13, color: "#64748b" }}>
                      {task.subject?.subjectName || "—"}
                    </td>

                    {/* Total Marks */}
                    <td className={styles.td} style={{ textAlign: "center" }}>
                      {task.totalMarks > 0 ? (
                        <span style={{
                          display: "inline-block", padding: "2px 10px", borderRadius: 20,
                          background: "#f0fdf4", color: "#15803d", fontSize: 12, fontWeight: 700,
                          border: "1px solid #bbf7d0",
                        }}>
                          {task.totalMarks}
                        </span>
                      ) : (
                        <span style={{ color: "#d1d5db", fontSize: 13 }}>—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className={styles.td} style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>
                      {fmtDate(task.taskDate)}
                    </td>

                    {/* Actions */}
                    <td className={styles.td}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button
                          onClick={() => router.push(`/dashboard/homework/create-task?taskId=${task._id}`)}
                          style={{
                            padding: "5px 14px", fontSize: 12, fontWeight: 600,
                            border: "1px solid #c7d2fe", borderRadius: 8,
                            background: "#eef2ff", color: "#6366f1",
                            cursor: "pointer", transition: "all 0.15s",
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#6366f1"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#eef2ff"; (e.currentTarget as HTMLButtonElement).style.color = "#6366f1"; }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => setDeleteId(task._id)}
                          style={{
                            padding: "5px 10px", fontSize: 13, fontWeight: 600,
                            border: "1px solid #fecaca", borderRadius: 8,
                            background: "#fff5f5", color: "#dc2626",
                            cursor: "pointer", transition: "all 0.15s",
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#dc2626"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff5f5"; (e.currentTarget as HTMLButtonElement).style.color = "#dc2626"; }}
                          title="Delete task"
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "1rem 1.5rem", borderTop: "1px solid #f1f5f9" }}>
            <button
              disabled={page === 1}
              className={styles.btnSecondary}
              style={{ padding: "6px 16px", opacity: page === 1 ? 0.4 : 1 }}
              onClick={() => setPage(p => p - 1)}
            >
              ‹ Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} style={{ color: "#9ca3af", fontSize: 13 }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    style={{
                      padding: "6px 12px", borderRadius: 8, border: "1px solid",
                      borderColor: page === p ? "#6366f1" : "#e2e8f0",
                      background: page === p ? "#6366f1" : "#fff",
                      color: page === p ? "#fff" : "#374151",
                      fontWeight: page === p ? 700 : 400,
                      cursor: "pointer", fontSize: 13,
                    }}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              disabled={page === totalPages}
              className={styles.btnSecondary}
              style={{ padding: "6px 16px", opacity: page === totalPages ? 0.4 : 1 }}
              onClick={() => setPage(p => p + 1)}
            >
              Next ›
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className={styles.modalOverlay} onClick={() => setDeleteId(null)}>
          <div className={styles.modal} style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Delete Class Task?</h3>
              <button className={styles.modalClose} onClick={() => setDeleteId(null)}>×</button>
            </div>
            <div className={styles.modalBody} style={{ padding: "20px 28px" }}>
              <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
                This task and all its student results will be permanently deleted.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setDeleteId(null)}>Cancel</button>
              <button
                disabled={deleting}
                onClick={handleDelete}
                style={{
                  padding: "8px 24px", borderRadius: 8, border: "none",
                  background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 600,
                  opacity: deleting ? 0.6 : 1,
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
