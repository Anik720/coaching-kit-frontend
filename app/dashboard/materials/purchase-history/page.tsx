'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPurchaseHistory, fetchMaterials } from '@/api/materialsApi/materialsSlice';
import styles from '@/components/materials/Materials.module.css';

export default function PurchaseHistoryPage() {
  const dispatch = useDispatch<any>();
  const { purchases, materials, loading, total } = useSelector((state: any) => state.materials);

  const [filters, setFilters] = useState({
    materialId: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    dispatch(fetchMaterials({ limit: 1000 }));
    dispatch(fetchPurchaseHistory({ limit: 500 }));
  }, [dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query: any = { limit: 500 };
    Object.keys(filters).forEach(k => {
      if ((filters as any)[k]) query[k] = (filters as any)[k];
    });
    dispatch(fetchPurchaseHistory(query));
  };

  const handleReset = () => {
    setFilters({ materialId: '', startDate: '', endDate: '' });
    dispatch(fetchPurchaseHistory({ limit: 500 }));
  };

  const calculateTotalCost = () => {
    return purchases.reduce((sum: number, p: any) => sum + (Number(p.totalCost) || 0), 0);
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Purchase History</h1>

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
          <div>Total Purchase Records</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{total}</div>
        </div>
        <div className={`${styles.summaryBox} ${styles.greenBox}`}>
          <div>Total Cost for Filtered Data</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
            ৳ {calculateTotalCost().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              <th>Quantity Purchased</th>
              <th>Unit Cost</th>
              <th>Total Cost</th>
              <th>Added By</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className={styles.emptyState}>Loading history...</td></tr>
            ) : purchases.length === 0 ? (
              <tr><td colSpan={7} className={styles.emptyState}>No purchase records found</td></tr>
            ) : (
              purchases.map((p: any) => (
                <tr key={p._id}>
                  <td>
                    <div>{new Date(p.createdAt).toLocaleDateString()}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(p.createdAt).toLocaleTimeString()}</div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{p.materialId?.name || '—'}</td>
                  <td><span className={styles.badge} style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>+{p.quantity} {p.materialId?.purchaseUnit || ''}</span></td>
                  <td>৳ {p.unitCost?.toFixed(2)}</td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>৳ {p.totalCost?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>{p.createdBy?.username || '—'}</td>
                  <td>{p.remarks || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
