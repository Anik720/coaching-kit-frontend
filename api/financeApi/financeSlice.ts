import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import financeApi from './financeApi';

export interface FinanceCategory {
  _id: string;
  categoryName: string;
  type: 'income' | 'expense';
  status: 'published' | 'unpublished';
  createdAt: string;
}

export interface IncomeItem {
  _id: string;
  category: any;
  categoryInfo?: { _id: string; categoryName: string; type: string };
  incomeName: string;
  date: string;
  amount: number;
  paymentMethod: string;
  walletOrAccountNo?: string;
  receivedBy?: any;
  receivedByUser?: { _id: string; email: string; username?: string };
  document?: string;
  description?: string;
  transactionId?: string;
  status: string;
  createdAt: string;
}

export interface ExpenseItem {
  _id: string;
  category: any;
  categoryInfo?: { _id: string; categoryName: string; type: string };
  expenseName: string;
  date: string;
  amount: number;
  paymentMethod: string;
  walletOrAccountNo?: string;
  expenseBy?: any;
  expenseByUser?: { _id: string; email: string; username?: string };
  document?: string;
  description?: string;
  transactionId?: string;
  status: string;
  createdAt: string;
}

interface FinanceState {
  // Categories
  categories: FinanceCategory[];
  categoriesLoading: boolean;
  categoriesError: string | null;

  // Income
  incomes: IncomeItem[];
  todayIncomes: IncomeItem[];
  todayIncomeTotal: number;
  incomeTotal: number;
  incomeTotalAmount: number;
  incomePage: number;
  incomeLimit: number;
  incomeTotalPages: number;
  incomeLoading: boolean;
  incomeError: string | null;
  incomeSuccess: boolean;

  // Expense
  expenses: ExpenseItem[];
  todayExpenses: ExpenseItem[];
  todayExpenseTotal: number;
  expenseTotal: number;
  expenseTotalAmount: number;
  expensePage: number;
  expenseLimit: number;
  expenseTotalPages: number;
  expenseLoading: boolean;
  expenseError: string | null;
  expenseSuccess: boolean;
}

const initialState: FinanceState = {
  categories: [],
  categoriesLoading: false,
  categoriesError: null,
  incomes: [],
  todayIncomes: [],
  todayIncomeTotal: 0,
  incomeTotal: 0,
  incomeTotalAmount: 0,
  incomePage: 1,
  incomeLimit: 20,
  incomeTotalPages: 0,
  incomeLoading: false,
  incomeError: null,
  incomeSuccess: false,
  expenses: [],
  todayExpenses: [],
  todayExpenseTotal: 0,
  expenseTotal: 0,
  expenseTotalAmount: 0,
  expensePage: 1,
  expenseLimit: 20,
  expenseTotalPages: 0,
  expenseLoading: false,
  expenseError: null,
  expenseSuccess: false,
};

// ─── Category Thunks ────────────────────────────────────────────────────────

export const fetchCategories = createAsyncThunk(
  'finance/fetchCategories',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const res = await financeApi.getCategories(params);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const createCategory = createAsyncThunk(
  'finance/createCategory',
  async (data: { categoryName: string; type: string; status?: string }, { rejectWithValue }) => {
    try {
      const res = await financeApi.createCategory(data);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to create category');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'finance/updateCategory',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const res = await financeApi.updateCategory(id, data);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to update category');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'finance/deleteCategory',
  async (id: string, { rejectWithValue }) => {
    try {
      await financeApi.deleteCategory(id);
      return id;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to delete category');
    }
  }
);

// ─── Income Thunks ───────────────────────────────────────────────────────────

export const fetchIncomes = createAsyncThunk(
  'finance/fetchIncomes',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const res = await financeApi.getIncomes(params);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to fetch incomes');
    }
  }
);

export const fetchTodayIncome = createAsyncThunk(
  'finance/fetchTodayIncome',
  async (_, { rejectWithValue }) => {
    try {
      const res = await financeApi.getTodayIncome();
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to fetch today income');
    }
  }
);

export const createIncome = createAsyncThunk(
  'finance/createIncome',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const res = await financeApi.createIncome(formData);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to create income');
    }
  }
);

export const deleteIncome = createAsyncThunk(
  'finance/deleteIncome',
  async (id: string, { rejectWithValue }) => {
    try {
      await financeApi.deleteIncome(id);
      return id;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to delete income');
    }
  }
);

// ─── Expense Thunks ──────────────────────────────────────────────────────────

export const fetchExpenses = createAsyncThunk(
  'finance/fetchExpenses',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const res = await financeApi.getExpenses(params);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to fetch expenses');
    }
  }
);

