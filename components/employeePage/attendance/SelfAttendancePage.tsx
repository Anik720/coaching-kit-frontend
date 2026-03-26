"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSelfAttendanceToday, markSelfIn, markSelfOut } from "@/api/employeeAttendanceApi/employeeAttendanceSlice";
import { toastManager } from "@/utils/toastConfig";
import styles from "../Employee.module.css";

export default function SelfAttendancePage() {
  const dispatch = useDispatch<any>();
  const { selfAttendanceToday, loading } = useSelector((state: any) => state.staffAttendance);
  const [ip, setIp] = useState("Checking...");
  
  const todayDate = new Date().toISOString().split("T")[0];
  const displayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  useEffect(() => {
    dispatch(fetchSelfAttendanceToday(todayDate));
    // Simulated IP fetch
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => setIp(d.ip))
      .catch(() => setIp("hidden"));
  }, [dispatch, todayDate]);

  const handleMarkIn = async () => {
    const time = new Date().toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    const tid = toastManager.showLoading("Marking entry...");
    const res = await dispatch(markSelfIn({ date: todayDate, inTime: time, ipAddress: ip }));
    if (res.meta.requestStatus === 'fulfilled') {
      toastManager.safeUpdateToast(tid, "Entry marked successfully!", "success");
    } else {
      toastManager.safeUpdateToast(tid, "Failed to mark entry", "error");
    }
  };

  const handleMarkOut = async () => {
    const time = new Date().toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    const tid = toastManager.showLoading("Marking out...");
    const res = await dispatch(markSelfOut({ date: todayDate, outTime: time, ipAddress: ip }));
    if (res.meta.requestStatus === 'fulfilled') {
      toastManager.safeUpdateToast(tid, "Out marked successfully!", "success");
    } else {
      toastManager.safeUpdateToast(tid, "Failed to mark out", "error");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Mark Your Attendance</h1>
        </div>
      </div>

      <div className={styles.sectionCard} style={{ maxWidth: '400px', margin: '40px auto', textAlign: 'center' }}>
        <div style={{ marginBottom: '20px', fontSize: '1.1rem', lineHeight: '1.8' }}>
          <div><strong>Today:</strong> {displayDate}</div>
          <div><strong>Your IP:</strong> {ip}</div>
          <div>
            <strong>In Time:</strong>{" "}
            <span style={{ color: selfAttendanceToday?.inTime ? '#2e7d32' : '#d32f2f' }}>
              {selfAttendanceToday?.inTime || "Not marked"}
            </span>
          </div>
          <div>
            <strong>Out Time:</strong>{" "}
            <span style={{ color: selfAttendanceToday?.outTime ? '#2e7d32' : '#d32f2f' }}>
              {selfAttendanceToday?.outTime || "Not marked"}
            </span>
          </div>
        </div>

        {!selfAttendanceToday?.inTime ? (
          <button
            className={styles.btnPrimary}
            style={{ width: '100%', padding: '12px', fontSize: '1.1rem', backgroundColor: '#2e7d32' }}
            onClick={handleMarkIn}
            disabled={loading}
          >
            Mark Entry (In)
          </button>
        ) : !selfAttendanceToday?.outTime ? (
          <button
            className={styles.btnPrimary}
            style={{ width: '100%', padding: '12px', fontSize: '1.1rem', backgroundColor: '#d32f2f' }}
            onClick={handleMarkOut}
            disabled={loading}
          >
            Mark Out
          </button>
        ) : (
          <div style={{ padding: '12px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', fontWeight: 'bold' }}>
            Attendance fully marked for today!
          </div>
        )}
      </div>
    </div>
  );
}
