"use client";

import React, { useState, useEffect, useMemo } from 'react';
import styles from './ResultEntryTable.module.css';
import { Exam } from '@/api/result-management/create-exam/types/exam.types';

interface Student {
  _id: string;
  studentId: string;
  registrationId: string;
  name: string;
  nameEnglish?: string;
}

interface StudentResult {
  mcq: string;
  cq: string;
  written: string;
  is_absent: boolean;
  total: number;
  grade: string;
  gpa: string;
  isPassed: boolean;
}

interface ResultEntryTableProps {
  exam: Exam | null;
  students: Student[];
  existingResults?: any[];
  loading: boolean;
  onSave: (results: Record<string, any>) => void;
  saving: boolean;
}

export default function ResultEntryTable({ exam, students, existingResults = [], loading, onSave, saving }: ResultEntryTableProps) {
  const [results, setResults] = useState<Record<string, StudentResult>>({});
  const [searchName, setSearchName] = useState("");
  const [searchReg, setSearchReg] = useState("");

  // Initialize results when students change
  useEffect(() => {
    // Only initialize if we have students and results object is empty, OR if we want to repopulate when existingResults arrives
    const isInitialLoad = students.length > 0 && Object.keys(results).length === 0;
    const hasExistingDataToLoad = existingResults.length > 0 && students.length > 0 && Object.keys(results).length === 0;

    if (isInitialLoad || hasExistingDataToLoad) {
      const initial: Record<string, StudentResult> = {};
      students.forEach(s => {
        const studentIdToCheck = s._id;
        // See if we have an existing result for this student
        const existingResult = existingResults.find(er => er.student?._id === studentIdToCheck || er.student === studentIdToCheck);
        
        if (existingResult) {
          initial[s._id] = {
            mcq: existingResult.mcq != null ? String(existingResult.mcq) : "",
            cq: existingResult.cq != null ? String(existingResult.cq) : "",
            written: existingResult.written != null ? String(existingResult.written) : "",
            is_absent: existingResult.isAbsent || false,
            total: existingResult.obtainedMarks || existingResult.totalMarks || existingResult.total || 0,
            grade: existingResult.grade || "N/A",
            gpa: existingResult.gpa != null ? String(existingResult.gpa) : "N/A",
            isPassed: existingResult.isPassed || false
          };
        } else {
          initial[s._id] = {
            mcq: "",
            cq: "",
            written: "",
            is_absent: false,
            total: 0,
            grade: "N/A",
            gpa: "N/A",
            isPassed: false
          };
        }
      });
      setResults(initial);
    }
  }, [students, existingResults]);

  const hasMcq = !!exam?.marksFields?.find(f => f.type === 'mcq');
  const hasCq = !!exam?.marksFields?.find(f => f.type === 'cq');
  const hasWritten = !!exam?.marksFields?.find(f => f.type === 'written');

  const calculateStudentResult = (studentId: string, currentResults: Record<string, StudentResult>) => {
    if (!exam) return;
    
    const res = currentResults[studentId];
    if (!res) return;

    if (res.is_absent) {
      res.total = 0;
      res.grade = "F";
      res.gpa = "0.00";
      res.isPassed = false;
      return;
    }

    const mcqVal = parseFloat(res.mcq) || 0;
    const cqVal = parseFloat(res.cq) || 0;
    const writtenVal = parseFloat(res.written) || 0;

    const total = mcqVal + cqVal + writtenVal;
    res.total = total;

    // Simple grading logic (can be expanded based on your specific rules)
    if (exam.enableGrading) {
       const percentage = (total / (exam.totalMarks || 1)) * 100;
       let grade = "F";
       let gpa = "0.00";
       let passed = true;

       if (percentage >= 80) { grade = "A+"; gpa = "5.00"; }
       else if (percentage >= 70) { grade = "A"; gpa = "4.00"; }
       else if (percentage >= 60) { grade = "A-"; gpa = "3.50"; }
       else if (percentage >= 50) { grade = "B"; gpa = "3.00"; }
       else if (percentage >= 40) { grade = "C"; gpa = "2.00"; }
       else if (percentage >= 33) { grade = "D"; gpa = "1.00"; }
       else { grade = "F"; gpa = "0.00"; passed = false; }

       res.grade = grade;
       res.gpa = gpa;
       res.isPassed = passed;
    } else {
       res.isPassed = total >= (exam.totalPassMarks || 0);
    }
  };

  const handleChange = (studentId: string, field: 'mcq' | 'cq' | 'written', value: string) => {
    setResults(prev => {
      const next = { ...prev };
      if (!next[studentId]) return prev;
      next[studentId] = { ...next[studentId], [field]: value };
      calculateStudentResult(studentId, next);
      return next;
    });
  };

  const handleAbsentToggle = (studentId: string, checked: boolean) => {
    setResults(prev => {
      const next = { ...prev };
      if (!next[studentId]) return prev;
      next[studentId] = { ...next[studentId], is_absent: checked };
      if (checked) {
        next[studentId].mcq = "";
        next[studentId].cq = "";
        next[studentId].written = "";
      }
      calculateStudentResult(studentId, next);
      return next;
    });
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const nameMatch = (s.name || s.nameEnglish || "").toLowerCase().includes(searchName.toLowerCase());
      const regMatch = (s.registrationId || s.studentId || "").toLowerCase().includes(searchReg.toLowerCase());
      return nameMatch && regMatch;
    });
  }, [students, searchName, searchReg]);

  const handleSave = () => {
    // Format to expected BulkCreateResultDto
    const formattedResults: Record<string, any> = {};
    Object.keys(results).forEach(studentId => {
      const r = results[studentId];
      if (r.is_absent || r.total > 0) {
        formattedResults[studentId] = {
           only_total_marks: r.total,
           is_absent: r.is_absent,
           grade: r.grade,
           gpa: r.gpa,
           mcq: parseFloat(r.mcq) || 0,
           cq: parseFloat(r.cq) || 0,
           written: parseFloat(r.written) || 0
        };
      }
    });

    onSave(formattedResults);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.spinner}></div>
          <p>Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.searchGroup}>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Search by Name</label>
            <input 
              type="text" 
              className={styles.searchInput}
              placeholder="Student Name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Search by Reg ID</label>
            <input 
              type="text" 
              className={styles.searchInput}
              placeholder="Registration ID..."
              value={searchReg}
              onChange={(e) => setSearchReg(e.target.value)}
            />
          </div>
        </div>

        <button 
          className={styles.saveBtn} 
          onClick={handleSave}
          disabled={saving || !exam || students.length === 0}
        >
          {saving ? 'Saving...' : '💾 Save Result'}
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className="text-center w-12">#</th>
              <th>Student</th>
              <th>Reg. ID</th>
              {hasMcq && <th className="text-center">MCQ Section</th>}
              {hasCq && <th className="text-center">CQ Section</th>}
              {hasWritten && <th className="text-center">Written Section</th>}
              <th className="text-center">Total</th>
              <th className="text-center">Grade (%)</th>
              <th className="text-center">GPA</th>
              <th className="text-center">Absent</th>
            </tr>
          </thead>
          <tbody>
             {filteredStudents.length === 0 ? (
               <tr>
                 <td colSpan={10} className="text-center py-8 text-gray-500">No students found</td>
               </tr>
             ) : (
               filteredStudents.map((student, index) => {
                 const res = results[student._id] || { 
                   mcq: "", cq: "", written: "", is_absent: false, total: 0, grade: "N/A", gpa: "N/A" 
                 };

                 return (
                   <tr key={student._id}>
                     <td className="text-center text-sm text-gray-500">{index + 1}</td>
                     <td className="font-medium">{student.nameEnglish || student.name || 'Unknown'}</td>
                     <td>{student.registrationId || student.studentId}</td>
                     
                     {hasMcq && (
                       <td className="text-center">
                         <input 
                           type="number" 
                           className={styles.markInput}
                           value={res.mcq}
                           onChange={(e) => handleChange(student._id, 'mcq', e.target.value)}
                           disabled={res.is_absent}
                         />
                       </td>
                     )}
                     
                     {hasCq && (
                       <td className="text-center">
                         <input 
                           type="number" 
                           className={styles.markInput}
                           value={res.cq}
                           onChange={(e) => handleChange(student._id, 'cq', e.target.value)}
                           disabled={res.is_absent}
                         />
                       </td>
                     )}
                     
                     {hasWritten && (
                       <td className="text-center">
                         <input 
                           type="number" 
                           className={styles.markInput}
                           value={res.written}
                           onChange={(e) => handleChange(student._id, 'written', e.target.value)}
                           disabled={res.is_absent}
                         />
                       </td>
                     )}

                     <td className="text-center font-semibold">{res.total}</td>
                     
                     <td className="text-center">
                       <span className={`${styles.badge} ${res.grade !== 'F' && res.grade !== 'N/A' ? styles.passed : res.grade === 'F' ? styles.failed : ''}`}>
                         {res.grade}
                       </span>
                     </td>
                     
                     <td className="text-center font-medium text-gray-600">{res.gpa}</td>
                     
                     <td className="text-center">
                        <label className={styles.absentToggle}>
                          <input 
                            type="checkbox" 
                            checked={res.is_absent}
                            onChange={(e) => handleAbsentToggle(student._id, e.target.checked)}
                          />
                          <span className={styles.slider}></span>
                        </label>
                     </td>
                   </tr>
                 );
               })
             )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
