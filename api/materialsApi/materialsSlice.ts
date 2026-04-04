import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import materialsApi from './materialsApi';

// ─── State ──────────────────────────────────────────────────────────────────
interface MaterialsState {
  categories: any[];
  materials: any[];
  purchases: any[];
  distributions: any[];
  assignments: any[];
  assignedForBatch: any[];
  currentMaterial: any | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const initialState: MaterialsState = {
  categories: [],
  materials: [],
  purchases: [],
  distributions: [],
  assignments: [],
  assignedForBatch: [],
  currentMaterial: null,
  loading: false,
  actionLoading: false,
  error: null,
  success: false,
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
};

// ─── Thunks ─────────────────────────────────────────────────────────────────

// Categories
export const fetchCategories = createAsyncThunk(
  'materials/fetchCategories',
  async (status: string | undefined = undefined, { rejectWithValue }) => {
    try {
      const res = await materialsApi.listCategories(status);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load categories');
    }
  }
);

export const createCategory = createAsyncThunk(
  'materials/createCategory',
  async (data: Record<string, any>, { rejectWithValue }) => {
    try {
      const res = await materialsApi.createCategory(data);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to create category');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'materials/updateCategory',
  async ({ id, data }: { id: string; data: Record<string, any> }, { rejectWithValue }) => {
    try {
      const res = await materialsApi.updateCategory(id, data);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to update category');
    }
  }
);

// Materials
export const fetchMaterials = createAsyncThunk(
  'materials/fetchMaterials',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const res = await materialsApi.listMaterials(params);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load materials');
    }
  }
);

export const createMaterial = createAsyncThunk(
  'materials/createMaterial',
  async (data: Record<string, any>, { rejectWithValue }) => {
    try {
      const res = await materialsApi.createMaterial(data);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to create material');
    }
  }
);

export const updateMaterial = createAsyncThunk(
  'materials/updateMaterial',
  async ({ id, data }: { id: string; data: Record<string, any> }, { rejectWithValue }) => {
    try {
      const res = await materialsApi.updateMaterial(id, data);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to update material');
    }
  }
);

export const addStock = createAsyncThunk(
  'materials/addStock',
  async ({ id, data }: { id: string; data: Record<string, any> }, { rejectWithValue }) => {
    try {
      const res = await materialsApi.addStock(id, data);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to add stock');
    }
  }
);

// Assignments
export const assignToBatch = createAsyncThunk(
  'materials/assignToBatch',
  async (data: Record<string, any>, { rejectWithValue }) => {
    try {
      const res = await materialsApi.assignToBatch(data);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to assign to batch');
    }
  }
);

export const updateBatchAssignment = createAsyncThunk(
  'materials/updateBatchAssignment',
  async (data: Record<string, any>, { rejectWithValue }) => {
    try {
      const res = await materialsApi.updateBatchAssignment(data);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to update assignment');
    }
  }
);

export const fetchBatchAssignments = createAsyncThunk(
  'materials/fetchBatchAssignments',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const res = await materialsApi.getBatchAssignments(params);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load assignments');
    }
  }
);

export const fetchAssignedForBatch = createAsyncThunk(
  'materials/fetchAssignedForBatch',
  async (batchId: string, { rejectWithValue }) => {
    try {
      const res = await materialsApi.getAssignedMaterialsForBatch(batchId);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load assigned materials');
    }
  }
);

// Upsert distribution (create or update per student)
export const upsertDistribution = createAsyncThunk(
  'materials/upsertDistribution',
  async (data: Record<string, any>, { rejectWithValue }) => {
    try {
      const res = await materialsApi.upsertDistribution(data);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to save distribution');
    }
  }
);

// Distribution
export const distributeMaterial = createAsyncThunk(
  'materials/distribute',
  async (data: Record<string, any>, { rejectWithValue }) => {
    try {
      const res = await materialsApi.distribute(data);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to distribute');
    }
  }
);

export const fetchDistributions = createAsyncThunk(
  'materials/fetchDistributions',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const res = await materialsApi.getDistributions(params);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load distributions');
    }
  }
);

