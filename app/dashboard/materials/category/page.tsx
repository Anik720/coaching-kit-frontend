'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories, createCategory, updateCategory, clearError, clearSuccess } from '@/api/materialsApi/materialsSlice';
import { toastManager } from '@/utils/toastConfig';
import styles from '@/components/materials/Materials.module.css';

export default function MaterialCategoryPage() {
  const dispatch = useDispatch<any>();
  const { categories, loading, actionLoading, error, success } = useSelector((state: any) => state.materials);

  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      toastManager.showSuccess(`Category ${editingId ? 'updated' : 'created'} successfully`);
      setFormData({ name: '', description: '', status: 'active' });
      setEditingId(null);
      dispatch(clearSuccess());
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearError());
    }
  }, [success, error, editingId, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toastManager.showError('Name is required');

    if (editingId) {
      dispatch(updateCategory({ id: editingId, data: formData }));
    } else {
      dispatch(createCategory(formData));
    }
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat._id);
    setFormData({ name: cat.name, description: cat.description || '', status: cat.status || 'active' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', status: 'active' });
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Material Categories</h1>

      {/* Form Card */}
      <div className={styles.formCard}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          {editingId ? 'Edit Category' : 'Create New Category'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={`${styles.label} ${styles.labelRequired}`}>Category Name</label>
              <input
                type="text"
                className={styles.input}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Books, Sheets"
              />
            </div>
            {editingId && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Status</label>
                <select
                  className={styles.select}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          <div className={styles.btnGroup}>
            <button type="submit" className={styles.btnPrimary} disabled={actionLoading}>
              {actionLoading ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
            </button>
            {editingId && (
              <button type="button" className={styles.btnSecondary} onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List Card */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Category Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className={styles.emptyState}>Loading categories...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={5} className={styles.emptyState}>No categories found</td></tr>
            ) : (
              categories.map((cat: any, i: number) => (
                <tr key={cat._id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{cat.name}</td>
                  <td style={{ color: '#64748b' }}>{cat.description || '—'}</td>
                  <td>
                    <span className={`${styles.badge} ${cat.status === 'active' ? styles.badgeActive : styles.badgeLowStock}`}>
                      {cat.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className={styles.btnSecondary} style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleEdit(cat)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
