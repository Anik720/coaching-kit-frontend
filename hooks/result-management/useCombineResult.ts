// hooks/result-management/useCombineResult.ts
import { AppDispatch, RootState } from '@/store/store';
import { useDispatch, useSelector } from 'react-redux';

export const useCombineResult = () => {
  const dispatch = useDispatch<AppDispatch>();

  const combineResultState = useSelector((state: RootState) => state.combineResult);

  const {
    combineResults,
    currentCombineResult,
    searchedExams,
    loading,
    searchingExams,
    creating,
    deleting,
    toggling,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
  } = combineResultState;

  return {
    combineResults,
    currentCombineResult,
    searchedExams,
    loading,
    searchingExams,
    creating,
    deleting,
    toggling,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    dispatch,
  };
};
