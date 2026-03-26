"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTeacherAttendance } from "@/hooks/useTeacherAttendance";
import { clearError, clearSuccess } from "@/api/teacherAttendanceApi/teacherAttendanceSlice";
import { toastManager } from "@/utils/toastConfig";
import teacherAttendanceApi from "@/api/teacherAttendanceApi/teacherAttendanceApi";
import styles from "./TeacherAttendance.module.css";
import ConfirmationModal from "@/components/common/ConfirmationModal";

interface ClassItem { _id: string; classname: string; }
interface BatchItem { _id: string; batchName: string; }
interface SubjectItem { _id: string; subjectName: string; }

interface EditRowState {
  detailId: string;
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

const formatDate = (d: string | Date) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return String(d); }
};

function getStatusBadgeClass(status: string, css: any) {
  switch (status?.toLowerCase()) {
    case "present": return css.badgePresent;
    case "absent": return css.badgeAbsent;
    case "late": return css.badgeLate;
    case "half_day": return css.badgeHalfDay;
    case "leave": return css.badgeLeave;
    case "holiday": return css.badgeHoliday;
    default: return css.badgePending;
  }
}

function getApprovalBadgeClass(status: string, css: any) {
  switch (status) {
    case "approved": return css.badgeApproved;
    case "rejected": return css.badgeRejected;
    case "pending": return css.badgePending;
    default: return css.badgeSubmitted;
  }
}

