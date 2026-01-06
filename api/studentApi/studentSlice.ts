import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import studentService from './services/studentService';
import {
  StudentsResponse,
  StudentItem,
  StudentQueryParams,
  StudentState,
  CreateStudentDto,
  UpdateStudentDto,
  StudentStatistics,
  PaymentDto,
  StatusUpdateDto,
  ClassForDropdown,
} from './types/student.types';

const initialState: StudentState = {
  students: [],
  currentStudent: null,
  loading: false,
  error: null,
  success: false,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  classes: [],
  batches: [],
  dropdownLoaded: false, // ← NEW: Track if classes have been loaded
};

// ==========================================
// Async Thunks
// ==========================================

export const fetchStudents = createAsyncThunk<
  StudentsResponse,
  StudentQueryParams | undefined,
  { rejectValue: string }
>('student/fetchStudents', async (params, { rejectWithValue }) => {
  try {
    const response = await studentService.getAllStudents(params);
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || 'Failed to fetch students'
    );
  }
});

export const fetchStudentById = createAsyncThunk<
  StudentItem,
  string,
  { rejectValue: string }
>('student/fetchStudentById', async (id, { rejectWithValue }) => {
  try {
    const response = await studentService.getStudentById(id);
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || 'Failed to fetch student'
    );
  }
});

export const fetchStudentByRegistrationId = createAsyncThunk<
  StudentItem,
  string,
  { rejectValue: string }
>('student/fetchStudentByRegistrationId', async (registrationId, { rejectWithValue }) => {
  try {
    const response = await studentService.getStudentByRegistrationId(registrationId);
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || 'Failed to fetch student by registration ID'
    );
  }
});

export const createStudent = createAsyncThunk<
  StudentItem,
  CreateStudentDto,
  { rejectValue: string }
>('student/createStudent', async (studentData, { rejectWithValue }) => {
  try {
    const response = await studentService.createStudent(studentData);
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || 'Failed to create student'
    );
  }
});

export const updateStudent = createAsyncThunk<
  StudentItem,
  { id: string; studentData: UpdateStudentDto },
  { rejectValue: string }
>('student/updateStudent', async ({ id, studentData }, { rejectWithValue }) => {
  try {
    const response = await studentService.updateStudent(id, studentData);
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || 'Failed to update student'
    );
  }
});

export const deleteStudent = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('student/deleteStudent', async (id, { rejectWithValue }) => {
  try {
    await studentService.deleteStudent(id);
    return id;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || 'Failed to delete student'
    );
  }
});

export const updateStudentStatus = createAsyncThunk<
  StudentItem,
  { id: string; statusData: StatusUpdateDto },
  { rejectValue: string }
>('student/updateStudentStatus', async ({ id, statusData }, { rejectWithValue }) => {
  try {
    const response = await studentService.updateStudentStatus(id, statusData);
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || 'Failed to update student status'
    );
  }
});

export const makePayment = createAsyncThunk<
  StudentItem,
  { id: string; paymentData: PaymentDto },
  { rejectValue: string }
>('student/makePayment', async ({ id, paymentData }, { rejectWithValue }) => {
  try {
    const response = await studentService.makePayment(id, paymentData);
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || 'Failed to process payment'
    );
  }
});

export const fetchStatistics = createAsyncThunk<
  StudentStatistics,
  void,
  { rejectValue: string }
>('student/fetchStatistics', async (_, { rejectWithValue }) => {
  try {
    const response = await studentService.getStatistics();
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || 'Failed to fetch statistics'
    );
  }
});

export const fetchMyStudents = createAsyncThunk<
  StudentsResponse,
  StudentQueryParams | undefined,
  { rejectValue: string }
>('student/fetchMyStudents', async (params, { rejectWithValue }) => {
  try {
    const response = await studentService.getMyStudents(params);
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || 'Failed to fetch my students'
    );
  }
});

export const fetchMyStatsSummary = createAsyncThunk<
  StudentStatistics,
  void,
  { rejectValue: string }
>('student/fetchMyStatsSummary', async (_, { rejectWithValue }) => {
  try {
    const response = await studentService.getMyStatsSummary();
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || 'Failed to fetch my stats summary'
    );
  }
});

// Fetch classes
export const fetchClasses = createAsyncThunk<
  ClassForDropdown[],
  void,
  { rejectValue: string }
>('student/fetchClasses', async (_, { rejectWithValue }) => {
  try {
    const response = await studentService.getClasses();
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || 'Failed to fetch classes'
    );
  }
});

// Fetch batches by class
export const fetchBatchesByClass = createAsyncThunk<
  any[],
  string,
  { rejectValue: string }
>('student/fetchBatchesByClass', async (classId, { rejectWithValue }) => {
  try {
    const response = await studentService.getBatchesByClass(classId);
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || 'Failed to fetch batches by class'
    );
  }
});

