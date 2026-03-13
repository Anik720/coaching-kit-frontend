// api/result-management/result/resultSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  BulkCreateResultDto,
  BulkResultResponse,
  CreateResultDto,
  Result,
  ResultPaginatedResponse,
  ResultQueryParams,
  ResultSummary,
  StudentForResultEntry,
} from './types/result.types';
import resultService from './services/resultService';

export interface ResultState {
  results: Result[];
  currentResult: Result | null;
  examResults: Result[];
  students: StudentForResultEntry[];
  resultSummary: ResultSummary | null;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  loadingStudents: boolean;
  error: string | null;
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const initialState: ResultState = {
  results: [],
  currentResult: null,
  examResults: [],
  students: [],
  resultSummary: null,
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  loadingStudents: false,
  error: null,
  success: false,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

// Thunks
export const fetchResults = createAsyncThunk<
  ResultPaginatedResponse,
  ResultQueryParams | undefined,
  { rejectValue: string }
>('result/fetchResults', async (params, { rejectWithValue }) => {
  try {
    return await resultService.getAll(params);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load results');
  }
});

export const fetchExamResults = createAsyncThunk<
  ResultPaginatedResponse,
  { examId: string; params?: ResultQueryParams },
  { rejectValue: string }
>('result/fetchExamResults', async ({ examId, params }, { rejectWithValue }) => {
  try {
    return await resultService.getExamResults(examId, params);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load exam results');
  }
});

export const fetchResultSummary = createAsyncThunk<
  ResultSummary,
  string,
  { rejectValue: string }
>('result/fetchResultSummary', async (examId, { rejectWithValue }) => {
  try {
    return await resultService.getResultSummary(examId);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load result summary');
  }
});

export const fetchStudentsForResultEntry = createAsyncThunk<
  StudentForResultEntry[],
  { classId: string; batchId: string },
  { rejectValue: string }
>('result/fetchStudentsForResultEntry', async ({ classId, batchId }, { rejectWithValue }) => {
  try {
    return await resultService.getStudentsForResultEntry(classId, batchId);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load students');
  }
});

export const createResult = createAsyncThunk<
  Result,
  CreateResultDto,
  { rejectValue: string }
>('result/createResult', async (data, { rejectWithValue }) => {
  try {
    return await resultService.create(data);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create result');
  }
});

export const bulkCreateResult = createAsyncThunk<
  BulkResultResponse,
  BulkCreateResultDto,
  { rejectValue: string }
>('result/bulkCreateResult', async (data, { rejectWithValue }) => {
  try {
    return await resultService.bulkCreate(data);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to bulk create results');
  }
});

export const deleteResult = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('result/deleteResult', async (id, { rejectWithValue }) => {
  try {
    await resultService.delete(id);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete result');
  }
});

export const toggleResultActive = createAsyncThunk<
  Result,
  string,
  { rejectValue: string }
>('result/toggleResultActive', async (id, { rejectWithValue }) => {
  try {
    return await resultService.toggleActive(id);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to toggle result status');
  }
});

const resultSlice = createSlice({
  name: 'result',
  initialState,
  reducers: {
    clearResultError: (state) => {
      state.error = null;
    },
    clearResultSuccess: (state) => {
      state.success = false;
    },
    setCurrentResult: (state, action: PayloadAction<Result | null>) => {
      state.currentResult = action.payload;
    },
    clearStudents: (state) => {
      state.students = [];
    },
    clearResultSummary: (state) => {
      state.resultSummary = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch results
      .addCase(fetchResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch results';
      })

      // Fetch exam results
      .addCase(fetchExamResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExamResults.fulfilled, (state, action) => {
        state.loading = false;
        state.examResults = action.payload.data;
      })
      .addCase(fetchExamResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch exam results';
      })

      // Fetch result summary
      .addCase(fetchResultSummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchResultSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.resultSummary = action.payload;
      })
      .addCase(fetchResultSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch result summary';
      })

      // Fetch students for result entry
      .addCase(fetchStudentsForResultEntry.pending, (state) => {
        state.loadingStudents = true;
        state.error = null;
      })
      .addCase(fetchStudentsForResultEntry.fulfilled, (state, action) => {
        state.loadingStudents = false;
        state.students = action.payload;
      })
      .addCase(fetchStudentsForResultEntry.rejected, (state, action) => {
        state.loadingStudents = false;
        state.error = action.payload || 'Failed to fetch students';
      })

      // Create result
      .addCase(createResult.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createResult.fulfilled, (state, action) => {
        state.creating = false;
        state.success = true;
        state.results.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createResult.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || 'Failed to create result';
      })

      // Bulk create result
      .addCase(bulkCreateResult.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(bulkCreateResult.fulfilled, (state, action) => {
        state.creating = false;
        state.success = true;
      })
      .addCase(bulkCreateResult.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || 'Failed to bulk create results';
      })

      // Delete result
      .addCase(deleteResult.fulfilled, (state, action) => {
        state.deleting = false;
        state.success = true;
        state.results = state.results.filter((r) => r._id !== action.payload);
        state.total -= 1;
      })

      // Toggle active
      .addCase(toggleResultActive.fulfilled, (state, action) => {
        const index = state.results.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) state.results[index] = action.payload;
      });
  },
});

export const {
  clearResultError,
  clearResultSuccess,
  setCurrentResult,
  clearStudents,
  clearResultSummary,
} = resultSlice.actions;

export default resultSlice.reducer;
