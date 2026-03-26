"use client";

import { useState, useEffect } from "react";
import { useTeacherAttendance } from "@/hooks/useTeacherAttendance";
import { clearError } from "@/api/teacherAttendanceApi/teacherAttendanceSlice";
import { toastManager } from "@/utils/toastConfig";
import teacherAttendanceApi from "@/api/teacherAttendanceApi/teacherAttendanceApi";
import styles from "./TeacherAttendance.module.css";

interface Teacher { _id: string; fullName: string; }

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

const formatDate = (d: string | Date) => {
  if (!d) return "—";
  try {
    return new Date(d).toISOString().split("T")[0];
  } catch { return String(d); }
};

function getStatusBadgeClass(status: string, css: any) {
  switch (status?.toLowerCase()) {
    case "present": return css.badgePresent;
    case "absent": return css.badgeAbsent;
    case "late": return css.badgeLate;
    case "half_day": return css.badgeHalfDay;
    default: return css.badgePending;
  }
}

export default function MonthlyReportPage() {
  const { monthlyReport, loading, error, dispatch, fetchMonthlyReport: fetchReport, clearError: ce } =
    useTeacherAttendance();

  const now = new Date();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  useEffect(() => {
    teacherAttendanceApi
      .getTeachers()
      .then((res) => {
        const data = res.data?.teachers || res.data?.data || res.data || [];
        setTeachers(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (error) { toastManager.showError(error); dispatch(ce()); }
  }, [error]);

  const handleFilter = () => {
    if (!selectedTeacher) { toastManager.showError("Please select a teacher"); return; }
    fetchReport(selectedTeacher, selectedMonth, selectedYear);
  };

  const report = monthlyReport;
  const teacher = report?.teacher;
  const summary = report?.summary;
  const dailySummary: any[] = report?.dailySummary || [];

  return (
    <div className={styles.pageContainer}>
      {/* Report Filter */}
      <div className={styles.reportHeader}>
        <h1 className={styles.reportTitle}>Teacher Monthly Attendance Report</h1>
        <div className={styles.reportFilterRow}>
          <div className={styles.formField} style={{ minWidth: 200 }}>
            <select
              className={styles.formSelect}
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
            >
              <option value="">Select Teacher</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.fullName}</option>
              ))}
            </select>
          </div>
          <div className={styles.formField} style={{ minWidth: 140 }}>
            <select
              className={styles.formSelect}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className={styles.formField} style={{ minWidth: 110 }}>
            <select
              className={styles.formSelect}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            className={styles.btnPrimary}
            onClick={handleFilter}
            disabled={loading}
            type="button"
            style={{ alignSelf: "flex-end", padding: "11px 22px" }}
          >
            {loading ? "Loading..." : "Filter"}
          </button>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingWrapper}><div className={styles.spinner} /></div>
      )}

      {report && !loading && (
        <>
          {/* Report Title */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1f2937" }}>
              Attendance Report for{" "}
              <span className={styles.reportSubtitleHighlight}>{teacher?.fullName}</span>
              {" – "}
              <span className={styles.reportSubtitleHighlight}>
                {selectedYear} {MONTHS[selectedMonth - 1]}
              </span>
            </h2>
          </div>

          {/* Teacher Card */}
          <div className={styles.reportTeacherCard}>
            <p className={styles.reportTeacherName}>{teacher?.fullName}</p>
            <p className={styles.reportTeacherRole}>{teacher?.designation || "teacher"}</p>
          </div>

          {/* Summary Stats */}
          <div className={styles.statsGrid} style={{ marginBottom: 24 }}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}>📚</div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Total Classes</p>
                <p className={styles.statValue}>{summary?.totalClasses ?? 0}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>✅</div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Attended</p>
                <p className={styles.statValue}>{summary?.attendedClasses ?? 0}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}>❌</div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Absent</p>
                <p className={styles.statValue}>{summary?.absentClasses ?? 0}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" }}>📊</div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Attendance Rate</p>
                <p className={styles.statValue}>{(summary?.attendanceRate ?? 0).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Daily Table */}
          <div className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              {dailySummary.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>📋</span>
                  <p className={styles.emptyText}>
                    No approved attendance records found for this month
                  </p>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total Classes</th>
                      <th>Attended Classes</th>
                      <th>Missed Classes</th>
                      <th>Class Names</th>
                      <th>Subject Names</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySummary.map((day: any, idx: number) => {
                      const details: any[] = day.details || [];
                      const classNames = [...new Set(details.map((d: any) => d.class?.classname || d.classDetails?.classname).filter(Boolean))].join(", ");
                      const subjectNames = [...new Set(details.map((d: any) => d.subject?.subjectName || d.subjectDetails?.subjectName).filter(Boolean))].join(", ");
                      const overallStatus = day.attendedClasses >= day.totalClasses
                        ? "present"
                        : day.attendedClasses === 0
                        ? "absent"
                        : "partial";

                      return (
                        <tr key={idx}>
                          <td style={{ whiteSpace: "nowrap" }}>{formatDate(day.date)}</td>
                          <td>{day.totalClasses}</td>
                          <td>{day.attendedClasses}</td>
                          <td>{day.absentClasses}</td>
                          <td>{classNames || "—"}</td>
                          <td>{subjectNames || "—"}</td>
                          <td>
                            <span className={`${styles.badge} ${getStatusBadgeClass(overallStatus, styles)}`}>
                              {overallStatus === "partial" ? "Partial" : overallStatus === "present" ? "Present" : "Absent"}
                            </span>
                          </td>
                          <td>—</td>
                        </tr>
                      );
                    })}

                    {/* Summary Row */}
                    <tr className={styles.summaryRow}>
                      <td><strong>Monthly Total Classes:</strong></td>
                      <td><strong>{summary?.totalClasses ?? 0}</strong></td>
                      <td>Total Attended: <strong>{summary?.attendedClasses ?? 0}</strong></td>
                      <td>Total missed: <strong>{summary?.absentClasses ?? 0}</strong></td>
                      <td>—</td>
                      <td>—</td>
                      <td>
                        <div style={{ fontSize: 12 }}>
                          <div>Full Present Days: <strong>{dailySummary.filter((d) => d.absentClasses === 0).length}</strong></div>
                          <div>Full Absent Days: <strong>{dailySummary.filter((d) => d.attendedClasses === 0).length}</strong></div>
                        </div>
                      </td>
                      <td>—</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {!report && !loading && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📆</span>
          <p className={styles.emptyText}>Select a teacher and month, then click Filter to view the report</p>
        </div>
      )}
    </div>
  );
}
