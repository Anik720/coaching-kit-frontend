"use client";

import React, { useState } from 'react';
import styles from './CreateCombineFilter.module.css';

interface FilterProps {
  classes: any[];
  batches: any[];
  examCategories: any[];
  onFilter: (filters: {
    className?: string; // or classId depending on logic, backend expects category/class ID
    classId?: string;
    batchIds?: string[];
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }) => void;
  loading?: boolean;
}

export default function CreateCombineFilter({ classes, batches, examCategories, onFilter, loading }: FilterProps) {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSearch = () => {
    onFilter({
      classId: selectedClass || undefined,
      batchIds: selectedBatches.length > 0 ? selectedBatches : undefined,
      categoryId: selectedCategory || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const handleBatchToggle = (batchId: string) => {
    if (selectedBatches.includes(batchId)) {
      setSelectedBatches(selectedBatches.filter(id => id !== batchId));
    } else {
      setSelectedBatches([...selectedBatches, batchId]);
    }
  };

  return (
    <div className={styles.filterContainer}>
      <h3 className={styles.filterHeader}>Create Combine Result</h3>
      
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
              <option key={c._id} value={c._id}>
                {c.name || c.classname}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>Batches</label>
          <div className={styles.batchSelector}>
             <span className={styles.batchLabelText}>
               {selectedBatches.length === 0 ? "Select batches" : `${selectedBatches.length} selected`}
             </span>
             <div className={styles.batchDropdown}>
               {batches.map(b => (
                 <label key={b._id} className={styles.batchCheckbox}>
                   <input 
                     type="checkbox" 
                     checked={selectedBatches.includes(b._id)}
                     onChange={() => handleBatchToggle(b._id)}
                   />
                   {b.name || b.batchName}
                 </label>
               ))}
             </div>
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>Exam Category</label>
          <select 
            className={styles.select}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={loading}
          >
            <option value="">Select categories</option>
            {examCategories.map((ec) => (
              <option key={ec._id} value={ec._id}>
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
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>End Date</label>
          <input 
            type="date"
            className={styles.input}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className={styles.fullWidthButton}>
         <button 
           className={styles.searchBtn} 
           onClick={handleSearch}
           disabled={loading}
         >
           <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{marginRight: '8px'}}>
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
           </svg>
           Search
         </button>
      </div>
    </div>
  );
}
