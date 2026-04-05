'use client';

import React, { useEffect, useState } from 'react';
import { fetchFeeCategories, createFeeCategory } from '@/api/feeApi/feeSlice';
import { useFee } from '@/hooks/useFee';
import styles from '../Fee.module.css';

export default function FeeCategoryPage() {
  const { feeCategories, loading, dispatch } = useFee();

  useEffect(() => {
    dispatch(fetchFeeCategories());
  }, [dispatch]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>Fee Categories</h1>
            <p className={styles.pageSubtitle}>Manage your fee categories</p>
          </div>
          <button className={styles.btnPrimary}>
            <svg className={styles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Category
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>All Categories</h2>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Category Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center p-8">
                    <div className={styles.loadingContainer}>
                      <div className={styles.spinnerLarge} style={{ margin: '0 auto' }}></div>
                    </div>
                  </td>
                </tr>
              ) : feeCategories && feeCategories.length > 0 ? (
                feeCategories.map((category, index) => (
                  <tr key={category._id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className={styles.classNameCell}>
                        <span className={styles.className}>{category.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${category.status === 'active' ? styles.active : styles.inactive}`}>
                        {category.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button className={styles.btnEdit} title="Edit">✏️</button>
                        <button className={styles.btnDelete} title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center p-8">
                    <div className={styles.emptyState}>
                      <h3 className={styles.emptyTitle}>No categories found</h3>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
