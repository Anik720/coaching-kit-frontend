import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useClass = () => {
  const dispatch = useAppDispatch();
  const {
    classes,
    currentClass,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
  } = useAppSelector((state) => state.class);

  const classState = {
    classes,
    currentClass,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
  };

  return {
    ...classState,
    dispatch,
  };
};