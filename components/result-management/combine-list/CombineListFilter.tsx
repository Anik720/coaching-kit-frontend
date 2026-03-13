"use client";

import React, { useState } from 'react';
import styles from './CombineListFilter.module.css';

interface FilterProps {
  classes: any[];
  batches: any[];
  examCategories: any[];
  onFilter: (filters: {
    search?: string;
    classId?: string;
    categoryId?: string;
    isActive?: boolean;
    isPublished?: boolean;
  }) => void;
  loading?: boolean;
}

export default function CombineListFilter({ classes, batches, examCategories, onFilter, loading }: FilterProps) {
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleSearch = () => {
    onFilter({
      search: search || undefined,
      classId: selectedClass || undefined,
      categoryId: selectedCategory || undefined,
    });
  };

  const handleClear = () => {
    setSearch("");
    setSelectedClass("");
    setSelectedCategory("");
    onFilter({});
  };

  return (
    <div className={styles.filterContainer}>
      <h3 className={styles.filterHeader}>Combine Result List</h3>
      
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
          <label className={styles.label}>Exam Category</label>
          <select 
            className={styles.select}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={loading}
          >
            <option value="">Select Categories</option>
            {examCategories.map((ec) => (
              <option key={ec._id} value={ec._id}>
                {ec.name || ec.categoryName}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
           <label className={styles.label}>Search Name</label>
           <input 
             type="text" 
             className={styles.input} 
             placeholder="Search combine result..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
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
