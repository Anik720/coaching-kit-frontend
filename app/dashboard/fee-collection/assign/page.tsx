'use client';

import React, { useState } from 'react';
import styles from '../Fee.module.css';

export default function AssignFeePage() {
  const [assignType, setAssignType] = useState('batch');

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>Assign Fee to Student / Batch</h1>
            <p className={styles.pageSubtitle}>Target specific students or whole batches with particular fees</p>
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className="space-y-6 max-w-4xl">
          {/* Assign Type */}
          <div className={styles.formField}>
            <label className={styles.label}>Assign To</label>
            <div className="flex items-center gap-6 mt-2">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                <input 
                  type="radio" 
                  name="assign" 
                  value="batch" 
                  checked={assignType === 'batch'} 
                  onChange={(e) => setAssignType(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
                />
                Batch
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                <input 
                  type="radio" 
                  name="assign" 
                  value="student" 
                  checked={assignType === 'student'} 
                  onChange={(e) => setAssignType(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
                />
                Student
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className={styles.formField}>
              <label className={styles.label}>Select Class</label>
              <select className={styles.input}>
                <option>-- Select Class --</option>
              </select>
            </div>

            <div className={styles.formField}>
              <label className={styles.label}>Select Batch</label>
              <select className={styles.input}>
                <option>-- Select Batch --</option>
              </select>
            </div>
          </div>

          {assignType === 'student' && (
            <div className={styles.formField}>
              <label className={styles.label}>Search Student</label>
              <input type="text" placeholder="Student ID / Name / Mobile" className={styles.input} />
            </div>
          )}

          <div className={styles.formField}>
            <label className={styles.label}>Fee Category</label>
            <select className={styles.input}>
              <option>-- Select Fee Category --</option>
            </select>
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>Payment Entries</label>
            <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-lg border">
              <input type="number" placeholder="Amount" className={styles.input} style={{ width: '25%' }} />
              <input type="date" className={styles.input} style={{ width: '30%' }} />
              <input type="text" placeholder="Description / Purpose" className={styles.input} style={{ width: '45%' }} />
              <button type="button" className={styles.btnDelete} title="Remove">✕</button>
            </div>
            <button type="button" className={`${styles.btnSecondary} mt-4`}>
              + Add Payment Entry
            </button>
          </div>

          <div className="pt-6 border-t mt-6">
            <button type="button" className={styles.btnPrimary}>
              Assign Fee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
