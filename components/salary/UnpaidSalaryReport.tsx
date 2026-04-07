'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUnpaidSalaries } from '@/api/salaryApi/salarySlice';
import { fetchTeachers } from '@/api/teacherApi/teacherSlice';
import { fetchEmployees } from '@/api/employeeApi/employeeSlice';
import styles from './Salary.module.css';
import { useRouter } from 'next/navigation';

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

function avatarBg(name: string) {
  const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatMonth(m: string) {
  if (!m) return '—';
  try {
    const [year, month] = m.split('-');
    return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  } catch { return m; }
}

export default function UnpaidSalaryReport() {
  const router = useRouter();
  const dispatch = useDispatch<any>();

  const { unpaidSalaries, loading, error } = useSelector((state: any) => state.salary);
  const { teachers } = useSelector((state: any) => state.teacher);
  const { employees } = useSelector((state: any) => state.employee);

  const [userType, setUserType] = useState<'teacher' | 'staff'>('teacher');
  const [month, setMonth] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [searched, setSearched] = useState(false);

  // Load teacher and employee lists for the dropdowns
  useEffect(() => {
    dispatch(fetchTeachers({ limit: 1000 }));
    dispatch(fetchEmployees({ limit: 1000 }));
  }, [dispatch]);

  // Reset selection when userType changes
  useEffect(() => {
    setSelectedId('');
    setSearched(false);
  }, [userType]);

  const personList = userType === 'teacher' ? (teachers || []) : (employees || []);

  const handleSearch = () => {
    if (!month) return;
    dispatch(fetchUnpaidSalaries({ userType, month, page: 1, limit: 1000 }));
    setSearched(true);
  };

  // Client-side filter: if a specific person is selected, show only them
  const filteredResults = useMemo(() => {
    if (!unpaidSalaries || unpaidSalaries.length === 0) return [];
    if (!selectedId) return unpaidSalaries;
    return unpaidSalaries.filter((r: any) => r.user?._id === selectedId);
  }, [unpaidSalaries, selectedId]);

  const totalExpected = useMemo(
    () => filteredResults.reduce((sum: number, r: any) => sum + (r.expectedSalary || 0), 0),
    [filteredResults]
  );

  const handlePayNow = (person: any) => {
    router.push(`/dashboard/salary/create`);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Unpaid Salary Report</h1>
        <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>
          Find active {userType === 'teacher' ? 'teachers' : 'staff'} who have not received regular salary for a given month
        </p>
      </div>

      {/* Filter Card */}
      <div style={{
        background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
        padding: '24px', marginBottom: 24,
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 20px' }}>Search Filters</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>

          {/* User Type Toggle */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Type
            </label>
            <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: '1.5px solid #e5e7eb' }}>
              {(['teacher', 'staff'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setUserType(t)}
                  style={{
                    flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                    fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
                    background: userType === t ? '#6366f1' : '#fff',
                    color: userType === t ? '#fff' : '#6b7280',
                  }}
                >
                  {t === 'teacher' ? '🎓 Teacher' : '👤 Staff'}
                </button>
              ))}
            </div>
          </div>

          {/* Month */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Month <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => { setMonth(e.target.value); setSearched(false); }}
              className={styles.input}
              style={{ width: '100%' }}
            />
          </div>

          {/* Person Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {userType === 'teacher' ? 'Filter by Teacher' : 'Filter by Staff'} (Optional)
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className={styles.input}
              style={{ width: '100%' }}
            >
              <option value="">— All {userType === 'teacher' ? 'Teachers' : 'Staff'} —</option>
              {personList.map((p: any) => (
                <option key={p._id} value={p._id}>
                  {p.fullName}{p.designation ? ` — ${p.designation}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleSearch}
            disabled={!month || loading}
            className={styles.btnPrimary}
            style={{
              opacity: !month ? 0.5 : 1,
              cursor: !month ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              minWidth: 160,
            }}
          >
            {loading ? (
              <><span className={styles.spinner} style={{ width: 14, height: 14, borderWidth: 2 }} /> Searching…</>
            ) : (
              <>🔍 Search Unpaid</>
            )}
          </button>
          {searched && (
            <button
              onClick={() => { setMonth(''); setSelectedId(''); setSearched(false); }}
              className={styles.btnSecondary}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {searched && !loading && (
        <>
          {/* Stats — only meaningful when viewing all, not a specific person */}
          {!selectedId && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16, marginBottom: 24,
            }}>
              {[
                { label: 'Unpaid Count', value: filteredResults.length, icon: '❌', bg: '#fff5f5', color: '#ef4444' },
                { label: 'Total Due', value: `৳ ${totalExpected.toLocaleString()}`, icon: '💸', bg: '#fffbeb', color: '#d97706' },
                { label: 'Month', value: formatMonth(month), icon: '📅', bg: '#eff6ff', color: '#3b82f6' },
              ].map((s) => (
                <div key={s.label} style={{
                  background: '#fff', borderRadius: 12, padding: '16px',
                  border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, background: s.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ color: '#9ca3af', fontSize: 12, fontWeight: 500 }}>{s.label}</div>
                    <div style={{ color: s.color, fontWeight: 700, fontSize: 18 }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          <div className={styles.tableCard}>
            <div className={styles.tableHeader} style={{ marginBottom: 16 }}>
              <h2 className={styles.tableTitle}>
                {selectedId
                  ? `${userType === 'teacher' ? 'Teacher' : 'Staff'} Payment Status — ${formatMonth(month)}`
                  : `Unpaid ${userType === 'teacher' ? 'Teachers' : 'Staff'}`}
                {!selectedId && (
                  <span style={{
                    marginLeft: 10, fontSize: 13, fontWeight: 500,
                    background: '#fff5f5', color: '#ef4444',
                    padding: '2px 10px', borderRadius: 20,
                  }}>
                    {filteredResults.length} unpaid
                  </span>
                )}
              </h2>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{userType === 'teacher' ? 'Teacher' : 'Staff'}</th>
                    <th>Designation</th>
                    <th>Month</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                        {selectedId ? (
                          <>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                            <div style={{ fontWeight: 600, color: '#16a34a', fontSize: 15 }}>
                              {personList.find((p: any) => p._id === selectedId)?.fullName || 'This person'} has already been paid for {formatMonth(month)}.
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                            <div style={{ fontWeight: 600, color: '#6b7280', fontSize: 15 }}>
                              All {userType === 'teacher' ? 'teachers' : 'staff'} have been paid for {formatMonth(month)}.
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((r: any, idx: number) => {
                      const name = r.user?.fullName || 'Unknown';
                      const bg = avatarBg(name);
                      return (
                        <tr key={r.user?._id || idx}>
                          <td style={{ color: '#9ca3af', fontWeight: 500, width: 40 }}>{idx + 1}</td>

                          {/* Person */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                background: r.user?.profilePicture ? 'transparent' : bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: 13, fontWeight: 700, overflow: 'hidden',
                              }}>
                                {r.user?.profilePicture ? (
                                  <img src={r.user.profilePicture} alt="pic" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : getInitials(name)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{name}</div>
                                {r.user?.email && <div style={{ color: '#9ca3af', fontSize: 12 }}>{r.user.email}</div>}
                              </div>
                            </div>
                          </td>

                          {/* Designation */}
                          <td style={{ color: '#6b7280', fontSize: 13 }}>
                            {r.user?.designation || '—'}
                          </td>

                          {/* Month */}
                          <td>
                            <span style={{
                              background: '#eff6ff', color: '#3b82f6',
                              padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                            }}>
                              {formatMonth(r.month)}
                            </span>
                          </td>

                          {/* Action */}
                          <td>
                            <button
                              onClick={() => handlePayNow(r)}
                              style={{
                                background: '#f0fdf4', border: '1px solid #bbf7d0',
                                borderRadius: 8, padding: '6px 14px',
                                cursor: 'pointer', color: '#16a34a',
                                fontSize: 13, fontWeight: 600,
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              💳 Pay Now
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredResults.length > 0 && !selectedId && (
              <div style={{
                padding: '16px 20px',
                borderTop: '1px solid #f3f4f6',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 13, color: '#6b7280',
              }}>
                <span>
                  Showing <strong>{filteredResults.length}</strong> unpaid {userType === 'teacher' ? 'teacher' : 'staff'}{filteredResults.length !== 1 ? 's' : ''} for {formatMonth(month)}
                </span>
                <span style={{ fontWeight: 700, color: '#d97706' }}>
                  Total Due: ৳ {totalExpected.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty prompt — before first search */}
      {!searched && !loading && (
        <div style={{
          background: '#fff', borderRadius: 14, border: '1px dashed #e5e7eb',
          padding: '60px 24px', textAlign: 'center',
          color: '#9ca3af',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>
            Select a month and click &quot;Search Unpaid&quot;
          </div>
          <div style={{ fontSize: 13 }}>
            The report will show all active {userType === 'teacher' ? 'teachers' : 'staff'} who have not received their regular salary for the selected month.
          </div>
        </div>
      )}

      {/* Error state */}
      {error && searched && (
        <div style={{
          background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 12,
          padding: '16px 20px', color: '#dc2626', fontSize: 14,
        }}>
          ❌ Error: {error}
        </div>
      )}
    </div>
  );
}