export default function AttendanceDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const teacherId = searchParams.get("teacherId") || "";
  const dateStr = searchParams.get("date") || "";
  const recordId = searchParams.get("recordId") || "";

  const { currentRecord, loading, error, success, dispatch, fetchByTeacherDate, fetchById, update, remove } =
    useTeacherAttendance();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [editRow, setEditRow] = useState<EditRowState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load record
  useEffect(() => {
    if (recordId) {
      fetchById(recordId);
    } else if (teacherId && dateStr) {
      fetchByTeacherDate(teacherId, dateStr);
    }
  }, [teacherId, dateStr, recordId]);

  // Load dropdowns
  useEffect(() => {
    Promise.all([
      teacherAttendanceApi.getClasses(),
      teacherAttendanceApi.getSubjects(),
    ]).then(([cRes, sRes]) => {
      const cData = cRes.data?.data || cRes.data?.classes || cRes.data || [];
      const sData = sRes.data?.data || sRes.data?.subjects || sRes.data || [];
      setClasses(Array.isArray(cData) ? cData : []);
      setSubjects(Array.isArray(sData) ? sData : []);
    }).catch(() => {});
  }, []);

  // Toast
  useEffect(() => {
    if (success) {
      toastManager.showSuccess("Updated successfully!");
      dispatch(clearSuccess());
      setEditRow(null);
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearError());
    }
  }, [success, error]);

  const openEditRow = async (detail: any) => {
    const row: EditRowState = {
      detailId: detail._id || "",
      classId: detail.class?._id || "",
      batchId: detail.batch?._id || "",
      subjectId: detail.subject?._id || "",
      status: detail.status || "present",
      remarks: detail.remarks || "",
      batches: [],
    };
    // Load batches for the selected class
    if (row.classId) {
      try {
        const res = await teacherAttendanceApi.getBatchesByClass(row.classId);
        const data = res.data?.data || res.data?.batches || res.data || [];
        row.batches = Array.isArray(data) ? data : [];
      } catch {}
    }
    setEditRow(row);
  };

  const handleEditClassChange = async (classId: string) => {
    if (!editRow) return;
    let batches: BatchItem[] = [];
    if (classId) {
      try {
        const res = await teacherAttendanceApi.getBatchesByClass(classId);
        const data = res.data?.data || res.data?.batches || res.data || [];
        batches = Array.isArray(data) ? data : [];
      } catch {}
    }
    setEditRow({ ...editRow, classId, batchId: "", batches });
  };

  const handleSaveEdit = async () => {
    if (!editRow || !currentRecord) return;
    if (!editRow.classId || !editRow.batchId || !editRow.subjectId) {
      toastManager.showError("Class, Batch, and Subject are required");
      return;
    }
    setSaving(true);
    try {
      const updatedDetails = currentRecord.attendanceDetails.map((d: any) => {
        const dId = d._id || "";
        if (dId === editRow.detailId) {
          return {
            class: editRow.classId,
            batch: editRow.batchId,
            subject: editRow.subjectId,
            status: editRow.status,
            remarks: editRow.remarks || undefined,
          };
        }
        return {
          class: d.class?._id || d.class,
          batch: d.batch?._id || d.batch,
          subject: d.subject?._id || d.subject,
          status: d.status,
          remarks: d.remarks || undefined,
        };
      });
      await update(currentRecord._id, { attendanceDetails: updatedDetails });
    } catch {
      toastManager.showError("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const tid = toastManager.showLoading("Deleting...");
    try {
      await remove(deleteTarget);
      toastManager.safeUpdateToast(tid, "Deleted!", "success");
      router.push("/dashboard/teachers/attendance-list");
    } catch {
      toastManager.safeUpdateToast(tid, "Failed to delete", "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading && !currentRecord) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingWrapper}><div className={styles.spinner} /></div>
      </div>
    );
  }

  const teacherName = currentRecord?.teacher?.fullName || "Teacher";
  const recordDate = currentRecord?.date ? formatDate(currentRecord.date) : formatDate(dateStr);

  return (
    <div className={styles.pageContainer}>
      {/* Back */}
      <a
        className={styles.backLink}
        onClick={(e) => { e.preventDefault(); router.push("/dashboard/teachers/attendance-list"); }}
        href="#"
      >
        ← Back to Attendance List
      </a>

      {/* Header */}
      <div className={styles.detailHeader}>
        <h1 className={styles.detailTitle}>
          📋 Attendance Detail – {teacherName} on {recordDate}
        </h1>
        {currentRecord && (
          <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              Total: <strong>{currentRecord.totalClasses}</strong>
            </span>
            <span style={{ fontSize: 13, color: "#059669" }}>
              Attended: <strong>{currentRecord.attendedClasses}</strong>
            </span>
            <span style={{ fontSize: 13, color: "#dc2626" }}>
              Absent: <strong>{currentRecord.absentClasses}</strong>
            </span>
            <span className={`${styles.badge} ${getApprovalBadgeClass(currentRecord.approvalStatus, styles)}`}>
              {currentRecord.approvalStatus}
            </span>
          </div>
        )}
      </div>

      {/* Detail Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          {!currentRecord ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📋</span>
              <p className={styles.emptyText}>No attendance detail found for the selected teacher and date</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>🔖 Subject</th>
                  <th>🏫 Batch</th>
                  <th>Class Start Time</th>
                  <th>Class End Time</th>
                  <th>📝 Remarks</th>
                  <th>✅ Status</th>
                  <th>Approving Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentRecord.attendanceDetails?.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", color: "#9ca3af", padding: "32px" }}>
                      No details available
                    </td>
                  </tr>
                ) : (
                  currentRecord.attendanceDetails.map((detail: any, idx: number) => (
                    <tr key={detail._id || idx}>
                      <td><strong>{detail.subject?.subjectName || "—"}</strong></td>
                      <td>{detail.batch?.batchName || "—"}</td>
                      <td>—</td>
                      <td>—</td>
                      <td>{detail.remarks || "—"}</td>
                      <td>
                        <span className={`${styles.badge} ${getStatusBadgeClass(detail.status, styles)}`}>
                          {detail.status || "—"}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${getApprovalBadgeClass(currentRecord.approvalStatus, styles)}`}>
                          {currentRecord.approvalStatus || "pending"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionGroup}>
                          <button
                            className={styles.actionBtnEdit}
                            onClick={() => openEditRow(detail)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className={styles.actionBtnDelete}
                            onClick={() => setDeleteTarget(currentRecord._id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editRow && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Attendance Detail</h3>
              <button className={styles.modalClose} onClick={() => setEditRow(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Class</label>
                <select
                  className={styles.formSelect}
                  value={editRow.classId}
                  onChange={(e) => handleEditClassChange(e.target.value)}
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>{c.classname}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Batch</label>
                <select
                  className={styles.formSelect}
                  value={editRow.batchId}
                  onChange={(e) => setEditRow({ ...editRow, batchId: e.target.value })}
                  disabled={!editRow.classId}
                >
                  <option value="">Select Batch</option>
                  {editRow.batches.map((b) => (
                    <option key={b._id} value={b._id}>{b.batchName}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Subject</label>
                <select
                  className={styles.formSelect}
                  value={editRow.subjectId}
                  onChange={(e) => setEditRow({ ...editRow, subjectId: e.target.value })}
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>{s.subjectName}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Status</label>
                <select
                  className={styles.formSelect}
                  value={editRow.status}
                  onChange={(e) => setEditRow({ ...editRow, status: e.target.value })}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Remarks</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={editRow.remarks}
                  onChange={(e) => setEditRow({ ...editRow, remarks: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setEditRow(null)} type="button">
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleSaveEdit}
                disabled={saving}
                type="button"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmationModal
          isOpen={true}
          title="Delete Attendance Record"
          message="Are you sure you want to delete this attendance record? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isConfirming={deleting}
          isDanger={true}
        />
      )}
    </div>
  );
}
