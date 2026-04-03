'use client';

import React, { useState } from 'react';
import styles from './Salary.module.css';
import { useAppDispatch, useAppSelector } from '@/hooks/useSalary';
import { createSalary } from '@/api/salaryApi/salarySlice';
import { toastManager } from '@/utils/toastConfig';
import { CreateSalaryDto } from '@/api/salaryApi/types/salary.types';

export default function AdvanceSalaryForm() {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state: any) => state.salary);

  const [formData, setFormData] = useState({
    userType: 'teacher' as 'teacher' | 'staff',
    userId: '', // Ideally a dropdown to select exactly which user
    month: '',
    amount: '',
    method: 'cash' as 'cash' | 'bank' | 'mobile_banking',
    note: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId.trim()) {
      toastManager.showError('User ID is required. Please implement an autocomplete dropdown for real usage.');
      return;
    }

    const toastId = toastManager.showLoading('Processing advance payment...');
    try {
      const payload: CreateSalaryDto = {
        userType: formData.userType,
        userId: formData.userId,
        month: formData.month,
        amount: Number(formData.amount),
        paymentType: 'advance',
        method: formData.method,
        note: formData.note,
      };

      await dispatch(createSalary(payload)).unwrap();
      toastManager.updateToast(toastId, 'Advance Payment Submitted!', 'success');
      setFormData({ ...formData, userId: '', amount: '', note: '' }); // reset some fields
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, error || 'Failed to submit payment', 'error');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.tableCard} style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 className={styles.tableTitle} style={{ textAlign: 'center', marginBottom: '24px' }}>
          Advance Salary Form
        </h2>

        <form onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <label className={styles.label}>User Type</label>
            <div className={styles.inputWrapper}>
              <select
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                className={styles.input}
                disabled={loading}
                required
              >
                <option value="teacher">Teacher</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>User ID (Temp Input)</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                className={styles.input}
                placeholder="Enter User ID (Needs Autocomplete)"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>Month</label>
            <div className={styles.inputWrapper}>
              <input
                type="month"
                name="month"
                value={formData.month}
                onChange={handleChange}
                className={styles.input}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>Amount</label>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className={styles.input}
                placeholder="Amount"
                min="0"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>Payment Method</label>
            <div className={styles.inputWrapper}>
              <select
                name="method"
                value={formData.method}
                onChange={handleChange}
                className={styles.input}
                disabled={loading}
                required
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="mobile_banking">Mobile Banking</option>
              </select>
            </div>
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>Note</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                name="note"
                value={formData.note}
                onChange={handleChange}
                className={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className={styles.btnPrimary}
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? <span className={styles.spinnerSmall}></span> : 'Submit Advance Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}
