'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useSalary';
import { fetchSalaries, deleteSalary } from '@/api/salaryApi/salarySlice';
import { SalaryItem } from '@/api/salaryApi/types/salary.types';
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

function formatDate(d: string) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return d; }
}

function methodLabel(m: string) {
  if (m === 'mobile_banking') return 'Mobile Banking';
  if (m === 'bank') return 'Bank Transfer';
  return 'Cash';
}

interface DetailModalProps {
  salary: SalaryItem;
  onClose: () => void;
}

function DetailModal({ salary, onClose }: DetailModalProps) {
  const name = salary.user?.fullName || 'Unknown';
  const bg = avatarBg(name);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: '24px',
          display: 'flex', alignItems: 'center', gap: '16px',
          position: 'relative',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: salary.user?.profilePicture ? 'transparent' : 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: '#fff',
            flexShrink: 0, overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.4)',
          }}>
            {salary.user?.profilePicture ? (
              <img src={salary.user.profilePicture} alt="pic" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              getInitials(name)
            )}
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{name}</div>
            {salary.user?.designation && (
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{salary.user.designation}</div>
            )}
            {salary.user?.email && (
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>{salary.user.email}</div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.2)', border: 'none',
              borderRadius: '50%', width: 32, height: 32,
              cursor: 'pointer', color: '#fff', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {/* Amount highlight */}
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 12, padding: '16px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ color: '#166534', fontWeight: 600, fontSize: 14 }}>Salary Amount</span>
            <span style={{ color: '#16a34a', fontWeight: 800, fontSize: 22 }}>৳ {salary.amount?.toLocaleString()}</span>
          </div>

          {/* Details grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Month', value: formatMonth(salary.month) },
              {
                label: 'Payment Type',
                value: (
                  <span style={{
                    background: salary.paymentType === 'advance' ? '#fce7f3' : '#dbeafe',
                    color: salary.paymentType === 'advance' ? '#9f1239' : '#1e40af',
                    padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  }}>
                    {salary.paymentType === 'advance' ? 'Advance' : 'Regular'}
                  </span>
                ),
              },
              { label: 'Payment Date', value: formatDate(salary.paymentDate) },
              { label: 'Method', value: methodLabel(salary.method) },
              { label: 'Paid By', value: salary.paidBy?.username || 'System' },
              { label: 'Created', value: formatDate(salary.createdAt) },
            ].map((item) => (
              <div key={item.label} style={{
                background: '#f9fafb', borderRadius: 10, padding: '12px',
                border: '1px solid #f3f4f6',
              }}>
                <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {item.label}
                </div>
                <div style={{ color: '#111827', fontSize: 14, fontWeight: 500 }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {salary.note && (
            <div style={{
              marginTop: 16, background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: 10, padding: '12px',
            }}>
              <div style={{ color: '#92400e', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Note</div>
              <div style={{ color: '#78350f', fontSize: 14 }}>{salary.note}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StaffSalaryReport() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { salaries, loading, error } = useAppSelector((state: any) => state.salary);

  const [monthFilter, setMonthFilter] = useState('');
  const [selectedSalary, setSelectedSalary] = useState<SalaryItem | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);

  const loadSalaries = (month?: string) => {
    dispatch(fetchSalaries({ userType: 'staff', page: 1, limit: 200, month }));
  };

  useEffect(() => {
    loadSalaries();
  }, []);

  // Filter out orphan records (deleted staff — user is null)
  const validSalaries = useMemo(
    () => salaries.filter((s: SalaryItem) => s.user != null),
    [salaries]
  );
  const orphanCount = salaries.length - validSalaries.length;

  const totalAmount = useMemo(
    () => validSalaries.reduce((sum: number, s: SalaryItem) => sum + (s.amount || 0), 0),
    [validSalaries]
  );

  const handleCleanup = async () => {
    if (orphanCount === 0) return;
    if (!confirm(`${orphanCount}টি orphan salary record permanently delete হবে (deleted staff-দের)। Continue?`)) return;
    setCleaningUp(true);
    try {
      const orphans = salaries.filter((s: SalaryItem) => s.user == null);
      await Promise.all(orphans.map((s: SalaryItem) => dispatch(deleteSalary(s._id))));
    } finally {
      setCleaningUp(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {selectedSalary && (
        <DetailModal salary={selectedSalary} onClose={() => setSelectedSalary(null)} />
      )}

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Staff Salary Report</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>View and manage all staff salary payments</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {orphanCount > 0 && (
            <button
              onClick={handleCleanup}
              disabled={cleaningUp}
              style={{
                padding: '10px 18px', borderRadius: 10,
                border: '1.5px solid #fca5a5',
                background: cleaningUp ? '#f9fafb' : '#fff5f5',
                color: '#dc2626', fontWeight: 600, fontSize: 13,
                cursor: cleaningUp ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {cleaningUp ? '🗑️ Cleaning…' : `🗑️ Remove ${orphanCount} Orphan${orphanCount > 1 ? 's' : ''}`}
            </button>
          )}
          <button
            className={styles.btnPrimary}
            onClick={() => router.push('/dashboard/salary/create')}
          >
            ➕ Pay Now
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        {[
          { label: 'Total Payments', value: validSalaries.length, icon: '📋', bg: '#eff6ff', color: '#3b82f6' },
          { label: 'Total Paid', value: `৳ ${totalAmount.toLocaleString()}`, icon: '💰', bg: '#f0fdf4', color: '#16a34a' },
          {
            label: 'Regular',
            value: validSalaries.filter((s: SalaryItem) => s.paymentType === 'regular').length,
            icon: '✅', bg: '#f0fdf4', color: '#10b981',
          },
          {
            label: 'Advance',
            value: validSalaries.filter((s: SalaryItem) => s.paymentType === 'advance').length,
            icon: '⚡', bg: '#fdf4ff', color: '#9333ea',
          },
        ].map((s) => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: 12, padding: '16px',
            border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
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

      {/* Filters */}
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid #f3f4f6',
        padding: '16px', marginBottom: 20,
        display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap',
      }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Month
          </label>
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className={styles.input}
            disabled={loading}
            style={{ minWidth: 180 }}
          />
        </div>
        <button className={styles.btnPrimary} onClick={() => loadSalaries(monthFilter)} disabled={loading}>
          Filter
        </button>
        {monthFilter && (
          <button
            className={styles.btnSecondary}
            onClick={() => { setMonthFilter(''); loadSalaries(''); }}
            disabled={loading}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader} style={{ marginBottom: 16 }}>
          <h2 className={styles.tableTitle}>
            Salary Records
            <span style={{
              marginLeft: 10, fontSize: 13, fontWeight: 500,
              background: '#eff6ff', color: '#3b82f6', padding: '2px 10px', borderRadius: 20,
            }}>
              {validSalaries.length} record{validSalaries.length !== 1 ? 's' : ''}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className={styles.loadingContainer} style={{ padding: '40px 0', textAlign: 'center' }}>
            <div className={styles.spinnerLarge}></div>
            <p className={styles.loadingText}>Loading salaries…</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#ef4444' }}>Error: {error}</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Staff</th>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Payment Date</th>
                  <th>Method</th>
                  <th>Paid By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {validSalaries.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                      No salary records found.
                    </td>
                  </tr>
                ) : (
                  validSalaries.map((s: SalaryItem, idx: number) => {
                    const name = s.user?.fullName || '';
                    const bg = avatarBg(name || 'X');
                    return (
                      <tr key={s._id}>
                        <td style={{ color: '#9ca3af', fontWeight: 500, width: 40 }}>{idx + 1}</td>

                        {/* Staff */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                              background: s.user?.profilePicture ? 'transparent' : bg,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: 13, fontWeight: 700, overflow: 'hidden',
                            }}>
                              {s.user?.profilePicture ? (
                                <img src={s.user.profilePicture} alt="pic" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : getInitials(name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{name}</div>
                              {s.user?.email && <div style={{ color: '#9ca3af', fontSize: 12 }}>{s.user.email}</div>}
                            </div>
                          </div>
                        </td>

                        {/* Month */}
                        <td>
                          <span style={{ fontWeight: 500, color: '#374151', fontSize: 13 }}>
                            {formatMonth(s.month)}
                          </span>
                        </td>

                        {/* Amount */}
                        <td>
                          <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 15 }}>
                            ৳ {s.amount?.toLocaleString()}
                          </span>
                        </td>

                        {/* Payment Type */}
                        <td>
                          <span className={styles.badge} style={{
                            background: s.paymentType === 'advance' ? '#fce7f3' : '#dbeafe',
                            color: s.paymentType === 'advance' ? '#9f1239' : '#1e40af',
                            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          }}>
                            {s.paymentType === 'advance' ? 'Advance' : 'Regular'}
                          </span>
                        </td>

                        {/* Payment Date */}
                        <td style={{ color: '#374151', fontSize: 13 }}>{formatDate(s.paymentDate)}</td>

                        {/* Method */}
                        <td style={{ color: '#6b7280', fontSize: 13 }}>{methodLabel(s.method)}</td>

                        {/* Paid By */}
                        <td style={{ color: '#6b7280', fontSize: 13 }}>{s.paidBy?.username || 'System'}</td>

                        {/* Action */}
                        <td>
                          <button
                            onClick={() => setSelectedSalary(s)}
                            title="View Details"
                            style={{
                              background: '#eff6ff', border: '1px solid #bfdbfe',
                              borderRadius: 8, padding: '6px 12px',
                              cursor: 'pointer', color: '#3b82f6',
                              fontSize: 14, fontWeight: 500,
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              transition: 'all 0.2s',
                            }}
                          >
                            👁️ View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
