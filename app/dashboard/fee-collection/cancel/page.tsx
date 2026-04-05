'use client';

import React from 'react';
import styles from '../Fee.module.css';

export default function CancelPaymentPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>Student Payment Cancel</h1>
            <p className={styles.pageSubtitle}>Search and cancel erroneous payments with ease</p>
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className={styles.tableCard} style={{ marginBottom: '24px' }}>
        <div className={styles.formField} style={{ marginBottom: 0 }}>
          <label className={styles.label}>Search By: Student ID</label>
          <div className="flex max-w-sm">
            <input type="text" className={`${styles.input} rounded-r-none border-r-0`} placeholder="Enter Student ID..." />
            <button className={`${styles.btnPrimary} rounded-l-none`} style={{ padding: '0 24px' }}>
              <svg className={styles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Add Record section */}
      <div className={styles.tableCard} style={{ marginBottom: '24px' }}>
        <div className="flex gap-6 items-center flex-wrap">
          <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" /> 
            Add Tuition Fee Record
          </label>
          <div className="flex gap-4 flex-1 max-w-md">
            <input type="date" className={styles.input} />
            <button className={styles.btnPrimary}>Add Record</button>
          </div>
        </div>
      </div>

      {/* Student Details section with integrated table */}
      <div className={styles.tableCard} style={{ padding: '0', overflow: 'hidden' }}>
        <div className={styles.tableHeader} style={{ padding: '16px 24px', margin: 0, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <h2 className={styles.tableTitle}>Student Details</h2>
        </div>
        
        <div className="p-6 flex justify-between items-center bg-white border-b border-gray-100">
          <div className="space-y-3">
            <p className="text-gray-700"><strong>👤 Student Name:</strong> <span className="text-gray-500 ml-2">-</span></p>
            <p className="text-gray-700"><strong>🏫 Institute:</strong> <span className="text-gray-500 ml-2">-</span></p>
            <p className="text-gray-700"><strong>📚 Class Names:</strong> <span className="text-gray-500 ml-2">-</span></p>
            <p className="text-gray-700"><strong>🎓 Batch Name:</strong> <span className="text-gray-500 ml-2">-</span></p>
          </div>
          <div className="flex flex-col items-center mr-8">
            <div className="w-24 h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-400 mb-3 block">Photo</div>
            <div className={styles.badgeSecondary}>Student ID: ----</div>
          </div>
        </div>
        
        <div className={styles.tableWrapper} style={{ border: 'none', borderRadius: 0 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th className="w-1/6">MONTH</th>
                <th className="w-1/6">AMOUNT</th>
                <th className="w-[10%]">DISCOUNT</th>
                <th className="w-[15%]">FEE TYPE</th>
                <th className="w-1/6">PAYMENT SECURING DATE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={8} className="text-center p-12">
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon} style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                    <h3 className={styles.emptyTitle}>Select a student to see billing details</h3>
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
