// src/redux/slices/examCategorySlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CreateExamCategoryDto, ExamCategoriesResponse, ExamCategoryItem, ExamCategoryQueryParams, ExamCategoryState, UpdateExamCategoryDto } from './types/examCategory.types';
import examCategoryService from './services/examCategoryService';


const initialState: ExamCategoryState = {
  categories: [],
  currentCategory: null,
  loading: false,
  error: null,
  success: false,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

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

const examCategorySlice = createSlice({
  name: 'examCategory',
  initialState,
  reducers: {
    resetExamCategoryState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.currentCategory = null;
    },
    clearExamCategoryError: (state) => {
      state.error = null;
    },
    clearExamCategorySuccess: (state) => {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder
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

      // Create
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

      // Update
      .addCase(updateExamCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.categories.findIndex((cat) => cat._id === action.payload._id);
        if (index !== -1) state.categories[index] = action.payload;
        if (state.currentCategory?._id === action.payload._id) {
          state.currentCategory = action.payload;
        }
      })

      // Delete
      .addCase(deleteExamCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.categories = state.categories.filter((cat) => cat._id !== action.payload);
        state.total -= 1;
        state.totalPages = Math.ceil(state.total / state.limit);
      })

      // Toggle Active
      .addCase(toggleExamCategoryActive.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.categories.findIndex((cat) => cat._id === action.payload._id);
        if (index !== -1) state.categories[index] = action.payload;
      });
  },
});

export const {
  resetExamCategoryState,
  clearExamCategoryError,
  clearExamCategorySuccess,
} = examCategorySlice.actions;

export default examCategorySlice.reducer;