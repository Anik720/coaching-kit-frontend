import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import batchService from './services/batchService';
import { 
  BatchesResponse, 
  BatchItem, 
  BatchQueryParams, 
  BatchState, 
  CreateBatchDto, 
  UpdateBatchDto,
  ClassItem,
  GroupItem,
  SubjectItem,
  BatchStats,
  CreateBatchResponse // Add this import
} from './types/batch.types';

const initialState: BatchState = {
  batches: [],
  currentBatch: null,
  loading: false,
  error: null,
  success: false,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  classes: [],
  groups: [],
  subjects: [],
};

// Async thunks
export const fetchBatches = createAsyncThunk<
  BatchesResponse,
  BatchQueryParams | undefined,
  { rejectValue: string }
>(
  'batch/fetchBatches',
  async (params, { rejectWithValue }) => {
    try {
      const response = await batchService.getAllBatches(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch batches'
      );
    }
  }
);

export const fetchBatchById = createAsyncThunk<
  BatchItem,
  string,
  { rejectValue: string }
>(
  'batch/fetchBatchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await batchService.getBatchById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch batch'
      );
    }
  }
);

export const createBatch = createAsyncThunk<
  CreateBatchResponse, // Change return type to CreateBatchResponse
  CreateBatchDto,
  { rejectValue: string }
>(
  'batch/createBatch',
  async (batchData, { rejectWithValue }) => {
    try {
      const response = await batchService.createBatch(batchData);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to create batch'
      );
    }
  }
);

export const updateBatch = createAsyncThunk<
  BatchItem,
  { id: string; batchData: UpdateBatchDto },
  { rejectValue: string }
>(
  'batch/updateBatch',
  async ({ id, batchData }, { rejectWithValue }) => {
    try {
      const response = await batchService.updateBatch(id, batchData);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update batch'
      );
    }
  }
);

export const deleteBatch = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'batch/deleteBatch',
  async (id, { rejectWithValue }) => {
    try {
      await batchService.deleteBatch(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to delete batch'
      );
    }
  }
);

export const toggleBatchStatus = createAsyncThunk<
  BatchItem,
  string,
  { rejectValue: string }
>(
  'batch/toggleBatchStatus',
  async (id, { rejectWithValue }) => {
    try {
      const response = await batchService.toggleBatchStatus(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to toggle batch status'
      );
    }
  }
);

export const fetchBatchStats = createAsyncThunk<
  BatchStats,
  void,
  { rejectValue: string }
>(
  'batch/fetchBatchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await batchService.getBatchStats();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch batch statistics'
      );
    }
  }
);

export const fetchClasses = createAsyncThunk<
  ClassItem[],
  void,
  { rejectValue: string }
>(
  'batch/fetchClasses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await batchService.getAllClasses();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch classes'
      );
    }
  }
);

export const fetchGroups = createAsyncThunk<
  GroupItem[],
  void,
  { rejectValue: string }
>(
  'batch/fetchGroups',
  async (_, { rejectWithValue }) => {
    try {
      const response = await batchService.getAllGroups();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch groups'
      );
    }
  }
);

export const fetchSubjects = createAsyncThunk<
  SubjectItem[],
  void,
  { rejectValue: string }
>(
  'batch/fetchSubjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await batchService.getAllSubjects();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch subjects'
      );
    }
  }
);

