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
  BatchForDropdown,
  ClassForDropdown,
  GroupForDropdown,
  SubjectForDropdown,
  AdmissionSetting,
  FormFields,
  AdmissionTemplate // NEW
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
  batches: [],
  classes: [],
  groups: [],
  subjects: [],
  settings: null,
  templates: [], // NEW: Initial state for templates
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

export const fetchBatchesByClass = createAsyncThunk<
  any[],
  string,
  { rejectValue: string }
>(
  'admission/fetchBatchesByClass',
  async (classId, { rejectWithValue }) => {
    try {
      const response = await admissionService.getBatchesByClass(classId);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch batches by class'
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

export const fetchActiveBatches = createAsyncThunk<
  BatchForDropdown[],
  void,
  { rejectValue: string }
>(
  'admission/fetchActiveBatches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await admissionService.getActiveBatches();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch batches'
      );
    }
  }
);

export const fetchClasses = createAsyncThunk<
  ClassForDropdown[],
  void,
  { rejectValue: string }
>(
  'admission/fetchClasses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await admissionService.getClasses();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch classes'
      );
    }
  }
);

export const fetchGroups = createAsyncThunk<
  GroupForDropdown[],
  void,
  { rejectValue: string }
>(
  'admission/fetchGroups',
  async (_, { rejectWithValue }) => {
    try {
      const response = await admissionService.getGroups();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch groups'
      );
    }
  }
);

export const fetchSubjects = createAsyncThunk<
  SubjectForDropdown[],
  void,
  { rejectValue: string }
>(
  'admission/fetchSubjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await admissionService.getSubjects();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch subjects'
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

export const generateRegistrationId = createAsyncThunk<
  string,
  void,
  { rejectValue: string }
>(
  'admission/generateRegistrationId',
  async (_, { rejectWithValue }) => {
    try {
      const response = await admissionService.generateRegistrationId();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to generate registration ID'
      );
    }
  }
);

export const fetchAdmissionSettings = createAsyncThunk<
  AdmissionSetting,
  void,
  { rejectValue: string }
>(
  'admission/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await admissionService.getAdmissionSettings();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch admission settings'
      );
    }
  }
);

export const updateAdmissionSettings = createAsyncThunk<
  AdmissionSetting,
  FormFields,
  { rejectValue: string }
>(
  'admission/updateSettings',
  async (fields, { rejectWithValue }) => {
    try {
      const response = await admissionService.updateAdmissionSettings(fields);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update admission settings'
      );
    }
  }
);

// ==========================================
// NEW: Template Thunks
// ==========================================
export const fetchAdmissionTemplates = createAsyncThunk<
  AdmissionTemplate[],
  void,
  { rejectValue: string }
>(
  'admission/fetchTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await admissionService.getAdmissionTemplates();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch templates'
      );
    }
  }
);

export const createAdmissionTemplate = createAsyncThunk<
  AdmissionTemplate,
  Partial<AdmissionTemplate>,
  { rejectValue: string }
>(
  'admission/createTemplate',
  async (data, { rejectWithValue }) => {
    try {
      const response = await admissionService.createAdmissionTemplate(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to create template'
      );
    }
  }
);

export const updateAdmissionTemplate = createAsyncThunk<
  AdmissionTemplate,
  { id: string; data: Partial<AdmissionTemplate> },
  { rejectValue: string }
>(
  'admission/updateTemplate',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await admissionService.updateAdmissionTemplate(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update template'
      );
    }
  }
);

export const deleteAdmissionTemplate = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'admission/deleteTemplate',
  async (id, { rejectWithValue }) => {
    try {
      await admissionService.deleteAdmissionTemplate(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to delete template'
      );
    }
  }
);
// ==========================================

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
    clearDropdownData: (state) => {
      state.batches = [];
      state.classes = [];
      state.groups = [];
      state.subjects = [];
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
        // Keeping loading state handling empty to prevent flashing if called in background
      })
      .addCase(fetchAdmissionStatistics.fulfilled, (state, action: PayloadAction<AdmissionStatistics>) => {
        state.loading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchAdmissionStatistics.rejected, (state) => {
        state.loading = false;
        state.statistics = null;
      })

      // Fetch Active Batches
      .addCase(fetchActiveBatches.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActiveBatches.fulfilled, (state, action: PayloadAction<BatchForDropdown[]>) => {
        state.loading = false;
        state.batches = action.payload;
      })
      .addCase(fetchActiveBatches.rejected, (state) => {
        state.loading = false;
        state.batches = [];
      })

      // Fetch Classes
      .addCase(fetchClasses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClasses.fulfilled, (state, action: PayloadAction<ClassForDropdown[]>) => {
        state.loading = false;
        state.classes = action.payload;
      })
      .addCase(fetchClasses.rejected, (state) => {
        state.loading = false;
        state.classes = [];
      })

      // Fetch Groups
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGroups.fulfilled, (state, action: PayloadAction<GroupForDropdown[]>) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state) => {
        state.loading = false;
        state.groups = [];
      })

      // Fetch Subjects
      .addCase(fetchSubjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSubjects.fulfilled, (state, action: PayloadAction<SubjectForDropdown[]>) => {
        state.loading = false;
        state.subjects = action.payload;
      })
      .addCase(fetchSubjects.rejected, (state) => {
        state.loading = false;
        state.subjects = [];
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
      })

      // Generate Registration ID
      .addCase(generateRegistrationId.pending, (state) => {
        state.loading = true;
      })
      .addCase(generateRegistrationId.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
      })
      .addCase(generateRegistrationId.rejected, (state) => {
        state.loading = false;
      })

      // Settings Reducers
      .addCase(fetchAdmissionSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdmissionSettings.fulfilled, (state, action: PayloadAction<AdmissionSetting>) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchAdmissionSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch settings';
      })
      .addCase(updateAdmissionSettings.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updateAdmissionSettings.fulfilled, (state, action: PayloadAction<AdmissionSetting>) => {
        state.loading = false;
        state.success = true;
        state.settings = action.payload;
      })
      .addCase(updateAdmissionSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update settings';
        state.success = false;
      })

      // ==========================================
      // NEW: Template Reducers
      // ==========================================
      .addCase(fetchAdmissionTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdmissionTemplates.fulfilled, (state, action: PayloadAction<AdmissionTemplate[]>) => {
        state.loading = false;
        state.templates = action.payload;
      })
      .addCase(fetchAdmissionTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch templates';
      })
      .addCase(createAdmissionTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createAdmissionTemplate.fulfilled, (state, action: PayloadAction<AdmissionTemplate>) => {
        state.loading = false;
        state.success = true;
        state.templates.push(action.payload);
      })
      .addCase(createAdmissionTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create template';
        state.success = false;
      })
      .addCase(updateAdmissionTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateAdmissionTemplate.fulfilled, (state, action: PayloadAction<AdmissionTemplate>) => {
        state.loading = false;
        state.success = true;
        const index = state.templates.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
      })
      .addCase(updateAdmissionTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update template';
        state.success = false;
      })
      .addCase(deleteAdmissionTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteAdmissionTemplate.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.success = true;
        state.templates = state.templates.filter(t => t._id !== action.payload);
      })
      .addCase(deleteAdmissionTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete template';
        state.success = false;
      });
      // ==========================================
  },
});

export const {
  resetAdmissionState,
  setError,
  clearError,
  clearSuccess,
  setCurrentAdmission,
  clearDropdownData,
} = admissionSlice.actions;

export default admissionSlice.reducer;