"use client";

import React from "react";
import styles from './ConfirmationModal.module.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
  isDanger?: boolean;
  icon?: 'warning' | 'danger' | 'success';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isConfirming = false,
  isDanger = false,
  icon = 'warning',
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (icon) {
      case 'danger':
        return '⚠️';
      case 'success':
        return '✅';
      case 'warning':
      default:
        return '⚠️';
    }
  };

  const getIconClass = () => {
    switch (icon) {
      case 'danger':
        return styles.dangerIcon;
      case 'success':
        return styles.successIcon;
      case 'warning':
      default:
        return styles.warningIcon;
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button
            onClick={onCancel}
            className={styles.modalClose}
            disabled={isConfirming}
            type="button"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalIcon}>
            <span className={getIconClass()} role="img" aria-label="warning">
              {getIcon()}
            </span>
          </div>
          <p className={styles.confirmationMessage}>{message}</p>
        </div>
        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.btnSecondary}
            disabled={isConfirming}
            aria-label={cancelText}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${styles.btnPrimary} ${isDanger ? styles.btnDanger : ''}`}
            disabled={isConfirming}
            aria-label={confirmText}
          >
            {isConfirming ? (
              <span className={styles.spinnerSmall} aria-hidden="true"></span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;