import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import feeService from './services/feeService';
import { FeeState, FeeCategory, Fee, Payment } from './types/fee.types';

const initialState: FeeState = {
  feeCategories: [],
  fees: [],
  dueList: [],
  history: [],
  loading: false,
  error: null,
  success: false,
};

export const fetchFeeCategories = createAsyncThunk(
  'fee/fetchFeeCategories',
  async (_, { rejectWithValue }) => {
    try {
      return await feeService.getCategories();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch fee categories');
    }
  }
);

export const createFeeCategory = createAsyncThunk(
  'fee/createFeeCategory',
  async (data: any, { rejectWithValue }) => {
    try {
      return await feeService.createCategory(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create fee category');
    }
  }
);

export const fetchDueList = createAsyncThunk(
  'fee/fetchDueList',
  async (_, { rejectWithValue }) => {
    try {
      return await feeService.getDueList();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch due list');
    }
  }
);

export const fetchHistory = createAsyncThunk(
  'fee/fetchHistory',
  async (params: any, { rejectWithValue }) => {
    try {
      return await feeService.getHistory(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch fee history');
    }
  }
);

export const generateFee = createAsyncThunk(
  'fee/generateFee',
  async (data: any, { rejectWithValue }) => {
    try {
      return await feeService.generateFee(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate fee');
    }
  }
);

export const processPayment = createAsyncThunk(
  'fee/processPayment',
  async (data: any, { rejectWithValue }) => {
    try {
      return await feeService.processPayment(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process payment');
    }
  }
);

const feeSlice = createSlice({
  name: 'fee',
  initialState,
  reducers: {
    clearFeeState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    clearFeeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchFeeCategories.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFeeCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.feeCategories = action.payload;
      })
      .addCase(fetchFeeCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Due List
      .addCase(fetchDueList.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDueList.fulfilled, (state, action) => {
        state.loading = false;
        state.dueList = action.payload;
      })
      .addCase(fetchDueList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch History
      .addCase(fetchHistory.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Generate Fee
      .addCase(generateFee.pending, (state) => { state.loading = true; state.success = false; state.error = null; })
      .addCase(generateFee.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Optimization: Optionally push to dueList if returned
        state.dueList.unshift(action.payload);
      })
      .addCase(generateFee.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload as string;
      })
  },
});

export const { clearFeeState, clearFeeError } = feeSlice.actions;
export default feeSlice.reducer;
