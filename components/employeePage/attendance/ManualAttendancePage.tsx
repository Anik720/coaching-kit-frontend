"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { createManualAttendance } from "@/api/employeeAttendanceApi/employeeAttendanceSlice";
import { fetchEmployees } from "@/api/employeeApi/employeeSlice";
import { toastManager } from "@/utils/toastConfig";
import styles from "../Employee.module.css";

const STATUS_OPTIONS = [
  { value: "Present", label: "Present" },
  { value: "Absent", label: "Absent" },
  { value: "Late", label: "Late" },
  { value: "Half Day", label: "Half Day" },
];

export default function ManualAttendancePage() {
  const router = useRouter();
  const dispatch = useDispatch<any>();
  const { employees, loading: empLoading } = useSelector((state: any) => state.employee);
  const { loading, success, error } = useSelector((state: any) => state.staffAttendance);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    employee: "",
    inTime: "",
    outTime: "",
    status: "",
    remarks: "",
  });

  useEffect(() => {
    dispatch(fetchEmployees({ limit: 1000 })); // fetch all active employees
  }, [dispatch]);

  const handleChange = (field: string) => (e: any) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.employee || !form.date || !form.status) {
      toastManager.showError("Please fill all required fields (Staff, Date, Status)");
      return;
    }

    const tid = toastManager.showLoading("Saving attendance...");
    try {
      const res = await dispatch(createManualAttendance(form));
      if (res.meta.requestStatus === 'fulfilled') {
        toastManager.safeUpdateToast(tid, "Attendance saved successfully", "success");
        setForm({
          date: form.date,
          employee: "",
          inTime: "",
          outTime: "",
          status: "",
          remarks: "",
        });
      } else {
        toastManager.safeUpdateToast(tid, error || "Failed to save attendance", "error");
      }
    } catch (e) {
      toastManager.safeUpdateToast(tid, "Error saving attendance", "error");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Manual Attendance Entry</h1>
          <p>Create/Edit Staff Attendance</p>
        </div>
      </div>

      <div className={styles.sectionCard} style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className={styles.formGrid} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className={styles.formField}>
            <label className={styles.formLabel}>Date *</label>
            <input
              type="date"
              className={styles.formInput}
              value={form.date}
              onChange={handleChange("date")}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Staff *</label>
            <select
              className={styles.formSelect}
              value={form.employee}
              onChange={handleChange("employee")}
            >
              <option value="">Select Staff</option>
              {employees?.map((emp: any) => (
                <option key={emp._id} value={emp._id}>
                  {emp.fullName} ({emp.designation})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <div className={styles.formField} style={{ flex: 1 }}>
              <label className={styles.formLabel}>In Time</label>
              <input
                type="time"
                className={styles.formInput}
                value={form.inTime}
                onChange={handleChange("inTime")}
              />
            </div>
            <div className={styles.formField} style={{ flex: 1 }}>
              <label className={styles.formLabel}>Out Time</label>
              <input
                type="time"
                className={styles.formInput}
                value={form.outTime}
                onChange={handleChange("outTime")}
              />
            </div>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Status *</label>
            <select
              className={styles.formSelect}
              value={form.status}
              onChange={handleChange("status")}
            >
              <option value="">Select Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Remarks</label>
            <textarea
              className={styles.formTextarea}
              rows={3}
              value={form.remarks}
              onChange={handleChange("remarks")}
              placeholder="Any remarks..."
            />
          </div>

          <div className={styles.formActions} style={{ marginTop: '1rem' }}>
            <button
              className={styles.btnPrimary}
              onClick={handleSubmit}
              disabled={loading || empLoading}
            >
              {loading ? "Saving..." : "Save Attendance"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
