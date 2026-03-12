// src/hooks/useExamCategory.ts
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
    loading,
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
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    dispatch,
  };
};