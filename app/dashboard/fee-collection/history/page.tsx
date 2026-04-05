'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from '../Fee.module.css';
import feeService from '@/api/feeApi/services/feeService';
import batchService from '@/api/batchApi/services/batchService';
import { StudentPaymentHistoryItem } from '@/api/feeApi/types/fee.types';
import { BatchItem } from '@/api/batchApi/types/batch.types';

// ── helpers ───────────────────────────────────────────────────────────────────

const FEE_TYPE_META: Record<string, { label: string; bg: string; color: string }> = {
  admission: { label: 'Admission',  bg: 'rgba(99,102,241,.1)',   color: '#6366f1' },
  tuition:   { label: 'Tuition',    bg: 'rgba(16,185,129,.1)',   color: '#059669' },
  course:    { label: 'Course',     bg: 'rgba(245,158,11,.1)',   color: '#d97706' },
};

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  paid:    { label: 'Paid',    bg: 'rgba(16,185,129,.12)',  color: '#059669' },
  partial: { label: 'Partial', bg: 'rgba(245,158,11,.12)',  color: '#d97706' },
  due:     { label: 'Due',     bg: 'rgba(239,68,68,.12)',   color: '#dc2626' },
};

const METHOD_META: Record<string, { icon: string }> = {
  cash:  { icon: '💵' },
  bkash: { icon: '📱' },
  nagad: { icon: '📱' },
  bank:  { icon: '🏦' },
};

