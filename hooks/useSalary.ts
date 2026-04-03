import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useSalary = () => {
  const dispatch = useAppDispatch();
  const salaryState = useAppSelector((state) => state.salary);

  return {
    ...salaryState,
    dispatch,
  };
};
