'use client';

import React from 'react';
import styles from '../Fee.module.css';

const DueListSection = ({ title, amount, labelText }: { title: string, amount: string, labelText: string }) => (
  <div className={styles.tableCard} style={{ padding: '0', overflow: 'hidden', marginBottom: '24px' }}>
    <div className={styles.tableHeader} style={{ padding: '16px 24px', margin: '0', background: 'white' }}>
      <h2 className={styles.tableTitle}>{title}</h2>
    </div>
    <div style={{ padding: '0 24px 16px', fontSize: '14px', fontWeight: 'bold', color: '#4b5563', background: 'white' }}>
      {labelText}: <span className="text-red-500">{amount} TK</span>
    </div>
    <div className={styles.tableWrapper} style={{ borderLeft: 'none', borderRight: 'none', borderBottom: 'none', borderRadius: '0' }}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>STUDENT NAME</th>
            <th>STUDENT ID</th>
            <th>CLASS</th>
            <th>BATCH</th>
            <th>GUARDIAN NUMBER</th>
            <th>STUDENT NUMBER</th>
            <th>AMOUNT</th>
            <th>PAYMENT DATE / NUMBER OF DUE</th>
            <th>FEE TYPE</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={12} className="text-center p-8">
              <div className={styles.emptyState}>
                <h3 className={styles.emptyTitle}>No due records found</h3>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export default function DueListPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>Due List</h1>
            <p className={styles.pageSubtitle}>Track outstanding payments and liabilities</p>
          </div>
        </div>
      </div>

      <div className={styles.tableCard} style={{ marginBottom: '32px' }}>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border cursor-pointer font-medium text-sm text-gray-700 hover:bg-gray-100 transition-colors">
              <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" /> Admission
            </label>
            <label className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border cursor-pointer font-medium text-sm text-gray-700 hover:bg-gray-100 transition-colors">
              <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" /> Tuition
            </label>
            <label className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border cursor-pointer font-medium text-sm text-gray-700 hover:bg-gray-100 transition-colors">
              <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" /> Course
            </label>
            <select className={`${styles.input} w-auto`} style={{ padding: '8px 16px' }}>
              <option>Select Calendar</option>
            </select>
            <select className={`${styles.input} w-auto`} style={{ padding: '8px 16px' }}>
              <option>By Batch</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className={styles.formField} style={{ marginBottom: 0 }}>
              <select className={styles.input}>
                <option>Select Batch</option>
              </select>
            </div>
            <div className={styles.formField} style={{ marginBottom: 0 }}>
              <select className={styles.input}>
                <option>Active Students Only</option>
              </select>
            </div>
          </div>

          <div className="pt-6 border-t mt-6 flex justify-between items-center">
            <div className="text-xl font-bold bg-red-50 text-red-600 px-6 py-3 rounded-xl border border-red-100">
              Total Due Amount: 215100 Tk
            </div>
            <div className="flex gap-4">
              <button className={styles.btnPrimary}>Show Due List</button>
              <button className={styles.btnSecondary} style={{ color: '#4b5563', borderColor: '#d1d5db' }}>Download Due List</button>
            </div>
          </div>
        </div>
      </div>

      <DueListSection title="Admission Due List" labelText="Total Actual Due Amount" amount="500" />
      <DueListSection title="Tuition Due List" labelText="Total Actual Due Amount" amount="214600" />
      <DueListSection title="Course Due List" labelText="Total Due Course Fee" amount="0" />
      <DueListSection title="Extra & Partial Due Fees" labelText="Total Actual Due Amount" amount="0" />
    </div>
  );
}
