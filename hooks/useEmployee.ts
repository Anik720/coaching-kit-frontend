import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import {
  fetchEmployees,
  fetchEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  fetchEmployeeStatistics,
  clearError,
  clearSuccess,
  setCurrentEmployee,
  EmployeeItem,
} from '../api/employeeApi/employeeSlice';

const useAppDispatch: () => AppDispatch = useDispatch;
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useEmployee = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.employee);

  return {
    ...state,
    dispatch,
    fetchAll: (params?: Record<string, any>) => dispatch(fetchEmployees(params || {})),
    fetchById: (id: string) => dispatch(fetchEmployeeById(id)),
    create: (formData: FormData) => dispatch(createEmployee(formData)),
    update: (id: string, formData: FormData) => dispatch(updateEmployee({ id, formData })),
    remove: (id: string) => dispatch(deleteEmployee(id)),
    fetchStatistics: () => dispatch(fetchEmployeeStatistics()),
    clearError: () => dispatch(clearError()),
    clearSuccess: () => dispatch(clearSuccess()),
    setCurrentEmployee: (emp: EmployeeItem | null) => dispatch(setCurrentEmployee(emp)),
  };
};
