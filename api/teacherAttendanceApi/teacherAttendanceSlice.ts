import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import teacherAttendanceApi from './teacherAttendanceApi';

export interface AttendanceDetail {
  _id?: string;
  class: { _id: string; classname: string };
  batch: { _id: string; batchName: string; sessionYear?: string };
  subject: { _id: string; subjectName: string; subjectCode?: string };
  status: string;
  remarks?: string;
}

export interface TeacherAttendanceRecord {
  _id: string;
  teacher: { _id: string; fullName: string; email: string; designation: string };
  date: string;
  attendanceDetails: AttendanceDetail[];
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  approvalStatus: string;
  submittedBy?: string;
  approvedBy?: any;
  approvedAt?: string;
  approvalRemarks?: string;
  createdBy?: any;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherAttendanceFilters {
  teacher?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  approvalStatus?: string;
  page?: number;
  limit?: number;
}

interface TeacherAttendanceState {
  records: TeacherAttendanceRecord[];
  currentRecord: TeacherAttendanceRecord | null;
  pendingRecords: TeacherAttendanceRecord[];
  monthlyReport: any | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const initialState: TeacherAttendanceState = {
  records: [],
  currentRecord: null,
  pendingRecords: [],
  monthlyReport: null,
  loading: false,
  error: null,
  success: false,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

export const fetchTeacherAttendances = createAsyncThunk(
  'teacherAttendance/fetchAll',
  async (params: TeacherAttendanceFilters = {}, { rejectWithValue }) => {
    try {
      const response = await teacherAttendanceApi.getAll(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance records');
    }
  }
);

export const fetchTeacherAttendanceById = createAsyncThunk(
  'teacherAttendance/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await teacherAttendanceApi.getById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance');
    }
  }
);

export const fetchAttendanceByTeacherDate = createAsyncThunk(
  'teacherAttendance/fetchByTeacherDate',
  async ({ teacherId, date }: { teacherId: string; date: string }, { rejectWithValue }) => {
    try {
      const response = await teacherAttendanceApi.getByTeacherAndDate(teacherId, date);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance');
    }
  }
);

export const createTeacherAttendance = createAsyncThunk(
  'teacherAttendance/create',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await teacherAttendanceApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit attendance');
    }
  }
);

export const updateTeacherAttendance = createAsyncThunk(
  'teacherAttendance/update',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await teacherAttendanceApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update attendance');
    }
  }
);

export const deleteTeacherAttendance = createAsyncThunk(
  'teacherAttendance/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await teacherAttendanceApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete attendance');
    }
  }
);

export const approveTeacherAttendance = createAsyncThunk(
  'teacherAttendance/approve',
  async (
    { id, approvalStatus, remarks }: { id: string; approvalStatus: string; remarks?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await teacherAttendanceApi.approve(id, { approvalStatus, remarks });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve attendance');
    }
  }
);

export const fetchMonthlyReport = createAsyncThunk(
  'teacherAttendance/fetchMonthlyReport',
  async (
    { teacherId, month, year }: { teacherId: string; month: number; year: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await teacherAttendanceApi.getMonthlyReport(teacherId, month, year);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch monthly report');
    }
  }
);

export const fetchPendingAttendances = createAsyncThunk(
  'teacherAttendance/fetchPending',
  async (_, { rejectWithValue }) => {
    try {
      const response = await teacherAttendanceApi.getAll({
        approvalStatus: 'submitted',
        limit: 100,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending attendances');
    }
  }
);

const teacherAttendanceSlice = createSlice({
  name: 'teacherAttendance',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    clearSuccess: (state) => { state.success = false; },
    clearMonthlyReport: (state) => { state.monthlyReport = null; },
    setCurrentRecord: (state, action: PayloadAction<TeacherAttendanceRecord | null>) => {
      state.currentRecord = action.payload;
    },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchTeacherAttendances.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchTeacherAttendances.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        state.records = Array.isArray(payload)
          ? payload
          : payload?.attendances || payload?.data || [];
        state.total = payload?.total || (Array.isArray(payload) ? payload.length : 0);
        state.page = payload?.page || 1;
        state.limit = payload?.limit || 10;
        state.totalPages = payload?.totalPages || 1;
      })
      .addCase(fetchTeacherAttendances.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })

      // Fetch By ID
      .addCase(fetchTeacherAttendanceById.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchTeacherAttendanceById.fulfilled, (state, action) => {
        state.loading = false; state.currentRecord = action.payload;
      })
      .addCase(fetchTeacherAttendanceById.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })

      // Fetch By Teacher & Date
      .addCase(fetchAttendanceByTeacherDate.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchAttendanceByTeacherDate.fulfilled, (state, action) => {
        state.loading = false;
        const data = Array.isArray(action.payload) ? action.payload : [action.payload];
        state.currentRecord = data[0] || null;
      })
      .addCase(fetchAttendanceByTeacherDate.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })

      // Create
      .addCase(createTeacherAttendance.pending, (state) => {
        state.loading = true; state.error = null; state.success = false;
      })
      .addCase(createTeacherAttendance.fulfilled, (state, action) => {
        state.loading = false; state.success = true;
        state.records.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createTeacherAttendance.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string; state.success = false;
      })

      // Update
      .addCase(updateTeacherAttendance.pending, (state) => {
        state.loading = true; state.error = null; state.success = false;
      })
      .addCase(updateTeacherAttendance.fulfilled, (state, action) => {
        state.loading = false; state.success = true;
        const idx = state.records.findIndex((r) => r._id === action.payload._id);
        if (idx !== -1) state.records[idx] = action.payload;
        if (state.currentRecord?._id === action.payload._id) state.currentRecord = action.payload;
      })
      .addCase(updateTeacherAttendance.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string; state.success = false;
      })

      // Delete
      .addCase(deleteTeacherAttendance.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(deleteTeacherAttendance.fulfilled, (state, action) => {
        state.loading = false; state.success = true;
        state.records = state.records.filter((r) => r._id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteTeacherAttendance.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })

      // Approve
      .addCase(approveTeacherAttendance.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(approveTeacherAttendance.fulfilled, (state, action) => {
        state.loading = false; state.success = true;
        const idx = state.records.findIndex((r) => r._id === action.payload._id);
        if (idx !== -1) state.records[idx] = action.payload;
        state.pendingRecords = state.pendingRecords.filter((r) => r._id !== action.payload._id);
      })
      .addCase(approveTeacherAttendance.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })

      // Monthly Report
      .addCase(fetchMonthlyReport.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchMonthlyReport.fulfilled, (state, action) => {
        state.loading = false; state.monthlyReport = action.payload;
      })
      .addCase(fetchMonthlyReport.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })

      // Pending
      .addCase(fetchPendingAttendances.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchPendingAttendances.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        state.pendingRecords = Array.isArray(payload) ? payload : payload?.attendances || [];
      })
      .addCase(fetchPendingAttendances.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSuccess, clearMonthlyReport, setCurrentRecord, resetState } =
  teacherAttendanceSlice.actions;

export default teacherAttendanceSlice.reducer;
