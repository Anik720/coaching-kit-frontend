"use client";

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './ResultCreatePage.module.css';
import ExamInfoCard from '@/components/result-management/result-entry/ExamInfoCard';
import ResultEntryTable from '@/components/result-management/result-entry/ResultEntryTable';

import ExamService from '@/api/result-management/create-exam/services/examService';
import ResultService from '@/api/result-management/result/services/resultService';
import { Exam } from '@/api/result-management/create-exam/types/exam.types';
import { toastManager } from '@/utils/toastConfig';

export default function ResultCreatePage({ params }: { params: Promise<{ examId: string }> }) {
  const router = useRouter();
  
  const { examId } = use(params);

  const [exam, setExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [existingResults, setExistingResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchExamAndStudents = async () => {
      try {
        setLoading(true);
        // Fetch Exam config
        const examData = await ExamService.getById(examId);
        setExam(examData);

        // Fetch Students by class and batch (we check if exam has class/batch names or mapping)
        // Note: The API requires classId and batchId but exam model might only have className and batchName string.
        // If your ResultService.getStudentsByClassAndBatch endpoint accepts names instead of IDs, that's fine.
        // Otherwise, you might need to fetch class/batch list to map names -> IDs.
        // Assuming the backend handles name mapping or we pass names for now.
        
        // As a fallback, we can use getStudentsForResultEntry from ResultService
        // But the previous implementation in resultService says it uses classId and batchId string
        // Since we only have className/batchName in Exam by default, let's call the generic student API or custom API.
        
        let fetchedStudents: any[] = [];
        let fetchedExistingResults: any[] = [];
        
        // Try getting students based on the class and batch ID
        try {
           const classes = await ExamService.getClasses();
           const batches = await ExamService.getAllBatches();
           
           const matchedClass = classes.find(c => c.name === examData.className || c.classname === examData.className);
           const matchedBatch = batches.find(b => b.name === examData.batchName || b.batchName === examData.batchName);
           
           const classId = (examData as any).classId || (examData as any).class?._id || matchedClass?._id || examData.className;
           const batchId = (examData as any).batchId || (examData as any).batch?._id || matchedBatch?._id || examData.batchName;

           fetchedStudents = await ResultService.getStudentsByClassAndBatch(classId, batchId);
           
           try {
             // Fetch existing results
             const statsSummary = await ResultService.getStatsSummary(examId, classId, batchId);
             if (statsSummary) {
               fetchedExistingResults = statsSummary.results || statsSummary.data || (Array.isArray(statsSummary) ? statsSummary : []);
             }
           } catch (e) {
             console.error("Failed to fetch custom stats summary:", e);
           }
        } catch (e) {
           console.error("Failed to fetch students:", e);
        }
        
        setStudents(fetchedStudents);
        setExistingResults(fetchedExistingResults);
      } catch (error) {
        console.error("Failed to fetch exam data:", error);
        toastManager.showError("Failed to fetch exam information.");
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchExamAndStudents();
    }
  }, [examId]);

  const handleSaveResult = async (results: Record<string, any>) => {
    setSaving(true);
    const toastId = toastManager.showLoading('Saving results...');
    try {
      if (!exam) return;
      
      const payload = {
        exam_id: exam._id,
        results
      };

      const response = await ResultService.bulkCreate(payload);
      
      toastManager.updateToast(
         toastId, 
         `Results saved successfully! Success: ${response.successCount}, Failed: ${response.failedCount}`, 
         'success'
      );
      
      // Optionally redirect to result list
      // router.push(`/dashboard/result/exam-list/${examId}/result`);
    } catch (error: any) {
      toastManager.updateToast(toastId, error?.response?.data?.message || 'Failed to save results', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <Link href="/dashboard/result/exam-list" className={styles.backBtn}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Exam List
        </Link>
        <h1 className={styles.title}>Result Entry</h1>
        <div style={{ width: '130px' }}></div> {/* Spacer for centering */}
      </div>

      <ExamInfoCard exam={exam} loading={loading} />

      <ResultEntryTable 
        exam={exam}
        students={students}
        existingResults={existingResults}
        loading={loading}
        onSave={handleSaveResult}
        saving={saving}
      />
    </div>
  );
}
