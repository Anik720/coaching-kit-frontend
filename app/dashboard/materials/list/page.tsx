'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMaterials, addStock, clearError, clearSuccess } from '@/api/materialsApi/materialsSlice';
import { toastManager } from '@/utils/toastConfig';
import styles from '@/components/materials/Materials.module.css';

export default function MaterialListPage() {
  const dispatch = useDispatch<any>();
  const { materials, loading, actionLoading, error, success } = useSelector((state: any) => state.materials);

  const [stockModal, setStockModal] = useState<{ isOpen: boolean; materialId: string; materialName: string } | null>(null);
  const [stockData, setStockData] = useState({ quantity: '', unitCost: '', remarks: '' });

  useEffect(() => {
    dispatch(fetchMaterials({ limit: 1000 }));
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      if (stockModal?.isOpen) {
        toastManager.showSuccess('Stock added successfully!');
        setStockModal(null);
        setStockData({ quantity: '', unitCost: '', remarks: '' });
      }
      dispatch(clearSuccess());
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearError());
    }
  }, [success, error, stockModal, dispatch]);

  const handleOpenStockModal = (mat: any) => {
    setStockModal({ isOpen: true, materialId: mat._id, materialName: mat.name });
    setStockData({ quantity: '', unitCost: mat.purchaseCost.toString() || '0', remarks: '' });
  };

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModal) return;
    if (!stockData.quantity || Number(stockData.quantity) <= 0) return toastManager.showError('Valid quantity is required');

    dispatch(addStock({
      id: stockModal.materialId,
      data: {
        quantity: Number(stockData.quantity),
        unitCost: Number(stockData.unitCost) || 0,
        remarks: stockData.remarks
      }
    }));
  };

  const statusBadge = (txt: string) => {
    if (txt === 'In Stock') return styles.badgeInStock;
    if (txt === 'Low Stock') return styles.badgeLowStock;
    if (txt === 'Out Of Stock') return styles.badgeOutStock;
    return '';
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Material List</h1>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Material Name</th>
              <th>Category</th>
              <th>Total Stock</th>
              <th>Available</th>
              <th>Distributed</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className={styles.emptyState}>Loading materials...</td></tr>
            ) : materials.length === 0 ? (
              <tr><td colSpan={8} className={styles.emptyState}>No materials found. Please create one.</td></tr>
            ) : (
              materials.map((mat: any, i: number) => (
                <tr key={mat._id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{mat.name}</td>
                  <td>{mat.categoryId?.name || '—'}</td>
                  <td>{mat.totalQuantity} <span style={{ fontSize: 11, color: '#64748b' }}>{mat.purchaseUnit}</span></td>
                  <td style={{ fontWeight: 600, color: mat.availableQuantity === 0 ? '#ef4444' : '#10b981' }}>
                    {mat.availableQuantity}
                  </td>
                  <td>{mat.distributedQuantity}</td>
                  <td>
                    <span className={`${styles.badge} ${statusBadge(mat.stockStatus)}`}>
                      {mat.stockStatus}
                    </span>
                  </td>
                  <td>
                    <button className={styles.btnSecondary} style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleOpenStockModal(mat)}>
                      + Add Stock
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Very basic modal for Add Stock */}
      {stockModal?.isOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className={styles.formCard} style={{ width: 400, margin: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Add Stock to {stockModal.materialName}</h2>
            <form onSubmit={handleAddStock}>
              <div className={styles.formGroup} style={{ marginBottom: 12 }}>
                <label className={styles.labelRequired}>Quantity to Add</label>
                <input type="number" min="1" step="any" className={styles.input} required value={stockData.quantity} onChange={(e) => setStockData({ ...stockData, quantity: e.target.value })} />
              </div>
              <div className={styles.formGroup} style={{ marginBottom: 12 }}>
                <label className={styles.labelRequired}>Cost Per Unit (৳)</label>
                <input type="number" min="0" step="any" className={styles.input} required value={stockData.unitCost} onChange={(e) => setStockData({ ...stockData, unitCost: e.target.value })} />
              </div>
              <div className={styles.formGroup} style={{ marginBottom: 20 }}>
                <label className={styles.label}>Remarks (Optional)</label>
                <textarea className={styles.textarea} style={{ minHeight: 60 }} value={stockData.remarks} onChange={(e) => setStockData({ ...stockData, remarks: e.target.value })}></textarea>
              </div>
              <div className={styles.btnGroup}>
                <button type="submit" className={styles.btnSuccess} disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Confirm'}
                </button>
                <button type="button" className={styles.btnSecondary} onClick={() => setStockModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