const batchSlice = createSlice({
  name: 'batch',
  initialState,
  reducers: {
    resetBatchState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.currentBatch = null;
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
      // Fetch Batches
      .addCase(fetchBatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBatches.fulfilled, (state, action: PayloadAction<BatchesResponse>) => {
        state.loading = false;
        state.batches = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchBatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch batches';
      })

      // Fetch Batch By ID
      .addCase(fetchBatchById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBatchById.fulfilled, (state, action: PayloadAction<BatchItem>) => {
        state.loading = false;
        state.currentBatch = action.payload;
      })
      .addCase(fetchBatchById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch batch';
      })

      // Create Batch - Fix the type casting
      .addCase(createBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createBatch.fulfilled, (state, action: PayloadAction<CreateBatchResponse>) => {
        state.loading = false;
        state.success = true;
        // Type cast CreateBatchResponse to BatchItem
        const batchItem: BatchItem = {
          ...action.payload,
          status: action.payload.status as 'active' | 'inactive' | 'completed' | 'upcoming',
          className: typeof action.payload.className === 'string' 
            ? action.payload.className 
            : { _id: action.payload.className._id, classname: action.payload.className.classname || '' },
          group: typeof action.payload.group === 'string'
            ? action.payload.group
            : { _id: action.payload.group._id, groupName: action.payload.group.groupName || '' },
          subject: typeof action.payload.subject === 'string'
            ? action.payload.subject
            : { _id: action.payload.subject._id, subjectName: action.payload.subject.subjectName || '' },
          createdBy: typeof action.payload.createdBy === 'string'
            ? action.payload.createdBy
            : {
                id: action.payload.createdBy._id || action.payload.createdBy.id,
                email: action.payload.createdBy.email,
                username: action.payload.createdBy.username,
                role: action.payload.createdBy.role
              }
        };
        state.batches.unshift(batchItem);
        state.total += 1;
        state.totalPages = Math.ceil(state.total / state.limit);
      })
      .addCase(createBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create batch';
        state.success = false;
      })

      // Update Batch
      .addCase(updateBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateBatch.fulfilled, (state, action: PayloadAction<BatchItem>) => {
        state.loading = false;
        state.success = true;
        const index = state.batches.findIndex((batch) => batch._id === action.payload._id);
        if (index !== -1) {
          state.batches[index] = action.payload;
        }
        if (state.currentBatch?._id === action.payload._id) {
          state.currentBatch = action.payload;
        }
      })
      .addCase(updateBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update batch';
        state.success = false;
      })

      // Delete Batch
      .addCase(deleteBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteBatch.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.success = true;
        state.batches = state.batches.filter((batch) => batch._id !== action.payload);
        state.total -= 1;
        state.totalPages = Math.ceil(state.total / state.limit);
        if (state.currentBatch?._id === action.payload) {
          state.currentBatch = null;
        }
      })
      .addCase(deleteBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete batch';
        state.success = false;
      })

      // Toggle Batch Status
      .addCase(toggleBatchStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleBatchStatus.fulfilled, (state, action: PayloadAction<BatchItem>) => {
        state.loading = false;
        const index = state.batches.findIndex((batch) => batch._id === action.payload._id);
        if (index !== -1) {
          state.batches[index] = action.payload;
        }
        if (state.currentBatch?._id === action.payload._id) {
          state.currentBatch = action.payload;
        }
      })
      .addCase(toggleBatchStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to toggle batch status';
      })

      // Fetch Classes
      .addCase(fetchClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClasses.fulfilled, (state, action: PayloadAction<ClassItem[]>) => {
        state.loading = false;
        state.classes = action.payload;
      })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch classes';
      })

      // Fetch Groups
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action: PayloadAction<GroupItem[]>) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch groups';
      })

      // Fetch Subjects
      .addCase(fetchSubjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubjects.fulfilled, (state, action: PayloadAction<SubjectItem[]>) => {
        state.loading = false;
        state.subjects = action.payload;
      })
      .addCase(fetchSubjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch subjects';
      })

      // Fetch Batch Stats
      .addCase(fetchBatchStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBatchStats.fulfilled, (state, action: PayloadAction<BatchStats>) => {
        state.loading = false;
        // Store stats in state if needed
      })
      .addCase(fetchBatchStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch batch statistics';
      });
  },
});

export const { resetBatchState, setError, clearError, clearSuccess } = batchSlice.actions;
export default batchSlice.reducer;