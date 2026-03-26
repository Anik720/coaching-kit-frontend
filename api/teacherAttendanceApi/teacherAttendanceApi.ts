import api from '../axios';

const teacherAttendanceApi = {
  getAll: (params?: Record<string, any>) =>
    api.get('/teacher-attendance', { params }),

  getById: (id: string) =>
    api.get(`/teacher-attendance/${id}`),

  create: (data: any) =>
    api.post('/teacher-attendance', data),

  update: (id: string, data: any) =>
    api.patch(`/teacher-attendance/${id}`, data),

  delete: (id: string) =>
    api.delete(`/teacher-attendance/${id}`),

  approve: (id: string, data: { approvalStatus: string; remarks?: string }) =>
    api.patch(`/teacher-attendance/${id}/approve`, data),

  getByTeacherAndDate: (teacherId: string, date: string) =>
    api.get(`/teacher-attendance/teacher/${teacherId}/date/${date}`),

  getMonthlyReport: (teacherId: string, month: number, year: number) =>
    api.get(`/teacher-attendance/report/monthly/${teacherId}`, {
      params: { month, year },
    }),

  getMyAttendances: (params?: Record<string, any>) =>
    api.get('/teacher-attendance/my-attendances', { params }),

  // Helpers
  getTeachers: () =>
    api.get('/teachers?isActive=true&limit=1000'),

  getClasses: () =>
    api.get('/academic/class?isActive=true&limit=1000'),

  getBatchesByClass: (classId: string) =>
    api.get(`/batches/class/${classId}?isActive=true&limit=1000`),

  getSubjects: () =>
    api.get('/academic/subject?isActive=true&limit=1000'),
};

export default teacherAttendanceApi;
