"use client";

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStaffAttendances } from "@/api/employeeAttendanceApi/employeeAttendanceSlice";
import employeeAttendanceApi from "@/api/employeeAttendanceApi/employeeAttendanceApi";
import styles from "../Employee.module.css";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  Present:  { label: "Present",  cls: styles.badgeActive,    dot: "#10b981" },
  Absent:   { label: "Absent",   cls: styles.badgeSuspended, dot: "#ef4444" },
  Late:     { label: "Late",     cls: styles.badgeResigned,  dot: "#f59e0b" },
  "Half Day": { label: "Half Day", cls: styles.badgeOnLeave, dot: "#3b82f6" },
  Leave:    { label: "Leave",    cls: styles.badgeOnLeave,   dot: "#8b5cf6" },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function avatarBg(name: string) {
  const colors = ["#6366f1","#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(t?: string) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export default function AttendanceListPage() {
  const dispatch = useDispatch<any>();
  const { attendances, loading, total } = useSelector((state: any) => state.staffAttendance);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [cleaning, setCleaning] = useState(false);

  // Default month = current month
  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    const params: Record<string, any> = { limit: 200 };
    if (monthFilter) params.month = monthFilter;
    if (statusFilter) params.status = statusFilter;
    dispatch(fetchStaffAttendances(params));
  }, [dispatch, monthFilter, statusFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return attendances;
    const q = search.toLowerCase();
    return attendances.filter((a: any) =>
      a.employee?.fullName?.toLowerCase().includes(q) ||
      a.employee?.systemEmail?.toLowerCase().includes(q)
    );
  }, [attendances, search]);

  // Stats derived from filtered
  const stats = useMemo(() => {
    const present  = filtered.filter((a: any) => a.status === "Present").length;
    const absent   = filtered.filter((a: any) => a.status === "Absent").length;
    const late     = filtered.filter((a: any) => a.status === "Late").length;
    const halfDay  = filtered.filter((a: any) => a.status === "Half Day").length;
    return { total: filtered.length, present, absent, late, halfDay };
  }, [filtered]);

  const handleCleanup = async () => {
    if (!confirm("Deleted employee-দের সব orphan attendance records permanently delete হবে। Continue?")) return;
    setCleaning(true);
    try {
      const res = await employeeAttendanceApi.cleanupOrphans();
      const count = res.data?.deletedCount ?? 0;
      alert(`✅ ${count}টি orphan record সফলভাবে delete হয়েছে।`);
      dispatch(fetchStaffAttendances({ limit: 200 }));
    } catch {
      alert("❌ Cleanup failed. Please try again.");
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className={styles.pageContainerWide}>

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Staff Attendance</h1>
          <p>Track and manage all employee attendance records</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={handleCleanup}
            disabled={cleaning}
            style={{
              padding: "10px 18px", borderRadius: "10px",
              border: "1.5px solid #fca5a5",
              background: cleaning ? "#f9fafb" : "#fff5f5",
              color: "#dc2626", fontWeight: 600, fontSize: "13px",
              cursor: cleaning ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "6px",
              transition: "all 0.2s",
            }}
          >
            {cleaning ? (
              <><span className={styles.spinner} style={{ width: 14, height: 14, borderWidth: 2 }} /> Cleaning…</>
            ) : (
              <>🗑️ Cleanup Orphans</>
            )}
          </button>
          <Link href="/dashboard/employee/staff-attendance/manual" className={styles.btnPrimary}>
            ➕ Manual Entry
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={styles.statsGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 24 }}>
        {[
          { label: "Total Records", value: stats.total,   icon: "📋", bg: "#eff6ff", color: "#3b82f6" },
          { label: "Present",       value: stats.present, icon: "✅", bg: "#f0fdf4", color: "#10b981" },
          { label: "Absent",        value: stats.absent,  icon: "❌", bg: "#fff5f5", color: "#ef4444" },
          { label: "Late",          value: stats.late,    icon: "⏰", bg: "#fffbeb", color: "#f59e0b" },
          { label: "Half Day",      value: stats.halfDay, icon: "🌓", bg: "#eef2ff", color: "#6366f1" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: s.bg }}>
              <span>{s.icon}</span>
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>{s.label}</p>
              <p className={styles.statValue} style={{ color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className={styles.filterCard}>
        <div className={styles.filterRow}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Month</label>
            <input
              type="month"
              className={styles.filterInput}
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              style={{ minWidth: 160 }}
            />
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Status</label>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="Leave">Leave</option>
            </select>
          </div>
          <div className={styles.filterField} style={{ flex: 1, minWidth: 220 }}>
            <label className={styles.filterLabel}>Search</label>
            <div className={styles.searchBox}>
              <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
          </div>
          {(monthFilter || statusFilter || search) && (
            <div className={styles.filterActions}>
              <button
                className={styles.btnSecondary}
                style={{ padding: "9px 16px", fontSize: "13px" }}
                onClick={() => { setMonthFilter(""); setStatusFilter(""); setSearch(""); }}
              >
                ✕ Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 className={styles.tableTitle}>Attendance Records</h2>
            <span className={styles.tableCount}>
              {filtered.length} {filtered.length === 1 ? "record" : "records"}
              {monthFilter && ` · ${monthFilter}`}
            </span>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.loadingWrapper}>
              <div className={styles.spinner} />
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📭</span>
              <p className={styles.emptyText}>No attendance records found.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>In Time</th>
                  <th>Out Time</th>
                  <th>Total Hours</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((att: any, idx: number) => {
                  const name = att.employee?.fullName;
                  const email = att.employee?.systemEmail;
                  const cfg = STATUS_CONFIG[att.status] ?? { label: att.status, cls: styles.badgeInactive, dot: "#9ca3af" };

                  return (
                    <tr key={att._id}>
                      <td style={{ color: "#9ca3af", fontWeight: 500, width: 40 }}>{idx + 1}</td>

                      {/* Employee cell */}
                      <td>
                        <div className={styles.staffInfo}>
                          {name ? (
                            <div
                              className={styles.staffAvatar}
                              style={{ background: avatarBg(name), color: "#fff", fontSize: 13, fontWeight: 700 }}
                            >
                              {getInitials(name)}
                            </div>
                          ) : (
                            <div
                              className={styles.staffAvatar}
                              style={{ background: "#f3f4f6", color: "#9ca3af", fontSize: 18 }}
                            >
                              👤
                            </div>
                          )}
                          <div>
                            <div className={styles.staffName}>
                              {name ?? <span style={{ color: "#d1d5db", fontStyle: "italic", fontWeight: 400 }}>Deleted Employee</span>}
                            </div>
                            {email && <div className={styles.staffEmail}>{email}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td>
                        <span style={{ fontWeight: 500, color: "#374151" }}>{formatDate(att.date)}</span>
                      </td>

                      {/* In Time */}
                      <td>
                        {att.inTime ? (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            color: "#10b981", fontWeight: 600, fontSize: 13,
                          }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                            {formatTime(att.inTime)}
                          </span>
                        ) : "—"}
                      </td>

                      {/* Out Time */}
                      <td>
                        {att.outTime ? (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            color: "#ef4444", fontWeight: 600, fontSize: 13,
                          }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                            {formatTime(att.outTime)}
                          </span>
                        ) : (
                          <span style={{ color: "#d1d5db", fontSize: 13 }}>Not out yet</span>
                        )}
                      </td>

                      {/* Total Hours */}
                      <td>
                        {att.totalHours ? (
                          <span style={{
                            background: "#f0fdf4", color: "#16a34a",
                            padding: "3px 10px", borderRadius: 20,
                            fontSize: 12, fontWeight: 600,
                          }}>
                            ⏱ {att.totalHours}
                          </span>
                        ) : "—"}
                      </td>

                      {/* Status badge */}
                      <td>
                        <span
                          className={`${styles.badge} ${cfg.cls}`}
                          style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Remarks */}
                      <td style={{ color: "#6b7280", fontSize: 13, maxWidth: 180 }}>
                        {att.remarks || <span style={{ color: "#d1d5db" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Showing <strong>{filtered.length}</strong> of <strong>{total}</strong> records
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