// Purchase history
export const fetchPurchaseHistory = createAsyncThunk(
  'materials/fetchPurchaseHistory',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const res = await materialsApi.getPurchaseHistory(params);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load purchase history');
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────
const materialsSlice = createSlice({
  name: 'materials',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    clearSuccess: (state) => { state.success = false; },
    clearAssignedForBatch: (state) => { state.assignedForBatch = []; },
  },
  extraReducers: (builder) => {
    const setLoading = (state: MaterialsState) => { state.loading = true; state.error = null; };
    const setActionLoading = (state: MaterialsState) => { state.actionLoading = true; state.error = null; state.success = false; };
    const setError = (state: MaterialsState, action: any) => { state.loading = false; state.actionLoading = false; state.error = action.payload as string; };

    builder
      // fetchCategories
      .addCase(fetchCategories.pending, setLoading)
      .addCase(fetchCategories.fulfilled, (state, a) => { state.loading = false; state.categories = Array.isArray(a.payload) ? a.payload : []; })
      .addCase(fetchCategories.rejected, setError)

      // createCategory
      .addCase(createCategory.pending, setActionLoading)
      .addCase(createCategory.fulfilled, (state, a) => { state.actionLoading = false; state.success = true; state.categories.unshift(a.payload); })
      .addCase(createCategory.rejected, setError)

      // updateCategory
      .addCase(updateCategory.pending, setActionLoading)
      .addCase(updateCategory.fulfilled, (state, a) => {
        state.actionLoading = false; state.success = true;
        const idx = state.categories.findIndex((c) => c._id === a.payload?._id);
        if (idx !== -1) state.categories[idx] = a.payload;
      })
      .addCase(updateCategory.rejected, setError)

      // fetchMaterials
      .addCase(fetchMaterials.pending, setLoading)
      .addCase(fetchMaterials.fulfilled, (state, a) => {
        state.loading = false;
        state.materials = a.payload.data || [];
        state.total = a.payload.total || 0;
        state.page = a.payload.page || 1;
        state.limit = a.payload.limit || 20;
        state.totalPages = a.payload.totalPages || 0;
      })
      .addCase(fetchMaterials.rejected, setError)

      // createMaterial
      .addCase(createMaterial.pending, setActionLoading)
      .addCase(createMaterial.fulfilled, (state, a) => { state.actionLoading = false; state.success = true; if (a.payload) state.materials.unshift(a.payload); })
      .addCase(createMaterial.rejected, setError)

      // updateMaterial
      .addCase(updateMaterial.pending, setActionLoading)
      .addCase(updateMaterial.fulfilled, (state, a) => {
        state.actionLoading = false; state.success = true;
        const idx = state.materials.findIndex((m) => m._id === a.payload?._id);
        if (idx !== -1) state.materials[idx] = a.payload;
      })
      .addCase(updateMaterial.rejected, setError)

      // addStock
      .addCase(addStock.pending, setActionLoading)
      .addCase(addStock.fulfilled, (state, a) => {
        state.actionLoading = false; state.success = true;
        const idx = state.materials.findIndex((m) => m._id === a.payload?._id);
        if (idx !== -1) state.materials[idx] = { ...state.materials[idx], ...a.payload };
      })
      .addCase(addStock.rejected, setError)

      // assignToBatch
      .addCase(assignToBatch.pending, setActionLoading)
      .addCase(assignToBatch.fulfilled, (state) => { state.actionLoading = false; state.success = true; })
      .addCase(assignToBatch.rejected, setError)

      // updateBatchAssignment
      .addCase(updateBatchAssignment.pending, setActionLoading)
      .addCase(updateBatchAssignment.fulfilled, (state) => { state.actionLoading = false; state.success = true; })
      .addCase(updateBatchAssignment.rejected, setError)

      // fetchBatchAssignments
      .addCase(fetchBatchAssignments.pending, setLoading)
      .addCase(fetchBatchAssignments.fulfilled, (state, a) => { state.loading = false; state.assignments = Array.isArray(a.payload) ? a.payload : []; })
      .addCase(fetchBatchAssignments.rejected, setError)

      // fetchAssignedForBatch
      .addCase(fetchAssignedForBatch.pending, setLoading)
      .addCase(fetchAssignedForBatch.fulfilled, (state, a) => { state.loading = false; state.assignedForBatch = Array.isArray(a.payload) ? a.payload : []; })
      .addCase(fetchAssignedForBatch.rejected, setError)

      // upsertDistribution
      .addCase(upsertDistribution.pending, setActionLoading)
      .addCase(upsertDistribution.fulfilled, (state) => { state.actionLoading = false; state.success = true; })
      .addCase(upsertDistribution.rejected, setError)

      // distributeMaterial
      .addCase(distributeMaterial.pending, setActionLoading)
      .addCase(distributeMaterial.fulfilled, (state) => { state.actionLoading = false; state.success = true; })
      .addCase(distributeMaterial.rejected, setError)

      // fetchDistributions
      .addCase(fetchDistributions.pending, setLoading)
      .addCase(fetchDistributions.fulfilled, (state, a) => {
        state.loading = false;
        state.distributions = a.payload.data || [];
        state.total = a.payload.total || 0;
        state.page = a.payload.page || 1;
        state.totalPages = a.payload.totalPages || 0;
      })
      .addCase(fetchDistributions.rejected, setError)

      // fetchPurchaseHistory
      .addCase(fetchPurchaseHistory.pending, setLoading)
      .addCase(fetchPurchaseHistory.fulfilled, (state, a) => {
        state.loading = false;
        state.purchases = a.payload.data || [];
        state.total = a.payload.total || 0;
        state.page = a.payload.page || 1;
        state.totalPages = a.payload.totalPages || 0;
      })
      .addCase(fetchPurchaseHistory.rejected, setError);
  },
});

export const { clearError, clearSuccess, clearAssignedForBatch } = materialsSlice.actions;
export default materialsSlice.reducer;
