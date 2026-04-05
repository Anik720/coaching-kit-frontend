'use client';

import React from 'react';
import styles from '../Fee.module.css';

export default function TransectionTrashPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>Transaction Trash</h1>
            <p className={styles.pageSubtitle}>Recover deleted or cancelled payment records</p>
          </div>
        </div>
      </div>
      
      <div className={styles.tableCard}>
         <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Fee Type</th>
                <th>Amount</th>
                <th>Cancel Date</th>
                <th>Restoration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="text-center p-8">
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🗑️</div>
                    <h3 className={styles.emptyTitle}>Trash is empty</h3>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
