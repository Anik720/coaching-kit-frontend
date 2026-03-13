"use client";

import React, { useEffect, useState, useCallback } from 'react';
import styles from './CombineList.module.css';

import CombineListFilter from '@/components/result-management/combine-list/CombineListFilter';
import CombineListTable from '@/components/result-management/combine-list/CombineListTable';

import { useExam } from "@/hooks/result-management/useExam";
import { fetchClasses, fetchActiveBatches, fetchExamCategories } from "@/api/result-management/create-exam/examSlice";

import { useCombineResult } from "@/hooks/result-management/useCombineResult";
import { 
  fetchCombineResults, 
  deleteCombineResult, 
  toggleCombineResultPublish 
} from "@/api/result-management/combine-result/combineResultSlice";
import { QueryParams } from '@/api/result-management/combine-result/types/combine-result.types';

export default function CombineListPage() {
  const {
    classes,
    activeBatches: batches,
    examCategories,
    dispatch: examDispatch,
    loading: examLoading
  } = useExam();

  const {
    combineResults,
    loading,
    page,
    totalPages,
    dispatch: combineDispatch,
    error,
    success
  } = useCombineResult();

  const [filters, setFilters] = useState<QueryParams>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    examDispatch(fetchClasses());
    examDispatch(fetchActiveBatches());
    examDispatch(fetchExamCategories());
  }, [examDispatch]);

  useEffect(() => {
    combineDispatch(
      fetchCombineResults({
        ...filters,
        page: currentPage,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      })
    );
  }, [combineDispatch, filters, currentPage]);

  const handleFilter = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1); 
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [totalPages]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this combine result?")) {
      try {
        await combineDispatch(deleteCombineResult(id)).unwrap();
        setToastMessage("Deleted successfully.");
        setTimeout(() => setToastMessage(""), 3000);
      } catch (err: any) {
        setToastMessage(err || "Failed to delete.");
        setTimeout(() => setToastMessage(""), 3000);
      }
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      await combineDispatch(toggleCombineResultPublish(id)).unwrap();
      setToastMessage("Publish status updated.");
      setTimeout(() => setToastMessage(""), 3000);
    } catch (err: any) {
      setToastMessage(err || "Failed to update publish status.");
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {toastMessage && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Combine Result List</h1>
      </div>

      <CombineListFilter 
        classes={classes}
        batches={batches}
        examCategories={examCategories}
        onFilter={handleFilter}
        loading={examLoading || loading}
      />

      <CombineListTable 
        results={combineResults}
        loading={loading}
        page={page || 1}
        totalPages={totalPages || 1}
        onPageChange={handlePageChange}
        onDeleteClick={handleDelete}
        onTogglePublish={handleTogglePublish}
      />
    </div>
  );
}
