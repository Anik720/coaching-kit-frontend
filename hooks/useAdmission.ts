import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useAdmission = () => {
  const dispatch = useAppDispatch();
  const {
    admissions,
    currentAdmission,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    statistics,
  } = useAppSelector((state) => state.admission);

  const admissionState = {
    admissions,
    currentAdmission,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    statistics,
  };

  return {
    ...admissionState,
    dispatch,
  };
};