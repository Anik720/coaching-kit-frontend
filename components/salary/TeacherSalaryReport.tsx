'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useSalary';
import { fetchSalaries } from '@/api/salaryApi/salarySlice';
import styles from './Salary.module.css';
import { useRouter } from 'next/navigation';

export default function TeacherSalaryReport() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { salaries, loading, error, total } = useAppSelector((state: any) => state.salary);
  const [monthFilter, setMonthFilter] = useState('');

  const loadSalaries = (month?: string) => {
    dispatch(fetchSalaries({ userType: 'teacher', page: 1, limit: 50, month }));
  };

  useEffect(() => {
    loadSalaries();
  }, [dispatch]);

  const handleFilter = () => loadSalaries(monthFilter);
  const handleReset = () => {
    setMonthFilter('');
    loadSalaries('');
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.tableCard}>
        <div className={styles.tableHeader} style={{ marginBottom: '16px' }}>
          <h2 className={styles.tableTitle}>Teacher Paid Salaries</h2>
          <button className={styles.btnPrimary} type="button" onClick={() => router.push('/dashboard/salary/create')}>Pay Now</button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className={styles.input}
            disabled={loading}
            style={{ width: '200px' }}
          />
          <button className={styles.btnPrimary} onClick={handleFilter} disabled={loading} style={{ flex: 1 }}>Filter</button>
          <button className={styles.btnSecondary} onClick={handleReset} disabled={loading} style={{ flex: 1, color: 'white', background: '#3b82f6', borderColor: '#3b82f6' }}>Reset Filter</button>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinnerLarge}></div>
            <p className={styles.loadingText}>Loading salaries...</p>
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>Error: {error}</h3>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Pic</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>Payment Type</th>
                  <th>Payment Date</th>
                  <th>Method</th>
                  <th>Paid By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {salaries.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '24px' }}>No salaries found.</td>
                  </tr>
                ) : (
                  salaries.map((s: any) => (
                    <tr key={s._id}>
                      <td>
                        <div className={styles.userAvatar}>
                          {s.user?.profilePicture ? (
                            <img src={s.user.profilePicture} alt="Pic" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                          ) : (
                            s.user?.fullName?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                      </td>
                      <td><span className={styles.className}>{s.user?.fullName || 'Unknown User'}</span></td>
                      <td>{s.user?.email || 'N/A'}</td>
                      <td><span style={{ fontWeight: 600 }}>৳ {s.amount}</span></td>
                      <td><span className={styles.badge} style={{ background: s.paymentType === 'advance' ? '#fce7f3' : '#dbeafe', color: s.paymentType === 'advance' ? '#9f1239' : '#1e40af' }}>{s.paymentType}</span></td>
                      <td>{new Date(s.paymentDate).toLocaleDateString()}</td>
                      <td>{s.method}</td>
                      <td>{s.paidBy?.username || 'System'}</td>
                      <td>
                        <button className={styles.btnEdit}>👁️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
