import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CreateGroupDto, GroupItem, GroupQueryParams, GroupsResponse, GroupState, GroupStatusResponse, UpdateGroupDto } from './types/group.types';
import groupService from './service/groupService';


const initialState: GroupState = {
  groups: [],
  currentGroup: null,
  loading: false,
  error: null,
  success: false,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

// Async thunks
export const fetchGroups = createAsyncThunk<
  GroupsResponse,
  GroupQueryParams | undefined,
  { rejectValue: string }
>(
  'group/fetchGroups',
  async (params, { rejectWithValue }) => {
    try {
      const response = await groupService.getAllGroups(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch groups'
      );
    }
  }
);

export const fetchGroupById = createAsyncThunk<
  GroupItem,
  string,
  { rejectValue: string }
>(
  'group/fetchGroupById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await groupService.getGroupById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch group'
      );
    }
  }
);

export const createGroup = createAsyncThunk<
  GroupItem,
  CreateGroupDto,
  { rejectValue: string }
>(
  'group/createGroup',
  async (groupData, { rejectWithValue }) => {
    try {
      const response = await groupService.createGroup(groupData);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to create group'
      );
    }
  }
);

export const updateGroup = createAsyncThunk<
  GroupItem,
  { id: string; groupData: UpdateGroupDto },
  { rejectValue: string }
>(
  'group/updateGroup',
  async ({ id, groupData }, { rejectWithValue }) => {
    try {
      const response = await groupService.updateGroup(id, groupData);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update group'
      );
    }
  }
);

export const deleteGroup = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'group/deleteGroup',
  async (id, { rejectWithValue }) => {
    try {
      await groupService.deleteGroup(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to delete group'
      );
    }
  }
);

export const toggleGroupActive = createAsyncThunk<
  GroupItem,
  string,
  { rejectValue: string }
>(
  'group/toggleGroupActive',
  async (id, { rejectWithValue }) => {
    try {
      const response = await groupService.toggleGroupActive(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to toggle group status'
      );
    }
  }
);

export const fetchGroupStatus = createAsyncThunk<
  GroupStatusResponse,
  string,
  { rejectValue: string }
>(
  'group/fetchGroupStatus',
  async (id, { rejectWithValue }) => {
    try {
      const response = await groupService.getGroupStatus(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch group status'
      );
    }
  }
);

export const fetchMyGroups = createAsyncThunk<
  GroupsResponse,
  Omit<GroupQueryParams, 'sortBy' | 'sortOrder'> | undefined,
  { rejectValue: string }
>(
  'group/fetchMyGroups',
  async (params, { rejectWithValue }) => {
    try {
      const response = await groupService.getMyGroups(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch my groups'
      );
    }
  }
);

const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {
    resetGroupState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.currentGroup = null;
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
      // Fetch Groups
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action: PayloadAction<GroupsResponse>) => {
        state.loading = false;
        state.groups = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch groups';
      })

      // Fetch Group By ID
      .addCase(fetchGroupById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupById.fulfilled, (state, action: PayloadAction<GroupItem>) => {
        state.loading = false;
        state.currentGroup = action.payload;
      })
      .addCase(fetchGroupById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch group';
      })

      // Create Group
      .addCase(createGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createGroup.fulfilled, (state, action: PayloadAction<GroupItem>) => {
        state.loading = false;
        state.success = true;
        state.groups.unshift(action.payload);
        state.total += 1;
        state.totalPages = Math.ceil(state.total / state.limit);
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create group';
        state.success = false;
      })

      // Update Group
      .addCase(updateGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateGroup.fulfilled, (state, action: PayloadAction<GroupItem>) => {
        state.loading = false;
        state.success = true;
        const index = state.groups.findIndex((group) => group._id === action.payload._id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
        if (state.currentGroup?._id === action.payload._id) {
          state.currentGroup = action.payload;
        }
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update group';
        state.success = false;
      })

      // Delete Group
      .addCase(deleteGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteGroup.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.success = true;
        state.groups = state.groups.filter((group) => group._id !== action.payload);
        state.total -= 1;
        state.totalPages = Math.ceil(state.total / state.limit);
        if (state.currentGroup?._id === action.payload) {
          state.currentGroup = null;
        }
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete group';
        state.success = false;
      })

      // Toggle Group Active
      .addCase(toggleGroupActive.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleGroupActive.fulfilled, (state, action: PayloadAction<GroupItem>) => {
        state.loading = false;
        const index = state.groups.findIndex((group) => group._id === action.payload._id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
        if (state.currentGroup?._id === action.payload._id) {
          state.currentGroup = action.payload;
        }
      })
      .addCase(toggleGroupActive.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to toggle group status';
      })

      // Fetch My Groups
      .addCase(fetchMyGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyGroups.fulfilled, (state, action: PayloadAction<GroupsResponse>) => {
        state.loading = false;
        state.groups = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchMyGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch my groups';
      });
  },
});

export const { resetGroupState, setError, clearError, clearSuccess } = groupSlice.actions;
export default groupSlice.reducer;