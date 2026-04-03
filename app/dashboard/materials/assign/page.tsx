'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMaterials, fetchBatchAssignments, assignToBatch, clearError, clearSuccess } from '@/api/materialsApi/materialsSlice';
import { fetchClasses } from '@/api/classApi/classSlice';
import { fetchBatches } from '@/api/batchApi/batchSlice';
import { toastManager } from '@/utils/toastConfig';
import styles from '@/components/materials/Materials.module.css';

export default function AssignToBatchPage() {
  const dispatch = useDispatch<any>();
  const { materials, assignments, actionLoading, error, success } = useSelector((state: any) => state.materials);
  const { classes } = useSelector((state: any) => state.class);
  const { batches } = useSelector((state: any) => state.batch);

  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'assign' | 'list'>('assign');

  useEffect(() => {
    dispatch(fetchMaterials({ limit: 1000, status: 'active' }));
    dispatch(fetchClasses({ limit: 1000 }));
    dispatch(fetchBatches({ limit: 1000 }));
    dispatch(fetchBatchAssignments({}));
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      toastManager.showSuccess('Material assigned to batches successfully');
      dispatch(clearSuccess());
      setSelectedBatches([]);
      setSelectedClass('');
      setSelectedMaterial('');
      dispatch(fetchBatchAssignments({}));
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch]);

  const filteredBatches = selectedClass 
    ? batches.filter((b: any) => b.class?._id === selectedClass || b.class === selectedClass)
    : [];

  const handleCheckbox = (batchId: string) => {
    if (selectedBatches.includes(batchId)) {
      setSelectedBatches(prev => prev.filter(id => id !== batchId));
    } else {
      setSelectedBatches(prev => [...prev, batchId]);
    }
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return toastManager.showError('Select a material');
    if (selectedBatches.length === 0) return toastManager.showError('Select at least one batch');
    
    dispatch(assignToBatch({
      materialId: selectedMaterial,
      batchIds: selectedBatches
    }));
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle}>Assign To Batch</h1>
        <div>
          <button 
            className={activeTab === 'assign' ? styles.btnPrimary : styles.btnSecondary} 
            style={{ marginRight: 8 }}
            onClick={() => setActiveTab('assign')}
          >
            Assign Form
          </button>
          <button 
            className={activeTab === 'list' ? styles.btnPrimary : styles.btnSecondary} 
            onClick={() => setActiveTab('list')}
          >
            Assignment List
          </button>
        </div>
      </div>

      {activeTab === 'assign' && (
        <div className={styles.formCard}>
          <form onSubmit={handleAssign}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={`${styles.label} ${styles.labelRequired}`}>Select Material</label>
                <select 
                  className={styles.select} 
                  value={selectedMaterial} 
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  required
                >
                  <option value="">-- Choose Material --</option>
                  {materials.map((m: any) => (
                    <option key={m._id} value={m._id}>{m.name} (Stock: {m.availableQuantity})</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Filter by Class (Optional)</label>
                <select 
                  className={styles.select} 
                  value={selectedClass} 
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedBatches([]); // Reset selection when class changes
                  }}
                >
                  <option value="">All Classes</option>
                  {classes.map((c: any) => (
                    <option key={c._id} value={c._id}>{c.classname}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginTop: 24, marginBottom: 24 }}>
              <label className={`${styles.label} ${styles.labelRequired}`}>Select Batches</label>
              {(selectedClass ? filteredBatches : batches).length === 0 ? (
                <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>No batches available for the selected class.</div>
              ) : (
                <div className={styles.checkboxGrid}>
                  {(selectedClass ? filteredBatches : batches).map((b: any) => (
                    <label key={b._id} className={styles.checkboxItem}>
                      <input 
                        type="checkbox" 
                        className={styles.checkboxInput}
                        checked={selectedBatches.includes(b._id)}
                        onChange={() => handleCheckbox(b._id)}
                      />
                      <span>{b.batchName} {selectedClass ? '' : `(${b.class?.classname || ''})`}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className={styles.btnPrimary} style={{ width: 200 }} disabled={actionLoading}>
              {actionLoading ? 'Assigning...' : 'Assign to Batches'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'list' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Material Name</th>
                <th>Batch Assigned</th>
                <th>Assigned Date</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr><td colSpan={4} className={styles.emptyState}>No assignments found.</td></tr>
              ) : (
                assignments.map((a: any, i: number) => (
                  <tr key={a._id}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{a.materialId?.name || '—'}</td>
                    <td><span className={styles.badge} style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>{a.batchId?.batchName || '—'}</span></td>
                    <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
