'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { fetchCategories, createMaterial, clearError, clearSuccess } from '@/api/materialsApi/materialsSlice';
import { toastManager } from '@/utils/toastConfig';
import styles from '@/components/materials/Materials.module.css';

const UNIT_TYPES = ['Pcs', 'Dozen', 'Carton', 'Packet', 'Ream', 'Bundle', 'Set', 'Copy'];

export default function CreateMaterialPage() {
  const router = useRouter();
  const dispatch = useDispatch<any>();
  
  const { categories, actionLoading, error, success } = useSelector((state: any) => state.materials);

  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    quantity: '',
    description: '',
    purchaseCost: '',
    sellingPrice: '',
    purchaseUnit: 'Pcs',
    sellingUnit: 'Pcs',
  });

  useEffect(() => {
    dispatch(fetchCategories('active'));
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      toastManager.showSuccess('Material created successfully!');
      dispatch(clearSuccess());
      router.push('/dashboard/materials/list');
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) return toastManager.showError('Please select a category');
    if (!formData.name.trim()) return toastManager.showError('Material Name is required');
    if (!formData.quantity) return toastManager.showError('Quantity is required');
    if (Number(formData.quantity) < 0) return toastManager.showError('Quantity cannot be negative');

    const payload = {
      ...formData,
      quantity: Number(formData.quantity) || 0,
      purchaseCost: Number(formData.purchaseCost) || 0,
      sellingPrice: Number(formData.sellingPrice) || 0,
    };

    dispatch(createMaterial(payload));
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Add New Material</h1>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={`${styles.label} ${styles.labelRequired}`}>Category</label>
              <select
                className={styles.select}
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat: any) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={`${styles.label} ${styles.labelRequired}`}>Material Name</label>
              <input
                type="text"
                className={styles.input}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={`${styles.label} ${styles.labelRequired}`}>Quantity</label>
              <input
                type="number"
                min="0"
                step="any"
                className={styles.input}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup} style={{ marginBottom: 20 }}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Purchase Cost per Unit (৳)</label>
              <input
                type="number"
                min="0"
                step="any"
                className={styles.input}
                value={formData.purchaseCost}
                onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Selling Price per Unit (৳)</label>
              <input
                type="number"
                min="0"
                step="any"
                className={styles.input}
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Purchase Unit Type</label>
              <select
                className={styles.select}
                value={formData.purchaseUnit}
                onChange={(e) => setFormData({ ...formData, purchaseUnit: e.target.value })}
              >
                {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Selling Unit Type</label>
              <select
                className={styles.select}
                value={formData.sellingUnit}
                onChange={(e) => setFormData({ ...formData, sellingUnit: e.target.value })}
              >
                {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.btnGroup}>
            <button type="submit" className={styles.btnPrimary} style={{ minWidth: 150 }} disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save Material'}
            </button>
            <button type="button" className={styles.btnSecondary} onClick={() => router.push('/dashboard/materials/list')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
