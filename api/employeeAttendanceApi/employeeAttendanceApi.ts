import api from '../axios';

const employeeAttendanceApi = {
  createManual: (data: Record<string, any>) =>
    api.post('/staff-attendance/manual', data),

  getAll: (params?: Record<string, any>) =>
    api.get('/staff-attendance', { params }),

  getMonthlyReport: (params?: Record<string, any>) =>
    api.get('/staff-attendance/monthly-report', { params }),

  getSelfToday: (date: string) =>
    api.get('/staff-attendance/self/today', { params: { date } }),

  markSelfIn: (data: Record<string, any>) =>
    api.post('/staff-attendance/self/mark-in', data),

  markSelfOut: (data: Record<string, any>) =>
    api.patch('/staff-attendance/self/mark-out', data),

  markBreakIn: (data: Record<string, any>) =>
    api.post('/staff-attendance/self/break-in', data),

  markBreakOut: (data: Record<string, any>) =>
    api.patch('/staff-attendance/self/break-out', data),

  getById: (id: string) =>
    api.get(`/staff-attendance/${id}`),

  update: (id: string, data: Record<string, any>) =>
    api.patch(`/staff-attendance/${id}`, data),

  delete: (id: string) =>
    api.delete(`/staff-attendance/${id}`),
};

export default employeeAttendanceApi;
