"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStaffAttendances } from "@/api/employeeAttendanceApi/employeeAttendanceSlice";
import styles from "../Employee.module.css";
import Link from "next/link";

export default function AttendanceListPage() {
  const dispatch = useDispatch<any>();
  const { attendances, loading } = useSelector((state: any) => state.staffAttendance);

  useEffect(() => {
    dispatch(fetchStaffAttendances({ limit: 100 }));
  }, [dispatch]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>All Staff Attendance Report</h1>
          <p>List of all staff daily attendances</p>
        </div>
        <Link href="/dashboard/employee/manual-attendance" className={styles.btnPrimary}>
          ➕ Manual Entry
        </Link>
      </div>

      <div className={styles.sectionCard} style={{ overflowX: 'auto' }}>
        <table className={styles.dataTable} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', backgroundColor: '#f9f9f9' }}>
              <th style={{ padding: '12px' }}>#</th>
              <th style={{ padding: '12px' }}>Name</th>
              <th style={{ padding: '12px' }}>Email</th>
              <th style={{ padding: '12px' }}>Date</th>
              <th style={{ padding: '12px' }}>In Time</th>
              <th style={{ padding: '12px' }}>Out Time</th>
              <th style={{ padding: '12px' }}>Total Hours</th>
              <th style={{ padding: '12px' }}>Remarks</th>
              <th style={{ padding: '12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: '20px', textAlign: 'center' }}>Loading attendances...</td></tr>
            ) : attendances.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No attendance found.</td></tr>
            ) : (
              attendances.map((att: any, idx: number) => (
                <tr key={att._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{idx + 1}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{att.employee?.fullName || 'N/A'}</td>
                  <td style={{ padding: '12px', color: '#666' }}>{att.employee?.systemEmail || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>{formatDate(att.date)}</td>
                  <td style={{ padding: '12px' }}>{att.inTime || '-'}</td>
                  <td style={{ padding: '12px' }}>{att.outTime || '-'}</td>
                  <td style={{ padding: '12px' }}>{att.totalHours || '-'}</td>
                  <td style={{ padding: '12px' }}>{att.remarks || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold',
                      backgroundColor: att.status === 'Present' ? '#e8f5e9' : att.status === 'Absent' ? '#ffebee' : '#fff3e0',
                      color: att.status === 'Present' ? '#2e7d32' : att.status === 'Absent' ? '#c62828' : '#e65100'
                    }}>
                      {att.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
