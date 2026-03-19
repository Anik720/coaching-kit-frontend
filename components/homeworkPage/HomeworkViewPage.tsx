"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import homeworkApi from "@/api/homeworkApi/homeworkApi";
import { toastManager } from "@/utils/toastConfig";
import styles from "../attendancePage/Attendance.module.css";

interface Props { homeworkId: string; }

function fmtDate(d: any) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(d: any) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function HomeworkViewPage({ homeworkId }: Props) {
  const router = useRouter();

  const [homework, setHomework] = useState<any>(null);
  const [rows,     setRows]     = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    if (!homeworkId) return;
    setLoading(true);
    homeworkApi.getSubmissions(homeworkId)
      .then(r => {
        setHomework(r.data?.homework || null);
        setRows(r.data?.rows || []);
      })
      .catch(() => toastManager.showError("Failed to load submission data"))
      .finally(() => setLoading(false));
  }, [homeworkId]);

  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(row =>
      row.student.nameEnglish?.toLowerCase().includes(q) ||
      row.student.registrationId?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const submittedCount    = rows.filter(r => r.submitted).length;
  const notSubmittedCount = rows.length - submittedCount;

  const hwName    = homework?.homeworkName || "Homework";
  const hwClass   = homework?.class?.classname || "";
  const hwSubject = homework?.subject?.subjectName || "";
  const hwDate    = homework?.homeworkDate ? fmtDate(homework.homeworkDate) : "";
  const hwBatches = Array.isArray(homework?.batches)
    ? homework.batches.map((b: any) => b.batchName || b).join(", ")
    : "";
  const hwCreatedBy = homework?.createdBy?.username || homework?.createdBy?.email || "";

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
              }}>📖</div>
              <div>
                <h1 className={styles.pageTitle}>{hwName}</h1>
                <p className={styles.pageSubtitle} style={{ color: "#6366f1", fontWeight: 600 }}>
                  Submission Overview
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className={styles.btnPrimary}
                style={{ background: "linear-gradient(135deg,#059669,#047857)" }}
                onClick={() => router.push(`/dashboard/homework/${homeworkId}/submissions`)}
              >
                Input
              </button>
              <button className={styles.btnSecondary} onClick={() => router.push("/dashboard/homework/list")}>
                ← Back to List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info strip */}
      {homework && (
        <div style={{
          background: "#fff", borderRadius: 12, padding: "12px 24px",
          marginBottom: "1.25rem", border: "1px solid #e2e8f0",
          display: "flex", gap: 40, flexWrap: "wrap", alignItems: "center",
        }}>
          {hwClass   && <div style={{ fontSize: 13 }}><span style={{ color: "#9ca3af" }}>Class: </span><strong>{hwClass}</strong></div>}
          {hwBatches && <div style={{ fontSize: 13 }}><span style={{ color: "#9ca3af" }}>Batch: </span><strong>{hwBatches}</strong></div>}
          {hwSubject && <div style={{ fontSize: 13 }}><span style={{ color: "#9ca3af" }}>Subject: </span><strong>{hwSubject}</strong></div>}
          {hwCreatedBy && <div style={{ fontSize: 13 }}><span style={{ color: "#9ca3af" }}>Created By: </span><strong>{hwCreatedBy}</strong></div>}
          {hwDate    && <div style={{ fontSize: 13 }}><span style={{ color: "#9ca3af" }}>Date: </span><strong>{hwDate}</strong></div>}

          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <span style={{ padding: "4px 14px", borderRadius: 20, background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700 }}>
              ✓ Submitted: {submittedCount}
            </span>
            <span style={{ padding: "4px 14px", borderRadius: 20, background: "#fee2e2", color: "#991b1b", fontSize: 12, fontWeight: 700 }}>
              ✗ Not Submitted: {notSubmittedCount}
            </span>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div style={{
        background: "#fff", borderRadius: 12, padding: "12px 24px",
        marginBottom: "1.25rem", border: "1px solid #e2e8f0",
      }}>
        <input
          type="text"
          className={styles.filterInput}
          style={{ maxWidth: 400 }}
          placeholder="Search by student name or ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
            <span className={styles.spinnerSmall} /> Loading…
          </div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af", fontSize: 15 }}>
            {rows.length === 0 ? "No submissions found." : "No students match the search."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} style={{ width: 50 }}>#</th>
                  <th className={styles.th}>Student</th>
                  <th className={styles.th} style={{ width: 140 }}>Student ID</th>
                  <th className={styles.th} style={{ width: 160 }}>Batch</th>
                  <th className={styles.th} style={{ width: 130 }}>Submitted?</th>
                  <th className={styles.th} style={{ width: 180 }}>Submission Date</th>
                  <th className={styles.th}>Feedback</th>
                  <th className={styles.th} style={{ width: 80 }}>File</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr key={row.student._id} className={styles.tr}>
                    <td className={styles.td} style={{ textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                      {idx + 1}
                    </td>
                    <td className={styles.td} style={{ fontWeight: 600, color: "#374151" }}>
                      {row.student.nameEnglish}
                    </td>
                    <td className={styles.td} style={{ fontSize: 13, color: "#64748b" }}>
                      {row.student.registrationId}
                    </td>
                    <td className={styles.td}>
                      {row.student.batchName ? (
                        <span style={{
                          padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: "#eef2ff", color: "#6366f1", border: "1px solid #c7d2fe",
                        }}>
                          {row.student.batchName}
                        </span>
                      ) : "—"}
                    </td>
                    <td className={styles.td}>
                      {row.submitted ? (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "3px 12px", borderRadius: 20,
                          background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700,
                        }}>
                          ✓ Yes
                        </span>
                      ) : (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "3px 12px", borderRadius: 20,
                          background: "#fee2e2", color: "#991b1b", fontSize: 12, fontWeight: 700,
                        }}>
                          ✗ No
                        </span>
                      )}
                    </td>
                    <td className={styles.td} style={{ fontSize: 13, color: "#64748b" }}>
                      {fmtDateTime(row.submissionDate)}
                    </td>
                    <td className={styles.td} style={{ fontSize: 13, color: "#374151" }}>
                      {row.feedback || "—"}
                    </td>
                    <td className={styles.td} style={{ textAlign: "center" }}>
                      {row.fileUrl ? (
                        <a
                          href={row.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#6366f1", fontSize: 13, textDecoration: "underline" }}
                        >
                          View
                        </a>
                      ) : (
                        <span style={{ color: "#d1d5db", fontSize: 13 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
