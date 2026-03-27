import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchIncomes,
  fetchTodayIncome,
  createIncome,
  deleteIncome,
  fetchExpenses,
  fetchTodayExpense,
  createExpense,
  deleteExpense,
  clearIncomeSuccess,
  clearExpenseSuccess,
  clearIncomeError,
  clearExpenseError,
} from '../api/financeApi/financeSlice';

const useAppDispatch: () => AppDispatch = useDispatch;
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useFinance = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.finance);

  return {
    ...state,
    // Categories
    fetchCategories: (params?: Record<string, any>) => dispatch(fetchCategories(params || {})),
    createCategory: (data: { categoryName: string; type: string; status?: string }) =>
      dispatch(createCategory(data)),
    updateCategory: (id: string, data: any) => dispatch(updateCategory({ id, data })),
    deleteCategory: (id: string) => dispatch(deleteCategory(id)),
    // Income
    fetchIncomes: (params?: Record<string, any>) => dispatch(fetchIncomes(params || {})),
    fetchTodayIncome: () => dispatch(fetchTodayIncome()),
    createIncome: (formData: FormData) => dispatch(createIncome(formData)),
    deleteIncome: (id: string) => dispatch(deleteIncome(id)),
    // Expense
    fetchExpenses: (params?: Record<string, any>) => dispatch(fetchExpenses(params || {})),
    fetchTodayExpense: () => dispatch(fetchTodayExpense()),
    createExpense: (formData: FormData) => dispatch(createExpense(formData)),
    deleteExpense: (id: string) => dispatch(deleteExpense(id)),
    // Clear helpers
    clearIncomeSuccess: () => dispatch(clearIncomeSuccess()),
    clearExpenseSuccess: () => dispatch(clearExpenseSuccess()),
    clearIncomeError: () => dispatch(clearIncomeError()),
    clearExpenseError: () => dispatch(clearExpenseError()),
  };
};
