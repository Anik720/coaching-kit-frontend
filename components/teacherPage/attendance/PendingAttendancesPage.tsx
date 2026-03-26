"use client";

import { useEffect, useState } from "react";
import { useTeacherAttendance } from "@/hooks/useTeacherAttendance";
import { clearError, clearSuccess } from "@/api/teacherAttendanceApi/teacherAttendanceSlice";
import { toastManager } from "@/utils/toastConfig";
import styles from "./TeacherAttendance.module.css";

const formatDate = (d: string | Date) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return String(d); }
};

const formatTime = (d: string | Date) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch { return "—"; }
};

export default function PendingAttendancesPage() {
  const { pendingRecords, loading, error, success, dispatch, fetchPending, approve } =
    useTeacherAttendance();

  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  useEffect(() => {
    if (success) {
      toastManager.showSuccess("Done!");
      dispatch(clearSuccess());
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearError());
    }
  }, [success, error]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    const tid = toastManager.showLoading("Approving...");
    try {
      await approve(id, "approved");
      toastManager.safeUpdateToast(tid, "Approved!", "success");
    } catch {
      toastManager.safeUpdateToast(tid, "Failed to approve", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    const tid = toastManager.showLoading("Rejecting...");
    try {
      await approve(id, "rejected");
      toastManager.safeUpdateToast(tid, "Rejected!", "success");
    } catch {
      toastManager.safeUpdateToast(tid, "Failed to reject", "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pendingCard}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1f2937", margin: "0 0 4px 0" }}>
          Pending Teacher Attendance Approvals
        </h1>
        <p className={styles.pendingSubtitle}>
          Review and approve class sessions submitted by teachers
        </p>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}>
            ⏳
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Pending</p>
            <p className={styles.statValue}>{pendingRecords.length}</p>
            <span className={styles.statSubtext}>Awaiting review</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.loadingWrapper}><div className={styles.spinner} /></div>
          ) : pendingRecords.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>✅</span>
              <p className={styles.emptyText}>No pending approvals. All caught up!</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>TEACHER</th>
                  <th>BATCH / SUBJECT</th>
                  <th>SUBMITTED BY</th>
                  <th>CLASSES</th>
                  <th>REMARKS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {pendingRecords.map((record) => {
                  const batchSubjects = record.attendanceDetails
                    ?.map((d: any) => `${d.batch?.batchName || "—"} / ${d.subject?.subjectName || "—"}`)
                    .join("; ") || "—";

                  return (
                    <tr key={record._id}>
                      <td style={{ whiteSpace: "nowrap" }}>{formatDate(record.date)}</td>
                      <td>
                        <div>
                          <strong>{record.teacher?.fullName || "—"}</strong>
                          {record.teacher?.designation && (
                            <div style={{ fontSize: 12, color: "#9ca3af" }}>{record.teacher.designation}</div>
                          )}
                        </div>
                      </td>
                      <td style={{ maxWidth: 200, fontSize: 13 }}>
                        {record.attendanceDetails?.length > 0
                          ? record.attendanceDetails.map((d: any, i: number) => (
                              <div key={i}>{d.batch?.batchName || "—"} / {d.subject?.subjectName || "—"}</div>
                            ))
                          : "—"}
                      </td>
                      <td>{record.createdBy?.username || record.submittedBy || "—"}</td>
                      <td>
                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: "#059669" }}>✓ {record.attendedClasses}</span>
                          {" / "}
                          <span style={{ color: "#6b7280" }}>{record.totalClasses}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: "#6b7280" }}>
                        {record.approvalRemarks || "—"}
                      </td>
                      <td>
                        <div className={styles.actionGroup}>
                          <button
                            className={styles.actionBtnApprove}
                            onClick={() => handleApprove(record._id)}
                            disabled={processingId === record._id}
                            type="button"
                          >
                            {processingId === record._id ? "..." : "Approve"}
                          </button>
                          <button
                            className={styles.actionBtnReject}
                            onClick={() => handleReject(record._id)}
                            disabled={processingId === record._id}
                            type="button"
                          >
                            {processingId === record._id ? "..." : "Reject"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
