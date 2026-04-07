'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMaterials, fetchBatchAssignments, assignToBatch, updateBatchAssignment, clearError, clearSuccess } from '@/api/materialsApi/materialsSlice';
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

  // Pre-select already assigned batches when material changes
  useEffect(() => {
    if (selectedMaterial) {
      const alreadyAssigned = assignments
        .filter((a: any) => a.materialId?._id === selectedMaterial || a.materialId === selectedMaterial)
        .map((a: any) => a.batchId?._id || a.batchId);
      setSelectedBatches(alreadyAssigned);
    } else {
      setSelectedBatches([]);
    }
  }, [selectedMaterial, assignments]);

  useEffect(() => {
    if (success) {
      toastManager.showSuccess('Assignment updated successfully');
      dispatch(clearSuccess());
      dispatch(fetchBatchAssignments({}));
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch]);

  const filteredBatches = selectedClass
    ? batches.filter((b: any) => {
        const cls = b.className;
        return (typeof cls === 'object' ? cls?._id : cls) === selectedClass;
      })
    : [];

  // Batch IDs already assigned to the selected material (before any changes)
  const originalAssignedBatchIds = useMemo(() => {
    if (!selectedMaterial) return [];
    return assignments
      .filter((a: any) => a.materialId?._id === selectedMaterial || a.materialId === selectedMaterial)
      .map((a: any) => a.batchId?._id || a.batchId);
  }, [selectedMaterial, assignments]);

  const handleCheckbox = (batchId: string) => {
    if (selectedBatches.includes(batchId)) {
      setSelectedBatches(prev => prev.filter(id => id !== batchId));
    } else {
      setSelectedBatches(prev => [...prev, batchId]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return toastManager.showError('Select a material');

    const isUpdate = originalAssignedBatchIds.length > 0;

    if (isUpdate) {
      dispatch(updateBatchAssignment({
        materialId: selectedMaterial,
        batchIds: selectedBatches
      }));
    } else {
      if (selectedBatches.length === 0) return toastManager.showError('Select at least one batch');
      dispatch(assignToBatch({
        materialId: selectedMaterial,
        batchIds: selectedBatches
      }));
    }
  };

  const displayBatches = selectedClass ? filteredBatches : batches;

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
          <form onSubmit={handleSave}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={`${styles.label} ${styles.labelRequired}`}>Select Material</label>
                <select
                  className={styles.select}
                  value={selectedMaterial}
                  onChange={(e) => {
                    setSelectedMaterial(e.target.value);
                    setSelectedClass('');
                  }}
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
                  onChange={(e) => setSelectedClass(e.target.value)}
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
              {selectedMaterial && originalAssignedBatchIds.length > 0 && (
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                  Already assigned batches are pre-selected. Uncheck to remove assignment.
                </p>
              )}
              {displayBatches.length === 0 ? (
                <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>
                  {selectedClass ? 'No batches available for the selected class.' : 'No batches found.'}
                </div>
              ) : (
                <div className={styles.checkboxGrid}>
                  {displayBatches.map((b: any) => {
                    const isAlreadyAssigned = originalAssignedBatchIds.includes(b._id);
                    return (
                      <label key={b._id} className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          className={styles.checkboxInput}
                          checked={selectedBatches.includes(b._id)}
                          onChange={() => handleCheckbox(b._id)}
                        />
                        <span>
                          {b.batchName}
                          {!selectedClass && ` (${typeof b.className === 'object' ? b.className?.classname : b.className || ''})`}
                          {isAlreadyAssigned && (
                            <span style={{ marginLeft: 6, fontSize: 11, color: '#16a34a', fontWeight: 600, background: '#dcfce7', borderRadius: 4, padding: '1px 6px' }}>
                              Assigned
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <button type="submit" className={styles.btnPrimary} style={{ width: 200 }} disabled={actionLoading || !selectedMaterial}>
              {actionLoading ? 'Saving...' : originalAssignedBatchIds.length > 0 ? 'Update Assignment' : 'Assign to Batches'}
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
