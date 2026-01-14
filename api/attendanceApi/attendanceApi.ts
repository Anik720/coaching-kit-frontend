// src/api/attendanceApi/attendanceApi.ts
import axios from 'axios';
import { AttendanceFormData, AttendanceFilters } from './attendanceSlice';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const attendanceApi = {
  // Get attendance records with filters
  getAttendanceRecords: (filters: AttendanceFilters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.classId) params.append('classId', filters.classId);
    if (filters.batchId) params.append('batchId', filters.batchId);
    if (filters.attendanceDate) params.append('attendanceDate', filters.attendanceDate);
    if (filters.attendanceType) params.append('attendanceType', filters.attendanceType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    return axiosInstance.get(`/attendance?${params.toString()}`);
  },

  // Get attendance statistics
  getAttendanceStats: (filters: AttendanceFilters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.classId) params.append('classId', filters.classId);
    if (filters.batchId) params.append('batchId', filters.batchId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    return axiosInstance.get(`/attendance/statistics?${params.toString()}`);
  },

  // Get students by class and batch
  getStudentsByClassBatch: (classId: string, batchId: string) => {
    return axiosInstance.get(`/students?class=${classId}&batch=${batchId}&isActive=true&limit=1000`);
  },

  // Submit attendance
  submitAttendance: (attendanceData: AttendanceFormData) => {
    return axiosInstance.post('/attendance', attendanceData);
  },

  // Get single attendance record
  getAttendanceById: (id: string) => {
    return axiosInstance.get(`/attendance/${id}`);
  },

  // Update attendance
  updateAttendance: (id: string, attendanceData: Partial<AttendanceFormData>) => {
    return axiosInstance.patch(`/attendance/${id}`, attendanceData);
  },

  // Delete attendance
  deleteAttendance: (id: string) => {
    return axiosInstance.delete(`/attendance/${id}`);
  },

  // Bulk attendance operations
  submitBulkAttendance: (attendanceData: AttendanceFormData[]) => {
    return axiosInstance.post('/attendance/bulk', attendanceData);
  },

  // Get attendance for specific date
  getAttendanceByDate: (date: string, classId?: string, batchId?: string) => {
    const params = new URLSearchParams();
    params.append('date', date);
    if (classId) params.append('classId', classId);
    if (batchId) params.append('batchId', batchId);

    return axiosInstance.get(`/attendance/date?${params.toString()}`);
  },

  // Get student's attendance history
  getStudentAttendanceHistory: (studentId: string, filters: AttendanceFilters = {}) => {
    const params = new URLSearchParams();
    params.append('studentId', studentId);
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    return axiosInstance.get(`/attendance/student-history?${params.toString()}`);
  },

  // Get classes for dropdown
  getClasses: () => {
    return axiosInstance.get('/classes?limit=1000&isActive=true');
  },

  // Get batches for dropdown
  getBatches: (classId?: string) => {
    const params = new URLSearchParams();
    params.append('isActive', 'true');
    params.append('limit', '1000');
    if (classId) params.append('class', classId);

    return axiosInstance.get(`/batches?${params.toString()}`);
  },
};

export default attendanceApi;