import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  CreateTeacherDto, 
  UpdateTeacherDto, 
  TeacherItem, 
  TeacherStatistics, 
  TeacherListResponse,
  TeacherFilterParams,
  UpdateStatusParams,
  ChangePasswordParams,
  Gender,
  Religion,
  BloodGroup,
  Designation,
  AssignType,
  TeacherStatus
} from './types/teacher.types';
import api from '../axios';


interface TeacherState {
  teachers: TeacherItem[];
  currentTeacher: TeacherItem | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statistics: TeacherStatistics | null;
}

const initialState: TeacherState = {
  teachers: [],
  currentTeacher: null,
  loading: false,
  error: null,
  success: false,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  statistics: null,
};

// Async Thunks
export const fetchTeachers = createAsyncThunk<TeacherListResponse, TeacherFilterParams>(
  'teacher/fetchTeachers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/teachers', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch teachers');
    }
  }
);

export const fetchTeacherById = createAsyncThunk<TeacherItem, string>(
  'teacher/fetchTeacherById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/teachers/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch teacher');
    }
  }
);

export const createTeacher = createAsyncThunk<TeacherItem, CreateTeacherDto>(
  'teacher/createTeacher',
  async (teacherData, { rejectWithValue }) => {
    try {
      const response = await api.post('/teachers', teacherData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create teacher');
    }
  }
);

export const updateTeacher = createAsyncThunk<TeacherItem, { id: string; teacherData: UpdateTeacherDto }>(
  'teacher/updateTeacher',
  async ({ id, teacherData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/teachers/${id}`, teacherData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update teacher');
    }
  }
);

export const deleteTeacher = createAsyncThunk<void, string>(
  'teacher/deleteTeacher',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/teachers/${id}`);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete teacher');
    }
  }
);

export const updateTeacherStatus = createAsyncThunk<TeacherItem, { id: string; status: TeacherStatus; isActive: boolean }>(
  'teacher/updateTeacherStatus',
  async ({ id, status, isActive }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/teachers/${id}/status`, { status, isActive });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update teacher status');
    }
  }
);

export const verifyTeacherEmail = createAsyncThunk<TeacherItem, string>(
  'teacher/verifyTeacherEmail',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/teachers/${id}/verify-email`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to verify email');
    }
  }
);

export const verifyTeacherPhone = createAsyncThunk<TeacherItem, string>(
  'teacher/verifyTeacherPhone',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/teachers/${id}/verify-phone`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to verify phone');
    }
  }
);

export const changeTeacherPassword = createAsyncThunk<TeacherItem, { id: string; newPassword: string }>(
  'teacher/changeTeacherPassword',
  async ({ id, newPassword }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/teachers/${id}/change-password`, { newPassword });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change password');
    }
  }
);

export const fetchTeacherStatistics = createAsyncThunk<TeacherStatistics, void>(
  'teacher/fetchTeacherStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/teachers/statistics/overview');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);

export const fetchMyStatsSummary = createAsyncThunk<any, void>(
  'teacher/fetchMyStatsSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/teachers/my-stats/summary');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats summary');
    }
  }
);

export const fetchTeachersByUser = createAsyncThunk<TeacherListResponse, TeacherFilterParams>(
  'teacher/fetchTeachersByUser',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/teachers/my-teachers', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user teachers');
    }
  }
);

const teacherSlice = createSlice({
  name: 'teacher',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setCurrentTeacher: (state, action: PayloadAction<TeacherItem | null>) => {
      state.currentTeacher = action.payload;
    },
    resetTeacherState: (state) => {
      state.teachers = [];
      state.currentTeacher = null;
      state.loading = false;
      state.error = null;
      state.success = false;
      state.total = 0;
      state.page = 1;
      state.limit = 10;
      state.totalPages = 0;
      state.statistics = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Teachers
      .addCase(fetchTeachers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeachers.fulfilled, (state, action) => {
        state.loading = false;
        state.teachers = action.payload.teachers;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchTeachers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Teacher by ID
      .addCase(fetchTeacherById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTeacher = action.payload;
      })
      .addCase(fetchTeacherById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create Teacher
      .addCase(createTeacher.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createTeacher.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.teachers.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createTeacher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // Update Teacher
      .addCase(updateTeacher.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateTeacher.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.teachers.findIndex(teacher => teacher._id === action.payload._id);
        if (index !== -1) {
          state.teachers[index] = action.payload;
        }
        if (state.currentTeacher?._id === action.payload._id) {
          state.currentTeacher = action.payload;
        }
      })
      .addCase(updateTeacher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // Delete Teacher
      .addCase(deleteTeacher.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteTeacher.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.teachers = state.teachers.filter(teacher => teacher._id !== action.meta.arg);
        state.total -= 1;
      })
      .addCase(deleteTeacher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // Update Teacher Status
      .addCase(updateTeacherStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateTeacherStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.teachers.findIndex(teacher => teacher._id === action.payload._id);
        if (index !== -1) {
          state.teachers[index] = action.payload;
        }
      })
      .addCase(updateTeacherStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // Verify Email
      .addCase(verifyTeacherEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(verifyTeacherEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.teachers.findIndex(teacher => teacher._id === action.payload._id);
        if (index !== -1) {
          state.teachers[index] = action.payload;
        }
      })
      .addCase(verifyTeacherEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // Verify Phone
      .addCase(verifyTeacherPhone.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(verifyTeacherPhone.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.teachers.findIndex(teacher => teacher._id === action.payload._id);
        if (index !== -1) {
          state.teachers[index] = action.payload;
        }
      })
      .addCase(verifyTeacherPhone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // Fetch Statistics
      .addCase(fetchTeacherStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchTeacherStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch My Stats Summary
      .addCase(fetchMyStatsSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyStatsSummary.fulfilled, (state, action) => {
        state.loading = false;
        // Update statistics with summary data
        if (state.statistics) {
          state.statistics = {
            ...state.statistics,
            ...action.payload
          };
        }
      })
      .addCase(fetchMyStatsSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Teachers by User
      .addCase(fetchTeachersByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeachersByUser.fulfilled, (state, action) => {
        state.loading = false;
        state.teachers = action.payload.teachers;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchTeachersByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearSuccess,
  setError,
  setCurrentTeacher,
  resetTeacherState,
} = teacherSlice.actions;

export default teacherSlice.reducer;