import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import admissionService from './admissionService';
import {
  AdmissionsResponse,
  AdmissionItem,
  AdmissionQueryParams,
  AdmissionState,
  CreateAdmissionDto,
  UpdateAdmissionDto,
  AdmissionStatistics,
  AdmissionStatus,
} from './types/admission.types';

const initialState: AdmissionState = {
  admissions: [],
  currentAdmission: null,
  loading: false,
  error: null,
  success: false,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  statistics: null,
};

// Async thunks
export const fetchAdmissions = createAsyncThunk<
  AdmissionsResponse,
  AdmissionQueryParams | undefined,
  { rejectValue: string }
>(
  'admission/fetchAdmissions',
  async (params, { rejectWithValue }) => {
    try {
      const response = await admissionService.getAllAdmissions(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch admissions'
      );
    }
  }
);

export const fetchAdmissionByRegistrationId = createAsyncThunk<
  AdmissionItem,
  string,
  { rejectValue: string }
>(
  'admission/fetchAdmissionByRegistrationId',
  async (registrationId, { rejectWithValue }) => {
    try {
      const response = await admissionService.getAdmissionByRegistrationId(registrationId);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch admission'
      );
    }
  }
);

export const createAdmission = createAsyncThunk<
  AdmissionItem,
  CreateAdmissionDto,
  { rejectValue: string }
>(
  'admission/createAdmission',
  async (admissionData, { rejectWithValue }) => {
    try {
      const response = await admissionService.createAdmission(admissionData);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to create admission'
      );
    }
  }
);

export const updateAdmission = createAsyncThunk<
  AdmissionItem,
  { registrationId: string; admissionData: UpdateAdmissionDto },
  { rejectValue: string }
>(
  'admission/updateAdmission',
  async ({ registrationId, admissionData }, { rejectWithValue }) => {
    try {
      const response = await admissionService.updateAdmission(registrationId, admissionData);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update admission'
      );
    }
  }
);

export const deleteAdmission = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'admission/deleteAdmission',
  async (registrationId, { rejectWithValue }) => {
    try {
      await admissionService.deleteAdmission(registrationId);
      return registrationId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to delete admission'
      );
    }
  }
);

export const fetchAdmissionStatistics = createAsyncThunk<
  AdmissionStatistics,
  void,
  { rejectValue: string }
>(
  'admission/fetchStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await admissionService.getAdmissionStatistics();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch statistics'
      );
    }
  }
);

export const updateAdmissionStatus = createAsyncThunk<
  AdmissionItem,
  { registrationId: string; status: AdmissionStatus },
  { rejectValue: string }
>(
  'admission/updateStatus',
  async ({ registrationId, status }, { rejectWithValue }) => {
    try {
      const response = await admissionService.updateAdmissionStatus(registrationId, status);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update status'
      );
    }
  }
);

export const updateAdmissionPayment = createAsyncThunk<
  AdmissionItem,
  { registrationId: string; paidAmount: number },
  { rejectValue: string }
>(
  'admission/updatePayment',
  async ({ registrationId, paidAmount }, { rejectWithValue }) => {
    try {
      const response = await admissionService.updatePayment(registrationId, paidAmount);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update payment'
      );
    }
  }
);

const admissionSlice = createSlice({
  name: 'admission',
  initialState,
  reducers: {
    resetAdmissionState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.currentAdmission = null;
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
    setCurrentAdmission: (state, action: PayloadAction<AdmissionItem | null>) => {
      state.currentAdmission = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Admissions
      .addCase(fetchAdmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdmissions.fulfilled, (state, action: PayloadAction<AdmissionsResponse>) => {
        state.loading = false;
        state.admissions = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchAdmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch admissions';
      })

      // Fetch Admission By Registration ID
      .addCase(fetchAdmissionByRegistrationId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdmissionByRegistrationId.fulfilled, (state, action: PayloadAction<AdmissionItem>) => {
        state.loading = false;
        state.currentAdmission = action.payload;
      })
      .addCase(fetchAdmissionByRegistrationId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch admission';
      })

      // Create Admission
      .addCase(createAdmission.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createAdmission.fulfilled, (state, action: PayloadAction<AdmissionItem>) => {
        state.loading = false;
        state.success = true;
        state.admissions.unshift(action.payload);
        state.total += 1;
        state.totalPages = Math.ceil(state.total / state.limit);
      })
      .addCase(createAdmission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create admission';
        state.success = false;
      })

      // Update Admission
      .addCase(updateAdmission.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateAdmission.fulfilled, (state, action: PayloadAction<AdmissionItem>) => {
        state.loading = false;
        state.success = true;
        const index = state.admissions.findIndex((adm) => adm._id === action.payload._id);
        if (index !== -1) {
          state.admissions[index] = action.payload;
        }
        if (state.currentAdmission?._id === action.payload._id) {
          state.currentAdmission = action.payload;
        }
      })
      .addCase(updateAdmission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update admission';
        state.success = false;
      })

      // Delete Admission
      .addCase(deleteAdmission.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteAdmission.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.success = true;
        state.admissions = state.admissions.filter((adm) => adm.registrationId !== action.payload);
        state.total -= 1;
        state.totalPages = Math.ceil(state.total / state.limit);
        if (state.currentAdmission?.registrationId === action.payload) {
          state.currentAdmission = null;
        }
      })
      .addCase(deleteAdmission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete admission';
        state.success = false;
      })

      // Fetch Statistics
      .addCase(fetchAdmissionStatistics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdmissionStatistics.fulfilled, (state, action: PayloadAction<AdmissionStatistics>) => {
        state.loading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchAdmissionStatistics.rejected, (state) => {
        state.loading = false;
        state.statistics = null;
      })

      // Update Status
      .addCase(updateAdmissionStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAdmissionStatus.fulfilled, (state, action: PayloadAction<AdmissionItem>) => {
        state.loading = false;
        const index = state.admissions.findIndex((adm) => adm._id === action.payload._id);
        if (index !== -1) {
          state.admissions[index] = action.payload;
        }
        if (state.currentAdmission?._id === action.payload._id) {
          state.currentAdmission = action.payload;
        }
      })
      .addCase(updateAdmissionStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update status';
      })

      // Update Payment
      .addCase(updateAdmissionPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAdmissionPayment.fulfilled, (state, action: PayloadAction<AdmissionItem>) => {
        state.loading = false;
        const index = state.admissions.findIndex((adm) => adm._id === action.payload._id);
        if (index !== -1) {
          state.admissions[index] = action.payload;
        }
        if (state.currentAdmission?._id === action.payload._id) {
          state.currentAdmission = action.payload;
        }
      })
      .addCase(updateAdmissionPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update payment';
      });
  },
});

export const {
  resetAdmissionState,
  setError,
  clearError,
  clearSuccess,
  setCurrentAdmission,
} = admissionSlice.actions;

export default admissionSlice.reducer;