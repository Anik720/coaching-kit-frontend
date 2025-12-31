import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useBatch = () => {
  const dispatch = useAppDispatch();
  const {
    batches,
    currentBatch,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    classes,
    groups,
    subjects,
  } = useAppSelector((state) => state.batch);

  const batchState = {
    batches,
    currentBatch,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    classes,
    groups,
    subjects,
  };

  return {
    ...batchState,
    dispatch,
  };
};