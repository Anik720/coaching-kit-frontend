"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTeacherAttendance } from "@/hooks/useTeacherAttendance";
import { clearError, clearSuccess } from "@/api/teacherAttendanceApi/teacherAttendanceSlice";
import { toastManager } from "@/utils/toastConfig";
import teacherAttendanceApi from "@/api/teacherAttendanceApi/teacherAttendanceApi";
import styles from "./TeacherAttendance.module.css";

interface Teacher { _id: string; fullName: string; designation?: string; }
interface ClassItem { _id: string; classname: string; }
interface BatchItem { _id: string; batchName: string; sessionYear?: string; }
interface SubjectItem { _id: string; subjectName: string; }

interface AttendanceRow {
  id: number;
  classId: string;
  batchId: string;
  subjectId: string;
  status: string;
  remarks: string;
  batches: BatchItem[];
}

const STATUS_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "half_day", label: "Half Day" },
  { value: "leave", label: "Leave" },
];

let rowCounter = 1;

export default function TakeTeacherAttendancePage() {
  const router = useRouter();
  const { loading, error, success, dispatch, create, clearError: ce, clearSuccess: cs } =
    useTeacherAttendance();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [rows, setRows] = useState<AttendanceRow[]>([
    { id: rowCounter++, classId: "", batchId: "", subjectId: "", status: "present", remarks: "", batches: [] },
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Load dropdowns
  useEffect(() => {
    const loadData = async () => {
      try {
        const [tRes, cRes, sRes] = await Promise.all([
          teacherAttendanceApi.getTeachers(),
          teacherAttendanceApi.getClasses(),
          teacherAttendanceApi.getSubjects(),
        ]);
        const tData = tRes.data?.teachers || tRes.data?.data || tRes.data || [];
        const cData = cRes.data?.data || cRes.data?.classes || cRes.data || [];
        const sData = sRes.data?.data || sRes.data?.subjects || sRes.data || [];
        setTeachers(Array.isArray(tData) ? tData : []);
        setClasses(Array.isArray(cData) ? cData : []);
        setSubjects(Array.isArray(sData) ? sData : []);
      } catch {
        // silent
      }
    };
    loadData();
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

  const loadBatchesForRow = useCallback(async (rowId: number, classId: string) => {
    if (!classId) {
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, batchId: "", batches: [] } : r))
      );
      return;
    }
    try {
      const res = await teacherAttendanceApi.getBatchesByClass(classId);
      const data = res.data?.data || res.data?.batches || res.data || [];
      setRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, batches: Array.isArray(data) ? data : [], batchId: "" } : r
        )
      );
    } catch {
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, batches: [], batchId: "" } : r))
      );
    }
  }, []);

  const handleClassChange = (rowId: number, classId: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, classId } : r))
    );
    loadBatchesForRow(rowId, classId);
  };

  const handleRowChange = (
    rowId: number,
    field: keyof Omit<AttendanceRow, "id" | "batches">,
    value: string
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r))
    );
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: rowCounter++, classId: "", batchId: "", subjectId: "", status: "present", remarks: "", batches: [] },
    ]);
  };

  const removeRow = (rowId: number) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleSubmit = async () => {
    if (!selectedTeacher) { toastManager.showError("Please select a teacher"); return; }
    if (!selectedDate) { toastManager.showError("Please select a date"); return; }

    const invalidRow = rows.find((r) => !r.classId || !r.batchId || !r.subjectId);
    if (invalidRow) { toastManager.showError("Please fill all Class, Batch, and Subject fields for each row"); return; }

    setSubmitting(true);
    const tid = toastManager.showLoading("Submitting attendance...");
    try {
      await create({
        teacher: selectedTeacher,
        date: selectedDate,
        attendanceDetails: rows.map((r) => ({
          class: r.classId,
          batch: r.batchId,
          subject: r.subjectId,
          status: r.status,
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
              onChange={(e) => setSelectedTeacher(e.target.value)}
            >
              <option value="">Select Teacher</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.fullName}
                </option>
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

        {/* Rows Table */}
        <div style={{ overflowX: "auto" }}>
          <table className={styles.rowsTable}>
            <thead>
              <tr>
                <th>Class</th>
                <th>Batch</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <select
                      value={row.classId}
                      onChange={(e) => handleClassChange(row.id, e.target.value)}
                    >
                      <option value="">Select Class</option>
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>{c.classname}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={row.batchId}
                      onChange={(e) => handleRowChange(row.id, "batchId", e.target.value)}
                      disabled={!row.classId}
                    >
                      <option value="">Select Batch</option>
                      {row.batches.map((b) => (
                        <option key={b._id} value={b._id}>{b.batchName}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={row.subjectId}
                      onChange={(e) => handleRowChange(row.id, "subjectId", e.target.value)}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((s) => (
                        <option key={s._id} value={s._id}>{s.subjectName}</option>
                      ))}
                    </select>
                  </td>
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
                  <td>
                    <input
                      type="text"
                      placeholder="Remarks (optional)"
                      value={row.remarks}
                      onChange={(e) => handleRowChange(row.id, "remarks", e.target.value)}
                    />
                  </td>
                  <td className={styles.rowActionsCell}>
                    <button
                      className={styles.btnDanger}
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length === 1}
                      type="button"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className={styles.formActions}>
          <button className={styles.btnAdd} onClick={addRow} type="button">
            + Add Row
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={submitting || loading}
            type="button"
          >
            {submitting ? "Submitting..." : "Submit Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}
