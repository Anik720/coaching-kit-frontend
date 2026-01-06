// src/components/teacherPage/CreateTeacherModal.tsx

"use client";

import { useState } from "react";
import styles from './Teachers.module.css';

interface CreateTeacherModalProps {
  onClose: () => void;
  onCreate: (teacherData: any) => void;
  loading: boolean;
}

export default function CreateTeacherModal({
  onClose,
  onCreate,
  loading,
}: CreateTeacherModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    designation: 'subject_teacher',
    assignType: 'class_basis',
    gender: 'male',
    status: 'active',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^\d{11}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Contact number must be 11 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onCreate(formData);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Add New Teacher</h2>
          <button 
            onClick={onClose} 
            className={styles.modalClose} 
            disabled={loading}
            type="button"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="fullName">
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
                disabled={loading}
                placeholder="Enter full name"
              />
              {errors.fullName && (
                <div className={styles.errorMessage}>{errors.fullName}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                disabled={loading}
                placeholder="Enter email address"
              />
              {errors.email && (
                <div className={styles.errorMessage}>{errors.email}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="contactNumber">
                Contact Number *
              </label>
              <input
                id="contactNumber"
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => handleChange('contactNumber', e.target.value)}
                className={`${styles.input} ${errors.contactNumber ? styles.inputError : ''}`}
                disabled={loading}
                placeholder="Enter 11-digit phone number"
              />
              {errors.contactNumber && (
                <div className={styles.errorMessage}>{errors.contactNumber}</div>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="designation">
                  Designation *
                </label>
                <select
                  id="designation"
                  value={formData.designation}
                  onChange={(e) => handleChange('designation', e.target.value)}
                  className={styles.select}
                  disabled={loading}
                >
                  <option value="head_teacher">Head Teacher</option>
                  <option value="assistant_teacher">Assistant Teacher</option>
                  <option value="subject_teacher">Subject Teacher</option>
                  <option value="co_teacher">Co-Teacher</option>
                  <option value="visiting_teacher">Visiting Teacher</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="assignType">
                  Assign Type *
                </label>
                <select
                  id="assignType"
                  value={formData.assignType}
                  onChange={(e) => handleChange('assignType', e.target.value)}
                  className={styles.select}
                  disabled={loading}
                >
                  <option value="monthly_basis">Monthly Basis</option>
                  <option value="class_basis">Class Basis</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="gender">
                  Gender *
                </label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className={styles.select}
                  disabled={loading}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="status">
                  Status *
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className={styles.select}
                  disabled={loading}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="resigned">Resigned</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnSecondary}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinnerSmall}></span>
                  Creating...
                </>
              ) : (
                'Create Teacher'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}