'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssignedForBatch, distributeMaterial, clearError, clearSuccess, clearAssignedForBatch } from '@/api/materialsApi/materialsSlice';
import { fetchClasses } from '@/api/classApi/classSlice';
import { fetchBatches } from '@/api/batchApi/batchSlice';
import { fetchAdmissions } from '@/api/admissionApi/admissionSlice';
import { toastManager } from '@/utils/toastConfig';
import styles from '@/components/materials/Materials.module.css';

export default function DistributeMaterialPage() {
  const dispatch = useDispatch<any>();
  
  const { assignedForBatch, actionLoading, error, success } = useSelector((state: any) => state.materials);
  const { classes } = useSelector((state: any) => state.class);
  const { batches } = useSelector((state: any) => state.batch);
  const { admissions, loading: studentsLoading } = useSelector((state: any) => state.admission);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // Array of { studentId: string, _id: string, name: string, rollNo: string, checked: boolean, qty: number }
  const [studentList, setStudentList] = useState<any[]>([]);

  // Initial load
  useEffect(() => {
    dispatch(fetchClasses({ limit: 1000 }));
    dispatch(fetchBatches({ limit: 1000 }));
    return () => { dispatch(clearAssignedForBatch()); }
  }, [dispatch]);

  // Load Materials & Students when Batch changes
  useEffect(() => {
    if (selectedBatch) {
      dispatch(fetchAssignedForBatch(selectedBatch));
      // Fetch admissions (students) in this batch
      dispatch(fetchAdmissions({ selectBatch: selectedBatch, selectClass: selectedClass, limit: 1000 } as any));
      setSelectedMaterial('');
    } else {
      dispatch(clearAssignedForBatch());
      setStudentList([]);
    }
  }, [selectedBatch, dispatch]);

  // Update table when students (admissions) change
  useEffect(() => {
    if (admissions && admissions.length > 0 && selectedBatch) {
      // Setup the checklist
      const mapped = admissions.map((a: any) => ({
        _id: a._id, // This is admission ID (studentId in our schema)
        studentId: a.studentId, // system ID
        name: a.studentName,
        rollNo: a.rollNo,
        checked: false,
        qty: 1
      }));
      setStudentList(mapped);
    } else {
      setStudentList([]);
    }
  }, [admissions, selectedBatch]);

  useEffect(() => {
    if (success) {
      toastManager.showSuccess('Material distributed successfully!');
      dispatch(clearSuccess());
      // reset checklist
      setStudentList(prev => prev.map(s => ({ ...s, checked: false, qty: 1 })));
      // refresh stock
      dispatch(fetchAssignedForBatch(selectedBatch)); 
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearError());
    }
  }, [success, error, selectedBatch, dispatch]);

  const filteredBatches = selectedClass 
    ? batches.filter((b: any) => b.class?._id === selectedClass || b.class === selectedClass)
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

  const handleDistribute = () => {
    if (!selectedBatch) return toastManager.showError('Select a batch first');
    if (!selectedMaterial) return toastManager.showError('Select a material');
    
    const mat = assignedForBatch.find((m: any) => m._id === selectedMaterial);
    if (!mat) return toastManager.showError('Invalid material selected');

    const selectedStudents = studentList.filter(s => s.checked);
    if (selectedStudents.length === 0) return toastManager.showError('Select at least one student');

    // Calculate total needed
    let totalNeeded = 0;
    const distributions = selectedStudents.map(s => {
      totalNeeded += Number(s.qty);
      return { studentId: s._id, quantity: Number(s.qty) };
    });

    if (totalNeeded > mat.availableQuantity) {
      return toastManager.showError(`Insufficient stock. Need ${totalNeeded}, have ${mat.availableQuantity}`);
    }

    dispatch(distributeMaterial({
      materialId: selectedMaterial,
      batchId: selectedBatch,
      unit: mat.sellingUnit,
      remarks,
      distributions
    }));
  };

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
          <select className={styles.select} value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
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
        <div style={{ color: '#ef4444', marginBottom: 20, fontSize: 13 }}>
          No materials are assigned to this batch. Please assign materials first.
        </div>
      )}

      {/* Student List for Distribution */}
      {selectedBatch && selectedMaterial && (
        <div className={styles.tableContainer} style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Students List</h2>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input 
                type="text" 
                className={styles.input} 
                style={{ width: 250, padding: '6px 12px' }} 
                placeholder="Remarks (e.g. For March Model Test)" 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
              <button className={styles.btnSuccess} onClick={handleDistribute} disabled={actionLoading}>
                {actionLoading ? 'Processing...' : 'Distribute Now'}
              </button>
            </div>
          </div>
          
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input 
                    type="checkbox" 
                    className={styles.checkboxInput}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={studentList.length > 0 && studentList.every(s => s.checked)}
                  />
                </th>
                <th>Admission ID</th>
                <th>Student Name</th>
                <th>Roll No</th>
                <th style={{ width: 150 }}>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {studentsLoading ? (
                <tr><td colSpan={5} className={styles.emptyState}>Loading students...</td></tr>
              ) : studentList.length === 0 ? (
                <tr><td colSpan={5} className={styles.emptyState}>No active students found in this batch.</td></tr>
              ) : (
                studentList.map((stu, i) => (
                  <tr key={stu._id}>
                    <td>
                      <input 
                        type="checkbox" 
                        className={styles.checkboxInput}
                        checked={stu.checked}
                        onChange={(e) => handleCheckStudent(stu._id, e.target.checked)}
                      />
                    </td>
                    <td style={{ color: '#64748b' }}>{stu.studentId}</td>
                    <td style={{ fontWeight: 500 }}>{stu.name}</td>
                    <td>{stu.rollNo}</td>
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