export const fetchTodayExpense = createAsyncThunk(
  'finance/fetchTodayExpense',
  async (_, { rejectWithValue }) => {
    try {
      const res = await financeApi.getTodayExpense();
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to fetch today expense');
    }
  }
);

export const createExpense = createAsyncThunk(
  'finance/createExpense',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const res = await financeApi.createExpense(formData);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to create expense');
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'finance/deleteExpense',
  async (id: string, { rejectWithValue }) => {
    try {
      await financeApi.deleteExpense(id);
      return id;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to delete expense');
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {
    clearIncomeSuccess: (state) => { state.incomeSuccess = false; },
    clearExpenseSuccess: (state) => { state.expenseSuccess = false; },
    clearIncomeError: (state) => { state.incomeError = null; },
    clearExpenseError: (state) => { state.expenseError = null; },
  },
  extraReducers: (builder) => {
    builder
      // ── Categories ──────────────────────────────────────────────────────
      .addCase(fetchCategories.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload.categories || [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError = action.payload as string;
      })

      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })

      .addCase(updateCategory.fulfilled, (state, action) => {
        const idx = state.categories.findIndex(c => c._id === action.payload._id);
        if (idx !== -1) state.categories[idx] = action.payload;
      })

      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(c => c._id !== action.payload);
      })

      // ── Income ──────────────────────────────────────────────────────────
      .addCase(fetchIncomes.pending, (state) => {
        state.incomeLoading = true;
        state.incomeError = null;
      })
      .addCase(fetchIncomes.fulfilled, (state, action) => {
        state.incomeLoading = false;
        state.incomes = action.payload.incomes || [];
        state.incomeTotal = action.payload.total || 0;
        state.incomeTotalAmount = action.payload.totalAmount || 0;
        state.incomePage = action.payload.page || 1;
        state.incomeLimit = action.payload.limit || 20;
        state.incomeTotalPages = action.payload.totalPages || 0;
      })
      .addCase(fetchIncomes.rejected, (state, action) => {
        state.incomeLoading = false;
        state.incomeError = action.payload as string;
      })

      .addCase(fetchTodayIncome.fulfilled, (state, action) => {
        state.todayIncomes = action.payload.incomes || [];
        state.todayIncomeTotal = action.payload.totalAmount || 0;
      })

      .addCase(createIncome.pending, (state) => {
        state.incomeLoading = true;
        state.incomeError = null;
        state.incomeSuccess = false;
      })
      .addCase(createIncome.fulfilled, (state, action) => {
        state.incomeLoading = false;
        state.incomeSuccess = true;
        state.todayIncomes.unshift(action.payload);
        state.todayIncomeTotal += action.payload.amount || 0;
      })
      .addCase(createIncome.rejected, (state, action) => {
        state.incomeLoading = false;
        state.incomeError = action.payload as string;
        state.incomeSuccess = false;
      })

      .addCase(deleteIncome.fulfilled, (state, action) => {
        state.incomes = state.incomes.filter(i => i._id !== action.payload);
        state.todayIncomes = state.todayIncomes.filter(i => i._id !== action.payload);
        state.incomeTotal -= 1;
      })

      // ── Expense ─────────────────────────────────────────────────────────
      .addCase(fetchExpenses.pending, (state) => {
        state.expenseLoading = true;
        state.expenseError = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.expenseLoading = false;
        state.expenses = action.payload.expenses || [];
        state.expenseTotal = action.payload.total || 0;
        state.expenseTotalAmount = action.payload.totalAmount || 0;
        state.expensePage = action.payload.page || 1;
        state.expenseLimit = action.payload.limit || 20;
        state.expenseTotalPages = action.payload.totalPages || 0;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.expenseLoading = false;
        state.expenseError = action.payload as string;
      })

      .addCase(fetchTodayExpense.fulfilled, (state, action) => {
        state.todayExpenses = action.payload.expenses || [];
        state.todayExpenseTotal = action.payload.totalAmount || 0;
      })

      .addCase(createExpense.pending, (state) => {
        state.expenseLoading = true;
        state.expenseError = null;
        state.expenseSuccess = false;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.expenseLoading = false;
        state.expenseSuccess = true;
        state.todayExpenses.unshift(action.payload);
        state.todayExpenseTotal += action.payload.amount || 0;
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.expenseLoading = false;
        state.expenseError = action.payload as string;
        state.expenseSuccess = false;
      })

      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter(e => e._id !== action.payload);
        state.todayExpenses = state.todayExpenses.filter(e => e._id !== action.payload);
        state.expenseTotal -= 1;
      });
  },
});

export const {
  clearIncomeSuccess,
  clearExpenseSuccess,
  clearIncomeError,
  clearExpenseError,
} = financeSlice.actions;

export default financeSlice.reducer;
