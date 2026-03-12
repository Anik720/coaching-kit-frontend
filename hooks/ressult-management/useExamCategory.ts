// hooks/result-management/useExamCategory.ts
import { AppDispatch, RootState } from '@/store/store';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useExamCategory = () => {
  const dispatch = useAppDispatch();

  const {
    categories,
    currentCategory,
    categoryStatus,
    loading,
    statusLoading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
  } = useAppSelector((state) => state.examCategory);

  return {
    categories,
    currentCategory,
    categoryStatus,
    loading,
    statusLoading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    dispatch,
  };
};