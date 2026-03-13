"use client";

import React from 'react';
import Link from 'next/link';
import styles from './ExamListTable.module.css';

interface MarksField {
  type: string;
  totalMarks: number;
}

interface Exam {
  _id: string;
  examName: string;
  className: string;
  batchName: string;
  subjectName: string;
  examCategory: string;
  examDate: string;
  totalMarks: number;
  marksFields?: MarksField[];
  enableGrading: boolean;
  isActive: boolean;
  isPublished: boolean;
}

interface ExamListTableProps {
  exams: Exam[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onDeleteClick?: (id: string) => void;
  onEditClick?: (exam: Exam) => void;
  onTogglePublish?: (id: string, isPublished: boolean) => void;
}

export default function ExamListTable({ 
  exams, 
  loading, 
  page, 
  totalPages, 
  onPageChange,
  onDeleteClick,
  onEditClick,
  onTogglePublish
}: ExamListTableProps) {

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const getMarksByType = (fields: MarksField[] | undefined, type: string) => {
    const field = fields?.find(f => f.type === type);
    return field ? field.totalMarks : 0;
  };

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>Exam List</h2>
      </div>

      <div className={styles.tableContainer}>
        {loading && exams.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner}></div>
            <p>Loading exams...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No exams found matching your criteria.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>EXAM DATE</th>
                <th>EXAM NAME</th>
                <th>CLASS</th>
                <th>BATCHES</th>
                <th>SUBJECT</th>
                <th>CATEGORY</th>
                <th>TOTAL MARKS</th>
                <th>MCQ</th>
                <th>CQ</th>
                <th>WRITTEN</th>
                <th>RESULT STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam, index) => (
                <tr key={exam._id}>
                  <td>{(page - 1) * 10 + index + 1}</td>
                  <td>{formatDate(exam.examDate)}</td>
                  <td>{exam.examName}</td>
                  <td>{exam.className}</td>
                  <td>{exam.batchName}</td>
                  <td>{exam.subjectName}</td>
                  <td>{exam.examCategory}</td>
                  <td>{exam.totalMarks}</td>
                  <td>{getMarksByType(exam.marksFields, 'mcq')}</td>
                  <td>{getMarksByType(exam.marksFields, 'cq')}</td>
                  <td>{getMarksByType(exam.marksFields, 'written')}</td>
                  <td>
                     <button 
                       className={`${styles.statusBadge} ${exam.isPublished ? styles.published : styles.unpublished}`}
                       onClick={() => onTogglePublish && onTogglePublish(exam._id, exam.isPublished)}
                       style={{ cursor: 'pointer', border: 'none' }}
                     >
                        {exam.isPublished ? 'Published' : 'Unpublished'}
                     </button>
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      <Link 
                        href={`/dashboard/result/exam-list/${exam._id}/result/create`}
                        className={styles.inputBtn}
                      >
                        Input 
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                        </svg>
                      </Link>
                      
                      {/* Optional standard action icons */}
                      <button 
                        className={styles.actionBtn}
                        onClick={() => onTogglePublish && onTogglePublish(exam._id, exam.isPublished)}
                        title={exam.isPublished ? "Unpublish" : "Publish"}
                      >
                         <svg width="16" height="16" fill={exam.isPublished ? "#10b981" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                         </svg>
                      </button>
                      <button 
                        className={`${styles.actionBtn} ${styles.edit}`} 
                        title="Edit"
                        onClick={() => onEditClick && onEditClick(exam)}
                      >
                         <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                         </svg>
                      </button>
                      <button 
                        className={`${styles.actionBtn} ${styles.delete}`} 
                        title="Delete"
                        onClick={() => onDeleteClick && onDeleteClick(exam._id)}
                      >
                         <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                         </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            className={styles.paginationBtn}
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
          >
             &lt;
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button 
              key={p} 
              className={`${styles.paginationBtn} ${page === p ? styles.active : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ))}

          <button 
            className={styles.paginationBtn}
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
          >
             &gt;
          </button>
        </div>
      )}
    </div>
  );
}
