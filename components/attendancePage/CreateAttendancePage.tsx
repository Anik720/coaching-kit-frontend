// src/components/attendancePage/CreateAttendancePage.tsx
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
}

export default function CreateAttendancePage() {
  const {
    loading,
    error,
    success,
    submitAttendance,
    clearError,
    clearSuccess,
  } = useAttendance();

  const [classes, setClasses] = useState<Class[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [classStartingTime, setClassStartingTime] = useState<string>('');
  const [classEndingTime, setClassEndingTime] = useState<string>('');
  
  // To keep track of each student's attendance and remarks
  const [studentAttendance, setStudentAttendance] = useState<Record<string, string>>({});
  const [studentRemarks, setStudentRemarks] = useState<Record<string, string>>({});

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await attendanceApi.getClasses();
        const dataArray = response.data?.data || response.data?.classes || response.data || [];
        setClasses(Array.isArray(dataArray) ? dataArray : []);
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
          const dataArray = response.data?.data || response.data?.batches || response.data || [];
          setBatches(Array.isArray(dataArray) ? dataArray : []);
          setSelectedBatch('');
          setStudents([]);
        } catch (err: any) {
          toastManager.showError('Failed to load batches');
        }
      } else {
        setBatches([]);
        setSelectedBatch('');
        setStudents([]);
      }
    };
    loadBatches();
  }, [selectedClass]);

  useEffect(() => {
    const loadStudents = async () => {
      if (selectedClass && selectedBatch) {
        try {
          const response = await attendanceApi.getStudentsByClassBatch(selectedClass, selectedBatch);
          const rawStudents = response.data?.data || response.data?.students || response.data || [];
          const loadedStudents = Array.isArray(rawStudents) ? rawStudents : [];
          setStudents(loadedStudents);
          
          // Initialize attendance state with defaults (empty or 'present')
          const initialAttendance: Record<string, string> = {};
          loadedStudents.forEach((student: any) => {
            initialAttendance[student._id] = 'present'; // Default to present as per common practice
          });
          setStudentAttendance(initialAttendance);
          setStudentRemarks({});
          setFormErrors({});
        } catch (err: any) {
          toastManager.showError('Failed to load students');
          setStudents([]);
        }
      }
    };
    loadStudents();
  }, [selectedClass, selectedBatch]);

  useEffect(() => {
    if (error) {
      toastManager.showError(error);
      clearError();
    }
  }, [error, clearError]);

  useEffect(() => {
    if (success) {
      toastManager.showSuccess('Attendance submitted successfully');
      clearSuccess();
      // Reset form but optionally keep date/times
      setSelectedClass('');
      setSelectedBatch('');
      setStudents([]);
    }
  }, [success, clearSuccess]);

  const handleAttendanceChange = (studentId: string, type: string) => {
    setStudentAttendance(prev => ({ ...prev, [studentId]: type }));
  };

  const handleRemarkChange = (studentId: string, remark: string) => {
    setStudentRemarks(prev => ({ ...prev, [studentId]: remark }));
  };

  const handleGlobalAttendanceType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    if (type) {
      const newAttendance: Record<string, string> = {};
      students.forEach(student => {
        newAttendance[student._id] = type;
      });
      setStudentAttendance(newAttendance);
    }
  };

  const setAllAttendance = (type: 'present' | 'absent') => {
    const newAttendance: Record<string, string> = {};
    students.forEach(student => {
      newAttendance[student._id] = type;
    });
    setStudentAttendance(newAttendance);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!selectedClass) errors.class = 'Please select a class';
    if (!selectedBatch) errors.batch = 'Please select a batch';
    if (!attendanceDate) errors.date = 'Date is required';
    if (!classStartingTime) errors.startTime = 'Start time is required';
    if (!classEndingTime) errors.endTime = 'End time is required';
    
    // Optional: Validate if start time matches batch start time if backend passes it.
    // Assuming we do not have it in the Batch item interface for now, bypass.

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toastManager.showError('Please fill all required fields');
      return;
    }

    if (students.length === 0) {
      toastManager.showError('No students to submit attendance for');
      return;
    }

    submitAttendance({
      class: selectedClass,
      batch: selectedBatch,
      attendanceDate,
      classStartTime: classStartingTime,
      classEndTime: classEndingTime,
      records: students.map(student => ({
        student: student._id,
        status: studentAttendance[student._id] || 'present',
        remarks: studentRemarks[student._id] || '',
      })),
    });
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const lowerQuery = searchQuery.toLowerCase();
    return students.filter(
      (s: any) =>
        s.nameEnglish?.toLowerCase().includes(lowerQuery) ||
        s.registrationId?.toLowerCase().includes(lowerQuery)
    );
  }, [students, searchQuery]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>Students Attendance</h1>
            <p className={styles.pageSubtitle}>Create and submit attendance record</p>
          </div>
        </div>
      </div>

      <div className={styles.filterCard} style={{ 
        marginBottom: '2rem', 
        padding: '2rem', 
        backgroundColor: '#ffffff', 
        borderRadius: '12px', 
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Top Row: Class and Batch */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className={styles.filterField}>
              <label className={styles.filterLabel} style={{ fontWeight: 600, color: '#1f2937' }}>Select the class: <span className={styles.required}>*</span></label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className={`${styles.filterSelect} ${formErrors.class ? styles.inputError : ''}`}
                disabled={loading}
                style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db' }}
              >
                <option value="">Select the class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.classname}</option>)}
              </select>
              {formErrors.class && <span className={styles.errorMessage}>{formErrors.class}</span>}
            </div>

            <div className={styles.filterField}>
              <label className={styles.filterLabel} style={{ fontWeight: 600, color: '#1f2937' }}>Select the Batch: <span className={styles.required}>*</span></label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className={`${styles.filterSelect} ${formErrors.batch ? styles.inputError : ''}`}
                disabled={loading || !selectedClass}
                style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db' }}
              >
                <option value="">Select the batch</option>
                {batches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
              </select>
              {formErrors.batch && <span className={styles.errorMessage}>{formErrors.batch}</span>}
            </div>
          </div>

          {/* Bottom Row: Date, Time, Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem' }}>
            <div className={styles.filterField}>
              <label className={styles.filterLabel} style={{ fontWeight: 600, color: '#1f2937' }}>Attendance Date: <span className={styles.required}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className={`${styles.filterInput} ${formErrors.date ? styles.inputError : ''}`}
                  disabled={loading}
                  style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db', width: '100%', paddingRight: '2.5rem' }}
                />
              </div>
              {formErrors.date && <span className={styles.errorMessage}>{formErrors.date}</span>}
            </div>

            <div className={styles.filterField}>
              <label className={styles.filterLabel} style={{ fontWeight: 600, color: '#1f2937' }}>Class Starting Time: <span className={styles.required}>*</span></label>
              <input
                type="time"
                value={classStartingTime}
                onChange={(e) => setClassStartingTime(e.target.value)}
                className={`${styles.filterInput} ${formErrors.startTime ? styles.inputError : ''}`}
                disabled={loading}
                style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db', width: '100%' }}
              />
              {formErrors.startTime && <span className={styles.errorMessage}>{formErrors.startTime}</span>}
            </div>

            <div className={styles.filterField}>
              <label className={styles.filterLabel} style={{ fontWeight: 600, color: '#1f2937' }}>Class Ending Time: <span className={styles.required}>*</span></label>
              <input
                type="time"
                value={classEndingTime}
                onChange={(e) => setClassEndingTime(e.target.value)}
                className={`${styles.filterInput} ${formErrors.endTime ? styles.inputError : ''}`}
                disabled={loading}
                style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db', width: '100%' }}
              />
              {formErrors.endTime && <span className={styles.errorMessage}>{formErrors.endTime}</span>}
            </div>

            <div className={styles.filterField}>
              <label className={styles.filterLabel} style={{ fontWeight: 600, color: '#1f2937' }}>Attendance Type:</label>
              <select
                onChange={handleGlobalAttendanceType}
                className={styles.filterSelect}
                defaultValue="present"
                disabled={loading || students.length === 0}
                style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db' }}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      <div className={styles.tableCard} style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        padding: '2rem'
      }}>
        {/* Header for table section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Student List</h2>
          <input
            type="text"
            placeholder="Search student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.filterInput}
            style={{ width: '250px' }}
          />
        </div>

        <div className={styles.tableWrapper}>
          {loading && students.length === 0 ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinnerLarge}></div>
              <p>Loading students...</p>
            </div>
          ) : students.length === 0 ? (
             <div className={styles.emptyState}>
               <div className={styles.emptyIcon}>👥</div>
               <p>Please select a class and batch to view students.</p>
             </div>
          ) : (
            <table className={styles.table}>
              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '1rem', color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>#</th>
                  <th style={{ padding: '1rem', color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>PROFILE PIC</th>
                  <th style={{ padding: '1rem', color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>NAME</th>
                  <th style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      ABSENT
                      <input 
                        type="radio"
                        name="global-attendance"
                        onChange={() => setAllAttendance('absent')}
                        checked={students.length > 0 && Object.values(studentAttendance).every(status => status === 'absent')}
                        style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: '#ef4444' }}
                      />
                    </div>
                  </th>
                  <th style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      PRESENT
                      <input 
                        type="radio"
                        name="global-attendance"
                        onChange={() => setAllAttendance('present')}
                        checked={Object.values(studentAttendance).every(status => status === 'present') || Object.values(studentAttendance).length === 0}
                        style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: '#10b981' }}
                      />
                    </div>
                  </th>
                  <th style={{ padding: '1rem', color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>ID</th>
                  <th style={{ padding: '1rem', color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>INSTITUTE NAME</th>
                  <th style={{ padding: '1rem', color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>BATCH</th>
                  <th style={{ padding: '1rem', color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>CLASS</th>
                  <th style={{ padding: '1rem', color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>GROUP</th>
                  <th style={{ padding: '1rem', color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>GUARDIAN NUMBER</th>
                  <th style={{ padding: '1rem', color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>STUDENT NUMBER</th>
                  <th style={{ padding: '1rem', color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={student._id}>
                    <td>{index + 1}</td>
                    <td>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {student.nameEnglish?.charAt(0).toUpperCase() || '?'}
                      </div>
                    </td>
                    <td style={{ fontWeight: '500' }}>{student.nameEnglish}</td>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="radio" 
                        name={`attendance-${student._id}`} 
                        checked={studentAttendance[student._id] === 'absent'}
                        onChange={() => handleAttendanceChange(student._id, 'absent')}
                        style={{ width: '18px', height: '18px', accentColor: '#ef4444' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="radio" 
                        name={`attendance-${student._id}`} 
                        checked={studentAttendance[student._id] === 'present'}
                        onChange={() => handleAttendanceChange(student._id, 'present')}
                        style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                      />
                    </td>
                    <td>{student.registrationId}</td>
                    <td>{student.instituteName || 'N/A'}</td>
                    <td>{student.batch?.batchName || '-'}</td>
                    <td>{student.class?.classname || '-'}</td>
                    <td>{student.batch?.groupDetails?.groupName || '-'}</td>
                    <td>{student.fatherMobileNumber || '-'}</td>
                    <td>{student.studentMobileNumber || '-'}</td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Add remark" 
                        value={studentRemarks[student._id] || ''}
                        onChange={(e) => handleRemarkChange(student._id, e.target.value)}
                        className={styles.filterInput}
                        style={{ padding: '0.25rem 0.5rem', minWidth: '120px' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {students.length > 0 && (
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleSubmit} 
              className={styles.btnPrimary} 
              disabled={loading}
              style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
            >
              {loading ? 'Submitting...' : 'Submit Attendance'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
