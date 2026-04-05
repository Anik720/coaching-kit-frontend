import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useFee = () => {
  const dispatch = useAppDispatch();
  const feeState = useAppSelector((state) => state.fee);

  return {
    ...feeState,
    dispatch,
  };
};
