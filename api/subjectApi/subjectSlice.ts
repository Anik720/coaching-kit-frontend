import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { 
  SubjectsResponse, 
  SubjectItem, 
  SubjectQueryParams, 
  SubjectState, 
  CreateSubjectDto, 
  UpdateSubjectDto 
} from './types/subject.types';
import subjectService from './service/subjectService';

const initialState: SubjectState = {
  subjects: [],
  currentSubject: null,
  loading: false,
  error: null,
  success: false,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

// Async thunks
export const fetchSubjects = createAsyncThunk<
  SubjectsResponse,
  SubjectQueryParams | undefined,
  { rejectValue: string }
>(
  'subject/fetchSubjects',
  async (params, { rejectWithValue }) => {
    try {
      const response = await subjectService.getAllSubjects(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch subjects'
      );
    }
  }
);

export const fetchSubjectById = createAsyncThunk<
  SubjectItem,
  string,
  { rejectValue: string }
>(
  'subject/fetchSubjectById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await subjectService.getSubjectById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch subject'
      );
    }
  }
);

export const createSubject = createAsyncThunk<
  SubjectItem,
  CreateSubjectDto,
  { rejectValue: string }
>(
  'subject/createSubject',
  async (subjectData, { rejectWithValue }) => {
    try {
      const response = await subjectService.createSubject(subjectData);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to create subject'
      );
    }
  }
);

export const updateSubject = createAsyncThunk<
  SubjectItem,
  { id: string; subjectData: UpdateSubjectDto },
  { rejectValue: string }
>(
  'subject/updateSubject',
  async ({ id, subjectData }, { rejectWithValue }) => {
    try {
      const response = await subjectService.updateSubject(id, subjectData);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update subject'
      );
    }
  }
);

export const deleteSubject = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'subject/deleteSubject',
  async (id, { rejectWithValue }) => {
    try {
      await subjectService.deleteSubject(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to delete subject'
      );
    }
  }
);

export const toggleSubjectActive = createAsyncThunk<
  SubjectItem,
  string,
  { rejectValue: string }
>(
  'subject/toggleSubjectActive',
  async (id, { rejectWithValue }) => {
    try {
      const response = await subjectService.toggleSubjectActive(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to toggle subject status'
      );
    }
  }
);

export const fetchMySubjects = createAsyncThunk<
  SubjectsResponse,
  Omit<SubjectQueryParams, 'sortBy' | 'sortOrder'> | undefined,
  { rejectValue: string }
>(
  'subject/fetchMySubjects',
  async (params, { rejectWithValue }) => {
    try {
      const response = await subjectService.getMySubjects(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch my subjects'
      );
    }
  }
);

const subjectSlice = createSlice({
  name: 'subject',
  initialState,
  reducers: {
    resetSubjectState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.currentSubject = null;
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
  },
  extraReducers: (builder) => {
    builder
      // Fetch Subjects
      .addCase(fetchSubjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubjects.fulfilled, (state, action: PayloadAction<SubjectsResponse>) => {
        state.loading = false;
        state.subjects = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchSubjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch subjects';
      })

      // Fetch Subject By ID
      .addCase(fetchSubjectById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubjectById.fulfilled, (state, action: PayloadAction<SubjectItem>) => {
        state.loading = false;
        state.currentSubject = action.payload;
      })
      .addCase(fetchSubjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch subject';
      })

      // Create Subject
      .addCase(createSubject.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createSubject.fulfilled, (state, action: PayloadAction<SubjectItem>) => {
        state.loading = false;
        state.success = true;
        state.subjects.unshift(action.payload);
        state.total += 1;
        state.totalPages = Math.ceil(state.total / state.limit);
      })
      .addCase(createSubject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create subject';
        state.success = false;
      })

      // Update Subject
      .addCase(updateSubject.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateSubject.fulfilled, (state, action: PayloadAction<SubjectItem>) => {
        state.loading = false;
        state.success = true;
        const index = state.subjects.findIndex((subject) => subject._id === action.payload._id);
        if (index !== -1) {
          state.subjects[index] = action.payload;
        }
        if (state.currentSubject?._id === action.payload._id) {
          state.currentSubject = action.payload;
        }
      })
      .addCase(updateSubject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update subject';
        state.success = false;
      })

      // Delete Subject
      .addCase(deleteSubject.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteSubject.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.success = true;
        state.subjects = state.subjects.filter((subject) => subject._id !== action.payload);
        state.total -= 1;
        state.totalPages = Math.ceil(state.total / state.limit);
        if (state.currentSubject?._id === action.payload) {
          state.currentSubject = null;
        }
      })
      .addCase(deleteSubject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete subject';
        state.success = false;
      })

      // Toggle Subject Active
      .addCase(toggleSubjectActive.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleSubjectActive.fulfilled, (state, action: PayloadAction<SubjectItem>) => {
        state.loading = false;
        const index = state.subjects.findIndex((subject) => subject._id === action.payload._id);
        if (index !== -1) {
          state.subjects[index] = action.payload;
        }
        if (state.currentSubject?._id === action.payload._id) {
          state.currentSubject = action.payload;
        }
      })
      .addCase(toggleSubjectActive.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to toggle subject status';
      })

      // Fetch My Subjects
      .addCase(fetchMySubjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMySubjects.fulfilled, (state, action: PayloadAction<SubjectsResponse>) => {
        state.loading = false;
        state.subjects = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchMySubjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch my subjects';
      });
  },
});

export const { resetSubjectState, setError, clearError, clearSuccess } = subjectSlice.actions;
export default subjectSlice.reducer;