// src/components/attendancePage/MonthlyGridPage.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAttendance } from '@/hooks/useAttendance';
import attendanceApi from '@/api/attendanceApi/attendanceApi';
import { toastManager } from '@/utils/toastConfig';
import styles from './Attendance.module.css';

interface Class {
  _id: string;
  classname: string;
}

interface Batch {
  _id: string;
  batchName: string;
  sessionYear: string;
  class?: {
    _id: string;
    classname: string;
  };
}

export default function MonthlyGridPage() {
  const {
    monthlyGridData,
    loading,
    error,
    fetchMonthlyGrid,
    clearError,
  } = useAttendance();

  const [classes, setClasses] = useState<Class[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('');
  const [studentIdFilter, setStudentIdFilter] = useState<string>('');

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await attendanceApi.getClasses();
        setClasses(response.data.classes || response.data);
      } catch (err: any) {
        toastManager.showError('Failed to load classes');
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    const loadBatches = async () => {
      if (selectedClass) {
        try {
          const response = await attendanceApi.getBatches(selectedClass);
          setBatches(response.data.batches || response.data);
          setSelectedBatch('');
        } catch (err: any) {
          toastManager.showError('Failed to load batches');
        }
      } else {
        setBatches([]);
        setSelectedBatch('');
      }
    };
    loadBatches();
  }, [selectedClass]);

  useEffect(() => {
    if (error) {
      toastManager.showError(error);
      clearError();
    }
  }, [error, clearError]);

  const handleSearch = () => {
    if (!selectedClass || !selectedBatch || !selectedMonthYear) {
      toastManager.showError('Please select class, batch, and month');
      return;
    }
    const [year, month] = selectedMonthYear.split('-');
    fetchMonthlyGrid(selectedClass, selectedBatch, parseInt(month, 10), parseInt(year, 10));
  };

  const handleReset = () => {
    setSelectedClass('');
    setSelectedBatch('');
    setSelectedMonthYear('');
    setStudentIdFilter('');
  };

  const filteredStudents = useMemo(() => {
    if (!monthlyGridData?.students) return [];
    if (!studentIdFilter) return monthlyGridData.students;
    return monthlyGridData.students.filter((s: any) => 
      s.studentId.toLowerCase().includes(studentIdFilter.toLowerCase())
    );
  }, [monthlyGridData, studentIdFilter]);

  // Extract class name and batch name for header
  const headerClass = classes.find(c => c._id === monthlyGridData?.classId)?.classname || '';
  const headerBatch = batches.find(b => b._id === monthlyGridData?.batchId)?.batchName || '';
  const headerMonth = monthlyGridData ? `${new Date(monthlyGridData.year, monthlyGridData.month - 1).toLocaleString('default', { month: 'long' })} ${monthlyGridData.year}` : '';

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>Student Attendance List</h1>
            <p className={styles.pageSubtitle}>Monthly view of student attendance</p>
          </div>
        </div>
      </div>

      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Student ID</label>
            <input
              type="text"
              placeholder="Enter Student ID"
              value={studentIdFilter}
              onChange={(e) => setStudentIdFilter(e.target.value)}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.classname}</option>)}
            </select>
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className={styles.filterSelect}
              disabled={!selectedClass}
            >
              <option value="">Select Batch</option>
              {batches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
            </select>
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Month</label>
            <input
              type="month"
              value={selectedMonthYear}
              onChange={(e) => setSelectedMonthYear(e.target.value)}
              className={styles.filterInput}
            />
          </div>
        </div>
        <div className={styles.filterActions} style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <button onClick={() => toastManager.showInfo('Excel download not implemented yet')} className={`${styles.btnSecondary} ${styles.btnExport}`} type="button" style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}>
            Download Excel
          </button>
          <button onClick={handleSearch} className={styles.btnPrimary} type="button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button onClick={handleReset} className={styles.btnSecondary} type="button" style={{ backgroundColor: '#6b7280', color: 'white', border: 'none' }}>
            Reset
          </button>
        </div>
      </div>

      <div className={styles.tableCard} style={{ marginTop: '2rem' }}>
        {monthlyGridData && !loading && (
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '2rem', fontWeight: 'bold' }}>
            <span>Class: {headerClass}</span>
            <span>Batch: {headerBatch}</span>
            <span>Month: {headerMonth}</span>
          </div>
        )}

        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinnerLarge}></div>
              <p>Loading grid...</p>
            </div>
          ) : !monthlyGridData ? (
             <div className={styles.emptyState}>
               <div className={styles.emptyIcon}>📅</div>
               <p>Please select class, batch, and month to view attendance.</p>
             </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}>#</th>
                  <th style={{ textAlign: 'left' }}>Student ID</th>
                  <th style={{ textAlign: 'left' }}>Name</th>
                  <th style={{ textAlign: 'left' }}>Institute</th>
                  {monthlyGridData.dates.map((dateStr: string) => {
                    const day = dateStr.split('-')[2];
                    return <th key={dateStr} style={{ textAlign: 'center' }}>{day}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4 + monthlyGridData.dates.length} style={{ textAlign: 'center' }}>No students found</td>
                  </tr>
                ) : (
                  filteredStudents.map((student: any, index: number) => (
                    <tr key={student._id}>
                      <td style={{ textAlign: 'center' }}>{index + 1}</td>
                      <td>{student.studentId}</td>
                      <td>{student.name}</td>
                      <td>{student.institute}</td>
                      {monthlyGridData.dates.map((dateStr: string) => {
                        const status = student.attendance[dateStr] || '-';
                        let color = '';
                        if (status === 'P') color = '#10b981';
                        else if (status === 'A') color = '#ef4444';
                        else if (status === 'L') color = '#f59e0b';
                        else if (status === 'LV') color = '#3b82f6';
                        
                        return (
                          <td key={dateStr} style={{ color, fontWeight: 'bold', textAlign: 'center' }}>
                            {status}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
