import api from '../axios';

const employeeApi = {
  getAll: (params?: Record<string, any>) =>
    api.get('/employees', { params }),

  getById: (id: string) =>
    api.get(`/employees/${id}`),

  create: (formData: FormData) =>
    api.post('/employees', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, formData: FormData) =>
    api.patch(`/employees/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: string) =>
    api.delete(`/employees/${id}`),

  updateStatus: (id: string, status: string, isActive: boolean) =>
    api.patch(`/employees/${id}/status`, { status, isActive }),

  getStatistics: () =>
    api.get('/employees/statistics/overview'),
};

export default employeeApi;
