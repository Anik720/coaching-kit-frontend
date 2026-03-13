// api/result-management/combine-result/combineResultSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import combineResultService from './services/combineResultService';
import {
  CombineResultResponseDto,
  SearchCombineResultDto,
  CreateCombineResultDto,
  CombineResultPaginatedResponse,
  ExamForCombineSearch,
  QueryParams,
} from './types/combine-result.types';

export interface CombineResultState {
  combineResults: CombineResultResponseDto[];
  currentCombineResult: CombineResultResponseDto | null;
  searchedExams: ExamForCombineSearch[];
  loading: boolean;
  searchingExams: boolean;
  creating: boolean;
  deleting: boolean;
  toggling: boolean;
  error: string | null;
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  studentResults: any[];
  studentsLoading: boolean;
  studentTotal: number;
  studentTotalPages: number;
}

const initialState: CombineResultState = {
  combineResults: [],
  currentCombineResult: null,
  searchedExams: [],
  loading: false,
  searchingExams: false,
  creating: false,
  deleting: false,
  toggling: false,
  error: null,
  success: false,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  studentResults: [],
  studentsLoading: false,
  studentTotal: 0,
  studentTotalPages: 0,
};

// Thunks
export const fetchCombineResults = createAsyncThunk<
  CombineResultPaginatedResponse,
  QueryParams | undefined,
  { rejectValue: string }
>('combineResult/fetchCombineResults', async (params, { rejectWithValue }) => {
  try {
    return await combineResultService.getAll(params);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load combine results');
  }
});

export const fetchCombineResultById = createAsyncThunk<
  CombineResultResponseDto,
  string,
  { rejectValue: string }
>('combineResult/fetchCombineResultById', async (id, { rejectWithValue }) => {
  try {
    return await combineResultService.getById(id);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load combine result');
  }
});

export const fetchCombineResultStudents = createAsyncThunk<
  any,
  { id: string; params?: { search?: string; batch?: string; page?: number; limit?: number } },
  { rejectValue: string }
>('combineResult/fetchCombineResultStudents', async ({ id, params }, { rejectWithValue }) => {
  try {
    return await combineResultService.getStudentResults(id, params);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load student results');
  }
});

export const searchExamsForCombine = createAsyncThunk<
  ExamForCombineSearch[],
  SearchCombineResultDto,
  { rejectValue: string }
>('combineResult/searchExamsForCombine', async (data, { rejectWithValue }) => {
  try {
    return await combineResultService.searchExams(data);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to search exams');
  }
});

export const createCombineResult = createAsyncThunk<
  CombineResultResponseDto,
  CreateCombineResultDto,
  { rejectValue: string }
>('combineResult/createCombineResult', async (data, { rejectWithValue }) => {
  try {
    return await combineResultService.create(data);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create combine result');
  }
});

export const deleteCombineResult = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('combineResult/deleteCombineResult', async (id, { rejectWithValue }) => {
  try {
    await combineResultService.delete(id);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete combine result');
  }
});

export const toggleCombineResultPublish = createAsyncThunk<
  CombineResultResponseDto,
  string,
  { rejectValue: string }
>('combineResult/togglePublish', async (id, { rejectWithValue }) => {
  try {
    return await combineResultService.togglePublish(id);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to toggle publish status');
  }
});

export const toggleCombineResultActive = createAsyncThunk<
  CombineResultResponseDto,
  string,
  { rejectValue: string }
>('combineResult/toggleActive', async (id, { rejectWithValue }) => {
  try {
    return await combineResultService.toggleActive(id);
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to toggle active status');
  }
});

const combineResultSlice = createSlice({
  name: 'combineResult',
  initialState,
  reducers: {
    clearCombineResultError: (state) => {
      state.error = null;
    },
    clearCombineResultSuccess: (state) => {
      state.success = false;
    },
    clearSearchedExams: (state) => {
      state.searchedExams = [];
    },
    setCurrentCombineResult: (state, action: PayloadAction<CombineResultResponseDto | null>) => {
      state.currentCombineResult = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch combine results
      .addCase(fetchCombineResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCombineResults.fulfilled, (state, action) => {
        state.loading = false;
        state.combineResults = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchCombineResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch combine results';
      })

      // Search exams
      .addCase(searchExamsForCombine.pending, (state) => {
        state.searchingExams = true;
        state.error = null;
      })
      .addCase(searchExamsForCombine.fulfilled, (state, action) => {
        state.searchingExams = false;
        state.searchedExams = action.payload;
      })
      .addCase(searchExamsForCombine.rejected, (state, action) => {
        state.searchingExams = false;
        state.error = action.payload || 'Failed to search exams';
      })

      // Create combine result
      .addCase(createCombineResult.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createCombineResult.fulfilled, (state, action) => {
        state.creating = false;
        state.success = true;
      })
      .addCase(createCombineResult.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || 'Failed to create combine result';
      })

      // Delete combine result
      .addCase(deleteCombineResult.pending, (state) => {
        state.deleting = true;
      })
      .addCase(deleteCombineResult.fulfilled, (state, action) => {
        state.deleting = false;
        state.success = true;
        state.combineResults = state.combineResults.filter((r) => r._id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteCombineResult.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || 'Failed to delete combine result';
      })

      // Toggle publish
      .addCase(toggleCombineResultPublish.pending, (state) => {
        state.toggling = true;
      })
      .addCase(toggleCombineResultPublish.fulfilled, (state, action) => {
        state.toggling = false;
        const index = state.combineResults.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) state.combineResults[index] = action.payload;
      })
      .addCase(toggleCombineResultPublish.rejected, (state, action) => {
        state.toggling = false;
        state.error = action.payload || 'Failed to toggle publish status';
      })

      // Toggle active
      .addCase(toggleCombineResultActive.pending, (state) => {
        state.toggling = true;
      })
      .addCase(toggleCombineResultActive.fulfilled, (state, action) => {
        state.toggling = false;
        const index = state.combineResults.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) state.combineResults[index] = action.payload;
      })
      .addCase(toggleCombineResultActive.rejected, (state, action) => {
        state.toggling = false;
        state.error = action.payload || 'Failed to toggle active status';
      })

      // Fetch combine result by ID
      .addCase(fetchCombineResultById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCombineResultById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCombineResult = action.payload;
      })
      .addCase(fetchCombineResultById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch combine result';
      })

      // Fetch student results
      .addCase(fetchCombineResultStudents.pending, (state) => {
        state.studentsLoading = true;
        state.error = null;
      })
      .addCase(fetchCombineResultStudents.fulfilled, (state, action) => {
        state.studentsLoading = false;
        state.studentResults = action.payload.data;
        state.studentTotal = action.payload.total;
        state.studentTotalPages = action.payload.totalPages;
      })
      .addCase(fetchCombineResultStudents.rejected, (state, action) => {
        state.studentsLoading = false;
        state.error = action.payload || 'Failed to fetch student results';
      });
  },
});

export const {
  clearCombineResultError,
  clearCombineResultSuccess,
  clearSearchedExams,
  setCurrentCombineResult,
} = combineResultSlice.actions;

export default combineResultSlice.reducer;
