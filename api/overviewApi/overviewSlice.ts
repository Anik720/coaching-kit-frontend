import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../axios';

// Async thunk to fetch overview data
export const fetchOverview = createAsyncThunk(
  'overview/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/academic/overview');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch academic overview');
    }
  }
);

interface OverviewState {
  data: any;
  loading: boolean;
  error: string | null;
}

const initialState: OverviewState = {
  data: null,
  loading: false,
  error: null,
};

const overviewSlice = createSlice({
  name: 'overview',
  initialState,
  reducers: {
    clearOverviewError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearOverviewError } = overviewSlice.actions;
export default overviewSlice.reducer;