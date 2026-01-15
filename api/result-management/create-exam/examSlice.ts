// api/result-management/create-exam/examSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CreateExamDto, Exam, ExamQueryParams, ExamsPaginatedResponse, UpdateExamDto } from './types/exam.types';
import examService from './services/examService';

// Define the complete ExamState interface
export interface ExamState {
  exams: Exam[];
  currentExam: Exam | null;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  error: string | null;
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  // Dropdown data
  classes: any[];
  batches: any[];
  subjects: any[];
  examCategories: any[];
  activeBatches: any[];
}

const initialState: ExamState = {
  exams: [],
  currentExam: null,
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,
  success: false,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  classes: [],
  batches: [],
  subjects: [],
  examCategories: [],
  activeBatches: [],
};

// ── Thunks ────────────────────────────────────────────────────────────────

export const fetchExams = createAsyncThunk<
  ExamsPaginatedResponse,
  ExamQueryParams | undefined,
  { rejectValue: string }
>('exam/fetchExams', async (params, { rejectWithValue }) => {
  try {
    return await examService.getAll(params);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load exams');
  }
});

export const createExam = createAsyncThunk<
  Exam,
  CreateExamDto,
  { rejectValue: string }
>('exam/createExam', async (data, { rejectWithValue }) => {
  try {
    return await examService.create(data);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create exam');
  }
});

export const updateExam = createAsyncThunk<
  Exam,
  { id: string; data: UpdateExamDto },
  { rejectValue: string }
>('exam/updateExam', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await examService.update(id, data);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update exam');
  }
});

export const deleteExam = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('exam/deleteExam', async (id, { rejectWithValue }) => {
  try {
    await examService.delete(id);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete exam');
  }
});

export const toggleExamActive = createAsyncThunk<
  Exam,
  string,
  { rejectValue: string }
>('exam/toggleExamActive', async (id, { rejectWithValue }) => {
  try {
    return await examService.toggleActive(id);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to toggle active status');
  }
});

// Dropdown data thunks
export const fetchClasses = createAsyncThunk<
  any[],
  void,
  { rejectValue: string }
>('exam/fetchClasses', async (_, { rejectWithValue }) => {
  try {
    return await examService.getClasses();
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch classes');
  }
});

export const fetchSubjects = createAsyncThunk<
  any[],
  void,
  { rejectValue: string }
>('exam/fetchSubjects', async (_, { rejectWithValue }) => {
  try {
    return await examService.getSubjects();
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch subjects');
  }
});

export const fetchExamCategories = createAsyncThunk<
  any[],
  void,
  { rejectValue: string }
>('exam/fetchExamCategories', async (_, { rejectWithValue }) => {
  try {
    return await examService.getExamCategories();
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch exam categories');
  }
});

export const fetchActiveBatches = createAsyncThunk<
  any[],
  void,
  { rejectValue: string }
>('exam/fetchActiveBatches', async (_, { rejectWithValue }) => {
  try {
    return await examService.getActiveBatches();
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch active batches');
  }
});

export const fetchBatchesByClass = createAsyncThunk<
  any[],
  string,
  { rejectValue: string }
>('exam/fetchBatchesByClass', async (classId, { rejectWithValue }) => {
  try {
    return await examService.getBatchesByClass(classId);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch batches by class');
  }
});

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    clearExamError: (state) => {
      state.error = null;
    },
    clearExamSuccess: (state) => {
      state.success = false;
    },
    setCurrentExam: (state, action: PayloadAction<Exam | null>) => {
      state.currentExam = action.payload;
    },
    setBatches: (state, action: PayloadAction<any[]>) => {
      state.batches = action.payload;
    },
    clearBatches: (state) => {
      state.batches = [];
    },
    resetDropdownData: (state) => {
      state.classes = [];
      state.batches = [];
      state.subjects = [];
      state.examCategories = [];
      state.activeBatches = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch exams
      .addCase(fetchExams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExams.fulfilled, (state, action) => {
        state.loading = false;
        state.exams = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchExams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch exams';
      })

      // Create
      .addCase(createExam.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createExam.fulfilled, (state, action) => {
        state.creating = false;
        state.success = true;
        state.exams.unshift(action.payload);
        state.total += 1;
        state.totalPages = Math.ceil(state.total / state.limit);
      })
      .addCase(createExam.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || 'Failed to create exam';
      })

      // Update
      .addCase(updateExam.fulfilled, (state, action) => {
        state.updating = false;
        state.success = true;
        const index = state.exams.findIndex(e => e._id === action.payload._id);
        if (index !== -1) state.exams[index] = action.payload;
        if (state.currentExam?._id === action.payload._id) {
          state.currentExam = action.payload;
        }
      })

      // Delete
      .addCase(deleteExam.fulfilled, (state, action) => {
        state.deleting = false;
        state.success = true;
        state.exams = state.exams.filter(e => e._id !== action.payload);
        state.total -= 1;
        state.totalPages = Math.ceil(state.total / state.limit);
      })

      // Toggle active
      .addCase(toggleExamActive.fulfilled, (state, action) => {
        const index = state.exams.findIndex(e => e._id === action.payload._id);
        if (index !== -1) state.exams[index] = action.payload;
        if (state.currentExam?._id === action.payload._id) {
          state.currentExam = action.payload;
        }
      })

      // Fetch classes
      .addCase(fetchClasses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.classes = action.payload;
      })
      .addCase(fetchClasses.rejected, (state) => {
        state.loading = false;
        state.classes = [];
      })

      // Fetch subjects
      .addCase(fetchSubjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSubjects.fulfilled, (state, action) => {
        state.loading = false;
        state.subjects = action.payload;
      })
      .addCase(fetchSubjects.rejected, (state) => {
        state.loading = false;
        state.subjects = [];
      })

      // Fetch exam categories
      .addCase(fetchExamCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExamCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.examCategories = action.payload;
      })
      .addCase(fetchExamCategories.rejected, (state) => {
        state.loading = false;
        state.examCategories = [];
      })

      // Fetch active batches
      .addCase(fetchActiveBatches.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActiveBatches.fulfilled, (state, action) => {
        state.loading = false;
        state.activeBatches = action.payload;
      })
      .addCase(fetchActiveBatches.rejected, (state) => {
        state.loading = false;
        state.activeBatches = [];
      })

      // Fetch batches by class
      .addCase(fetchBatchesByClass.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBatchesByClass.fulfilled, (state, action) => {
        state.loading = false;
        state.batches = action.payload;
      })
      .addCase(fetchBatchesByClass.rejected, (state) => {
        state.loading = false;
        state.batches = [];
      });
  },
});

export const {
  clearExamError,
  clearExamSuccess,
  setCurrentExam,
  setBatches,
  clearBatches,
  resetDropdownData,
} = examSlice.actions;

export default examSlice.reducer;