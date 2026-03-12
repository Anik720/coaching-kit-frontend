// api/result-management/exam-category/examCategorySlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  CategoryStatus,
  CreateExamCategoryDto,
  ExamCategoriesResponse,
  ExamCategoryItem,
  ExamCategoryQueryParams,
  ExamCategoryState,
  UpdateExamCategoryDto,
} from './types/examCategory.types';
import examCategoryService from './services/examCategoryService';

const initialState: ExamCategoryState = {
  categories: [],
  currentCategory: null,
  categoryStatus: null,
  loading: false,
  statusLoading: false,
  error: null,
  success: false,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

// ─── Thunks ────────────────────────────────────────────────────────────────────

export const fetchExamCategories = createAsyncThunk<
  ExamCategoriesResponse,
  ExamCategoryQueryParams | undefined,
  { rejectValue: string }
>('examCategory/fetchExamCategories', async (params, { rejectWithValue }) => {
  try {
    return await examCategoryService.getAllCategories(params);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch exam categories');
  }
});

export const fetchExamCategoryById = createAsyncThunk<
  ExamCategoryItem,
  string,
  { rejectValue: string }
>('examCategory/fetchExamCategoryById', async (id, { rejectWithValue }) => {
  try {
    return await examCategoryService.getCategoryById(id);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch exam category');
  }
});

export const createExamCategory = createAsyncThunk<
  ExamCategoryItem,
  CreateExamCategoryDto,
  { rejectValue: string }
>('examCategory/createExamCategory', async (data, { rejectWithValue }) => {
  try {
    return await examCategoryService.createCategory(data);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create exam category');
  }
});

export const updateExamCategory = createAsyncThunk<
  ExamCategoryItem,
  { id: string; data: UpdateExamCategoryDto },
  { rejectValue: string }
>('examCategory/updateExamCategory', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await examCategoryService.updateCategory(id, data);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update exam category');
  }
});

export const deleteExamCategory = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('examCategory/deleteExamCategory', async (id, { rejectWithValue }) => {
  try {
    await examCategoryService.deleteCategory(id);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete exam category');
  }
});

export const toggleExamCategoryActive = createAsyncThunk<
  ExamCategoryItem,
  string,
  { rejectValue: string }
>('examCategory/toggleExamCategoryActive', async (id, { rejectWithValue }) => {
  try {
    return await examCategoryService.toggleCategoryActive(id);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to toggle status');
  }
});

export const fetchExamCategoryStatus = createAsyncThunk<
  CategoryStatus,
  string,
  { rejectValue: string }
>('examCategory/fetchExamCategoryStatus', async (id, { rejectWithValue }) => {
  try {
    return await examCategoryService.getCategoryStatus(id);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch category status');
  }
});

// ─── Slice ─────────────────────────────────────────────────────────────────────

const examCategorySlice = createSlice({
  name: 'examCategory',
  initialState,
  reducers: {
    resetExamCategoryState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.currentCategory = null;
      state.categoryStatus = null;
    },
    clearExamCategoryError: (state) => {
      state.error = null;
    },
    clearExamCategorySuccess: (state) => {
      state.success = false;
    },
    setCurrentCategory: (state, action: PayloadAction<ExamCategoryItem | null>) => {
      state.currentCategory = action.payload;
    },
    clearCategoryStatus: (state) => {
      state.categoryStatus = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Fetch All ──────────────────────────────────────────────────────────
      .addCase(fetchExamCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExamCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchExamCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load exam categories';
      })

      // ── Fetch By ID ────────────────────────────────────────────────────────
      .addCase(fetchExamCategoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExamCategoryById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCategory = action.payload;
      })
      .addCase(fetchExamCategoryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load exam category';
      })

      // ── Create ─────────────────────────────────────────────────────────────
      .addCase(createExamCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createExamCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.categories.unshift(action.payload);
        state.total += 1;
        state.totalPages = Math.ceil(state.total / state.limit);
      })
      .addCase(createExamCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create category';
        state.success = false;
      })

      // ── Update ─────────────────────────────────────────────────────────────
      .addCase(updateExamCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateExamCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.categories.findIndex((cat) => cat._id === action.payload._id);
        if (index !== -1) state.categories[index] = action.payload;
        if (state.currentCategory?._id === action.payload._id) {
          state.currentCategory = action.payload;
        }
      })
      .addCase(updateExamCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update category';
        state.success = false;
      })

      // ── Delete ─────────────────────────────────────────────────────────────
      .addCase(deleteExamCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExamCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.categories = state.categories.filter((cat) => cat._id !== action.payload);
        state.total -= 1;
        state.totalPages = Math.ceil(state.total / state.limit);
      })
      .addCase(deleteExamCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete category';
      })

      // ── Toggle Active ──────────────────────────────────────────────────────
      .addCase(toggleExamCategoryActive.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleExamCategoryActive.fulfilled, (state, action) => {
        state.success = true;
        const index = state.categories.findIndex((cat) => cat._id === action.payload._id);
        if (index !== -1) state.categories[index] = action.payload;
        if (state.currentCategory?._id === action.payload._id) {
          state.currentCategory = action.payload;
        }
      })
      .addCase(toggleExamCategoryActive.rejected, (state, action) => {
        state.error = action.payload || 'Failed to toggle status';
      })

      // ── Fetch Status ───────────────────────────────────────────────────────
      .addCase(fetchExamCategoryStatus.pending, (state) => {
        state.statusLoading = true;
        state.error = null;
      })
      .addCase(fetchExamCategoryStatus.fulfilled, (state, action) => {
        state.statusLoading = false;
        state.categoryStatus = action.payload;
      })
      .addCase(fetchExamCategoryStatus.rejected, (state, action) => {
        state.statusLoading = false;
        state.error = action.payload || 'Failed to fetch category status';
      });
  },
});

export const {
  resetExamCategoryState,
  clearExamCategoryError,
  clearExamCategorySuccess,
  setCurrentCategory,
  clearCategoryStatus,
} = examCategorySlice.actions;

export default examCategorySlice.reducer;