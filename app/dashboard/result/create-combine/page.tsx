"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CreateCombine.module.css';

import CreateCombineFilter from '@/components/result-management/create-combine/CreateCombineFilter';
import CreateCombineTable from '@/components/result-management/create-combine/CreateCombineTable';
import CreateCombineModal from '@/components/result-management/create-combine/CreateCombineModal';

import { useExam } from "@/hooks/result-management/useExam";
import { fetchClasses, fetchActiveBatches, fetchExamCategories } from "@/api/result-management/create-exam/examSlice";

import { useCombineResult } from "@/hooks/result-management/useCombineResult";
import { searchExamsForCombine, createCombineResult } from "@/api/result-management/combine-result/combineResultSlice";

import { SearchCombineResultDto } from "@/api/result-management/combine-result/types/combine-result.types";

export default function CreateCombinePage() {
  const router = useRouter();

  // For Dropdowns
  const {
    classes,
    activeBatches: batches,
    examCategories,
    dispatch: examDispatch,
    loading: examLoading
  } = useExam();

  // For Combine Results
  const {
    searchedExams,
    searchingExams,
    creating,
    success: createSuccess,
    error: createError,
    dispatch: combineDispatch
  } = useCombineResult();

  const [currentFilters, setCurrentFilters] = useState<SearchCombineResultDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExamsForCombine, setSelectedExamsForCombine] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    examDispatch(fetchClasses());
    examDispatch(fetchActiveBatches());
    examDispatch(fetchExamCategories());
  }, [examDispatch]);

  // Handle Search
  const handleFilter = useCallback((filters: any) => {
    // Only search if we at least have class and some other detail
    if (!filters.classId) {
       setToastMessage("Please select at least a Class to search exams.");
       setTimeout(() => setToastMessage(""), 3000);
       return;
    }

    const searchPayload: SearchCombineResultDto = {
      class: filters.classId,
      batches: filters.batchIds,
      category: filters.categoryId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      status: 'published' // Only combine published exams based on design expectations
    };

    setCurrentFilters(searchPayload);
    combineDispatch(searchExamsForCombine(searchPayload));
  }, [combineDispatch]);

  const handleCreateClick = (selectedExamIds: string[]) => {
    setSelectedExamsForCombine(selectedExamIds);
    setIsModalOpen(true);
  };

  const handleSaveCombineResult = async (name: string, isPublished: boolean) => {
    if (!currentFilters?.class) return;

    const payload = {
      name,
      class: currentFilters.class,
      batches: currentFilters.batches || [],
      exams: selectedExamsForCombine,
      category: currentFilters.category || selectedExamsForCombine[0], // fallback if not explicitly set
      startDate: currentFilters.startDate || new Date().toISOString(),
      endDate: currentFilters.endDate || new Date().toISOString(),
      isPublished
    };

    try {
      await combineDispatch(createCombineResult(payload)).unwrap();
      setIsModalOpen(false);
      setToastMessage("Combine Result created successfully!");
      setTimeout(() => {
        setToastMessage("");
        router.push('/dashboard/result/combine-list');
      }, 2000);
    } catch (error: any) {
      setToastMessage(error || "Failed to create Combine Result");
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
        <h1 className={styles.pageTitle}>Create Combine Result</h1>
      </div>

      <CreateCombineFilter 
        classes={classes}
        batches={batches}
        examCategories={examCategories}
        onFilter={handleFilter}
        loading={examLoading || searchingExams}
      />

      {currentFilters && (
        <CreateCombineTable 
          exams={searchedExams}
          loading={searchingExams}
          onCreateClick={handleCreateClick}
        />
      )}

      <CreateCombineModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCombineResult}
        isSaving={creating}
      />
    </div>
  );
}
