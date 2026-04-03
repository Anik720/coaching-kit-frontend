'use client';

import React, { useState } from 'react';
import styles from './Salary.module.css';

export default function UnpaidSalaryReport() {
  const [formData, setFormData] = useState({
    teacherId: '',
    month: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGeneratePdf = () => {
    // In a real application, this would call an API endpoint that generates a PDF buffer
    // and triggers a download or opens it in a new tab.
    alert(`Generating PDF for Teacher ID: ${formData.teacherId || 'All'} for Month: ${formData.month}`);
  };

  const handleGeneratePdfAll = () => {
    alert(`Generating PDF for ALL Teachers for Month: ${formData.month}`);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.tableCard} style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
        <h2 className={styles.tableTitle} style={{ marginBottom: '8px' }}>
          Teacher Unpaid Salary Report
        </h2>
        <p className={styles.pageSubtitle} style={{ marginBottom: '32px' }}>
          Select a teacher and month to generate report
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', textAlign: 'left', marginBottom: '32px' }}>
          <div className={styles.formField} style={{ marginBottom: 0 }}>
            <label className={styles.label}>Select Teacher</label>
            <div className={styles.inputWrapper}>
              {/* Using a text input as a placeholder for a select/autocomplete dropdown */}
              <input
                type="text"
                name="teacherId"
                value={formData.teacherId}
                onChange={handleChange}
                className={styles.input}
                placeholder="Choose Teacher (Input ID)"
              />
            </div>
          </div>

          <div className={styles.formField} style={{ marginBottom: 0 }}>
            <label className={styles.label}>Select Month</label>
            <div className={styles.inputWrapper}>
              <input
                type="month"
                name="month"
                value={formData.month}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button className={styles.btnPrimary} type="button" onClick={handleGeneratePdf} disabled={!formData.month}>
            Generate PDF
          </button>
          <button className={styles.btnPrimary} type="button" onClick={handleGeneratePdfAll} disabled={!formData.month}>
            Generate PDF For All Teacher
          </button>
        </div>
      </div>
    </div>
  );
}
