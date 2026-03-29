import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import salaryService from './services/salaryService';
import {
  SalaryState,
  SalariesResponse,
  UnpaidSalariesResponse,
  SalaryQueryParams,
  CreateSalaryDto,
  SalaryItem,
} from './types/salary.types';

const initialState: SalaryState = {
  salaries: [],
  unpaidSalaries: [],
  loading: false,
  error: null,
  success: false,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

export const fetchSalaries = createAsyncThunk<
  SalariesResponse,
  SalaryQueryParams | undefined,
  { rejectValue: string }
>(
  'salary/fetchSalaries',
  async (params, { rejectWithValue }) => {
    try {
      const response = await salaryService.getSalaries(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch salaries'
      );
    }
  }
);

export const fetchUnpaidSalaries = createAsyncThunk<
  UnpaidSalariesResponse,
  { userType: 'teacher' | 'staff'; month: string; page?: number; limit?: number },
  { rejectValue: string }
>(
  'salary/fetchUnpaidSalaries',
  async ({ userType, month, page, limit }, { rejectWithValue }) => {
    try {
      const response = await salaryService.getUnpaidSalaries(userType, month, page, limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch unpaid salaries'
      );
    }
  }
);

export const createSalary = createAsyncThunk<
  SalaryItem,
  CreateSalaryDto,
  { rejectValue: string }
>(
  'salary/createSalary',
  async (data, { rejectWithValue }) => {
    try {
      const response = await salaryService.createSalary(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to process salary payment'
      );
    }
  }
);

const salarySlice = createSlice({
  name: 'salary',
  initialState,
  reducers: {
    resetSalaryState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchSalaries
      .addCase(fetchSalaries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalaries.fulfilled, (state, action: PayloadAction<SalariesResponse>) => {
        state.loading = false;
        state.salaries = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchSalaries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch salaries';
      })
      // fetchUnpaidSalaries
      .addCase(fetchUnpaidSalaries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUnpaidSalaries.fulfilled, (state, action: PayloadAction<UnpaidSalariesResponse>) => {
        state.loading = false;
        state.unpaidSalaries = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchUnpaidSalaries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch unpaid salaries';
      })
      // createSalary
      .addCase(createSalary.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createSalary.fulfilled, (state, action: PayloadAction<SalaryItem>) => {
        state.loading = false;
        state.success = true;
        state.salaries.unshift(action.payload);
        state.total += 1;
        state.totalPages = Math.ceil(state.total / state.limit);
      })
      .addCase(createSalary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to process salary payment';
        state.success = false;
      });
  },
});

export const { resetSalaryState, clearError, clearSuccess } = salarySlice.actions;
export default salarySlice.reducer;