// ==========================================
// Slice Definition
// ==========================================

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    resetStudentState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.currentStudent = null;
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
    setCurrentStudent: (state, action: PayloadAction<StudentItem | null>) => {
      state.currentStudent = action.payload;
    },
    clearDropdownData: (state) => {
      state.classes = [];
      state.batches = [];
      state.dropdownLoaded = false; // ← Important: reset flag
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Students
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action: PayloadAction<StudentsResponse>) => {
        state.loading = false;
        state.students = action.payload.data || action.payload.students || [];
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch students';
      })

      // Fetch Student By ID
      .addCase(fetchStudentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentById.fulfilled, (state, action: PayloadAction<StudentItem>) => {
        state.loading = false;
        state.currentStudent = action.payload;
      })
      .addCase(fetchStudentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch student';
      })

      // Fetch Student By Registration ID
      .addCase(fetchStudentByRegistrationId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentByRegistrationId.fulfilled, (state, action: PayloadAction<StudentItem>) => {
        state.loading = false;
        state.currentStudent = action.payload;
      })
      .addCase(fetchStudentByRegistrationId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch student by registration ID';
      })

      // Create Student
      .addCase(createStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createStudent.fulfilled, (state, action: PayloadAction<StudentItem>) => {
        state.loading = false;
        state.success = true;
        state.students.unshift(action.payload);
        state.total += 1;
        state.totalPages = Math.ceil(state.total / state.limit);
      })
      .addCase(createStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create student';
        state.success = false;
      })

      // Update Student
      .addCase(updateStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateStudent.fulfilled, (state, action: PayloadAction<StudentItem>) => {
        state.loading = false;
        state.success = true;
        const index = state.students.findIndex((std) => std._id === action.payload._id);
        if (index !== -1) {
          state.students[index] = action.payload;
        }
        if (state.currentStudent?._id === action.payload._id) {
          state.currentStudent = action.payload;
        }
      })
      .addCase(updateStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update student';
        state.success = false;
      })

      // Delete Student
      .addCase(deleteStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteStudent.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.success = true;
        state.students = state.students.filter((std) => std._id !== action.payload);
        state.total -= 1;
        state.totalPages = Math.ceil(state.total / state.limit);
        if (state.currentStudent?._id === action.payload) {
          state.currentStudent = null;
        }
      })
      .addCase(deleteStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete student';
        state.success = false;
      })

      // Update Student Status
      .addCase(updateStudentStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStudentStatus.fulfilled, (state, action: PayloadAction<StudentItem>) => {
        state.loading = false;
        const index = state.students.findIndex((std) => std._id === action.payload._id);
        if (index !== -1) {
          state.students[index] = action.payload;
        }
        if (state.currentStudent?._id === action.payload._id) {
          state.currentStudent = action.payload;
        }
      })
      .addCase(updateStudentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update student status';
      })

      // Make Payment
      .addCase(makePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(makePayment.fulfilled, (state, action: PayloadAction<StudentItem>) => {
        state.loading = false;
        state.success = true;
        const index = state.students.findIndex((std) => std._id === action.payload._id);
        if (index !== -1) {
          state.students[index] = action.payload;
        }
        if (state.currentStudent?._id === action.payload._id) {
          state.currentStudent = action.payload;
        }
      })
      .addCase(makePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to process payment';
        state.success = false;
      })

      // Fetch Statistics & My Stats (no state change needed beyond loading)
      .addCase(fetchStatistics.pending, (state) => { state.loading = true; })
      .addCase(fetchStatistics.fulfilled, (state) => { state.loading = false; })
      .addCase(fetchStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch statistics';
      })
      .addCase(fetchMyStudents.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyStudents.fulfilled, (state, action: PayloadAction<StudentsResponse>) => {
        state.loading = false;
        state.students = action.payload.students || action.payload.data || [];
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchMyStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch my students';
      })
      .addCase(fetchMyStatsSummary.pending, (state) => { state.loading = true; })
      .addCase(fetchMyStatsSummary.fulfilled, (state) => { state.loading = false; })
      .addCase(fetchMyStatsSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch my stats summary';
      })

      // ========== FETCH CLASSES ==========
      .addCase(fetchClasses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClasses.fulfilled, (state, action: PayloadAction<ClassForDropdown[]>) => {
        state.loading = false;
        state.classes = action.payload;
        state.dropdownLoaded = true; // ← Mark as loaded
      })
      .addCase(fetchClasses.rejected, (state) => {
        state.loading = false;
        state.classes = [];
        state.dropdownLoaded = false;
      })

      // ========== FETCH BATCHES BY CLASS ==========
      .addCase(fetchBatchesByClass.pending, (state) => {
        state.loading = true;
        state.batches = []; // ← Clear previous batches when loading new
      })
      .addCase(fetchBatchesByClass.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.loading = false;
        state.batches = action.payload;
      })
      .addCase(fetchBatchesByClass.rejected, (state) => {
        state.loading = false;
        state.batches = [];
      });
  },
});

export const {
  resetStudentState,
  setError,
  clearError,
  clearSuccess,
  setCurrentStudent,
  clearDropdownData,
} = studentSlice.actions;

export default studentSlice.reducer;