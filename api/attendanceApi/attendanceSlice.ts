// src/api/attendanceApi/attendanceSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import attendanceApi from './attendanceApi';


export interface AttendanceRecord {
  _id: string;
  student: {
    _id: string;
    registrationId: string;
    nameEnglish: string;
    class: {
      _id: string;
      classname: string;
    };
    batch: {
      _id: string;
      batchName: string;
    };
  };
  class: {
    _id: string;
    classname: string;
  };
  batch: {
    _id: string;
    batchName: string;
    sessionYear: string;
  };
  attendanceDate: string;
  classStartingTime: string;
  classEndingTime: string;
  attendanceType: 'present' | 'absent' | 'late' | 'half_day';
  remarks?: string;
  isActive: boolean;
  createdBy: {
    _id: string;
    username: string;
    email: string;
    role: string;
  };
  updatedBy?: {
    _id: string;
    username: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceFormData {
  classId: string;
  batchId: string;
  attendanceDate: string;
  classStartingTime: string;
  classEndingTime: string;
  attendanceType: string;
  students: Array<{
    studentId: string;
    attendanceType: string;
    remarks?: string;
  }>;
}

export interface AttendanceStats {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  halfDayCount: number;
  attendanceRate: number;
}

export interface AttendanceFilters {
  search?: string;
  classId?: string;
  batchId?: string;
  attendanceDate?: string;
  attendanceType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface AttendanceState {
  attendanceRecords: AttendanceRecord[];
  currentAttendance: AttendanceRecord | null;
  attendanceStats: AttendanceStats | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: AttendanceFilters;
}

const initialState: AttendanceState = {
  attendanceRecords: [],
  currentAttendance: null,
  attendanceStats: null,
  loading: false,
  error: null,
  success: false,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  filters: {},
};

// Async Thunks
export const fetchAttendanceRecords = createAsyncThunk(
  'attendance/fetchRecords',
  async (filters: AttendanceFilters = {}, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.getAttendanceRecords(filters);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance records');
    }
  }
);

export const fetchAttendanceStats = createAsyncThunk(
  'attendance/fetchStats',
  async (filters: AttendanceFilters = {}, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.getAttendanceStats(filters);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance statistics');
    }
  }
);

export const fetchStudentsByClassBatch = createAsyncThunk(
  'attendance/fetchStudents',
  async ({ classId, batchId }: { classId: string; batchId: string }, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.getStudentsByClassBatch(classId, batchId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch students');
    }
  }
);

export const submitAttendance = createAsyncThunk(
  'attendance/submit',
  async (attendanceData: AttendanceFormData, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.submitAttendance(attendanceData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit attendance');
    }
  }
);

export const updateAttendance = createAsyncThunk(
  'attendance/update',
  async ({ id, attendanceData }: { id: string; attendanceData: Partial<AttendanceFormData> }, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.updateAttendance(id, attendanceData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update attendance');
    }
  }
);

export const deleteAttendance = createAsyncThunk(
  'attendance/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await attendanceApi.deleteAttendance(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete attendance');
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    setFilters: (state, action: PayloadAction<AttendanceFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    resetAttendanceState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch Attendance Records
      .addCase(fetchAttendanceRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.attendanceRecords = action.payload.records || action.payload;
        state.total = action.payload.total || action.payload.length;
        state.page = action.payload.page || 1;
        state.limit = action.payload.limit || 10;
        state.totalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchAttendanceRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Attendance Stats
      .addCase(fetchAttendanceStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceStats.fulfilled, (state, action) => {
        state.loading = false;
        state.attendanceStats = action.payload;
      })
      .addCase(fetchAttendanceStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Students
      .addCase(fetchStudentsByClassBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentsByClassBatch.fulfilled, (state, action) => {
        state.loading = false;
        // Store students data temporarily for form
      })
      .addCase(fetchStudentsByClassBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Submit Attendance
      .addCase(submitAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Optionally add to records
        if (state.attendanceRecords.length > 0) {
          state.attendanceRecords.unshift(action.payload);
          state.total += 1;
        }
      })
      .addCase(submitAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update Attendance
      .addCase(updateAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.attendanceRecords.findIndex(record => record._id === action.payload._id);
        if (index !== -1) {
          state.attendanceRecords[index] = action.payload;
        }
      })
      .addCase(updateAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete Attendance
      .addCase(deleteAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.attendanceRecords = state.attendanceRecords.filter(record => record._id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearSuccess,
  setFilters,
  clearFilters,
  resetAttendanceState,
} = attendanceSlice.actions;

export default attendanceSlice.reducer;