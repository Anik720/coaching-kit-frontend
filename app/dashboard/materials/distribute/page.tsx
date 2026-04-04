'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAssignedForBatch,
  fetchDistributions,
  upsertDistribution,
  clearError,
  clearSuccess,
  clearAssignedForBatch,
} from '@/api/materialsApi/materialsSlice';
import { fetchClasses } from '@/api/classApi/classSlice';
import { fetchBatches } from '@/api/batchApi/batchSlice';
import { fetchStudents } from '@/api/studentApi/studentSlice';
import { toastManager } from '@/utils/toastConfig';
import styles from '@/components/materials/Materials.module.css';

export default function DistributeMaterialPage() {
  const dispatch = useDispatch<any>();

  const { assignedForBatch, distributions, actionLoading, error, success } = useSelector((state: any) => state.materials);
  const { classes } = useSelector((state: any) => state.class);
  const { batches } = useSelector((state: any) => state.batch);
  const { students, loading: studentsLoading } = useSelector((state: any) => state.student);

  const prefillDoneRef = useRef(false);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [remarks, setRemarks] = useState('');
  const [studentList, setStudentList] = useState<any[]>([]);
  const [bulkQty, setBulkQty] = useState(1);

  // Initial load
  useEffect(() => {
    dispatch(fetchClasses({ limit: 1000 }));
    dispatch(fetchBatches({ limit: 1000 }));
    return () => { dispatch(clearAssignedForBatch()); };
  }, [dispatch]);

  // Load materials & students when batch changes
  useEffect(() => {
    if (selectedBatch) {
      dispatch(fetchAssignedForBatch(selectedBatch));
      dispatch(fetchStudents({ batch: selectedBatch, limit: 1000 }));
      setSelectedMaterial('');
    } else {
      dispatch(clearAssignedForBatch());
      setStudentList([]);
    }
  }, [selectedBatch, dispatch]);

  // Load existing distributions when material is selected
  useEffect(() => {
    prefillDoneRef.current = false; // reset on material change so pre-fill runs fresh
    if (selectedBatch && selectedMaterial) {
      dispatch(fetchDistributions({ batchId: selectedBatch, materialId: selectedMaterial, limit: 1000 }));
    }
  }, [selectedBatch, selectedMaterial, dispatch]);

  // Build student list when students load (batch change)
  useEffect(() => {
    if (students && students.length > 0 && selectedBatch) {
      setStudentList(students.map((s: any) => ({
        _id: s._id,
        registrationId: s.registrationId,
        name: s.nameEnglish,
        mobile: s.fatherMobileNumber,
        checked: true,
        qty: 1,
        alreadyDistributed: false,
      })));
    } else if (!studentsLoading && selectedBatch) {
      setStudentList([]);
    }
  }, [students, selectedBatch, studentsLoading]);

  // Pre-fill quantities from existing distributions (only once per material selection)
  useEffect(() => {
    if (!distributions || distributions.length === 0) return;
    if (prefillDoneRef.current) return; // don't override user edits (e.g. bulk qty)
    const distMap: Record<string, number> = {};
    distributions.forEach((d: any) => {
      const sid = (d.studentId?._id || d.studentId)?.toString();
      if (sid) distMap[sid] = d.quantity;
    });
    setStudentList(prev =>
      prev.map(s => ({
        ...s,
        qty: distMap[s._id.toString()] ?? s.qty,
        alreadyDistributed: s._id.toString() in distMap,
        checked: s._id.toString() in distMap, // reflect who actually has a distribution
      }))
    );
    prefillDoneRef.current = true;
  }, [distributions]);

  useEffect(() => {
    if (success) {
      toastManager.showSuccess('Distribution saved successfully!');
      dispatch(clearSuccess());
      // Update flags locally for immediate UI feedback
      setStudentList(prev => prev.map(s => ({
        ...s,
        alreadyDistributed: s.checked ? true : false,
      })));
      // Re-fetch both — prefillDoneRef is already true so Effect 2 won't override user edits
      // This keeps distributions state fresh (accurate validation on next save)
      // and updates the available qty shown in the material dropdown
      if (selectedBatch && selectedMaterial) {
        dispatch(fetchDistributions({ batchId: selectedBatch, materialId: selectedMaterial, limit: 1000 }));
        dispatch(fetchAssignedForBatch(selectedBatch));
      }
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearError());
    }
  }, [success, error, selectedBatch, selectedMaterial, dispatch]);

  const filteredBatches = selectedClass
    ? batches.filter((b: any) => {
        const cls = b.className;
        return (typeof cls === 'object' ? cls?._id : cls) === selectedClass;
      })
    : [];

  const handleSelectAll = (checked: boolean) => {
    setStudentList(prev => prev.map(s => ({ ...s, checked })));
  };

  const handleCheckStudent = (id: string, checked: boolean) => {
    setStudentList(prev => prev.map(s => s._id === id ? { ...s, checked } : s));
  };

  const handleChangeQty = (id: string, qty: number) => {
    setStudentList(prev => prev.map(s => s._id === id ? { ...s, qty } : s));
  };

  const handleBulkQtyChange = (raw: string) => {
    const qty = raw === '' || isNaN(Number(raw)) ? 0 : Math.max(0, Math.floor(Number(raw)));
    setBulkQty(qty);
    setStudentList(prev => prev.map(s => ({ ...s, qty })));
  };

  const handleSave = () => {
    if (!selectedBatch) return toastManager.showError('Select a batch first');
    if (!selectedMaterial) return toastManager.showError('Select a material');

    const mat = assignedForBatch.find((m: any) => m._id === selectedMaterial);
    if (!mat) return toastManager.showError('Invalid material selected');

    const selectedStudents = studentList.filter(s => s.checked);
    if (selectedStudents.length === 0) return toastManager.showError('Select at least one student');

    // Validate qty >= 1 for each student
    const zeroQty = selectedStudents.find(s => s.qty < 1);
    if (zeroQty) return toastManager.showError(`Quantity must be at least 1 for all selected students`);

    // Stock validation: net new stock needed = total requested - already distributed (those get returned first)
    const totalRequested = selectedStudents.reduce((sum, s) => sum + Number(s.qty), 0);
    const alreadyDistributedTotal = selectedStudents
      .filter(s => s.alreadyDistributed)
      .reduce((sum, s) => {
        const existing = distributions.find((d: any) =>
          (d.studentId?._id || d.studentId)?.toString() === s._id.toString()
        );
        return sum + (existing?.quantity || 0);
      }, 0);
    const netStockNeeded = totalRequested - alreadyDistributedTotal;
    if (netStockNeeded > mat.availableQuantity) {
      return toastManager.showError(
        `Insufficient stock. Need ${netStockNeeded} more unit(s), only ${mat.availableQuantity} available.`
      );
    }

    dispatch(upsertDistribution({
      materialId: selectedMaterial,
      batchId: selectedBatch,
      unit: mat.sellingUnit,
      remarks,
      distributions: selectedStudents.map(s => ({
        studentId: s._id,
        quantity: Number(s.qty),
      })),
    }));
  };

  const checkedCount = studentList.filter(s => s.checked).length;
  const allChecked = studentList.length > 0 && studentList.every(s => s.checked);
  const hasExistingDistributions = studentList.some(s => s.alreadyDistributed);

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Distribute Material</h1>

      {/* Selection Row */}
      <div className={styles.filterRow} style={{ backgroundColor: 'white', padding: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <div style={{ flex: 1 }}>
          <label className={styles.label}>1. Select Class</label>
          <select className={styles.select} value={selectedClass} onChange={(e) => {
            setSelectedClass(e.target.value);
            setSelectedBatch('');
          }}>
            <option value="">-- Choose Class --</option>
            {classes.map((c: any) => <option key={c._id} value={c._id}>{c.classname}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className={styles.labelRequired}>2. Select Batch</label>
          <select className={styles.select} value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} disabled={!selectedClass}>
            <option value="">-- Choose Batch --</option>
            {filteredBatches.map((b: any) => <option key={b._id} value={b._id}>{b.batchName}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className={styles.labelRequired}>3. Select Material</label>
          <select className={styles.select} value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)} disabled={!selectedBatch}>
            <option value="">-- Available Materials --</option>
            {assignedForBatch.map((m: any) => (
              <option key={m._id} value={m._id} disabled={m.availableQuantity === 0}>
                {m.name} (Available: {m.availableQuantity})
              </option>
            ))}
          </select>
        </div>
      </div>

      {assignedForBatch.length === 0 && selectedBatch && (
        <div style={{ color: '#ef4444', marginTop: 12, fontSize: 13 }}>
          No materials are assigned to this batch. Please assign materials first.
        </div>
      )}

      {/* Student List */}
      {selectedBatch && selectedMaterial && (
        <div className={styles.tableContainer} style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>
                Students List
                {studentList.length > 0 && (
                  <span style={{ fontWeight: 400, fontSize: 13, color: '#64748b', marginLeft: 8 }}>
                    ({checkedCount}/{studentList.length} selected)
                  </span>
                )}
              </h2>
              {hasExistingDistributions && (
                <span style={{ fontSize: 12, color: '#16a34a', background: '#dcfce7', borderRadius: 4, padding: '2px 8px', fontWeight: 500 }}>
                  Previously distributed — editing mode
                </span>
              )}
              {studentList.length > 0 && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className={styles.btnSecondary} style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleSelectAll(true)}>
                    Select All
                  </button>
                  <button type="button" className={styles.btnSecondary} style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleSelectAll(false)}>
                    Deselect All
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {studentList.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Bulk Qty:</span>
                  <input
                    type="number"
                    min="1"
                    className={styles.input}
                    style={{ width: 70, padding: '5px 8px' }}
                    value={bulkQty}
                    onChange={(e) => handleBulkQtyChange(e.target.value)}
                  />
                </div>
              )}
              <input
                type="text"
                className={styles.input}
                style={{ width: 220, padding: '6px 12px' }}
                placeholder="Remarks (e.g. For March Model Test)"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
              <button className={styles.btnSuccess} onClick={handleSave} disabled={actionLoading}>
                {actionLoading ? 'Saving...' : hasExistingDistributions ? 'Update Distribution' : 'Distribute Now'}
              </button>
            </div>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" className={styles.checkboxInput} onChange={(e) => handleSelectAll(e.target.checked)} checked={allChecked} />
                </th>
                <th>Registration ID</th>
                <th>Student Name</th>
                <th>Father's Mobile</th>
                <th style={{ width: 160 }}>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {studentsLoading ? (
                <tr><td colSpan={5} className={styles.emptyState}>Loading students...</td></tr>
              ) : studentList.length === 0 ? (
                <tr><td colSpan={5} className={styles.emptyState}>No students found in this batch.</td></tr>
              ) : (
                studentList.map((stu) => (
                  <tr key={stu._id} style={{ opacity: stu.checked ? 1 : 0.5 }}>
                    <td>
                      <input type="checkbox" className={styles.checkboxInput} checked={stu.checked} onChange={(e) => handleCheckStudent(stu._id, e.target.checked)} />
                    </td>
                    <td style={{ color: '#64748b' }}>{stu.registrationId}</td>
                    <td style={{ fontWeight: 500 }}>
                      {stu.name}
                      {stu.alreadyDistributed && (
                        <span style={{ marginLeft: 6, fontSize: 11, color: '#16a34a', background: '#dcfce7', borderRadius: 4, padding: '1px 5px' }}>
                          Distributed
                        </span>
                      )}
                    </td>
                    <td>{stu.mobile}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        className={styles.input}
                        style={{ padding: '6px 10px' }}
                        value={stu.qty}
                        onChange={(e) => handleChangeQty(stu._id, Number(e.target.value))}
                        disabled={!stu.checked}
                      />
                    </td>
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
