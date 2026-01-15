// hooks/result-management/useExam.ts
import { AppDispatch, RootState } from '@/store/store';
import { useDispatch, useSelector } from 'react-redux';

export const useExam = () => {
  const dispatch = useDispatch<AppDispatch>();

  const examState = useSelector((state: RootState) => state.exam);

  // Destructure with type safety
  const {
    exams,
    currentExam,
    loading,
    creating,
    updating,
    deleting,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    classes = [],
    batches = [],
    subjects = [],
    examCategories = [],
    activeBatches = [],
  } = examState;

  return {
    exams,
    currentExam,
    loading,
    creating,
    updating,
    deleting,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    classes,
    batches,
    subjects,
    examCategories,
    activeBatches,
    dispatch,
  };
};