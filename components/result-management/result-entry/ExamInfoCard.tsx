"use client";

import React from 'react';
import styles from './ExamInfoCard.module.css';
import { Exam } from '@/api/result-management/create-exam/types/exam.types';

interface ExamInfoCardProps {
  exam: Exam | null;
  loading: boolean;
}

export default function ExamInfoCard({ exam, loading }: ExamInfoCardProps) {
  if (loading || !exam) {
    return (
      <div className={styles.cardContainer}>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-8 bg-slate-200 rounded col-span-1"></div>
                <div className="h-8 bg-slate-200 rounded col-span-1"></div>
                <div className="h-8 bg-slate-200 rounded col-span-1"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getMarksData = (type: string) => {
    return exam.marksFields?.find(f => f.type === type);
  };

  const mcq = getMarksData('mcq');
  const cq = getMarksData('cq');
  const written = getMarksData('written');

  return (
    <div className={styles.cardContainer}>
      <div className={styles.cardHeader}>
        <svg className={styles.icon} width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className={styles.headerTitle}>Exam Information</h3>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Exam Name:</span>
          <span className={styles.infoValue}>{exam.examName}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Topic:</span>
          <span className={styles.infoValue}>{exam.topicName || 'N/A'}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Class:</span>
          <span className={styles.infoValue}>{exam.className}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Batch:</span>
          <span className={styles.infoValue}>{exam.batchName}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Subject:</span>
          <span className={styles.infoValue}>{exam.subjectName}</span>
        </div>
      </div>

      <div className={styles.marksGrid}>
        {mcq && (
          <div className={styles.markBadge}>
             MCQ Pass Marks: <span className={styles.markPass}>{mcq.passMarks || 0}/{mcq.totalMarks}</span>
          </div>
        )}
        {cq && (
          <div className={styles.markBadge}>
             CQ Pass Marks: <span className={styles.markPass}>{cq.passMarks || 0}/{cq.totalMarks}</span>
          </div>
        )}
        {written && (
          <div className={styles.markBadge}>
             Written Pass Marks: <span className={styles.markPass}>{written.passMarks || 0}/{written.totalMarks}</span>
          </div>
        )}
        <div className={styles.markBadge}>
           Total Pass Marks: <span className={styles.markPass}>{exam.totalPassMarks || 0}/{exam.totalMarks}</span>
        </div>
      </div>
    </div>
  );
}
