"use client";

import React, { useState } from 'react';
import styles from './ExamListFilter.module.css';

interface FilterProps {
  classes: any[];
  batches: any[];
  examCategories: any[];
  onFilter: (filters: {
    className?: string;
    batchName?: string;
    examCategory?: string;
    fromDate?: string;
    toDate?: string;
  }) => void;
  loading?: boolean;
}

export default function ExamListFilter({ classes, batches, examCategories, onFilter, loading }: FilterProps) {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const handleSearch = () => {
    onFilter({
      className: selectedClass || undefined,
      batchName: selectedBatch || undefined,
      examCategory: selectedCategory || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
  };

  const handleClear = () => {
    setSelectedClass("");
    setSelectedBatch("");
    setSelectedCategory("");
    setFromDate("");
    setToDate("");
    onFilter({});
  };

  return (
    <div className={styles.filterContainer}>
      <h3 className={styles.filterHeader}>Filter Exams</h3>
      
      <div className={styles.filterGrid}>
        <div className={styles.filterGroup}>
          <label className={styles.label}>Class</label>
          <select 
            className={styles.select}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={loading}
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c._id} value={c.name || c.classname}>
                {c.name || c.classname}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>Batches</label>
          <select 
            className={styles.select}
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            disabled={loading}
          >
            <option value="">Select Batches</option>
            {batches.map((b) => (
              <option key={b._id} value={b.name || b.batchName}>
                {b.name || b.batchName}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>Exam Category</label>
          <select 
            className={styles.select}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={loading}
          >
            <option value="">Select Categories</option>
            {examCategories.map((ec) => (
              <option key={ec._id} value={ec.name || ec.categoryName}>
                {ec.name || ec.categoryName}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>Start Date</label>
          <input 
            type="date"
            className={styles.input}
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>End Date</label>
          <input 
            type="date"
            className={styles.input}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className={styles.buttonGroup}>
         <button 
           className={styles.clearBtn} 
           onClick={handleClear}
           disabled={loading}
         >
           Clear Filter
         </button>
         <button 
           className={styles.searchBtn} 
           onClick={handleSearch}
           disabled={loading}
         >
           <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
           </svg>
           Search
         </button>
      </div>
    </div>
  );
}
