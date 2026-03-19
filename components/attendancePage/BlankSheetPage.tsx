"use client";

import React, { useState, useEffect, useCallback } from "react";
import attendanceApi from "@/api/attendanceApi/attendanceApi";
import { toastManager } from "@/utils/toastConfig";
import styles from "./Attendance.module.css";

interface ClassItem { _id: string; classname: string; }
interface BatchItem  { _id: string; batchName: string; }

function daysInMonth(year: number, month: number) { return new Date(year, month, 0).getDate(); }
function formatMonthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}
function formatDateShort(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
// 2-letter abbreviations — safely fit in a 6.8mm column at 8pt
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// ── PDF layout constants ────────────────────────────────────────────────────
const PAGE_W   = 297;   // landscape A4 mm
const MARGIN   = 13;
const USABLE   = PAGE_W - MARGIN * 2;   // 271mm
const SERIAL_W = 8;
const ID_W     = 24;
const DAY_W    = 6.8;   // mm per session column
// Reserve at least 42mm for name, rest goes to sessions
const MAX_SESSIONS_PER_SECTION = Math.floor((USABLE - SERIAL_W - ID_W - 42) / DAY_W); // ~29

export default function BlankSheetPage() {
  const now = new Date();
  const [classes, setClasses]             = useState<ClassItem[]>([]);
  const [batches, setBatches]             = useState<BatchItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedYear, setSelectedYear]   = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [generating, setGenerating]       = useState(false);

  // Modal for blank-only sheets (no sessions recorded, or manual)
  const [showBlankModal, setShowBlankModal] = useState(false);
  const [numBlankDays, setNumBlankDays]     = useState(30);
  const [isManualBlank, setIsManualBlank]   = useState(false);

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingClasses(true);
    attendanceApi.getClasses()
      .then(r => { const d = r.data?.data || r.data?.classes || r.data || []; setClasses(Array.isArray(d) ? d : []); })
      .catch(() => toastManager.showError("Failed to load classes"))
      .finally(() => setLoadingClasses(false));
  }, []);

  useEffect(() => {
    if (!selectedClass) { setBatches([]); setSelectedBatch(""); return; }
    setLoadingBatches(true);
    attendanceApi.getBatches(selectedClass)
      .then(r => { const d = r.data?.data || r.data?.batches || r.data || []; setBatches(Array.isArray(d) ? d : []); setSelectedBatch(""); })
      .catch(() => toastManager.showError("Failed to load batches"))
      .finally(() => setLoadingBatches(false));
  }, [selectedClass]);

  useEffect(() => { setNumBlankDays(daysInMonth(selectedYear, selectedMonth)); }, [selectedYear, selectedMonth]);

  // ── Direct blank sheet download ───────────────────────────────────────────
  const handleClickBlankDirect = () => {
    if (!selectedClass) { toastManager.showError("Please select a class"); return; }
    if (!selectedBatch) { toastManager.showError("Please select a batch"); return; }
    setIsManualBlank(true);
    setShowBlankModal(true);
  };

  // ── Trigger download ──────────────────────────────────────────────────────
  const handleClickDownload = async () => {
    if (!selectedClass) { toastManager.showError("Please select a class"); return; }
    if (!selectedBatch) { toastManager.showError("Please select a batch"); return; }

    setGenerating(true);
    try {
      // Fetch the monthly grid — same data scope as the submit-page Prev badge
      const gridRes = await attendanceApi.getMonthlyGrid(
        selectedClass, selectedBatch, selectedMonth, selectedYear,
      );
      const dates: string[] = gridRes.data?.dates || [];

      if (dates.length === 0) {
        // No sessions recorded this month → offer blank sheet
        setIsManualBlank(false);
        setShowBlankModal(true);
      } else {
        await generatePDF(dates, gridRes.data?.students || [], false);
      }
    } catch {
      toastManager.showError("Failed to fetch attendance data");
    } finally {
      setGenerating(false);
    }
  };

  // For blank modal confirm
  const handleBlankDownload = async () => {
    if (numBlankDays < 1 || numBlankDays > 60) { toastManager.showError("Days must be 1–60"); return; }
    setShowBlankModal(false);
    setGenerating(true);
    try {
      // Blank dates: sequential
      const blankDates = Array.from({ length: numBlankDays }, (_, i) => `blank-${i + 1}`);
      await generatePDF(blankDates, [], true);
    } catch {
      toastManager.showError("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  // ── Core PDF generator ────────────────────────────────────────────────────
  const generatePDF = useCallback(async (
    dates: string[],
    gridStudents: any[],
    isBlank: boolean,
  ) => {
    const className  = classes.find(c => c._id === selectedClass)?.classname || "";
    const batchName  = batches.find(b => b._id === selectedBatch)?.batchName  || "";
    const monthLabel = formatMonthLabel(selectedYear, selectedMonth);

    // Fetch all students for this class+batch
    const studRes = await attendanceApi.getStudentsByClassBatch(selectedClass, selectedBatch);
    const rawStudents = studRes.data?.data || studRes.data?.students || studRes.data || [];
    const allStudents: any[] = Array.isArray(rawStudents) ? rawStudents : [];

    // Build attendance map: studentId → { dateStr → status }
    const attMap = new Map<string, Record<string, string>>();
    gridStudents.forEach((gs: any) => {
      attMap.set(gs._id, gs.attendance || {});
    });

    // Dynamic imports (keep initial bundle lean)
    const { default: jsPDF }     = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    // Split sessions into sections of MAX_SESSIONS_PER_SECTION
    const sections: string[][] = [];
    for (let i = 0; i < dates.length; i += MAX_SESSIONS_PER_SECTION) {
      sections.push(dates.slice(i, i + MAX_SESSIONS_PER_SECTION));
    }
    if (sections.length === 0) sections.push([]); // safety

    sections.forEach((sectionDates, sIdx) => {
      if (sIdx > 0) doc.addPage();

      const isFirstSection = sIdx === 0;
      const sessionCount   = sectionDates.length;
      // Adaptive name width: give remaining space to name column, capped at 70mm
      const usedByDays = sessionCount * DAY_W;
      const nameW = Math.min(70, Math.max(38, USABLE - SERIAL_W - ID_W - usedByDays));

      // ── Page header ────────────────────────────────────────────────────
      if (isFirstSection) {
        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(30, 30, 30);
        doc.text(isBlank ? "Attendance Blank Sheet" : "Monthly Attendance Sheet", MARGIN, 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(90, 90, 90);
        doc.text(monthLabel, MARGIN, 27);

        // Use getTextWidth so labels never overlap their values
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);

        const labelClass = "Class:";
        doc.text(labelClass, MARGIN, 35);
        doc.setFont("helvetica", "normal");
        doc.text(className, MARGIN + doc.getTextWidth(labelClass) + 2, 35);

        doc.setFont("helvetica", "bold");
        const labelBatch = "Batch:";
        doc.text(labelBatch, MARGIN, 41);
        doc.setFont("helvetica", "normal");
        doc.text(batchName, MARGIN + doc.getTextWidth(labelBatch) + 2, 41);

        doc.setFont("helvetica", "bold");
        const labelTotal = "Total Students:";
        doc.text(labelTotal, MARGIN, 47);
        doc.setFont("helvetica", "normal");
        doc.text(String(allStudents.length), MARGIN + doc.getTextWidth(labelTotal) + 2, 47);

        if (!isBlank) {
          const col2X = MARGIN + 90; // well clear of class/batch text
          doc.setFont("helvetica", "bold");
          const labelSessions = "Sessions:";
          doc.text(labelSessions, col2X, 35);
          doc.setFont("helvetica", "normal");
          doc.text(String(dates.length), col2X + doc.getTextWidth(labelSessions) + 2, 35);
        }

        // Logo box (top-right)
        const boxX = PAGE_W - MARGIN - 48;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.4);
        doc.roundedRect(boxX, 12, 48, 40, 3, 3);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(99, 102, 241);
        doc.text("CoachingKit", boxX + 24, 28, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text("Management System", boxX + 24, 35, { align: "center" });

        // Divider
        doc.setDrawColor(210, 210, 210);
        doc.setLineWidth(0.5);
        doc.line(MARGIN, 54, PAGE_W - MARGIN, 54);

        // Generated / Prepared By / Signature
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 30, 30);

        // Generated row — use getTextWidth so values never overlap labels
        const genLabel = "Generated:";
        doc.text(genLabel, MARGIN, 61);
        doc.setFont("helvetica", "normal");
        doc.text(formatDateShort(new Date()), MARGIN + doc.getTextWidth(genLabel) + 2, 61);

        doc.setFont("helvetica", "bold");
        const prepLabel = "Prepared By:";
        doc.text(prepLabel, 105, 61);
        doc.setFont("helvetica", "normal");
        doc.text("_______________________", 105 + doc.getTextWidth(prepLabel) + 2, 61);

        doc.setFont("helvetica", "bold");
        const sigLabel = "Signature:";
        doc.text(sigLabel, 220, 61);
        doc.setFont("helvetica", "normal");
        doc.text("_______________", 220 + doc.getTextWidth(sigLabel) + 2, 61);

      } else {
        // Continuation page mini-header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        doc.text(
          `${isBlank ? "Attendance Blank Sheet" : "Monthly Attendance Sheet"} (continued) — ${monthLabel}`,
          MARGIN, 14,
        );
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Class: ${className}   Batch: ${batchName}   Sessions ${sIdx * MAX_SESSIONS_PER_SECTION + 1}–${sIdx * MAX_SESSIONS_PER_SECTION + sessionCount}`, MARGIN, 21);
        doc.setDrawColor(210, 210, 210);
        doc.setLineWidth(0.4);
        doc.line(MARGIN, 25, PAGE_W - MARGIN, 25);
      }

      // ── Table ──────────────────────────────────────────────────────────

      // Build column defs
      const columns: Array<{ header: string; dataKey: string }> = [
        { header: "#",            dataKey: "serial" },
        { header: "Student ID",   dataKey: "sid"    },
        { header: "Student Name", dataKey: "name"   },
      ];

      sectionDates.forEach((d, di) => {
        if (isBlank) {
          columns.push({ header: String(sIdx * MAX_SESSIONS_PER_SECTION + di + 1), dataKey: d });
        } else {
          const dateObj  = new Date(d + "T00:00:00");
          const dayNum   = dateObj.getDate();
          const dayName  = DAY_NAMES[dateObj.getDay()];
          columns.push({ header: `${dayNum}\n${dayName}`, dataKey: d });
        }
      });

      // Build row data
      const body = allStudents.map((s: any, idx: number) => {
        const row: Record<string, string> = {
          serial: String(idx + 1),
          sid:    s.registrationId || "—",
          name:   s.nameEnglish    || "—",
        };
        const studentAtt = attMap.get(s._id) || {};
        sectionDates.forEach(d => {
          row[d] = isBlank ? "" : (studentAtt[d] || "");
        });
        return row;
      });

      // Column styles
      const colStyles: Record<string, { cellWidth: number; halign?: "left" | "center" | "right"; fontStyle?: "bold" | "normal" }> = {
        serial: { cellWidth: SERIAL_W, halign: "center" },
        sid:    { cellWidth: ID_W,     halign: "left"   },
        name:   { cellWidth: nameW,    halign: "left"   },
      };
      sectionDates.forEach(d => {
        colStyles[d] = { cellWidth: DAY_W, halign: "center" };
      });

      // Status color mapping for cell fills
      const didDrawCell = (data: any) => {
        if (data.section === "body" && sectionDates.includes(data.column.dataKey)) {
          const val = data.cell.text[0];
          if (val === "P") {
            doc.setFillColor(220, 252, 231);   // light green
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");
            doc.setTextColor(22, 101, 52);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            doc.text("P", data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 2.5, { align: "center" });
          } else if (val === "A") {
            doc.setFillColor(254, 226, 226);   // light red
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");
            doc.setTextColor(153, 27, 27);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            doc.text("A", data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 2.5, { align: "center" });
          } else if (val === "L") {
            doc.setFillColor(254, 243, 199);   // light amber
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");
            doc.setTextColor(146, 64, 14);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            doc.text("L", data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 2.5, { align: "center" });
          } else if (val === "LV") {
            doc.setFillColor(237, 233, 254);   // light purple
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");
            doc.setTextColor(109, 40, 217);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(6.5);
            doc.text("LV", data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 2.5, { align: "center" });
          }
          // Re-draw cell border
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.25);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "S");
          // Reset
          doc.setTextColor(30, 30, 30);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
        }
      };

      autoTable(doc, {
        startY: isFirstSection ? 66 : 29,
        columns,
        body,
        styles: {
          fontSize: 8,
          cellPadding: { top: 2.2, bottom: 2.2, left: 2, right: 1 },
          lineColor: [180, 180, 180],
          lineWidth: 0.25,
          overflow: "ellipsize",
          textColor: [30, 30, 30],
        },
        headStyles: {
          fillColor: [241, 243, 249],
          textColor: [30, 30, 30],
          fontStyle: "bold",
          halign: "center",
          fontSize: 7.5,
          lineColor: [180, 180, 180],
          lineWidth: 0.3,
          cellPadding: { top: 2, bottom: 2, left: 1, right: 1 },
          minCellHeight: 10,
        },
        alternateRowStyles: { fillColor: [251, 252, 255] },
        columnStyles: colStyles,
        margin: { left: MARGIN, right: MARGIN },
        tableLineColor: [160, 160, 160],
        tableLineWidth: 0.35,
        didDrawCell,
      });
    });

    // ── Footer on every page ──────────────────────────────────────────────
    const totalPages = (doc.internal as any).getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      const ph = doc.internal.pageSize.getHeight();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `Page ${p} of ${totalPages}   |   ${className} · ${batchName} · ${monthLabel}`,
        MARGIN, ph - 7,
      );
      doc.text("CoachingKit Management System", PAGE_W - MARGIN, ph - 7, { align: "right" });

      // Legend on last page
      if (p === totalPages && !isBlank) {
        const legendY = ph - 13;
        doc.setFontSize(7);
        doc.setTextColor(80, 80, 80);
        doc.text("Legend:", MARGIN, legendY);
        const legend = [
          { code: "P", label: "Present", r: 220, g: 252, b: 231, tc: [22, 101, 52] as [number,number,number] },
          { code: "A", label: "Absent",  r: 254, g: 226, b: 226, tc: [153, 27, 27] as [number,number,number] },
          { code: "L", label: "Late",    r: 254, g: 243, b: 199, tc: [146, 64, 14] as [number,number,number] },
          { code: "LV",label: "Leave",   r: 237, g: 233, b: 254, tc: [109, 40, 217] as [number,number,number] },
        ];
        let lx = MARGIN + 16;
        legend.forEach(l => {
          doc.setFillColor(l.r, l.g, l.b);
          doc.rect(lx, legendY - 4, 6, 5, "F");
          doc.setDrawColor(180, 180, 180);
          doc.rect(lx, legendY - 4, 6, 5, "S");
          doc.setTextColor(...l.tc);
          doc.setFont("helvetica", "bold");
          doc.text(l.code, lx + 3, legendY, { align: "center" });
          doc.setFont("helvetica", "normal");
          doc.setTextColor(80, 80, 80);
          doc.text(l.label, lx + 8, legendY);
          lx += 24;
        });
      }
    }

    const fname = `attendance-sheet-${batchName.replace(/\s+/g, "-")}-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.pdf`;
    doc.save(fname);
    toastManager.showSuccess(`PDF downloaded — ${totalPages} page${totalPages > 1 ? "s" : ""}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedBatch, selectedYear, selectedMonth, classes, batches]);

  const handleReset = () => {
    setSelectedClass(""); setSelectedBatch("");
    setSelectedYear(now.getFullYear()); setSelectedMonth(now.getMonth() + 1);
  };

  const years  = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const months = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.pageContainer}>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
            }}>📄</div>
            <div>
              <h1 className={styles.pageTitle}>Download Attendance Sheet</h1>
              <p className={styles.pageSubtitle}>
                Generates a monthly PDF and Prev badge — both scoped to the same selected month so the counts always match
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Config Card ──────────────────────────────────────────────────── */}
      <div className={styles.filterCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <span style={{ fontSize: 18 }}>⚙️</span>
          <h2 className={styles.filterTitle} style={{ margin: 0 }}>Sheet Configuration</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Class <span className={styles.required}>*</span></label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
              className={styles.filterSelect} disabled={loadingClasses}>
              <option value="">— Select Class —</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.classname}</option>)}
            </select>
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Batch <span className={styles.required}>*</span></label>
            <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}
              className={styles.filterSelect} disabled={loadingBatches || !selectedClass}>
              <option value="">— Select Batch —</option>
              {batches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
            </select>
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Month</label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
              className={styles.filterSelect}>
              {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Year</label>
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
              className={styles.filterSelect}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={handleClickDownload} disabled={generating || !selectedClass || !selectedBatch}
            className={styles.btnPrimary} style={{ minWidth: 200 }}>
            {generating ? (
              <><span className={styles.spinnerSmall}/>&nbsp;Generating…</>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download PDF
              </>
            )}
          </button>

          <button onClick={handleClickBlankDirect} disabled={generating || !selectedClass || !selectedBatch}
            className={styles.btnSecondary} style={{ minWidth: 200, borderColor: "#6366f1", color: "#6366f1" }}>
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
              </svg>
              Download Blank Sheet
            </>
          </button>

          <button onClick={handleReset} disabled={generating} className={styles.btnSecondary}>↺ Reset</button>
        </div>
      </div>

      {/* ── Info card ────────────────────────────────────────────────────── */}
      <div className={styles.tableCard} style={{ padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 18 }}>ℹ️</span>
          <h2 className={styles.tableTitle}>How It Works</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {[
            { icon: "📊", title: "Monthly Session Data", color: "#6366f1", bg: "#eef2ff",
              desc: "Shows sessions for the selected month with color-coded P/A/L/LV marks — same scope as the Prev badge on the submit page." },
            { icon: "📝", title: "Blank Sheet Fallback", color: "#059669", bg: "#d1fae5",
              desc: "If no sessions have been recorded yet, you'll be asked how many blank day-columns to include — perfect for pre-printing sheets." },
            { icon: "🖨️", title: "Multi-Page Layout", color: "#d97706", bg: "#fef3c7",
              desc: "Sessions split automatically (~29 per page) so nothing is ever cut off. Landscape A4, color-coded, fully print-ready." },
          ].map(c => (
            <div key={c.title} style={{ display: "flex", gap: 14, padding: "18px 20px",
              borderRadius: 14, background: c.bg, border: `1px solid ${c.color}22` }}>
              <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 12, background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, boxShadow: `0 2px 8px ${c.color}22` }}>{c.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: c.color, marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.55 }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend preview */}
        <div style={{ marginTop: 20, padding: "14px 20px", borderRadius: 12,
          background: "#f8fafc", border: "1px dashed #cbd5e1",
          display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#374151" }}>PDF Legend:</span>
          {[
            { code: "P",  label: "Present", bg: "#dcfce7", color: "#166534" },
            { code: "A",  label: "Absent",  bg: "#fee2e2", color: "#991b1b" },
            { code: "L",  label: "Late",    bg: "#fef3c7", color: "#92400e" },
            { code: "LV", label: "Leave",   bg: "#ede9fe", color: "#6d28d9" },
          ].map(l => (
            <div key={l.code} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 24, height: 20, borderRadius: 4, background: l.bg,
                border: `1px solid ${l.color}44`, fontWeight: 800, fontSize: 11, color: l.color }}>
                {l.code}
              </span>
              <span style={{ fontSize: 13, color: "#6b7280" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Blank-days modal ─────────────────────────────────────────────── */}
      {showBlankModal && (
        <div className={styles.modalOverlay} onClick={() => setShowBlankModal(false)}>
          <div className={styles.modal} style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ fontSize: 17 }}>
                {isManualBlank ? "Download Blank Sheet" : "No Sessions Recorded"}
              </h3>
              <button className={styles.modalClose} onClick={() => setShowBlankModal(false)}>×</button>
            </div>

            <div className={styles.modalBody} style={{ padding: "22px 28px" }}>
              {!isManualBlank && (
                <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 6px" }}>
                  No attendance sessions found for{" "}
                  <strong style={{ color: "#1f2937" }}>{formatMonthLabel(selectedYear, selectedMonth)}</strong>.
                </p>
              )}
              <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 18px" }}>
                {isManualBlank
                  ? <>Enter how many blank day-columns to include in the sheet for <strong style={{ color: "#1f2937" }}>{formatMonthLabel(selectedYear, selectedMonth)}</strong>:</>
                  : "Enter how many blank day-columns to include in the sheet:"}
              </p>
              <input
                type="number" min={1} max={60} value={numBlankDays}
                onChange={e => setNumBlankDays(Number(e.target.value))}
                className={styles.filterInput}
                style={{ width: "100%", fontSize: 16, textAlign: "center" }}
                autoFocus
                onKeyDown={e => { if (e.key === "Enter") handleBlankDownload(); }}
              />
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8, textAlign: "center" }}>
                {formatMonthLabel(selectedYear, selectedMonth)} has&nbsp;
                <strong>{daysInMonth(selectedYear, selectedMonth)}</strong>&nbsp;days &nbsp;·&nbsp; Min 1 · Max 60
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setShowBlankModal(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleBlankDownload} style={{ minWidth: 130 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Blank
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
