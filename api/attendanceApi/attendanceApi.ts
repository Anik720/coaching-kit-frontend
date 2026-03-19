import api from '../axios';
import { AttendanceFormData, AttendanceFilters } from './attendanceSlice';

const attendanceApi = {
  // Get attendance records with filters
  getAttendanceRecords: (filters: AttendanceFilters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.classId) params.append('class', filters.classId);
    if (filters.batchId) params.append('batch', filters.batchId);
    if (filters.attendanceDate) params.append('date', filters.attendanceDate);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    return api.get(`/academic/student-attendance?${params.toString()}`);
  },
  getStudentsByClassBatch: (classId: string, batchId: string) => {
    return api.get(`/students?class=${classId}&batch=${batchId}&isActive=true&limit=1000`);
  },

  // Submit attendance
  submitAttendance: (attendanceData: any) => {
    return api.post('/academic/student-attendance', attendanceData);
  },

  // Get single attendance record
  getAttendanceById: (id: string) => {
    return api.get(`/academic/student-attendance/${id}`);
  },

  // Update attendance
  updateAttendance: (id: string, attendanceData: any) => {
    return api.patch(`/academic/student-attendance/${id}`, attendanceData);
  },

  // Delete attendance
  deleteAttendance: (id: string) => {
    return api.delete(`/academic/student-attendance/${id}`);
  },
  // Get monthly summary
  getMonthlySummary: (studentId: string, batchId: string, month: number, year: number) => {
    return api.get(`/academic/student-attendance/summary/${studentId}/${batchId}?month=${month}&year=${year}`);
  },

  // Get classes for dropdown
  getClasses: () => {
    return api.get('/academic/class?limit=1000&isActive=true');
  },

  // Get batches for dropdown (by class)
  getBatches: (classId?: string) => {
    if (classId) {
      // Use the batches/class/:classId endpoint (with optional active filter)
      return api.get(`/batches/class/${classId}?isActive=true&limit=1000`);
    }
    // Get all batches
    return api.get('/batches?isActive=true&limit=1000');
  },

  // Get monthly attendance grid
  getMonthlyGrid: (classId: string, batchId: string, month: number, year: number) => {
    return api.get(`/academic/student-attendance/monthly-grid/${classId}/${batchId}?month=${month}&year=${year}`);
  },

  // Get previous attendance summary for all students in a batch (bulk, one call)
  getBatchAttendanceSummary: (batchId: string, date?: string, startDate?: string) => {
    const p = new URLSearchParams();
    if (date) p.append('date', date);
    if (startDate) p.append('startDate', startDate);
    const qs = p.toString() ? `?${p.toString()}` : '';
    return api.get(`/academic/student-attendance/batch-summary/${batchId}${qs}`);
  },
};

export default attendanceApi;