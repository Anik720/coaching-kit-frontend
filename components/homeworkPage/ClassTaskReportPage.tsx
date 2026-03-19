"use client";

import React, { useState, useEffect } from "react";
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

interface BatchItem   { _id: string; batchName: string; }
interface SubjectItem { _id: string; subjectName: string; }

export default function ClassTaskReportPage() {
  const now = new Date();
  const [batches,  setBatches]  = useState<BatchItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selBatch,   setSelBatch]   = useState("");
  const [selSubject, setSelSubject] = useState("");
  const [selYear,    setSelYear]    = useState(now.getFullYear());
  const [selMonth,   setSelMonth]   = useState(now.getMonth() + 1);
  const [report,     setReport]     = useState<any[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated,  setGenerated]  = useState(false);

  const years  = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const months = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];

  useEffect(() => {
    homeworkApi.getBatches().then(r  => { const d = r.data?.data || r.data?.batches || r.data || []; setBatches(Array.isArray(d) ? d : []); });
    homeworkApi.getSubjects().then(r => { const d = r.data?.data || r.data?.subjects || r.data || []; setSubjects(Array.isArray(d) ? d : []); });
  }, []);

  const handleGenerate = async () => {
    if (!selBatch)   { toastManager.showError("Select a batch");   return; }
    if (!selSubject) { toastManager.showError("Select a subject"); return; }
    setLoading(true);
    try {
      const r = await homeworkApi.getMonthlyReport(selBatch, selSubject, selYear, selMonth);
      setReport(r.data || []);
      setGenerated(true);
    } catch {
      toastManager.showError("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handlePDF = async () => {
    if (report.length === 0) { toastManager.showError("Generate report first"); return; }
    setGenerating(true);
    try {
      const { default: jsPDF }     = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const batchLabel   = batches.find(b => b._id === selBatch)?.batchName || "";
      const subjectLabel = subjects.find(s => s._id === selSubject)?.subjectName || "";
      const monthLabel   = `${months[selMonth - 1]} ${selYear}`;

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const MARGIN = 13;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(30, 30, 30);
      doc.text("Monthly Class Task Report", MARGIN, 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text(`${batchLabel}  ·  ${subjectLabel}  ·  ${monthLabel}`, MARGIN, 26);
      doc.setDrawColor(210, 210, 210);
      doc.line(MARGIN, 30, 297 - MARGIN, 30);

      // Collect all unique students
      const studentMap = new Map<string, string>();
      report.forEach(({ evaluations }) => {
        evaluations.forEach((e: any) => {
          const sid  = e.student?._id || e.student;
          const name = e.student?.nameEnglish || "—";
          if (sid) studentMap.set(sid, name);
        });
      });
      const studentList = Array.from(studentMap.entries());

      const columns = [
        { header: "#",           dataKey: "serial" },
        { header: "Student Name",dataKey: "name"   },
        ...report.map(({ task }, i) => ({
          header:  `T${i + 1}\n${fmtDate(task.taskDate)}`,
          dataKey: task._id,
        })),
        { header: "Total", dataKey: "total" },
      ];

      const body = studentList.map(([sid, name], idx) => {
        const row: Record<string, any> = { serial: idx + 1, name, total: 0 };
        let sum = 0, hasMark = false;
        report.forEach(({ task, evaluations }) => {
          const ev = evaluations.find((e: any) => (e.student?._id || e.student) === sid);
          if (ev) {
            row[task._id] = ev.marks != null ? ev.marks : STATUS_LABELS[ev.status] || "—";
            if (ev.marks != null) { sum += Number(ev.marks); hasMark = true; }
          } else {
            row[task._id] = "—";
          }
        });
        row.total = hasMark ? sum : "—";
        return row;
      });

      autoTable(doc, {
        startY: 35,
        columns,
        body,
        styles: { fontSize: 8, cellPadding: { top: 2, bottom: 2, left: 2, right: 1 }, lineColor: [180, 180, 180], lineWidth: 0.25 },
        headStyles: { fillColor: [241, 243, 249], textColor: [30, 30, 30], fontStyle: "bold", halign: "center", fontSize: 7.5 },
        alternateRowStyles: { fillColor: [251, 252, 255] },
        margin: { left: MARGIN, right: MARGIN },
      });

      const fname = `class-task-report-${batchLabel.replace(/\s+/g, "-")}-${selYear}-${String(selMonth).padStart(2, "0")}.pdf`;
      doc.save(fname);
      toastManager.showSuccess("PDF downloaded");
    } catch (err) {
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
              background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
            }}>📊</div>
            <div>
              <h1 className={styles.pageTitle}>Class Task Report</h1>
              <p className={styles.pageSubtitle}>Monthly class task report for a batch & subject</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterCard}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Batch <span className={styles.required}>*</span></label>
            <select className={styles.filterSelect} value={selBatch} onChange={e => setSelBatch(e.target.value)}>
              <option value="">— Select Batch —</option>
              {batches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
            </select>
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Subject <span className={styles.required}>*</span></label>
            <select className={styles.filterSelect} value={selSubject} onChange={e => setSelSubject(e.target.value)}>
              <option value="">— Select Subject —</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.subjectName}</option>)}
            </select>
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
        <div style={{ display: "flex", gap: 12 }}>
          <button className={styles.btnPrimary} onClick={handleGenerate} disabled={loading} style={{ minWidth: 150 }}>
            {loading ? <><span className={styles.spinnerSmall} />&nbsp;Generating…</> : "Generate Report"}
          </button>
          {generated && report.length > 0 && (
            <button
              className={styles.btnSecondary}
              onClick={handlePDF}
              disabled={generating}
              style={{ minWidth: 170, borderColor: "#059669", color: "#059669" }}
            >
              {generating ? <><span className={styles.spinnerSmall} />&nbsp;Generating…</> : "📄 Download PDF"}
            </button>
          )}
        </div>
      </div>

      {/* Report Table */}
      {generated && (
        <div className={styles.tableCard}>
          {report.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af", fontSize: 15 }}>
              No tasks found for the selected batch, subject and month.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              {/* Tasks summary header */}
              <div style={{ display: "flex", gap: 10, padding: "1rem 1.5rem", flexWrap: "wrap", borderBottom: "1px solid #e2e8f0" }}>
                {report.map(({ task }, i) => (
                  <div key={task._id} style={{ padding: "8px 14px", borderRadius: 10, background: "#eef2ff", border: "1px solid #c7d2fe" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1" }}>T{i + 1}: {task.name}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{fmtDate(task.taskDate)} · {task.totalMarks} marks</div>
                  </div>
                ))}
              </div>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>#</th>
                    <th className={styles.th}>Student Name</th>
                    <th className={styles.th}>ID</th>
                    {report.map(({ task }, i) => (
                      <th key={task._id} className={styles.th} style={{ textAlign: "center" }}>
                        T{i + 1}<br />
                        <span style={{ fontWeight: 400, fontSize: 10 }}>{fmtDate(task.taskDate)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const studentMap = new Map<string, { name: string; regId: string }>();
                    report.forEach(({ evaluations }) => {
                      evaluations.forEach((e: any) => {
                        const sid = e.student?._id || e.student;
                        if (sid && !studentMap.has(sid)) {
                          studentMap.set(sid, { name: e.student?.nameEnglish || "—", regId: e.student?.registrationId || "—" });
                        }
                      });
                    });
                    return Array.from(studentMap.entries()).map(([sid, info], idx) => (
                      <tr key={sid} className={styles.tr}>
                        <td className={styles.td} style={{ textAlign: "center" }}>{idx + 1}</td>
                        <td className={styles.td} style={{ fontWeight: 600 }}>{info.name}</td>
                        <td className={styles.td} style={{ fontSize: 12, color: "#64748b" }}>{info.regId}</td>
                        {report.map(({ task, evaluations }) => {
                          const ev = evaluations.find((e: any) => (e.student?._id || e.student) === sid);
                          const sc = ev ? (STATUS_COLORS[ev.status] || {}) : {};
                          return (
                            <td key={task._id} className={styles.td} style={{ textAlign: "center" }}>
                              {ev ? (
                                <span style={{
                                  padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                                  background: (sc as any).bg || "#f8fafc",
                                  color: (sc as any).color || "#374151",
                                }}>
                                  {ev.marks != null ? ev.marks : STATUS_LABELS[ev.status] || "—"}
                                </span>
                              ) : <span style={{ color: "#d1d5db" }}>—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
