import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import employeeAttendanceApi from './employeeAttendanceApi';

export interface StaffAttendanceItem {
  _id: string;
  employee: any;
  date: string;
  inTime?: string;
  outTime?: string;
  breakInTime?: string;
  breakOutTime?: string;
  status: string;
  remarks?: string;
  ipAddress?: string;
  totalHours?: string;
  createdAt: string;
  updatedAt: string;
}

interface StaffAttendanceState {
  attendances: StaffAttendanceItem[];
  currentAttendance: StaffAttendanceItem | null;
  selfAttendanceToday: StaffAttendanceItem | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const initialState: StaffAttendanceState = {
  attendances: [],
  currentAttendance: null,
  selfAttendanceToday: null,
  loading: false,
  error: null,
  success: false,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

export const fetchStaffAttendances = createAsyncThunk(
  'staffAttendance/fetchAll',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const res = await employeeAttendanceApi.getAll(params);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to fetch attendances');
    }
  }
);

export const fetchSelfAttendanceToday = createAsyncThunk(
  'staffAttendance/fetchSelfToday',
  async (date: string, { rejectWithValue }) => {
    try {
      const res = await employeeAttendanceApi.getSelfToday(date);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to fetch today attendance');
    }
  }
);

export const markSelfIn = createAsyncThunk(
  'staffAttendance/markSelfIn',
  async (data: Record<string, any>, { rejectWithValue }) => {
    try {
      const res = await employeeAttendanceApi.markSelfIn(data);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to mark in');
    }
  }
);

export const markSelfOut = createAsyncThunk(
  'staffAttendance/markSelfOut',
  async (data: Record<string, any>, { rejectWithValue }) => {
    try {
      const res = await employeeAttendanceApi.markSelfOut(data);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to mark out');
    }
  }
);

export const markBreakIn = createAsyncThunk(
  'staffAttendance/markBreakIn',
  async (data: Record<string, any>, { rejectWithValue }) => {
    try {
      const res = await employeeAttendanceApi.markBreakIn(data);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to mark break in');
    }
  }
);

export const markBreakOut = createAsyncThunk(
  'staffAttendance/markBreakOut',
  async (data: Record<string, any>, { rejectWithValue }) => {
    try {
      const res = await employeeAttendanceApi.markBreakOut(data);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to mark break out');
    }
  }
);

export const createManualAttendance = createAsyncThunk(
  'staffAttendance/createManual',
  async (data: Record<string, any>, { rejectWithValue }) => {
    try {
      const res = await employeeAttendanceApi.createManual(data);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to create attendance');
    }
  }
);

const staffAttendanceSlice = createSlice({
  name: 'staffAttendance',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    clearSuccess: (state) => { state.success = false; },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchStaffAttendances.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchStaffAttendances.fulfilled, (state, action) => {
        state.loading = false;
        state.attendances = action.payload.data || [];
        state.total = action.payload.total || 0;
        state.page = action.payload.page || 1;
        state.limit = action.payload.limit || 10;
        state.totalPages = action.payload.totalPages || 0;
      })
      .addCase(fetchStaffAttendances.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })
      // Self Today
      .addCase(fetchSelfAttendanceToday.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSelfAttendanceToday.fulfilled, (state, action) => {
        state.loading = false; state.selfAttendanceToday = action.payload;
      })
      .addCase(fetchSelfAttendanceToday.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })
      // Mark Self In
      .addCase(markSelfIn.pending, (state) => { state.loading = true; state.error = null; state.success = false; })
      .addCase(markSelfIn.fulfilled, (state, action) => {
        state.loading = false; state.success = true;
        state.selfAttendanceToday = action.payload;
      })
      .addCase(markSelfIn.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })
      // Mark Self Out
      .addCase(markSelfOut.pending, (state) => { state.loading = true; state.error = null; state.success = false; })
      .addCase(markSelfOut.fulfilled, (state, action) => {
        state.loading = false; state.success = true;
        state.selfAttendanceToday = action.payload;
      })
      .addCase(markSelfOut.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })
      // Mark Break In
      .addCase(markBreakIn.pending, (state) => { state.loading = true; state.error = null; state.success = false; })
      .addCase(markBreakIn.fulfilled, (state, action) => {
        state.loading = false; state.success = true;
        state.selfAttendanceToday = action.payload;
      })
      .addCase(markBreakIn.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })
      // Mark Break Out
      .addCase(markBreakOut.pending, (state) => { state.loading = true; state.error = null; state.success = false; })
      .addCase(markBreakOut.fulfilled, (state, action) => {
        state.loading = false; state.success = true;
        state.selfAttendanceToday = action.payload;
      })
      .addCase(markBreakOut.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })
      // Create Manual
      .addCase(createManualAttendance.pending, (state) => { state.loading = true; state.error = null; state.success = false; })
      .addCase(createManualAttendance.fulfilled, (state, action) => {
        state.loading = false; state.success = true;
      })
      .addCase(createManualAttendance.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSuccess } = staffAttendanceSlice.actions;
export default staffAttendanceSlice.reducer;
