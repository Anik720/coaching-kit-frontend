"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './CombineResultDetail.module.css';
import { useCombineResult } from '@/hooks/result-management/useCombineResult';
import {
  fetchCombineResultById,
  fetchCombineResultStudents,
} from '@/api/result-management/combine-result/combineResultSlice';

export default function CombineResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const {
    currentCombineResult: result,
    loading,
    studentResults,
    studentsLoading,
    dispatch,
  } = useCombineResult();

  useEffect(() => {
    if (id) {
      dispatch(fetchCombineResultById(id));
      dispatch(fetchCombineResultStudents({ id, params: { limit: 200 } }));
    }
  }, [id, dispatch]);

  if (loading || !result) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading combine result...</p>
      </div>
    );
  }

  const exams = result.exams || [];

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          ← Back
        </button>
        <h1 className={styles.pageTitle}>Combine Result</h1>
        <button className={styles.printBtn} onClick={() => window.print()}>
          🖨️ Print Result
        </button>
      </div>

      {/* Report Title */}
      <div className={styles.reportCard}>
        <div className={styles.reportTitleArea}>
          <h2 className={styles.reportTitle}>Combine Result Report</h2>
        </div>

        {/* Info Block */}
        <div className={styles.infoBlock}>
          <p><strong>Exam Name:</strong> {result.name}</p>
          <p><strong>Exam Total Marks:</strong> {result.totalMarks}</p>
          <p><strong>Class:</strong> {result.class?.classname}</p>
          <p><strong>Batches:</strong> {result.batches?.map(b => b.batchName).join(', ')}</p>
        </div>

        {/* Result Table */}
        <div className={styles.tableContainer}>
          {studentsLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading student results...</p>
            </div>
          ) : studentResults.length === 0 ? (
            <p className={styles.emptyMessage}>No student results found for this combine result.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>STUDENT NAME</th>
                  <th>STUDENT ID</th>
                  {exams.map((exam, i) => (
                    <th key={exam._id} className={styles.examHeader}>
                      <div className={styles.examHeaderTop}>EXAM {i + 1}</div>
                      <div className={styles.examHeaderName}>{exam.examName}</div>
                      <div className={styles.examHeaderSub}>
                        {exam.mcqMarks > 0 && <span>MCQ ({exam.mcqMarks})</span>}
                        {exam.cqMarks > 0 && <span>CQ ({exam.cqMarks})</span>}
                        {exam.writtenMarks > 0 && <span>Written ({exam.writtenMarks})</span>}
                      </div>
                    </th>
                  ))}
                  <th>TOTAL</th>
                  <th>GRADE</th>
                  <th>PERCENTAGE</th>
                  <th>MERIT</th>
                </tr>
              </thead>
              <tbody>
                {studentResults.map((studentResult: any, index: number) => {
                  const student = studentResult.student;
                  return (
                    <tr key={studentResult._id}>
                      <td>{index + 1}</td>
                      <td>{student?.nameEnglish || student?.name || 'N/A'}</td>
                      <td className={styles.studentId}>{student?.registrationId || 'N/A'}</td>
                      {exams.map((exam) => {
                        const examMark = studentResult.examMarks?.[exam._id];
                        return (
                          <td key={exam._id} className={styles.markCell}>
                            {examMark ? (
                              examMark.isAbsent ? (
                                <span className={styles.absent}>-</span>
                              ) : (
                                <span className={styles.mark}>{examMark.obtainedMarks}</span>
                              )
                            ) : (
                              <span className={styles.absent}>-</span>
                            )}
                          </td>
                        );
                      })}
                      <td><strong>{studentResult.obtainedMarks}</strong></td>
                      <td className={styles.grade}>{studentResult.grade || '-'}</td>
                      <td>{studentResult.percentage?.toFixed(2)}%</td>
                      <td>{studentResult.position || index + 1}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
