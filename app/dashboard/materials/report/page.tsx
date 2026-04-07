'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDistributions } from '@/api/materialsApi/materialsSlice';
import { fetchBatches } from '@/api/batchApi/batchSlice';
import { fetchMaterials } from '@/api/materialsApi/materialsSlice';
import styles from '@/components/materials/Materials.module.css';

export default function DistributionReportPage() {
  const dispatch = useDispatch<any>();
  const { distributions, materials, loading, total } = useSelector((state: any) => state.materials);
  const { batches } = useSelector((state: any) => state.batch);

  const [filters, setFilters] = useState({
    materialId: '',
    batchId: '',
    studentId: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    dispatch(fetchBatches({ limit: 1000 }));
    dispatch(fetchMaterials({ limit: 1000 }));
    dispatch(fetchDistributions({ limit: 500 }));
  }, [dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query: any = { limit: 500 };
    Object.keys(filters).forEach(k => {
      if ((filters as any)[k]) query[k] = (filters as any)[k];
    });
    dispatch(fetchDistributions(query));
  };

  const handleReset = () => {
    setFilters({ materialId: '', batchId: '', studentId: '', startDate: '', endDate: '' });
    dispatch(fetchDistributions({ limit: 500 }));
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Distribution Report</h1>

      {/* Filters */}
      <div className={styles.formCard}>
        <form onSubmit={handleSearch}>
          <div className={styles.filterRow}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label className={styles.label}>Material</label>
              <select 
                className={styles.select} 
                value={filters.materialId} 
                onChange={(e) => setFilters({ ...filters, materialId: e.target.value })}
              >
                <option value="">All Materials</option>
                {materials.map((m: any) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            
            <div style={{ flex: 1, minWidth: 200 }}>
              <label className={styles.label}>Batch</label>
              <select 
                className={styles.select} 
                value={filters.batchId} 
                onChange={(e) => setFilters({ ...filters, batchId: e.target.value })}
              >
                <option value="">All Batches</option>
                {batches.map((b: any) => <option key={b._id} value={b._id}>{b.batchName}</option>)}
              </select>
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <label className={styles.label}>Student ID</label>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="e.g. STU-001" 
                value={filters.studentId}
                onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
              />
            </div>

            <div style={{ flex: 1, minWidth: 150 }}>
              <label className={styles.label}>Start Date</label>
              <input 
                type="date" 
                className={styles.input} 
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div style={{ flex: 1, minWidth: 150 }}>
              <label className={styles.label}>End Date</label>
              <input 
                type="date" 
                className={styles.input} 
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', paddingBottom: 2 }}>
              <button type="submit" className={styles.btnPrimary}>Search</button>
              <button type="button" className={styles.btnSecondary} onClick={handleReset}>Reset</button>
            </div>
          </div>
        </form>
      </div>

      {/* Summary */}
      <div className={styles.selectedSummary}>
        <div className={`${styles.summaryBox} ${styles.blueBox}`}>
          <div>Total Distributions Found</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{total}</div>
        </div>
        <div className={`${styles.summaryBox} ${styles.greenBox}`}>
          <div>Total Quantity Distributed</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
            {distributions.reduce((sum: number, d: any) => sum + (Number(d.quantity) || 0), 0)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Material</th>
              <th>Student</th>
              <th>Batch</th>
              <th>Qty</th>
              <th>Distributed By</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className={styles.emptyState}>Loading report...</td></tr>
            ) : distributions.length === 0 ? (
              <tr><td colSpan={7} className={styles.emptyState}>No distribution records found</td></tr>
            ) : (
              distributions.map((d: any) => (
                <tr key={d._id}>
                  <td>
                    <div>{new Date(d.distributedAt).toLocaleDateString()}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(d.distributedAt).toLocaleTimeString()}</div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{d.materialId?.name || '—'}</td>
                  <td>
                    <div>{d.studentId?.studentName || '—'}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{d.studentId?.studentId || ''}</div>
                  </td>
                  <td><span className={styles.badge} style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>{d.batchId?.batchName || '—'}</span></td>
                  <td style={{ fontWeight: 600, color: '#10b981' }}>{d.quantity} <span style={{ fontSize: 11, fontWeight: 400 }}>{d.unit || ''}</span></td>
                  <td>{d.distributedBy?.username || '—'}</td>
                  <td>{d.remarks || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
