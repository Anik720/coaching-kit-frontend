// src/components/teacherPage/TeacherDetailsModal.tsx

"use client";

import { TeacherItem } from "@/api/teacherApi/types/teacher.types";
import styles from './Teachers.module.css';

interface TeacherDetailsModalProps {
  teacher: TeacherItem;
  onClose: () => void;
  onVerifyEmail: () => void;
  onVerifyPhone: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

export default function TeacherDetailsModal({
  teacher,
  onClose,
  onVerifyEmail,
  onVerifyPhone,
  onToggleActive,
  onDelete,
}: TeacherDetailsModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDesignation = (text: string): string => {
    return text.split('_').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male': return '👨';
      case 'female': return '👩';
      default: return '👤';
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Teacher Details</h2>
          <button 
            onClick={onClose} 
            className={styles.modalClose} 
            type="button"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.teacherProfile}>
            <div className={styles.profileHeader}>
              <div className={styles.profileAvatar}>
                {getGenderIcon(teacher.gender)}
              </div>
              <div className={styles.profileInfo}>
                <h3 className={styles.profileName}>{teacher.fullName}</h3>
                <p className={styles.profileDesignation}>
                  {formatDesignation(teacher.designation)}
                </p>
                <div className={styles.profileStatus}>
                  <span className={styles.statusBadge}>
                    {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
                  </span>
                  <span className={styles.activeBadge}>
                    {teacher.isActive ? '🟢 Active' : '⚪ Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.detailsGrid}>
              <div className={styles.detailSection}>
                <h4 className={styles.sectionTitle}>Contact Information</h4>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Email:</span>
                  <span className={styles.detailValue}>
                    {teacher.email}
                    {teacher.isEmailVerified ? ' ✅' : ' ❌'}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Phone:</span>
                  <span className={styles.detailValue}>
                    {teacher.contactNumber}
                    {teacher.isPhoneVerified ? ' ✅' : ' ❌'}
                  </span>
                </div>
                {teacher.whatsappNumber && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>WhatsApp:</span>
                    <span className={styles.detailValue}>{teacher.whatsappNumber}</span>
                  </div>
                )}
              </div>

              <div className={styles.detailSection}>
                <h4 className={styles.sectionTitle}>Professional Information</h4>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Designation:</span>
                  <span className={styles.detailValue}>{formatDesignation(teacher.designation)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Assign Type:</span>
                  <span className={styles.detailValue}>{formatDesignation(teacher.assignType)}</span>
                </div>
                {teacher.monthlyTotalClass && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Monthly Classes:</span>
                    <span className={styles.detailValue}>{teacher.monthlyTotalClass}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Joining Date:</span>
                  <span className={styles.detailValue}>{formatDate(teacher.joiningDate)}</span>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h4 className={styles.sectionTitle}>Personal Information</h4>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Gender:</span>
                  <span className={styles.detailValue}>
                    {teacher.gender.charAt(0).toUpperCase() + teacher.gender.slice(1)}
                  </span>
                </div>
                {teacher.bloodGroup && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Blood Group:</span>
                    <span className={styles.detailValue}>{teacher.bloodGroup}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.modalFooter}>
          <div className={styles.actionButtons}>
            {!teacher.isEmailVerified && (
              <button
                onClick={onVerifyEmail}
                className={styles.btnVerify}
                type="button"
              >
                Verify Email
              </button>
            )}
            {!teacher.isPhoneVerified && (
              <button
                onClick={onVerifyPhone}
                className={styles.btnVerify}
                type="button"
              >
                Verify Phone
              </button>
            )}
            <button
              onClick={onToggleActive}
              className={styles.btnToggle}
              type="button"
            >
              {teacher.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={onDelete}
              className={styles.btnDelete}
              type="button"
            >
              Delete
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.btnSecondary}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}