// src/api/teacherApi/teacherSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import teacherService from './teacherService';
import { 
  TeachersResponse, 
  TeacherItem, 
  TeacherQueryParams, 
  TeacherState, 
  CreateTeacherDto, 
  UpdateTeacherDto,
  Statistics,
  MyStatsSummary
} from './types/teacher.types';

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
};

// Async thunks
export const fetchTeachers = createAsyncThunk<
  TeachersResponse,
  TeacherQueryParams | undefined,
  { rejectValue: string }
>(
  'teacher/fetchTeachers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await teacherService.getAllTeachers(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch teachers'
      );
    }
  }
);

export const fetchTeacherById = createAsyncThunk<
  TeacherItem,
  string,
  { rejectValue: string }
>(
  'teacher/fetchTeacherById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await teacherService.getTeacherById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch teacher'
      );
    }
  }
);

export const createTeacher = createAsyncThunk<
  TeacherItem,
  CreateTeacherDto,
  { rejectValue: string }
>(
  'teacher/createTeacher',
  async (teacherData, { rejectWithValue }) => {
    try {
      const response = await teacherService.createTeacher(teacherData);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to create teacher'
      );
    }
  }
);

export const updateTeacher = createAsyncThunk<
  TeacherItem,
  { id: string; teacherData: UpdateTeacherDto },
  { rejectValue: string }
>(
  'teacher/updateTeacher',
  async ({ id, teacherData }, { rejectWithValue }) => {
    try {
      const response = await teacherService.updateTeacher(id, teacherData);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update teacher'
      );
    }
  }
);

export const deleteTeacher = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'teacher/deleteTeacher',
  async (id, { rejectWithValue }) => {
    try {
      await teacherService.deleteTeacher(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to delete teacher'
      );
    }
  }
);

export const toggleTeacherActive = createAsyncThunk<
  TeacherItem,
  { id: string; isActive: boolean },
  { rejectValue: string }
>(
  'teacher/toggleTeacherActive',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const response = await teacherService.toggleTeacherActive(id, isActive);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to toggle teacher status'
      );
    }
  }
);

export const verifyTeacherEmail = createAsyncThunk<
  TeacherItem,
  string,
  { rejectValue: string }
>(
  'teacher/verifyEmail',
  async (id, { rejectWithValue }) => {
    try {
      const response = await teacherService.verifyEmail(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to verify email'
      );
    }
  }
);

export const verifyTeacherPhone = createAsyncThunk<
  TeacherItem,
  string,
  { rejectValue: string }
>(
  'teacher/verifyPhone',
  async (id, { rejectWithValue }) => {
    try {
      const response = await teacherService.verifyPhone(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to verify phone'
      );
    }
  }
);

export const fetchStatistics = createAsyncThunk<
  Statistics,
  void,
  { rejectValue: string }
>(
  'teacher/fetchStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await teacherService.getStatistics();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch statistics'
      );
    }
  }
);

export const fetchMyStatsSummary = createAsyncThunk<
  MyStatsSummary,
  void,
  { rejectValue: string }
>(
  'teacher/fetchMyStatsSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await teacherService.getMyStatsSummary();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch stats summary'
      );
    }
  }
);

const teacherSlice = createSlice({
  name: 'teacher',
  initialState,
  reducers: {
    resetTeacherState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.currentTeacher = null;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    setCurrentTeacher: (state, action: PayloadAction<TeacherItem | null>) => {
      state.currentTeacher = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Teachers
      .addCase(fetchTeachers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeachers.fulfilled, (state, action: PayloadAction<TeachersResponse>) => {
        state.loading = false;
        state.teachers = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchTeachers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch teachers';
      })

      // Fetch Teacher By ID
      .addCase(fetchTeacherById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherById.fulfilled, (state, action: PayloadAction<TeacherItem>) => {
        state.loading = false;
        state.currentTeacher = action.payload;
      })
      .addCase(fetchTeacherById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch teacher';
      })

      // Create Teacher
      .addCase(createTeacher.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createTeacher.fulfilled, (state, action: PayloadAction<TeacherItem>) => {
        state.loading = false;
        state.success = true;
        state.teachers.unshift(action.payload);
        state.total += 1;
        state.totalPages = Math.ceil(state.total / state.limit);
      })
      .addCase(createTeacher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create teacher';
        state.success = false;
      })

      // Update Teacher
      .addCase(updateTeacher.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateTeacher.fulfilled, (state, action: PayloadAction<TeacherItem>) => {
        state.loading = false;
        state.success = true;
        const index = state.teachers.findIndex((teacher) => teacher._id === action.payload._id);
        if (index !== -1) {
          state.teachers[index] = action.payload;
        }
        if (state.currentTeacher?._id === action.payload._id) {
          state.currentTeacher = action.payload;
        }
      })
      .addCase(updateTeacher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update teacher';
        state.success = false;
      })

      // Delete Teacher
      .addCase(deleteTeacher.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteTeacher.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.success = true;
        state.teachers = state.teachers.filter((teacher) => teacher._id !== action.payload);
        state.total -= 1;
        state.totalPages = Math.ceil(state.total / state.limit);
        if (state.currentTeacher?._id === action.payload) {
          state.currentTeacher = null;
        }
      })
      .addCase(deleteTeacher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete teacher';
        state.success = false;
      })

      // Toggle Teacher Active
      .addCase(toggleTeacherActive.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleTeacherActive.fulfilled, (state, action: PayloadAction<TeacherItem>) => {
        state.loading = false;
        const index = state.teachers.findIndex((teacher) => teacher._id === action.payload._id);
        if (index !== -1) {
          state.teachers[index] = action.payload;
        }
        if (state.currentTeacher?._id === action.payload._id) {
          state.currentTeacher = action.payload;
        }
      })
      .addCase(toggleTeacherActive.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to toggle teacher status';
      })

      // Verify Email
      .addCase(verifyTeacherEmail.fulfilled, (state, action: PayloadAction<TeacherItem>) => {
        const index = state.teachers.findIndex((teacher) => teacher._id === action.payload._id);
        if (index !== -1) {
          state.teachers[index] = action.payload;
        }
        if (state.currentTeacher?._id === action.payload._id) {
          state.currentTeacher = action.payload;
        }
      })

      // Verify Phone
      .addCase(verifyTeacherPhone.fulfilled, (state, action: PayloadAction<TeacherItem>) => {
        const index = state.teachers.findIndex((teacher) => teacher._id === action.payload._id);
        if (index !== -1) {
          state.teachers[index] = action.payload;
        }
        if (state.currentTeacher?._id === action.payload._id) {
          state.currentTeacher = action.payload;
        }
      })

      // Fetch Statistics
      .addCase(fetchStatistics.fulfilled, (state) => {
        // Statistics are stored separately, not in this slice
      })
      .addCase(fetchStatistics.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch statistics';
      })

      // Fetch My Stats Summary
      .addCase(fetchMyStatsSummary.fulfilled, (state) => {
        // Stats summary are stored separately
      })
      .addCase(fetchMyStatsSummary.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch stats summary';
      });
  },
});

export const { 
  resetTeacherState, 
  setError, 
  clearError, 
  clearSuccess,
  setCurrentTeacher 
} = teacherSlice.actions;

export default teacherSlice.reducer;