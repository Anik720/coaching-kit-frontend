"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { useTeacherAttendance } from "@/hooks/useTeacherAttendance";
import { fetchAssignments } from "@/api/teacherApi/teacherSlice";
import { toastManager } from "@/utils/toastConfig";
import teacherAttendanceApi from "@/api/teacherAttendanceApi/teacherAttendanceApi";
import styles from "./TeacherAttendance.module.css";

interface Teacher { _id: string; fullName: string; designation?: string; }
interface BatchItem { _id: string; batchName: string; sessionYear?: string; }

interface AttendanceRow {
  id: number;
  classId: string;
  batchId: string;
  subjectId: string;
  status: string;
  remarks: string;
  batches: BatchItem[];
  className: string;
  batchName: string;
  subjectName: string;
  /** True when this row was pre-filled from a teacher assignment (batch list may be expanded by class). */
  fromAssignment?: boolean;
}

const STATUS_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent",  label: "Absent"  },
  { value: "late",    label: "Late"    },
  { value: "half_day",label: "Half Day"},
  { value: "leave",   label: "Leave"   },
];

let rowCounter = 1;

const emptyRow = (): AttendanceRow => ({
  id: rowCounter++,
  classId: "", batchId: "", subjectId: "",
  status: "present", remarks: "",
  batches: [],
  className: "", batchName: "", subjectName: "",
  fromAssignment: false,
});

