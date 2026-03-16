"use client";

import React, { useState } from 'react';
import styles from './CreateCombineTable.module.css';
import { ExamForCombineSearch } from '@/api/result-management/combine-result/types/combine-result.types';

interface CreateCombineTableProps {
  exams: ExamForCombineSearch[];
  loading: boolean;
  onCreateClick: (selectedExamIds: string[]) => void;
}

export default function CreateCombineTable({ exams, loading, onCreateClick }: CreateCombineTableProps) {
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedExamIds(exams.map(ex => ex._id));
    } else {
      setSelectedExamIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedExamIds(prev => [...prev, id]);
    } else {
      setSelectedExamIds(prev => prev.filter(exId => exId !== id));
    }
  };

  const allSelected = exams.length > 0 && selectedExamIds.length === exams.length;

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>Published Exam List</h2>
      </div>

      <div className={styles.createButtonContainer}>
        <button 
          className={styles.createBtn}
          disabled={selectedExamIds.length === 0}
          onClick={() => onCreateClick(selectedExamIds)}
        >
          Create Combine Result
        </button>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner}></div>
            <p>Searching exams...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No published exams found matching your criteria.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    checked={allSelected} 
                    onChange={handleSelectAll} 
                  />
                </th>
                <th>EXAM NAME</th>
                <th>CLASS</th>
                <th>BATCHES</th>
                <th>CATEGORY</th>
                <th>TOTAL MARKS</th>
                <th>MCQ</th>
                <th>CQ</th>
                <th>WRITTEN</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam._id}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedExamIds.includes(exam._id)}
                      onChange={(e) => handleSelectOne(exam._id, e.target.checked)}
                    />
                  </td>
                  <td>{exam.examName}</td>
                  <td>{exam.class?.classname}</td>
                  <td>{exam.batches?.map(b => b.batchName).join(', ')}</td>
                  <td>{exam.category?.categoryName}</td>
                  <td>{exam.totalMarks}</td>
                  <td>{exam.mcqMarks}</td>
                  <td>{exam.cqMarks}</td>
                  <td>{exam.writtenMarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
