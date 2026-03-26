"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStaffAttendances } from "@/api/employeeAttendanceApi/employeeAttendanceSlice";
import { fetchEmployees } from "@/api/employeeApi/employeeSlice";
import styles from "../Employee.module.css";

export default function AttendanceReportPage() {
  const dispatch = useDispatch<any>();
  const { attendances, loading } = useSelector((state: any) => state.staffAttendance);
  const { employees, loading: empLoading } = useSelector((state: any) => state.employee);

  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [selectedStaff, setSelectedStaff] = useState("");
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    dispatch(fetchEmployees({ limit: 1000 }));
  }, [dispatch]);

  const handleShowReport = () => {
    let query: any = { limit: 1000 };
    if (month) query.month = month;
    if (selectedStaff) query.employee = selectedStaff;
    
    dispatch(fetchStaffAttendances(query));
    setShowTable(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.sectionCard} style={{ maxWidth: '600px', margin: '40px auto' }}>
        <h2 className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '30px' }}>Monthly Attendance Report</h2>
        
        <div className={styles.formGrid} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Select Staff</label>
            <select
              className={styles.formSelect}
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
            >
              <option value="">-- Choose Staff --</option>
              {employees?.map((emp: any) => (
                <option key={emp._id} value={emp._id}>
                  {emp.fullName} ({emp.designation})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Select Month</label>
            <input
              type="month"
              className={styles.formInput}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>

          <div>
            <button
              className={styles.btnPrimary}
              style={{ padding: '10px 24px' }}
              onClick={handleShowReport}
              disabled={loading || empLoading}
            >
              Show Report
            </button>
          </div>
        </div>
      </div>

      {showTable && (
        <div className={styles.sectionCard} style={{ marginTop: '20px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.dataTable} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', backgroundColor: '#f9f9f9' }}>
                  <th style={{ padding: '12px' }}>Staff Name</th>
                  <th style={{ padding: '12px' }}>Designation</th>
                  <th style={{ padding: '12px' }}>Date</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>In Time</th>
                  <th style={{ padding: '12px' }}>Out Time</th>
                  <th style={{ padding: '12px' }}>Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center' }}>Loading report...</td></tr>
                ) : attendances.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No records found for this selection.</td></tr>
                ) : (
                  attendances.map((att: any) => (
                    <tr key={att._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{att.employee?.fullName || 'N/A'}</td>
                      <td style={{ padding: '12px', color: '#666' }}>{att.employee?.designation || 'N/A'}</td>
                      <td style={{ padding: '12px' }}>{formatDate(att.date)}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold',
                          backgroundColor: att.status === 'Present' ? '#e8f5e9' : att.status === 'Absent' ? '#ffebee' : '#fff3e0',
                          color: att.status === 'Present' ? '#2e7d32' : att.status === 'Absent' ? '#c62828' : '#e65100'
                        }}>
                          {att.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{att.inTime || '-'}</td>
                      <td style={{ padding: '12px' }}>{att.outTime || '-'}</td>
                      <td style={{ padding: '12px' }}>{att.totalHours || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
