"use client";

import React, { useState } from 'react';
import styles from './CreateCombineModal.module.css';

interface CreateCombineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, isPublished: boolean) => void;
  isSaving: boolean;
}

export default function CreateCombineModal({ isOpen, onClose, onSave, isSaving }: CreateCombineModalProps) {
  const [resultName, setResultName] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!resultName.trim()) return;
    onSave(resultName, isPublished);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Create Combined Result</h2>
        
        <div className={styles.formGroup}>
          <input 
            type="text" 
            className={styles.input} 
            placeholder="Enter result name" 
            value={resultName}
            onChange={(e) => setResultName(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              disabled={isSaving}
            />
            Publish result immediately
          </label>
        </div>

        <div className={styles.buttonGroup}>
          <button 
            className={styles.cancelBtn} 
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button 
            className={styles.saveBtn} 
            onClick={handleSave}
            disabled={!resultName.trim() || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
