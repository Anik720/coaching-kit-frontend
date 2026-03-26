import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import employeeApi from './employeeApi';

export interface EmployeeItem {
  _id: string;
  fullName: string;
  fatherName?: string;
  motherName?: string;
  religion?: string;
  gender?: string;
  dateOfBirth?: string;
  contactNumber: string;
  emergencyContactNumber?: string;
  presentAddress?: string;
  permanentAddress?: string;
  whatsappNumber?: string;
  email?: string;
  secondaryEmail?: string;
  nationalId?: string;
  bloodGroup?: string;
  profilePicture?: string;
  systemEmail: string;
  designation: string;
  salary?: number;
  joiningDate?: string;
  status: string;
  isActive: boolean;
  createdBy?: any;
  createdAt: string;
  updatedAt: string;
}

interface EmployeeState {
  employees: EmployeeItem[];
  currentEmployee: EmployeeItem | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statistics: any | null;
}

const initialState: EmployeeState = {
  employees: [],
  currentEmployee: null,
  loading: false,
  error: null,
  success: false,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  statistics: null,
};

export const fetchEmployees = createAsyncThunk(
  'employee/fetchAll',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const res = await employeeApi.getAll(params);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to fetch employees');
    }
  }
);

export const fetchEmployeeById = createAsyncThunk(
  'employee/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await employeeApi.getById(id);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to fetch employee');
    }
  }
);

export const createEmployee = createAsyncThunk(
  'employee/create',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const res = await employeeApi.create(formData);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to create employee');
    }
  }
);

export const updateEmployee = createAsyncThunk(
  'employee/update',
  async ({ id, formData }: { id: string; formData: FormData }, { rejectWithValue }) => {
    try {
      const res = await employeeApi.update(id, formData);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to update employee');
    }
  }
);

export const deleteEmployee = createAsyncThunk(
  'employee/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await employeeApi.delete(id);
      return id;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to delete employee');
    }
  }
);

export const fetchEmployeeStatistics = createAsyncThunk(
  'employee/fetchStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const res = await employeeApi.getStatistics();
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);

const employeeSlice = createSlice({
  name: 'employee',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    clearSuccess: (state) => { state.success = false; },
    setCurrentEmployee: (state, action: PayloadAction<EmployeeItem | null>) => {
      state.currentEmployee = action.payload;
    },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload.employees || [];
        state.total = action.payload.total || 0;
        state.page = action.payload.page || 1;
        state.limit = action.payload.limit || 10;
        state.totalPages = action.payload.totalPages || 0;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })

      .addCase(fetchEmployeeById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.loading = false; state.currentEmployee = action.payload;
      })
      .addCase(fetchEmployeeById.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })

      .addCase(createEmployee.pending, (state) => { state.loading = true; state.error = null; state.success = false; })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.loading = false; state.success = true;
        state.employees.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string; state.success = false;
      })

      .addCase(updateEmployee.pending, (state) => { state.loading = true; state.error = null; state.success = false; })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.loading = false; state.success = true;
        const idx = state.employees.findIndex((e) => e._id === action.payload._id);
        if (idx !== -1) state.employees[idx] = action.payload;
        if (state.currentEmployee?._id === action.payload._id) state.currentEmployee = action.payload;
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string; state.success = false;
      })

      .addCase(deleteEmployee.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.loading = false; state.success = true;
        state.employees = state.employees.filter((e) => e._id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })

      .addCase(fetchEmployeeStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      });
  },
});

export const { clearError, clearSuccess, setCurrentEmployee, resetState } = employeeSlice.actions;
export default employeeSlice.reducer;
