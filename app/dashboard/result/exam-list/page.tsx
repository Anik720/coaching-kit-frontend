"use client";

import React, { useEffect, useState, useCallback } from 'react';
import styles from './ExamListPage.module.css';
import ExamListFilter from '@/components/result-management/exam-list/ExamListFilter';
import ExamListTable from '@/components/result-management/exam-list/ExamListTable';

import { useExam } from "@/hooks/result-management/useExam";
import { 
  fetchExams, 
  fetchClasses, 
  fetchActiveBatches, 
  fetchExamCategories 
} from "@/api/result-management/create-exam/examSlice";

export default function ExamListPage() {
  const {
    exams,
    loading,
    total,
    page,
    totalPages,
    classes,
    activeBatches,
    examCategories,
    dispatch,
  } = useExam();

  const [filters, setFilters] = useState<{
    className?: string;
    batchName?: string;
    examCategory?: string;
    fromDate?: string;
    toDate?: string;
  }>({});

  const [currentPage, setCurrentPage] = useState(1);

  // Fetch dropdowns on initial load
  useEffect(() => {
    dispatch(fetchClasses());
    dispatch(fetchActiveBatches());
    dispatch(fetchExamCategories());
  }, [dispatch]);

  // Fetch exams when filters or page change
  useEffect(() => {
    dispatch(
      fetchExams({
        ...filters,
        page: currentPage,
        limit: 10,
        sortBy: "examDate",
        sortOrder: "desc",
      })
    );
  }, [dispatch, filters, currentPage]);

  const handleFilter = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on new filter
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [totalPages]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Result Management</h1>
        <p className={styles.pageSubtitle}>View all exams and enter results</p>
      </div>

      <ExamListFilter 
        classes={classes}
        batches={activeBatches}
        examCategories={examCategories}
        onFilter={handleFilter}
        loading={loading}
      />

      <ExamListTable 
        exams={exams}
        loading={loading}
        page={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
