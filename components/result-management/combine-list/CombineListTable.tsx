"use client";

import React from 'react';
import Link from 'next/link';
import styles from './CombineListTable.module.css';
import { CombineResultResponseDto } from '@/api/result-management/combine-result/types/combine-result.types';

interface CombineListTableProps {
  results: CombineResultResponseDto[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onDeleteClick?: (id: string) => void;
  onTogglePublish?: (id: string) => void;
}

export default function CombineListTable({ 
  results, 
  loading, 
  page, 
  totalPages, 
  onPageChange,
  onDeleteClick,
  onTogglePublish
}: CombineListTableProps) {

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>Combine Result List</h2>
      </div>

      <div className={styles.tableContainer}>
        {loading && results.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner}></div>
            <p>Loading combine results...</p>
          </div>
        ) : results.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No combine results found matching your criteria.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>EXAM NAME</th>
                <th>TOTAL MARKS</th>
                <th>MCQ</th>
                <th>CQ</th>
                <th>WRITTEN</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={result._id}>
                  <td>{(page - 1) * 10 + index + 1}</td>
                  <td>{result.name}</td>
                  <td>{result.totalMarks}</td>
                  <td>{result.mcqMarks}</td>
                  <td>{result.cqMarks}</td>
                  <td>{result.writtenMarks}</td>
                  <td>
                    <div className={styles.actionGroup}>
                      <Link
                        href={`/dashboard/result/combine-list/${result._id}`}
                        className={styles.actionBtn}
                        title="View Result"
                      >
                         <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                         </svg>
                      </Link>

                      <button 
                         className={`${styles.actionBtn} ${styles.delete}`} 
                         title="Delete"
                         onClick={() => onDeleteClick && onDeleteClick(result._id)}
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
