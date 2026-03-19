"use client";

import React, { useState } from "react";
import homeworkApi from "@/api/homeworkApi/homeworkApi";
import { toastManager } from "@/utils/toastConfig";
import styles from "../attendancePage/Attendance.module.css";

const STATUS_LABELS: Record<string, string> = {
  completed:     "Completed",
  incomplete:    "Incomplete",
  not_submitted: "Not Submitted",
  absent:        "Absent",
};
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  completed:     { bg: "#dcfce7", color: "#166534" },
  incomplete:    { bg: "#fef3c7", color: "#92400e" },
  not_submitted: { bg: "#fee2e2", color: "#991b1b" },
  absent:        { bg: "#f1f5f9", color: "#64748b" },
};

function fmtDate(d: any) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function SingleStudentReportPage() {
  const now = new Date();
  const [registrationId, setRegistrationId] = useState("");
  const [studentId,      setStudentId]      = useState("");
  const [selYear,  setSelYear]  = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [pdfMode,  setPdfMode]  = useState<"portrait" | "landscape">("landscape");
  const [report,   setReport]   = useState<any[]>([]);
  const [student,  setStudent]  = useState<any>(null);
  const [loading,  setLoading]  = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showed,   setShowed]   = useState(false);

  const years  = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const months = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];

  const handleShow = async () => {
    if (!registrationId.trim()) { toastManager.showError("Enter a Student ID"); return; }
    setLoading(true);
    setShowed(false);
    try {
      // First resolve registration ID → student _id
      const sRes = await homeworkApi.getStudentByRegistrationId(registrationId.trim());
      const sData = sRes.data?.data || sRes.data?.students || sRes.data || [];
      const students = Array.isArray(sData) ? sData : [sData];
      if (students.length === 0 || !students[0]?._id) {
        toastManager.showError("Student not found");
        setLoading(false);
        return;
      }
      const stu = students[0];
      setStudent(stu);
      setStudentId(stu._id);

      const r = await homeworkApi.getStudentReport(stu._id, selYear, selMonth);
      setReport(r.data || []);
      setShowed(true);
    } catch {
      toastManager.showError("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const handlePDF = async () => {
    if (report.length === 0) { toastManager.showError("No data to export"); return; }
    setGenerating(true);
    try {
      const { default: jsPDF }     = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const monthLabel = `${months[selMonth - 1]} ${selYear}`;
      const stuName    = student?.nameEnglish || registrationId;

      const doc = new jsPDF({ orientation: pdfMode, unit: "mm", format: "a4" });
      const MARGIN = 13;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Student Monthly Task Report", MARGIN, 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text(`${stuName}  (${registrationId})  ·  ${monthLabel}`, MARGIN, 26);
      doc.setDrawColor(210, 210, 210);
      doc.setTextColor(30, 30, 30);

      const pageW = pdfMode === "landscape" ? 297 : 210;
      doc.line(MARGIN, 30, pageW - MARGIN, 30);

      autoTable(doc, {
        startY: 35,
        columns: [
          { header: "#",       dataKey: "serial"  },
          { header: "Task",    dataKey: "task"    },
          { header: "Subject", dataKey: "subject" },
          { header: "Class",   dataKey: "class"   },
          { header: "Batch",   dataKey: "batch"   },
          { header: "Date",    dataKey: "date"    },
          { header: "Marks",   dataKey: "marks"   },
          { header: "Total",   dataKey: "total"   },
          { header: "Status",  dataKey: "status"  },
          { header: "Note",    dataKey: "note"    },
        ],
        body: report.map((e: any, idx: number) => ({
          serial:  idx + 1,
          task:    e.classTask?.name || "—",
          subject: e.classTask?.subject?.subjectName || "—",
          class:   e.classTask?.class?.classname || "—",
          batch:   e.classTask?.batch?.batchName || "—",
          date:    fmtDate(e.classTask?.taskDate),
          marks:   e.marks != null ? e.marks : "—",
          total:   e.classTask?.totalMarks ?? "—",
          status:  STATUS_LABELS[e.status] || e.status,
          note:    e.note || "—",
        })),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [241, 243, 249], textColor: [30, 30, 30], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [251, 252, 255] },
        margin: { left: MARGIN, right: MARGIN },
      });

      const ph = doc.internal.pageSize.getHeight();
      doc.setFontSize(7.5);
      doc.setTextColor(160, 160, 160);
      doc.text(`CoachingKit  ·  ${stuName}  ·  ${monthLabel}`, MARGIN, ph - 7);

      const fname = `task-report-${registrationId}-${selYear}-${String(selMonth).padStart(2, "0")}.pdf`;
      doc.save(fname);
      toastManager.showSuccess("PDF downloaded");
    } catch {
      toastManager.showError("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
            }}>👤</div>
            <div>
              <h1 className={styles.pageTitle}>Class Task Single Student Report</h1>
              <p className={styles.pageSubtitle}>Monthly task report for an individual student</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className={styles.filterCard}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Student ID <span className={styles.required}>*</span></label>
            <input
              type="text"
              className={styles.filterInput}
              placeholder="Enter Registration ID"
              value={registrationId}
              onChange={e => setRegistrationId(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleShow(); }}
            />
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Month</label>
            <select className={styles.filterSelect} value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}>
              {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Year</label>
            <select className={styles.filterSelect} value={selYear} onChange={e => setSelYear(Number(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* PDF Orientation */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label className={styles.filterLabel}>PDF Orientation</label>
          <div style={{ display: "flex", gap: 20, marginTop: 6 }}>
            {(["portrait", "landscape"] as const).map(m => (
              <label key={m} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                <input type="radio" checked={pdfMode === m} onChange={() => setPdfMode(m)} />
                <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{m}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className={styles.btnPrimary} onClick={handleShow} disabled={loading} style={{ minWidth: 140 }}>
            {loading ? <><span className={styles.spinnerSmall} />&nbsp;Loading…</> : "Show Report"}
          </button>
          {showed && report.length > 0 && (
            <button
              className={styles.btnSecondary}
              onClick={handlePDF}
              disabled={generating}
              style={{ minWidth: 170, borderColor: "#8b5cf6", color: "#8b5cf6" }}
            >
              {generating ? <><span className={styles.spinnerSmall} />&nbsp;</> : "📄 "} Download PDF
            </button>
          )}
        </div>
      </div>

      {/* Result */}
      {showed && (
        <div className={styles.tableCard}>
          {student && (
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", gap: 24 }}>
              <div>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Name</span>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#374151" }}>{student.nameEnglish}</div>
              </div>
              <div>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Registration ID</span>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#6366f1" }}>{student.registrationId}</div>
              </div>
              <div>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Tasks this month</span>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#374151" }}>{report.length}</div>
              </div>
            </div>
          )}

          {report.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af", fontSize: 15 }}>
              No tasks found for the selected student and month.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {["#", "Task Name", "Subject", "Class", "Batch", "Date", "Marks", "Total", "Status", "Note"].map(h => (
                      <th key={h} className={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.map((e: any, idx: number) => {
                    const sc = STATUS_COLORS[e.status] || {};
                    return (
                      <tr key={e._id} className={styles.tr}>
                        <td className={styles.td} style={{ textAlign: "center" }}>{idx + 1}</td>
                        <td className={styles.td} style={{ fontWeight: 600 }}>{e.classTask?.name || "—"}</td>
                        <td className={styles.td}>{e.classTask?.subject?.subjectName || "—"}</td>
                        <td className={styles.td}>{e.classTask?.class?.classname || "—"}</td>
                        <td className={styles.td}>
                          <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "#eef2ff", color: "#6366f1" }}>
                            {e.classTask?.batch?.batchName || "—"}
                          </span>
                        </td>
                        <td className={styles.td} style={{ whiteSpace: "nowrap" }}>{fmtDate(e.classTask?.taskDate)}</td>
                        <td className={styles.td} style={{ textAlign: "center", fontWeight: 700, color: "#374151" }}>
                          {e.marks != null ? e.marks : "—"}
                        </td>
                        <td className={styles.td} style={{ textAlign: "center", color: "#9ca3af" }}>
                          {e.classTask?.totalMarks ?? "—"}
                        </td>
                        <td className={styles.td}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: (sc as any).bg || "#f8fafc",
                            color:      (sc as any).color || "#374151",
                          }}>
                            {STATUS_LABELS[e.status] || e.status}
                          </span>
                        </td>
                        <td className={styles.td} style={{ fontSize: 12, color: "#6b7280" }}>{e.note || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