export default function TakeTeacherAttendancePage() {
  const router  = useRouter();
  const reduxDispatch = useDispatch<AppDispatch>();
  const { loading, error, success, dispatch, create,
          clearError: ce, clearSuccess: cs } = useTeacherAttendance();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedDate,    setSelectedDate]    = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [rows, setRows]           = useState<AttendanceRow[]>([emptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Load teachers
  useEffect(() => {
    const load = async () => {
      try {
        const tRes = await teacherAttendanceApi.getTeachers();
        const tData = tRes.data?.teachers ?? tRes.data?.data ?? tRes.data ?? [];
        setTeachers(Array.isArray(tData) ? tData : []);
      } catch { /* silent */ }
    };
    load();
  }, []);

  // Toast
  useEffect(() => {
    if (success) {
      toastManager.showSuccess("Attendance submitted successfully!");
      dispatch(cs());
      router.push("/dashboard/teachers/attendance-list");
    }
    if (error) {
      toastManager.showError(error);
      dispatch(ce());
    }
  }, [success, error]);

  // When teacher changes → fetch their assignments and auto-populate rows
  const handleTeacherChange = async (teacherId: string) => {
    setSelectedTeacher(teacherId);

    if (!teacherId) {
      setRows([emptyRow()]);
      return;
    }

    setLoadingAssignments(true);
    try {
      const result = await reduxDispatch(
        fetchAssignments({ teacher: teacherId, limit: 1000 } as any)
      ).unwrap();

      const assignments = (result as any).assignments ?? [];

      if (!assignments.length) {
        toastManager.showError("No assignments found for this teacher");
        setRows([emptyRow()]);
        return;
      }

      // Build one pre-filled row per assignment
      const newRows: AttendanceRow[] = assignments.map((a: any) => ({
        id: rowCounter++,
        classId:   a.class?._id   ?? "",
        batchId:   a.batch?._id   ?? "",
        subjectId: a.subject?._id ?? "",
        status:    "present",
        remarks:   "",
        batches:   a.batch
          ? [{ _id: a.batch._id, batchName: a.batch.batchName, sessionYear: a.batch.sessionYear }]
          : [],
        className:   a.class?.classname     ?? "—",
        batchName:   a.batch?.batchName     ?? "—",
        subjectName: a.subject?.subjectName ?? "—",
        fromAssignment: true,
      }));

      setRows(newRows);

      // Expand batch lists for each unique class (so the manual-row "Batch" dropdown works)
      const uniqueClassIds = [
        ...new Set(assignments.map((a: any) => a.class?._id).filter(Boolean)),
      ] as string[];

      await Promise.all(
        uniqueClassIds.map(async (classId) => {
          try {
            const res  = await teacherAttendanceApi.getBatchesByClass(classId);
            const data = res.data?.data ?? res.data?.batches ?? res.data ?? [];
            const list = Array.isArray(data) ? data : [];
            setRows((prev) =>
              prev.map((r) =>
                r.classId === classId && r.fromAssignment ? { ...r, batches: list } : r
              )
            );
          } catch { /* silent */ }
        })
      );
    } catch {
      toastManager.showError("Failed to load teacher assignments");
      setRows([emptyRow()]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleRowChange = (
    rowId: number,
    field: keyof Omit<AttendanceRow, "id" | "batches" | "fromAssignment">,
    value: string
  ) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)));
  };

  const handleSubmit = async () => {
    if (!selectedTeacher) { toastManager.showError("Please select a teacher"); return; }
    if (!selectedDate)    { toastManager.showError("Please select a date");    return; }

    const invalid = rows.find((r) => !r.classId || !r.batchId || !r.subjectId);
    if (invalid) {
      toastManager.showError("Please fill all Class, Batch, and Subject fields for each row");
      return;
    }

    setSubmitting(true);
    const tid = toastManager.showLoading("Submitting attendance...");
    try {
      await create({
        teacher: selectedTeacher,
        date:    selectedDate,
        attendanceDetails: rows.map((r) => ({
          class:   r.classId,
          batch:   r.batchId,
          subject: r.subjectId,
          status:  r.status,
          remarks: r.remarks || undefined,
        })),
      });
      toastManager.safeUpdateToast(tid, "Submitted!", "success");
    } catch {
      toastManager.safeUpdateToast(tid, "Submission failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loadingAssignments || submitting || loading;

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Submit Teacher Attendance</h1>
          <p>Record teacher class sessions for the selected date</p>
        </div>
      </div>

      {/* Form */}
      <div className={styles.formCard}>
        {/* Teacher & Date */}
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>👨‍🏫 Teacher</label>
            <select
              className={styles.formSelect}
              value={selectedTeacher}
              onChange={(e) => handleTeacherChange(e.target.value)}
              disabled={isLoading}
            >
              <option value="">Select Teacher</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.fullName}</option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>📅 Date</label>
            <input
              type="date"
              className={styles.formInput}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {/* Loading overlay */}
        {loadingAssignments && (
          <div className={styles.assignmentLoading}>
            <span className={styles.loadingSpinner} />
            Loading assignments for selected teacher…
          </div>
        )}

        {/* Rows Table */}
        {!loadingAssignments && (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className={styles.rowsTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Class</th>
                    <th>Batch</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.id} className={styles.assignedRow}>
                      <td className={styles.rowIndex}>{idx + 1}</td>

                      {/* Class */}
                      <td>
                        <span className={styles.lockedCell}>{row.className}</span>
                      </td>

                      {/* Batch */}
                      <td>
                        <span className={styles.lockedCell}>{row.batchName}</span>
                      </td>

                      {/* Subject */}
                      <td>
                        <span className={styles.lockedCell}>{row.subjectName}</span>
                      </td>

                      {/* Status */}
                      <td>
                        <select
                          value={row.status}
                          onChange={(e) => handleRowChange(row.id, "status", e.target.value)}
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* Remarks */}
                      <td>
                        <input
                          type="text"
                          placeholder="Remarks (optional)"
                          value={row.remarks}
                          onChange={(e) => handleRowChange(row.id, "remarks", e.target.value)}
                        />
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Assignment count hint */}
            {rows.length > 0 && (
              <p className={styles.assignmentHint}>
                ✅ {rows.length} row(s) auto-filled from teacher assignments.
              </p>
            )}

            {/* Actions */}
            <div className={styles.formActions}>
              <button
                className={styles.btnPrimary}
                onClick={handleSubmit}
                disabled={isLoading}
                type="button"
              >
                {submitting ? "Submitting…" : "Submit Attendance"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
