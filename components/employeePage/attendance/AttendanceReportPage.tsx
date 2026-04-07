"use client";

import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStaffAttendances } from "@/api/employeeAttendanceApi/employeeAttendanceSlice";
import { fetchEmployees } from "@/api/employeeApi/employeeSlice";
import styles from "../Employee.module.css";

// ─── Helpers ───────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function avatarBg(name: string) {
  const colors = [
    "#6366f1","#3b82f6","#10b981","#f59e0b",
    "#ef4444","#8b5cf6","#ec4899","#14b8a6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatMonth(m: string) {
  if (!m) return "";
  try {
    const [year, month] = m.split("-");
    return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return m;
  }
}

function formatTime(t?: string) {
  if (!t) return "—";
  try {
    const d = new Date(t);
    if (isNaN(d.getTime())) return t;
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return t;
  }
}

function formatHours(h?: string | number) {
  if (h === undefined || h === null || h === "") return "—";
  const num = parseFloat(String(h));
  if (isNaN(num)) return String(h);
  const hrs = Math.floor(num);
  const mins = Math.round((num - hrs) * 60);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

type StatusType = "Present" | "Absent" | "Late" | "Half Day" | "On Leave" | string;

function StatusBadge({ status }: { status: StatusType }) {
  const cfg: Record<string, { bg: string; color: string; dot: string }> = {
    Present:  { bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
    Absent:   { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
    Late:     { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
    "Half Day": { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
    "On Leave": { bg: "#f3e8ff", color: "#6b21a8", dot: "#9333ea" },
  };
  const c = cfg[status] || { bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: c.dot,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AttendanceReportPage() {
  const dispatch = useDispatch<any>();
  const { attendances, loading } = useSelector(
    (state: any) => state.staffAttendance
  );
  const { employees, loading: empLoading } = useSelector(
    (state: any) => state.employee
  );

  // Default to previous month so data is visible immediately
  const getPrevMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().substring(0, 7);
  };
  const [month, setMonth] = useState(getPrevMonth());
  const [selectedStaff, setSelectedStaff] = useState("");
  const [showTable, setShowTable] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    dispatch(fetchEmployees({ limit: 1000 }));
  }, [dispatch]);

  // Auto-load previous month data on mount
  useEffect(() => {
    const prevMonth = getPrevMonth();
    dispatch(fetchStaffAttendances({ limit: 500, month: prevMonth }));
    setShowTable(true);
    setSearched(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShowReport = () => {
    const query: any = { limit: 500 };
    if (month) query.month = month;
    if (selectedStaff) query.employee = selectedStaff;
    dispatch(fetchStaffAttendances(query));
    setShowTable(true);
    setSearched(true);
  };

  // ── Computed stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = attendances.length;
    const present = attendances.filter((a: any) => a.status === "Present").length;
    const absent = attendances.filter((a: any) => a.status === "Absent").length;
    const late = attendances.filter((a: any) => a.status === "Late").length;
    const halfDay = attendances.filter((a: any) => a.status === "Half Day").length;
    const onLeave = attendances.filter((a: any) => a.status === "On Leave").length;
    const totalHoursRaw = attendances.reduce((sum: number, a: any) => {
      const h = parseFloat(a.totalHours);
      return sum + (isNaN(h) ? 0 : h);
    }, 0);
    return { total, present, absent, late, halfDay, onLeave, totalHoursRaw };
  }, [attendances]);

  const selectedEmployee = useMemo(
    () => employees?.find((e: any) => e._id === selectedStaff),
    [employees, selectedStaff]
  );

  const presentRate = stats.total
    ? Math.round((stats.present / stats.total) * 100)
    : 0;

  // ── Sort by date ────────────────────────────────────────────────────────
  const sorted = useMemo(
    () =>
      [...attendances].sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [attendances]
  );

  const empName = selectedEmployee?.fullName || "All Staff";
  const empInitials = getInitials(empName);
  const empBg = avatarBg(empName);

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "28px 24px",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "#111827",
            margin: "0 0 4px",
            background: "linear-gradient(135deg, #1f2937 0%, #4b5563 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          📋 Staff Attendance Report
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
          View monthly attendance records for your staff members
        </p>
      </div>

      {/* ── Filter Panel ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #f3f4f6",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          padding: "24px 28px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#9ca3af",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 18,
          }}
        >
          Filter Options
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto",
            gap: 16,
            alignItems: "flex-end",
          }}
        >
          {/* Staff Select */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Staff Member
            </label>
            <div style={{ position: "relative" }}>
              <select
                style={{
                  width: "100%",
                  padding: "10px 36px 10px 13px",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: 10,
                  fontSize: 14,
                  color: "#111827",
                  background: "#fff",
                  appearance: "none",
                  cursor: "pointer",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                disabled={empLoading}
              >
                <option value="">— All Staff —</option>
                {employees?.map((emp: any) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName} · {emp.designation}
                  </option>
                ))}
              </select>
              <span
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "#9ca3af",
                  fontSize: 12,
                }}
              >
                ▾
              </span>
            </div>
          </div>

          {/* Month Picker */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Month
            </label>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
              Leave blank to see all months
            </div>
            <input
              type="month"
              style={{
                width: "100%",
                padding: "10px 13px",
                border: "1.5px solid #e5e7eb",
                borderRadius: 10,
                fontSize: 14,
                color: "#111827",
                background: "#fff",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>

          {/* Button */}
          <button
            onClick={handleShowReport}
            disabled={loading || empLoading}
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "11px 24px",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading || empLoading ? "not-allowed" : "pointer",
              opacity: loading || empLoading ? 0.7 : 1,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 14px rgba(59,130,246,0.4)",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTop: "2px solid #fff",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Loading…
              </>
            ) : (
              <>🔍 Show Report</>
            )}
          </button>
        </div>
      </div>

      {/* ── Results Section ── */}
      {showTable && (
        <>
          {/* ── Subject line ── */}
          {searched && !loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 20,
                background: "#fff",
                border: "1px solid #f3f4f6",
                borderRadius: 14,
                padding: "16px 20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: empBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {empInitials}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#111827", fontSize: 15 }}>
                  {empName}
                </div>
                <div style={{ color: "#9ca3af", fontSize: 13 }}>
                  {selectedEmployee?.designation || "All Designations"} ·{" "}
                  {month ? formatMonth(month) : "All Months"}
                </div>
              </div>
              <div
                style={{
                  marginLeft: "auto",
                  fontSize: 13,
                  color: "#6b7280",
                  background: "#f9fafb",
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontWeight: 500,
                }}
              >
                {stats.total} record{stats.total !== 1 ? "s" : ""}
              </div>
            </div>
          )}

          {/* ── Stats Cards ── */}
          {!loading && stats.total > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 14,
                marginBottom: 22,
              }}
            >
              {[
                {
                  label: "Total Days",
                  value: stats.total,
                  icon: "📅",
                  bg: "#eff6ff",
                  color: "#1d4ed8",
                },
                {
                  label: "Present",
                  value: stats.present,
                  icon: "✅",
                  bg: "#d1fae5",
                  color: "#065f46",
                },
                {
                  label: "Absent",
                  value: stats.absent,
                  icon: "❌",
                  bg: "#fee2e2",
                  color: "#991b1b",
                },
                {
                  label: "Late",
                  value: stats.late,
                  icon: "⚠️",
                  bg: "#fef3c7",
                  color: "#92400e",
                },
                {
                  label: "Half Day",
                  value: stats.halfDay,
                  icon: "🕐",
                  bg: "#dbeafe",
                  color: "#1e40af",
                },
                {
                  label: "On Leave",
                  value: stats.onLeave,
                  icon: "🏖️",
                  bg: "#f3e8ff",
                  color: "#6b21a8",
                },
                {
                  label: "Total Hours",
                  value: formatHours(stats.totalHoursRaw),
                  icon: "⏱️",
                  bg: "#ecfdf5",
                  color: "#047857",
                },
                {
                  label: "Present Rate",
                  value: `${presentRate}%`,
                  icon: "📊",
                  bg: presentRate >= 75 ? "#d1fae5" : "#fee2e2",
                  color: presentRate >= 75 ? "#065f46" : "#991b1b",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: "16px",
                    border: "1px solid #f3f4f6",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: s.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#9ca3af",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: s.color,
                        lineHeight: 1.2,
                      }}
                    >
                      {s.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Table ── */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #f3f4f6",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid #f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#111827",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Daily Attendance Records
                {!loading && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      background: "#eff6ff",
                      color: "#3b82f6",
                      padding: "2px 10px",
                      borderRadius: 20,
                    }}
                  >
                    {stats.total} entries
                  </span>
                )}
              </h2>
              {month && (
                <span style={{ color: "#6b7280", fontSize: 13, fontWeight: 500 }}>
                  {formatMonth(month)}
                </span>
              )}
            </div>

            {loading ? (
              <div
                style={{ padding: "60px 24px", textAlign: "center" }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    border: "3px solid #e5e7eb",
                    borderTop: "3px solid #3b82f6",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    margin: "0 auto 12px",
                  }}
                />
                <p style={{ color: "#9ca3af", margin: 0, fontSize: 14 }}>
                  Loading attendance records…
                </p>
              </div>
            ) : sorted.length === 0 ? (
              <div style={{ padding: "60px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <p
                  style={{
                    color: "#9ca3af",
                    margin: "0 0 6px",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  No records found
                </p>
                <p style={{ color: "#d1d5db", margin: 0, fontSize: 13 }}>
                  Try selecting a different staff member or month
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 700,
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {[
                        "#",
                        "Date",
                        "Staff Member",
                        "Status",
                        "In Time",
                        "Out Time",
                        "Break",
                        "Total Hours",
                        "Remarks",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "11px 16px",
                            textAlign: "left",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#9ca3af",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            borderBottom: "1px solid #f3f4f6",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((att: any, idx: number) => {
                      const name = att.employee?.fullName || "Unknown";
                      const isAbsent = att.status === "Absent";
                      return (
                        <tr
                          key={att._id || idx}
                          style={{
                            borderBottom: "1px solid #f9fafb",
                            background: isAbsent
                              ? "rgba(254,242,242,0.4)"
                              : "transparent",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.background =
                              "#fafafa";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.background =
                              isAbsent ? "rgba(254,242,242,0.4)" : "transparent";
                          }}
                        >
                          {/* # */}
                          <td
                            style={{
                              padding: "13px 16px",
                              color: "#d1d5db",
                              fontWeight: 500,
                              fontSize: 13,
                              width: 40,
                            }}
                          >
                            {idx + 1}
                          </td>

                          {/* Date */}
                          <td
                            style={{
                              padding: "13px 16px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#111827",
                              }}
                            >
                              {new Date(att.date).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>
                              {new Date(att.date).toLocaleDateString("en-GB", {
                                weekday: "long",
                              })}
                            </div>
                          </td>

                          {/* Staff Member */}
                          <td style={{ padding: "13px 16px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: "50%",
                                  background: avatarBg(name),
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#fff",
                                  fontSize: 13,
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {getInitials(name)}
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    color: "#111827",
                                    fontSize: 13,
                                  }}
                                >
                                  {name}
                                </div>
                                {att.employee?.designation && (
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: "#9ca3af",
                                      textTransform: "capitalize",
                                    }}
                                  >
                                    {att.employee.designation}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: "13px 16px" }}>
                            <StatusBadge status={att.status} />
                          </td>

                          {/* In Time */}
                          <td style={{ padding: "13px 16px" }}>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: att.inTime ? "#059669" : "#d1d5db",
                                fontFeatureSettings: "'tnum'",
                              }}
                            >
                              {formatTime(att.inTime)}
                            </span>
                          </td>

                          {/* Out Time */}
                          <td style={{ padding: "13px 16px" }}>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: att.outTime ? "#dc2626" : "#d1d5db",
                                fontFeatureSettings: "'tnum'",
                              }}
                            >
                              {formatTime(att.outTime)}
                            </span>
                          </td>

                          {/* Break */}
                          <td style={{ padding: "13px 16px" }}>
                            {att.breakInTime || att.breakOutTime ? (
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#6b7280",
                                  fontFeatureSettings: "'tnum'",
                                }}
                              >
                                {formatTime(att.breakInTime)} →{" "}
                                {formatTime(att.breakOutTime)}
                              </span>
                            ) : (
                              <span style={{ color: "#d1d5db", fontSize: 13 }}>
                                —
                              </span>
                            )}
                          </td>

                          {/* Total Hours */}
                          <td style={{ padding: "13px 16px" }}>
                            {att.totalHours ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  background: "#ecfdf5",
                                  color: "#047857",
                                  padding: "3px 10px",
                                  borderRadius: 8,
                                  fontSize: 13,
                                  fontWeight: 600,
                                  fontFeatureSettings: "'tnum'",
                                }}
                              >
                                ⏱ {formatHours(att.totalHours)}
                              </span>
                            ) : (
                              <span style={{ color: "#d1d5db", fontSize: 13 }}>—</span>
                            )}
                          </td>

                          {/* Remarks */}
                          <td style={{ padding: "13px 16px" }}>
                            <span
                              style={{
                                fontSize: 12,
                                color: att.remarks ? "#6b7280" : "#d1d5db",
                                fontStyle: att.remarks ? "normal" : "italic",
                              }}
                            >
                              {att.remarks || "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Footer summary ── */}
            {!loading && sorted.length > 0 && (
              <div
                style={{
                  padding: "14px 22px",
                  borderTop: "1px solid #f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                  background: "#fafafa",
                }}
              >
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  {[
                    { label: "Present", value: stats.present, color: "#065f46", bg: "#d1fae5" },
                    { label: "Absent", value: stats.absent, color: "#991b1b", bg: "#fee2e2" },
                    { label: "Late", value: stats.late, color: "#92400e", bg: "#fef3c7" },
                  ].map((s) => (
                    <span
                      key={s.label}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: s.color,
                        background: s.bg,
                        padding: "4px 10px",
                        borderRadius: 20,
                      }}
                    >
                      {s.label}: {s.value}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  Total logged:{" "}
                  <strong style={{ color: "#047857" }}>
                    {formatHours(stats.totalHoursRaw)}
                  </strong>
                  {" "}· Attendance rate:{" "}
                  <strong
                    style={{
                      color: presentRate >= 75 ? "#047857" : "#dc2626",
                    }}
                  >
                    {presentRate}%
                  </strong>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 700px) {
          .att-filter-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