const chip = (meta: { label: string; bg: string; color: string }) => (
  <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: meta.bg, color: meta.color }}>
    {meta.label}
  </span>
);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const today = () => new Date().toISOString().slice(0, 10);

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FeeHistoryPage() {
  const [records, setRecords]   = useState<StudentPaymentHistoryItem[]>([]);
  const [loading, setLoading]   = useState(false);
  const [fetched, setFetched]   = useState(false);

  // batches for dropdown
  const [batches, setBatches]   = useState<BatchItem[]>([]);

  // filters
  const [startDate, setStartDate] = useState(today());
  const [endDate,   setEndDate]   = useState(today());
  const [feeType,   setFeeType]   = useState('');
  const [batchId,   setBatchId]   = useState('');

  // ── fetch batches once ────────────────────────────────────────────────────
  useEffect(() => {
    batchService.getAllBatches({ limit: 200 }).then(res => setBatches(res.data || [])).catch(() => {});
  }, []);

  // ── fetch history ─────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate)   params.endDate   = endDate;
      if (feeType)   params.feeType   = feeType;
      if (batchId)   params.batchId   = batchId;
      const data = await feeService.getPaymentHistory(params);
      setRecords(data);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [startDate, endDate, feeType, batchId]);

  // load today on mount
  useEffect(() => { fetchHistory(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── derived stats ─────────────────────────────────────────────────────────
  const totalCollected  = records.reduce((s, r) => s + r.amount_paid, 0);
  const admissionTotal  = records.filter(r => r.fee_type === 'admission').reduce((s, r) => s + r.amount_paid, 0);
  const tuitionTotal    = records.filter(r => r.fee_type === 'tuition').reduce((s, r) => s + r.amount_paid, 0);
  const courseTotal     = records.filter(r => r.fee_type === 'course').reduce((s, r) => s + r.amount_paid, 0);
  const partialCount    = records.filter(r => r.status === 'partial').length;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.pageContainer}>

      {/* ── Header ── */}
      <div className={styles.pageHeader} style={{ marginBottom: '28px', padding: '28px 32px' }}>
        <div className={styles.headerContent}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(99,102,241,.3)', flexShrink: 0 }}>
              <svg width="26" height="26" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h1 className={styles.pageTitle} style={{ fontSize: '26px', marginBottom: '4px' }}>Payment History</h1>
              <p className={styles.pageSubtitle}>Browse & filter all recorded fee transactions</p>
            </div>
          </div>
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>
            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', border: '1px solid #f3f4f6', marginBottom: '24px' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '16px' }}>Filter Transactions</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Date From</label>
            <input type="date" className={styles.input}
              style={{ padding: '11px 14px', borderRadius: '10px', fontSize: '14px' }}
              value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Date To</label>
            <input type="date" className={styles.input}
              style={{ padding: '11px 14px', borderRadius: '10px', fontSize: '14px' }}
              value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Batch</label>
            <select className={styles.input}
              style={{ padding: '11px 14px', borderRadius: '10px', fontSize: '14px' }}
              value={batchId} onChange={e => setBatchId(e.target.value)}>
              <option value="">All Batches</option>
              {batches.map(b => (
                <option key={b._id} value={b._id}>{b.batchName}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Fee Type</label>
            <select className={styles.input}
              style={{ padding: '11px 14px', borderRadius: '10px', fontSize: '14px' }}
              value={feeType} onChange={e => setFeeType(e.target.value)}>
              <option value="">All Types</option>
              <option value="admission">Admission Fee</option>
              <option value="tuition">Tuition Fee</option>
              <option value="course">Course Fee</option>
            </select>
          </div>
          <button className={styles.btnPrimary} onClick={fetchHistory}
            disabled={loading}
            style={{ padding: '11px 24px', borderRadius: '10px', fontSize: '14px', opacity: loading ? .7 : 1, cursor: loading ? 'not-allowed' : 'pointer', justifyContent: 'center' }}>
            {loading
              ? <><div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTop: '2px solid white', animation: 'spin .8s linear infinite' }} /> Searching...</>
              : <><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> Search</>
            }
          </button>
        </div>
        {/* Quick date shortcuts */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
          {[
            { label: 'Today', action: () => { const d = today(); setStartDate(d); setEndDate(d); } },
            { label: 'This Month', action: () => { const n = new Date(); setStartDate(`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-01`); setEndDate(today()); } },
            { label: 'Last 7 Days', action: () => { const d = new Date(); d.setDate(d.getDate()-6); setStartDate(d.toISOString().slice(0,10)); setEndDate(today()); } },
            { label: 'All Time', action: () => { setStartDate(''); setEndDate(''); } },
          ].map(({ label, action }) => (
            <button key={label} onClick={action}
              style={{ padding: '5px 14px', borderRadius: '20px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '12px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats Cards ── */}
      {fetched && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Collected', value: `৳ ${totalCollected.toLocaleString()}`, icon: '💰', bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', shadow: 'rgba(99,102,241,.3)' },
            { label: 'Admission',       value: `৳ ${admissionTotal.toLocaleString()}`, icon: '🎓', bg: 'linear-gradient(135deg,#6366f1,#818cf8)', shadow: 'rgba(99,102,241,.2)' },
            { label: 'Tuition',         value: `৳ ${tuitionTotal.toLocaleString()}`,   icon: '📅', bg: 'linear-gradient(135deg,#10b981,#34d399)', shadow: 'rgba(16,185,129,.2)' },
            { label: 'Course',          value: `৳ ${courseTotal.toLocaleString()}`,    icon: '📚', bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)', shadow: 'rgba(245,158,11,.2)' },
          ].map(c => (
            <div key={c.label} style={{ background: 'white', borderRadius: '14px', padding: '20px 22px', boxShadow: `0 4px 16px ${c.shadow}`, border: '1px solid #f3f4f6', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-12px', right: '-12px', width: '64px', height: '64px', borderRadius: '50%', background: c.bg, opacity: .08 }} />
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>{c.label}</p>
              <p style={{ fontSize: '22px', fontWeight: '800', color: '#1f2937', margin: 0 }}>{c.value}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>
                {records.filter(r => {
                  if (c.label === 'Total Collected') return true;
                  const map: Record<string,string> = { Admission: 'admission', Tuition: 'tuition', Course: 'course' };
                  return r.fee_type === map[c.label];
                }).length} transaction{records.length !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)', border: '1px solid #f3f4f6' }}>

        {/* Table header bar */}
        <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" />
            </svg>
            <span style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>Transaction Records</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {partialCount > 0 && (
              <span style={{ fontSize: '12px', padding: '3px 12px', borderRadius: '20px', background: 'rgba(245,158,11,.25)', color: '#fbbf24', fontWeight: '700' }}>
                {partialCount} partial
              </span>
            )}
            <span style={{ fontSize: '12px', padding: '3px 12px', borderRadius: '20px', background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.9)', fontWeight: '700' }}>
              {records.length} record{records.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(99,102,241,.15)', borderTop: '3px solid #6366f1', animation: 'spin .8s linear infinite', margin: '0 auto 14px' }} />
            <p style={{ color: '#9ca3af', margin: 0 }}>Loading transactions...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && fetched && records.length === 0 && (
          <div style={{ padding: '72px 32px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(99,102,241,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="32" height="32" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p style={{ color: '#374151', fontWeight: '700', fontSize: '16px', margin: '0 0 6px' }}>No transactions found</p>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>Try adjusting the date range or fee type filter</p>
          </div>
        )}

        {/* Table */}
        {!loading && records.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#f9fafb,#f3f4f6)' }}>
                  {['#', 'Student', 'Class / Batch', 'Fee Type', 'Month', 'Expected', 'Paid', 'Method', 'Payment Date', 'Recorded On', 'Status'].map((h, i) => (
                    <th key={h} style={{
                      padding: '12px 16px',
                      fontSize: '11px', fontWeight: '700', color: '#6b7280',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      textAlign: i === 0 ? 'center' : 'left',
                      borderBottom: '2px solid #e5e7eb',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((rec, idx) => {
                  const ft   = FEE_TYPE_META[rec.fee_type] ?? FEE_TYPE_META.tuition;
                  const st   = STATUS_META[rec.status]     ?? STATUS_META.due;
                  const meth = METHOD_META[rec.method]     ?? { icon: '💳' };
                  const className = (rec.batchId as any)?.className?.classname || '—';
                  const batchName = rec.batchId?.batchName || '—';
                  const monthLabel = rec.month
                    ? (() => {
                        const [y, m] = rec.month.split('-');
                        return new Date(+y, +m - 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
                      })()
                    : '—';

                  return (
                    <tr key={rec._id}
                      style={{ borderBottom: idx < records.length - 1 ? '1px solid #f3f4f6' : 'none', transition: 'background .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}>

                      {/* # */}
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#9ca3af', width: '44px' }}>{idx + 1}</td>

                      {/* Student */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, background: 'linear-gradient(135deg,#e0e7ff,#ddd6fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: '#6366f1' }}>
                            {rec.studentId?.nameEnglish?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: '700', color: '#1f2937', fontSize: '14px' }}>{rec.studentId?.nameEnglish || '—'}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>{rec.studentId?.registrationId || '—'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Class / Batch */}
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#374151' }}>{className}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>{batchName}</p>
                      </td>

                      {/* Fee Type */}
                      <td style={{ padding: '14px 16px' }}>
                        {chip(ft)}
                      </td>

                      {/* Month */}
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151', fontWeight: '500', whiteSpace: 'nowrap' }}>{monthLabel}</td>

                      {/* Expected */}
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: '#6366f1', whiteSpace: 'nowrap' }}>৳ {rec.expected_fee.toLocaleString()}</td>

                      {/* Paid */}
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '800', color: '#1f2937', whiteSpace: 'nowrap' }}>৳ {rec.amount_paid.toLocaleString()}</td>

                      {/* Method */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: '#f3f4f6', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                          {meth.icon} {rec.method}
                        </span>
                      </td>

                      {/* Payment Date */}
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151', whiteSpace: 'nowrap' }}>{fmtDate(rec.payment_date)}</td>

                      {/* Recorded On */}
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{fmtDateTime(rec.createdAt)}</td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>{chip(st)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && records.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', padding: '14px 24px', borderTop: '2px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              Showing <strong style={{ color: '#374151' }}>{records.length}</strong> transaction{records.length !== 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#6366f1' }}>
              Total Collected: ৳ {totalCollected.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
