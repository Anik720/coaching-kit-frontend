
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import classService from './services/classService';
import { 
  ClassesResponse, 
  ClassItem, 
  ClassQueryParams, 
  ClassState, 
  CreateClassDto, 
  UpdateClassDto 
} from './types/class.types';

const initialState: ClassState = {
  classes: [],
  currentClass: null,
  loading: false,
  error: null,
  success: false,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

// Helper type for thunk arguments
type ThunkArgs = {
  rejectWithValue: (value: string) => any;
};

// Async thunks
export const fetchClasses = createAsyncThunk<
  ClassesResponse,
  ClassQueryParams | undefined,
  { rejectValue: string }
>(
  'class/fetchClasses',
  async (params, { rejectWithValue }) => {
    try {
      const response = await classService.getAllClasses(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch classes'
      );
    }
  }
);

export const fetchClassById = createAsyncThunk<
  ClassItem,
  string,
  { rejectValue: string }
>(
  'class/fetchClassById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await classService.getClassById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch class'
      );
    }
  }
);

export const createClass = createAsyncThunk<
  ClassItem,
  CreateClassDto,
  { rejectValue: string }
>(
  'class/createClass',
  async (classData, { rejectWithValue }) => {
    try {
      const response = await classService.createClass(classData);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to create class'
      );
    }
  }
);

export const updateClass = createAsyncThunk<
  ClassItem,
  { id: string; classData: UpdateClassDto },
  { rejectValue: string }
>(
  'class/updateClass',
  async ({ id, classData }, { rejectWithValue }) => {
    try {
      const response = await classService.updateClass(id, classData);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update class'
      );
    }
  }
);

export const deleteClass = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'class/deleteClass',
  async (id, { rejectWithValue }) => {
    try {
      await classService.deleteClass(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to delete class'
      );
    }
  }
);

export const toggleClassActive = createAsyncThunk<
  ClassItem,
  string,
  { rejectValue: string }
>(
  'class/toggleClassActive',
  async (id, { rejectWithValue }) => {
    try {
      const response = await classService.toggleClassActive(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to toggle class status'
      );
    }
  }
);

const classSlice = createSlice({
  name: 'class',
  initialState,
  reducers: {
    resetClassState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.currentClass = null;
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
      // Fetch Classes
      .addCase(fetchClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClasses.fulfilled, (state, action: PayloadAction<ClassesResponse>) => {
        state.loading = false;
        state.classes = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch classes';
      })

      // Fetch Class By ID
      .addCase(fetchClassById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClassById.fulfilled, (state, action: PayloadAction<ClassItem>) => {
        state.loading = false;
        state.currentClass = action.payload;
      })
      .addCase(fetchClassById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch class';
      })

      // Create Class
      .addCase(createClass.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createClass.fulfilled, (state, action: PayloadAction<ClassItem>) => {
        state.loading = false;
        state.success = true;
        state.classes.unshift(action.payload);
        state.total += 1;
        state.totalPages = Math.ceil(state.total / state.limit);
      })
      .addCase(createClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create class';
        state.success = false;
      })

      // Update Class
      .addCase(updateClass.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateClass.fulfilled, (state, action: PayloadAction<ClassItem>) => {
        state.loading = false;
        state.success = true;
        const index = state.classes.findIndex((cls) => cls._id === action.payload._id);
        if (index !== -1) {
          state.classes[index] = action.payload;
        }
        if (state.currentClass?._id === action.payload._id) {
          state.currentClass = action.payload;
        }
      })
      .addCase(updateClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update class';
        state.success = false;
      })

      // Delete Class
      .addCase(deleteClass.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteClass.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.success = true;
        state.classes = state.classes.filter((cls) => cls._id !== action.payload);
        state.total -= 1;
        state.totalPages = Math.ceil(state.total / state.limit);
        if (state.currentClass?._id === action.payload) {
          state.currentClass = null;
        }
      })
      .addCase(deleteClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete class';
        state.success = false;
      })

      // Toggle Class Active
      .addCase(toggleClassActive.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleClassActive.fulfilled, (state, action: PayloadAction<ClassItem>) => {
        state.loading = false;
        const index = state.classes.findIndex((cls) => cls._id === action.payload._id);
        if (index !== -1) {
          state.classes[index] = action.payload;
        }
        if (state.currentClass?._id === action.payload._id) {
          state.currentClass = action.payload;
        }
      })
      .addCase(toggleClassActive.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to toggle class status';
      });
  },
});

export const { resetClassState, setError, clearError, clearSuccess } = classSlice.actions;
export default classSlice.reducer;