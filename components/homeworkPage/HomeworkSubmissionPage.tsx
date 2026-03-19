"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import homeworkApi from "@/api/homeworkApi/homeworkApi";
import { toastManager } from "@/utils/toastConfig";
import styles from "../attendancePage/Attendance.module.css";

interface StudentRow {
  studentId: string;
  name:       string;
  regId:      string;
  submitted:  boolean;
  feedback:   string;
  dirty:      boolean; // changed since load
}

interface Props { homeworkId: string; }

function fmtDate(d: any) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function HomeworkSubmissionPage({ homeworkId }: Props) {
  const router = useRouter();

  const [homework,    setHomework]    = useState<any>(null);
  const [allRows,     setAllRows]     = useState<StudentRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState<string | null>(null); // studentId being saved

  // Search
  const [query,        setQuery]        = useState("");
  const [results,      setResults]      = useState<StudentRow[]>([]);
  const [searched,     setSearched]     = useState(false);
  const [searching,    setSearching]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Load all students + existing submissions ──────────────────────────────
  useEffect(() => {
    if (!homeworkId) return;
    setLoading(true);
    homeworkApi.getSubmissions(homeworkId)
      .then(r => {
        setHomework(r.data?.homework || null);
        const rawRows: any[] = r.data?.rows || [];
        setAllRows(rawRows.map(row => ({
          studentId: row.student._id,
          name:      row.student.nameEnglish,
          regId:     row.student.registrationId,
          submitted: row.submitted ?? false,
          feedback:  row.feedback  ?? "",
          dirty:     false,
        })));
      })
      .catch(() => toastManager.showError("Failed to load submission data"))
      .finally(() => setLoading(false));
  }, [homeworkId]);

  // ── Search handler ────────────────────────────────────────────────────────
  const handleSearch = async () => {
    const q = query.trim();
    if (!q) { setResults([]); setSearched(false); return; }

    // 1. Search locally in pre-loaded batch students
    const localMatches = allRows.filter(r =>
      r.name.toLowerCase().includes(q.toLowerCase()) ||
      r.regId.toLowerCase().includes(q.toLowerCase())
    );

    if (localMatches.length > 0) {
      setResults(localMatches);
      setSearched(true);
      return;
    }

    // 2. Fallback: search all students via API (student may be outside homework batches)
    setSearching(true);
    try {
      const res = await homeworkApi.searchStudents(q);
      const apiStudents: any[] = res.data || [];
      if (apiStudents.length === 0) {
        setResults([]);
        setSearched(true);
        return;
      }

      // Merge with any existing submission data already in allRows
      const found: StudentRow[] = apiStudents.map((stu: any) => {
        const stuId = stu._id;
        const existing = allRows.find(r => r.studentId === stuId);
        return existing ?? {
          studentId: stuId,
          name:      stu.nameEnglish,
          regId:     stu.registrationId,
          submitted: false,
          feedback:  "",
          dirty:     false,
        };
      });

      // Add any new students to allRows so Save works correctly
      setAllRows(prev => {
        const existingIds = new Set(prev.map(r => r.studentId));
        const newOnes = found.filter(r => !existingIds.has(r.studentId));
        return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
      });

      setResults(found);
    } catch {
      toastManager.showError("Failed to search students");
      setResults([]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  // ── Update a row (both in allRows and results) ────────────────────────────
  const updateRow = (studentId: string, field: "submitted" | "feedback", value: any) => {
    const updater = (rows: StudentRow[]) =>
      rows.map(r => r.studentId === studentId ? { ...r, [field]: value, dirty: true } : r);
    setAllRows(prev => updater(prev));
    setResults(prev => updater(prev));
  };

  // ── Save a single student ─────────────────────────────────────────────────
  const handleSaveOne = async (studentId: string) => {
    const row = allRows.find(r => r.studentId === studentId);
    if (!row) return;
    setSaving(studentId);
    try {
      await homeworkApi.saveSubmissions(homeworkId, [{
        studentId: row.studentId,
        submitted: row.submitted,
        feedback:  row.feedback,
      }]);
      // mark clean
      const markClean = (rows: StudentRow[]) =>
        rows.map(r => r.studentId === studentId ? { ...r, dirty: false } : r);
      setAllRows(prev => markClean(prev));
      setResults(prev => markClean(prev));
      toastManager.showSuccess(`Saved for ${row.name}`);
    } catch (err: any) {
      toastManager.showError(err?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(null);
    }
  };

  // ── Derived info ──────────────────────────────────────────────────────────
  const hwName    = homework?.homeworkName || "Homework";
  const hwClass   = homework?.class?.classname || "";
  const hwSubject = homework?.subject?.subjectName || "";
  const hwDate    = homework?.homeworkDate ? fmtDate(homework.homeworkDate) : "";
  const hwBatches = Array.isArray(homework?.batches)
    ? homework.batches.map((b: any) => b.batchName || b).join(", ")
    : "";
  const hwCreatedBy = homework?.createdBy?.username || homework?.createdBy?.email || "";

  const submittedCount    = allRows.filter(r => r.submitted).length;
  const notSubmittedCount = allRows.length - submittedCount;

  // ── Render ────────────────────────────────────────────────────────────────
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
                <h1 className={styles.pageTitle}>Student Homework</h1>
                <p className={styles.pageSubtitle} style={{ color: "#6366f1", fontWeight: 600 }}>
                  {hwName}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className={styles.btnSecondary}
                style={{ borderColor: "#6366f1", color: "#6366f1" }}
                onClick={() => router.push(`/dashboard/homework/${homeworkId}/view`)}
              >
                View All
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

      {/* Search */}
      <div style={{
        background: "#fff", borderRadius: 12, padding: "20px 24px",
        marginBottom: "1.25rem", border: "1px solid #e2e8f0",
      }}>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
          Search by student name or registration ID to update their submission status.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            ref={inputRef}
            type="text"
            className={styles.filterInput}
            style={{ flex: 1, maxWidth: 480 }}
            placeholder="Type student name or registration ID…"
            value={query}
            onChange={e => { setQuery(e.target.value); if (!e.target.value) { setResults([]); setSearched(false); } }}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className={styles.btnPrimary}
            onClick={handleSearch}
            disabled={loading || searching || !query.trim()}
            style={{ minWidth: 90 }}
          >
            {searching ? <><span className={styles.spinnerSmall} />&nbsp;Searching…</> : "Search"}
          </button>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className={styles.tableCard}>
          {results.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af", fontSize: 15 }}>
              No student found matching &ldquo;{query}&rdquo; in the system.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th} style={{ width: 50 }}>#</th>
                    <th className={styles.th}>Student Name</th>
                    <th className={styles.th} style={{ width: 140 }}>Registration ID</th>
                    <th className={styles.th} style={{ width: 240 }}>Status</th>
                    <th className={styles.th}>Comment</th>
                    <th className={styles.th} style={{ width: 100 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, idx) => (
                    <tr key={row.studentId} className={styles.tr}>
                      {/* # */}
                      <td className={styles.td} style={{ textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                        {idx + 1}
                      </td>

                      {/* Name */}
                      <td className={styles.td} style={{ fontWeight: 600, color: "#374151" }}>
                        {row.name}
                      </td>

                      {/* Reg ID */}
                      <td className={styles.td} style={{ fontSize: 13, color: "#64748b" }}>
                        {row.regId}
                      </td>

                      {/* Status radio */}
                      <td className={styles.td}>
                        <div style={{ display: "flex", gap: 16 }}>
                          <label style={{
                            display: "flex", alignItems: "center", gap: 6,
                            cursor: "pointer", fontSize: 13, fontWeight: 600,
                            color: row.submitted ? "#166534" : "#9ca3af",
                          }}>
                            <input
                              type="radio"
                              name={`status-${row.studentId}`}
                              checked={row.submitted}
                              onChange={() => updateRow(row.studentId, "submitted", true)}
                              style={{ accentColor: "#059669" }}
                            />
                            Submitted
                          </label>
                          <label style={{
                            display: "flex", alignItems: "center", gap: 6,
                            cursor: "pointer", fontSize: 13, fontWeight: 600,
                            color: !row.submitted ? "#991b1b" : "#9ca3af",
                          }}>
                            <input
                              type="radio"
                              name={`status-${row.studentId}`}
                              checked={!row.submitted}
                              onChange={() => updateRow(row.studentId, "submitted", false)}
                              style={{ accentColor: "#dc2626" }}
                            />
                            Not Submitted
                          </label>
                        </div>
                      </td>

                      {/* Comment */}
                      <td className={styles.td}>
                        <input
                          type="text"
                          className={styles.filterInput}
                          style={{ width: "100%" }}
                          value={row.feedback}
                          onChange={e => updateRow(row.studentId, "feedback", e.target.value)}
                          placeholder="Add comment…"
                        />
                      </td>

                      {/* Save button */}
                      <td className={styles.td} style={{ textAlign: "center" }}>
                        <button
                          className={styles.btnPrimary}
                          style={{
                            padding: "5px 14px", fontSize: 12, minWidth: 60,
                            opacity: row.dirty ? 1 : 0.5,
                          }}
                          onClick={() => handleSaveOne(row.studentId)}
                          disabled={saving === row.studentId}
                        >
                          {saving === row.studentId
                            ? <><span className={styles.spinnerSmall} />&nbsp;</>
                            : "Save"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Empty state before search */}
      {!searched && !loading && (
        <div style={{
          background: "#fff", borderRadius: 12, padding: "3rem",
          border: "1px solid #e2e8f0", textAlign: "center", color: "#9ca3af",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p style={{ fontSize: 15 }}>Search for a student above to update their submission status.</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>
            Total students in this homework: <strong style={{ color: "#374151" }}>{allRows.length}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
