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
  TeacherStatus,
  CreateAssignmentDto,
  TeacherAssignment,
  AssignmentsResponse,
  AssignmentQueryParams,
  UpdateAssignmentDto
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
  // Assignment state
  assignments: TeacherAssignment[];
  currentAssignment: TeacherAssignment | null;
  assignmentTotal: number;
  assignmentPage: number;
  assignmentLimit: number;
  assignmentTotalPages: number;
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
  assignments: [],
  currentAssignment: null,
  assignmentTotal: 0,
  assignmentPage: 1,
  assignmentLimit: 10,
  assignmentTotalPages: 0,
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

export const createBulkAssignments = createAsyncThunk<any, CreateAssignmentDto[]>(
  'teacher/createBulkAssignments',
  async (assignments, { rejectWithValue }) => {
    try {
      const response = await api.post('/teacher-assignments/bulk', assignments);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create assignments');
    }
  }
);

// Assignment Thunks
export const fetchAssignments = createAsyncThunk<AssignmentsResponse, AssignmentQueryParams>(
  'teacher/fetchAssignments',
  async (params, { rejectWithValue }) => {
    try {
      // Pass params securely 
      const response = await api.get('/teacher-assignments', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assignments');
    }
  }
);

export const updateAssignment = createAsyncThunk<TeacherAssignment, { id: string; assignmentData: UpdateAssignmentDto }>(
  'teacher/updateAssignment',
  async ({ id, assignmentData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/teacher-assignments/${id}`, assignmentData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update assignment');
    }
  }
);

export const deleteAssignment = createAsyncThunk<void, string>(
  'teacher/deleteAssignment',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/teacher-assignments/${id}`);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete assignment');
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
      state.assignments = [];
      state.currentAssignment = null;
      state.assignmentTotal = 0;
      state.assignmentPage = 1;
      state.assignmentLimit = 10;
      state.assignmentTotalPages = 0;
    },
    setCurrentAssignment: (state, action: PayloadAction<TeacherAssignment | null>) => {
      state.currentAssignment = action.payload;
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
      })
      
      // Create Bulk Assignments
      .addCase(createBulkAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createBulkAssignments.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(createBulkAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      // Fetch Assignments
      .addCase(fetchAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.assignments = action.payload.assignments;
        state.assignmentTotal = action.payload.total;
        state.assignmentPage = action.payload.page;
        state.assignmentLimit = action.payload.limit;
        state.assignmentTotalPages = action.payload.totalPages;
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update Assignment
      .addCase(updateAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.assignments.findIndex(a => a._id === action.payload._id);
        if (index !== -1) {
          state.assignments[index] = action.payload;
        }
        if (state.currentAssignment?._id === action.payload._id) {
          state.currentAssignment = action.payload;
        }
      })
      .addCase(updateAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      // Delete Assignment
      .addCase(deleteAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.assignments = state.assignments.filter(a => a._id !== action.meta.arg);
        state.assignmentTotal -= 1;
      })
      .addCase(deleteAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });
  },
});

export const {
  clearError,
  clearSuccess,
  setError,
  setCurrentTeacher,
  resetTeacherState,
  setCurrentAssignment
} = teacherSlice.actions;

export default teacherSlice.reducer;