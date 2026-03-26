"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSelfAttendanceToday, markBreakIn, markBreakOut } from "@/api/employeeAttendanceApi/employeeAttendanceSlice";
import { toastManager } from "@/utils/toastConfig";
import styles from "../Employee.module.css";

export default function BreakTimePage() {
  const dispatch = useDispatch<any>();
  const { selfAttendanceToday, loading } = useSelector((state: any) => state.staffAttendance);
  const [ip, setIp] = useState("Checking...");
  
  const todayDate = new Date().toISOString().split("T")[0];
  const displayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  useEffect(() => {
    dispatch(fetchSelfAttendanceToday(todayDate));
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => setIp(d.ip))
      .catch(() => setIp("hidden"));
  }, [dispatch, todayDate]);

  const handleBreakIn = async () => {
    if (!selfAttendanceToday?.inTime) {
      toastManager.showError("Mark attendance in before taking a break.");
      return;
    }
    const time = new Date().toTimeString().split(' ')[0].substring(0, 5);
    const tid = toastManager.showLoading("Marking break start...");
    const res = await dispatch(markBreakIn({ date: todayDate, breakInTime: time, ipAddress: ip }));
    if (res.meta.requestStatus === 'fulfilled') {
      toastManager.safeUpdateToast(tid, "Break started!", "success");
    } else {
      toastManager.safeUpdateToast(tid, "Failed to start break", "error");
    }
  };

  const handleBreakOut = async () => {
    const time = new Date().toTimeString().split(' ')[0].substring(0, 5);
    const tid = toastManager.showLoading("Marking break end...");
    const res = await dispatch(markBreakOut({ date: todayDate, breakOutTime: time, ipAddress: ip }));
    if (res.meta.requestStatus === 'fulfilled') {
      toastManager.safeUpdateToast(tid, "Break ended!", "success");
    } else {
      toastManager.safeUpdateToast(tid, "Failed to end break", "error");
    }
  };

  const hasInTime = !!selfAttendanceToday?.inTime;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Mark Your Break-Time</h1>
        </div>
      </div>

      <div className={styles.sectionCard} style={{ maxWidth: '400px', margin: '40px auto', textAlign: 'center' }}>
        <div style={{ marginBottom: '20px', fontSize: '1.1rem', lineHeight: '1.8' }}>
          <div><strong>Today:</strong> {displayDate}</div>
          <div><strong>Your IP:</strong> {ip}</div>
          <div>
            <strong>Break In Time:</strong>{" "}
            <span style={{ color: selfAttendanceToday?.breakInTime ? '#2e7d32' : '#d32f2f' }}>
              {selfAttendanceToday?.breakInTime || "Not marked"}
            </span>
          </div>
          <div>
            <strong>Break Out Time:</strong>{" "}
            <span style={{ color: selfAttendanceToday?.breakOutTime ? '#2e7d32' : '#d32f2f' }}>
              {selfAttendanceToday?.breakOutTime || "Not marked"}
            </span>
          </div>
        </div>

        {!hasInTime ? (
          <div style={{ padding: '12px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
            Please mark your daily attendance first before taking a break.
          </div>
        ) : !selfAttendanceToday?.breakInTime ? (
          <button
            className={styles.btnPrimary}
            style={{ width: '100%', padding: '12px', fontSize: '1.1rem', backgroundColor: '#f57c00' }}
            onClick={handleBreakIn}
            disabled={loading}
          >
            Start Break
          </button>
        ) : !selfAttendanceToday?.breakOutTime ? (
          <button
            className={styles.btnPrimary}
            style={{ width: '100%', padding: '12px', fontSize: '1.1rem', backgroundColor: '#2e7d32' }}
            onClick={handleBreakOut}
            disabled={loading}
          >
            End Break
          </button>
        ) : (
          <div style={{ padding: '12px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', fontWeight: 'bold' }}>
            Break fully completed for today!
          </div>
        )}
      </div>
    </div>
  );
}
