import api from '../axios';

const financeApi = {
  // Categories
  getCategories: (params?: Record<string, any>) => api.get('/finance-categories', { params }),
  createCategory: (data: { categoryName: string; type: string; status?: string }) => api.post('/finance-categories', data),
  updateCategory: (id: string, data: any) => api.patch(`/finance-categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/finance-categories/${id}`),

  // Income
  getIncomes: (params?: Record<string, any>) => api.get('/incomes', { params }),
  getTodayIncome: () => api.get('/incomes/today-report'),
  createIncome: (formData: FormData) => api.post('/incomes', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateIncome: (id: string, formData: FormData) => api.patch(`/incomes/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteIncome: (id: string) => api.delete(`/incomes/${id}`),

  // Expense
  getExpenses: (params?: Record<string, any>) => api.get('/expenses', { params }),
  getTodayExpense: () => api.get('/expenses/today-report'),
  createExpense: (formData: FormData) => api.post('/expenses', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateExpense: (id: string, formData: FormData) => api.patch(`/expenses/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteExpense: (id: string) => api.delete(`/expenses/${id}`),
};

export default financeApi;
