"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import homeworkApi from "@/api/homeworkApi/homeworkApi";
import { toastManager } from "@/utils/toastConfig";
import styles from "../attendancePage/Attendance.module.css";

const STATUS_OPTIONS = [
  { value: "completed",     label: "Completed" },
  { value: "incomplete",    label: "Incomplete" },
  { value: "not_submitted", label: "Not Submitted" },
  { value: "absent",        label: "Absent" },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  completed:     { bg: "#dcfce7", color: "#166534" },
  incomplete:    { bg: "#fef3c7", color: "#92400e" },
  not_submitted: { bg: "#fee2e2", color: "#991b1b" },
  absent:        { bg: "#f1f5f9", color: "#64748b" },
};

interface EvalRow {
  studentId: string;
  name:      string;
  regId:     string;
  marks:     string;
  status:    string;
  note:      string;
}

interface ClassItem   { _id: string; classname: string; }
interface BatchItem   { _id: string; batchName: string; }
interface SubjectItem { _id: string; subjectName: string; }

export default function EvaluateTaskPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const taskIdParam  = searchParams.get("taskId");

  // Dropdown data
  const [classes,  setClasses]  = useState<ClassItem[]>([]);
  const [batches,  setBatches]  = useState<BatchItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  // Step 1 — class + batch (controls student loading)
  const [selClass, setSelClass] = useState("");
  const [selBatch, setSelBatch] = useState("");

  // Step 2 — subject + date (only needed at save time)
  const [selSubject, setSelSubject] = useState("");
  const [selDate,    setSelDate]    = useState("");

  // Task metadata
  const [taskId,     setTaskId]     = useState<string | null>(taskIdParam);
  const [addMarks,   setAddMarks]   = useState(false);
  const [totalMarks, setTotalMarks] = useState("");

  // Student rows
  const [rows,    setRows]    = useState<EvalRow[]>([]);
  const [loaded,  setLoaded]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);

  // ── Load dropdown data ─────────────────────────────────────────────────────
  useEffect(() => {
    homeworkApi.getClasses().then(r => {
      const d = r.data?.data || r.data?.classes || r.data || [];
      setClasses(Array.isArray(d) ? d : []);
    });
    homeworkApi.getSubjects().then(r => {
      const d = r.data?.data || r.data?.subjects || r.data || [];
      setSubjects(Array.isArray(d) ? d : []);
    });
  }, []);

  // Load batches when class changes
  useEffect(() => {
    if (!selClass) { setBatches([]); setSelBatch(""); return; }
    homeworkApi.getBatches(selClass).then(r => {
      const d = r.data?.data || r.data?.batches || r.data || [];
      setBatches(Array.isArray(d) ? d : []);
    });
  }, [selClass]);

  // ── Load students when class + batch are both selected ────────────────────
  const loadStudents = useCallback(async (classId: string, batchId: string, tId?: string) => {
    setLoading(true);
    setLoaded(false);
    setRows([]);
    try {
      const [studRes, evalRes] = await Promise.all([
        homeworkApi.getStudentsByClassBatch(classId, batchId),
        tId ? homeworkApi.getEvaluations(tId) : Promise.resolve({ data: [] }),
      ]);

      const students: any[] = studRes.data?.data || studRes.data?.students || studRes.data || [];
      const evals:    any[] = evalRes.data || [];

      const evalMap: Record<string, { marks: number | null; status: string; note: string }> = {};
      evals.forEach((e: any) => {
        const sid = e.student?._id || e.student;
        if (sid) evalMap[sid] = { marks: e.marks, status: e.status, note: e.note || "" };
      });

      setRows(students.map((s: any) => {
        const ev = evalMap[s._id] || {};
        return {
          studentId: s._id,
          name:      s.nameEnglish    || "—",
          regId:     s.registrationId || "—",
          marks:     ev.marks != null ? String(ev.marks) : "",
          status:    ev.status || "completed",
          note:      ev.note   || "",
        };
      }));
      setLoaded(true);
    } catch {
      toastManager.showError("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load when class + batch are selected (manual selection path)
  useEffect(() => {
    if (taskIdParam) return; // taskId path handles its own loading
    if (!selClass || !selBatch) return;
    setTaskId(null);
    loadStudents(selClass, selBatch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selClass, selBatch]);

  // ── Pre-fill when editing an existing task from class-task-list ───────────
  useEffect(() => {
    if (!taskIdParam) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await homeworkApi.getClassTaskById(taskIdParam);
        const t   = res.data;

        const classId   = t.class?._id   || t.class   || "";
        const batchId   = t.batch?._id   || t.batch   || "";
        const subjectId = t.subject?._id || t.subject || "";
        const date      = t.taskDate ? t.taskDate.split("T")[0] : "";

        const batchRes  = await homeworkApi.getBatches(classId);
        const batchList = batchRes.data?.data || batchRes.data?.batches || batchRes.data || [];

        setTaskId(t._id);
        setTotalMarks(String(t.totalMarks ?? ""));
        setBatches(Array.isArray(batchList) ? batchList : []);
        setSelClass(classId);
        setSelBatch(batchId);
        setSelSubject(subjectId);
        setSelDate(date);

        await loadStudents(classId, batchId, t._id);
      } catch {
        toastManager.showError("Failed to load task");
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskIdParam]);

  // ── Row update helper ──────────────────────────────────────────────────────
  const updateRow = (idx: number, field: keyof EvalRow, val: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };

  // ── Save: create task if needed, then save evaluations ────────────────────
  const handleSave = async () => {
    if (!selSubject) { toastManager.showError("Please select a subject before saving"); return; }
    if (!selDate)    { toastManager.showError("Please select a date before saving");    return; }
    if (rows.length === 0) { toastManager.showError("No students to save"); return; }

    for (const row of rows) {
      if (addMarks && row.marks !== "" && isNaN(Number(row.marks))) {
        toastManager.showError(`Invalid marks for ${row.name}`); return;
      }
      if (addMarks && totalMarks && row.marks !== "" && Number(row.marks) > Number(totalMarks)) {
        toastManager.showError(`${row.name}'s marks exceed total marks (${totalMarks})`); return;
      }
    }

    setSaving(true);
    try {
      let activeTaskId = taskId;

      if (!activeTaskId) {
        // Check if a task already exists for these filters
        try {
          const found = await homeworkApi.findClassTaskByFilters(selClass, selBatch, selSubject, selDate);
          if (found.data?._id) {
            activeTaskId = found.data._id;
            setTaskId(activeTaskId);
          }
        } catch { /* no existing task — will create below */ }
      }

      if (!activeTaskId) {
        // Auto-create: name = "{Subject} - {date}"
        const subjectLabel = subjects.find(s => s._id === selSubject)?.subjectName || "Task";
        const created = await homeworkApi.createClassTask({
          name:       `${subjectLabel} - ${selDate}`,
          class:      selClass,
          batch:      selBatch,
          subject:    selSubject,
          taskDate:   selDate,
          totalMarks: addMarks && totalMarks ? Number(totalMarks) : 0,
        });
        activeTaskId = created.data._id;
        setTaskId(activeTaskId);
      } else if (addMarks && totalMarks) {
        await homeworkApi.updateClassTask(activeTaskId, { totalMarks: Number(totalMarks) });
      }

      const evaluations = rows.map(r => ({
        studentId: r.studentId,
        marks:     addMarks && r.marks !== "" ? Number(r.marks) : null,
        status:    r.status,
        note:      r.note,
      }));

      await homeworkApi.saveEvaluations(activeTaskId!, evaluations);
      toastManager.showSuccess(`✓ Saved ${rows.length} evaluations successfully`);
    } catch (err: any) {
      toastManager.showError(err?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.pageContainer}>

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "linear-gradient(135deg, #059669 0%, #0ea5e9 100%)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                boxShadow: "0 4px 12px rgba(5,150,105,0.3)",
              }}>✏️</div>
              <div>
                <h1 className={styles.pageTitle}>Create Class Task</h1>
                <p className={styles.pageSubtitle}>
                  Select class &amp; batch → students load → fill marks → choose subject &amp; date → save
                </p>
              </div>
            </div>
            <button className={styles.btnSecondary} onClick={() => router.push("/dashboard/homework/class-task-list")}>
              Go Task List
            </button>
          </div>
        </div>
      </div>

      {/* ── Step 1: Class + Batch (triggers student load) ── */}
      <div className={styles.filterCard}>
        <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1 }}>
          Step 1 — Select Class &amp; Batch to load students
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "end" }}>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Class <span className={styles.required}>*</span></label>
            <select
              className={styles.filterSelect}
              value={selClass}
              onChange={e => {
                setSelClass(e.target.value);
                setSelBatch("");
                setTaskId(null);
                setRows([]);
                setLoaded(false);
              }}
              disabled={loading || !!taskIdParam}
            >
              <option value="">— Select Class —</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.classname}</option>)}
            </select>
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Batch <span className={styles.required}>*</span></label>
            <select
              className={styles.filterSelect}
              value={selBatch}
              onChange={e => {
                setSelBatch(e.target.value);
                setTaskId(null);
                setRows([]);
                setLoaded(false);
              }}
              disabled={!selClass || loading || !!taskIdParam}
            >
              <option value="">— Select Batch —</option>
              {batches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Loading spinner ── */}
      {loading && (
        <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
          <span className={styles.spinnerSmall} /> &nbsp; Loading students…
        </div>
      )}

      {/* ── Student table ── */}
      {loaded && !loading && (
        <div className={styles.tableCard}>
          {rows.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af", fontSize: 15 }}>
              No students found for this class and batch.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th} style={{ width: 48 }}>#</th>
                    <th className={styles.th}>Student Name</th>
                    <th className={styles.th} style={{ width: 120 }}>ID</th>
                    <th className={styles.th} style={{ width: 130 }}>Marks</th>
                    <th className={styles.th} style={{ width: 175 }}>Status</th>
                    <th className={styles.th}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.studentId} className={styles.tr}>
                      <td className={styles.td} style={{ textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                        {idx + 1}
                      </td>
                      <td className={styles.td} style={{ fontWeight: 600, color: "#374151" }}>
                        {row.name}
                      </td>
                      <td className={styles.td} style={{ fontSize: 13, color: "#64748b" }}>
                        {row.regId}
                      </td>
                      <td className={styles.td}>
                        <input
                          type="number" min={0}
                          max={addMarks && totalMarks ? Number(totalMarks) : undefined}
                          className={styles.filterInput}
                          style={{ width: "100%", textAlign: "center" }}
                          value={row.marks}
                          onChange={e => updateRow(idx, "marks", e.target.value)}
                          placeholder="—"
                        />
                      </td>
                      <td className={styles.td}>
                        <select
                          className={styles.filterSelect}
                          value={row.status}
                          onChange={e => updateRow(idx, "status", e.target.value)}
                          style={{
                            background: STATUS_COLORS[row.status]?.bg    || "#f8fafc",
                            color:      STATUS_COLORS[row.status]?.color || "#374151",
                            fontWeight: 600,
                          }}
                        >
                          {STATUS_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className={styles.td}>
                        <input
                          type="text"
                          className={styles.filterInput}
                          style={{ width: "100%" }}
                          value={row.note}
                          onChange={e => updateRow(idx, "note", e.target.value)}
                          placeholder="Teacher Note"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Subject + Date + Save (only after students load) ── */}
      {loaded && rows.length > 0 && (
        <div style={{
          background: "#fff", borderRadius: 12, padding: "20px 24px",
          border: "1px solid #e2e8f0", marginTop: "0.5rem",
        }}>
          <div style={{ marginBottom: 14, fontSize: 12, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1 }}>
            Step 2 — Choose Subject &amp; Date, then Save
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>

            <div className={styles.filterField} style={{ minWidth: 200, flex: 1 }}>
              <label className={styles.filterLabel}>Subject <span className={styles.required}>*</span></label>
              <select
                className={styles.filterSelect}
                value={selSubject}
                onChange={e => { setSelSubject(e.target.value); setTaskId(null); }}
                disabled={saving}
              >
                <option value="">— Select Subject —</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.subjectName}</option>)}
              </select>
            </div>

            <div className={styles.filterField} style={{ minWidth: 160 }}>
              <label className={styles.filterLabel}>Date <span className={styles.required}>*</span></label>
              <input
                type="date"
                className={styles.filterInput}
                value={selDate}
                onChange={e => { setSelDate(e.target.value); setTaskId(null); }}
                disabled={saving}
              />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "#374151", fontWeight: 600, paddingBottom: 2 }}>
              <input
                type="checkbox"
                checked={addMarks}
                onChange={e => setAddMarks(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              Add Marks?
            </label>

            {addMarks && (
              <div className={styles.filterField} style={{ minWidth: 130 }}>
                <label className={styles.filterLabel}>Total Marks</label>
                <input
                  type="number" min={0}
                  className={styles.filterInput}
                  value={totalMarks}
                  onChange={e => setTotalMarks(e.target.value)}
                  placeholder="e.g. 100"
                  disabled={saving}
                />
              </div>
            )}

            <button
              className={styles.btnPrimary}
              style={{ minWidth: 140, background: "linear-gradient(135deg,#059669,#047857)", paddingBottom: 2 }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <><span className={styles.spinnerSmall} />&nbsp;Saving…</> : "Save Tasks"}
            </button>
          </div>
        </div>
      )}

      {/* ── Empty state prompt ── */}
      {!loaded && !loading && (
        <div style={{
          background: "#fff", borderRadius: 12, padding: "3rem",
          border: "1px solid #e2e8f0", textAlign: "center", color: "#9ca3af", fontSize: 15,
        }}>
          Select a class and batch above to load students
        </div>
      )}
    </div>
  );
}
