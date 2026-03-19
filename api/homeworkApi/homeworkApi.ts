import api from '../axios';

const homeworkApi = {
  // ── Subjects (for dropdowns) ──────────────────────────────────────────────
  getSubjects: () => api.get('/academic/subject?limit=1000&isActive=true'),

  // ── Homework ──────────────────────────────────────────────────────────────
  getHomeworkList: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') q.append(k, String(v)); });
    return api.get(`/homework?${q.toString()}`);
  },
  getHomeworkById: (id: string) => api.get(`/homework/${id}`),
  createHomework: (data: any) => api.post('/homework', data),
  updateHomework: (id: string, data: any) => api.patch(`/homework/${id}`, data),
  deleteHomework: (id: string) => api.delete(`/homework/${id}`),

  // ── Class Tasks ────────────────────────────────────────────────────────────
  getClassTasks: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') q.append(k, String(v)); });
    return api.get(`/homework/class-tasks?${q.toString()}`);
  },
  getClassTaskById:   (id: string) => api.get(`/homework/class-tasks/${id}`),
  createClassTask:    (data: any)  => api.post('/homework/class-tasks', data),
  updateClassTask:    (id: string, data: any) => api.patch(`/homework/class-tasks/${id}`, data),
  deleteClassTask:    (id: string) => api.delete(`/homework/class-tasks/${id}`),

  // Find task by filters (class + batch + subject + date)
  findClassTaskByFilters: (classId: string, batchId: string, subjectId: string, date: string) =>
    api.get(`/homework/class-tasks/by-filters?classId=${classId}&batchId=${batchId}&subjectId=${subjectId}&date=${date}`),

  // ── Evaluations ────────────────────────────────────────────────────────────
  getEvaluations:  (taskId: string) => api.get(`/homework/class-tasks/${taskId}/results`),
  saveEvaluations: (taskId: string, evaluations: any[]) =>
    api.post(`/homework/class-tasks/${taskId}/save`, { evaluations }),

  // ── Reports ────────────────────────────────────────────────────────────────
  getMonthlyReport: (batchId: string, subjectId: string, year: number, month: number) =>
    api.get(`/homework/class-tasks/report/monthly?batchId=${batchId}&subjectId=${subjectId}&year=${year}&month=${month}`),

  getStudentReport: (studentId: string, year: number, month: number) =>
    api.get(`/homework/class-tasks/report/student?studentId=${studentId}&year=${year}&month=${month}`),

  // ── Homework Submissions ───────────────────────────────────────────────────
  getSubmissions:  (homeworkId: string) => api.get(`/homework/${homeworkId}/submissions`),
  saveSubmissions: (homeworkId: string, submissions: any[]) =>
    api.post(`/homework/${homeworkId}/submissions`, { submissions }),

  // ── Shared dropdowns (reuse attendance patterns) ──────────────────────────
  getClasses: () => api.get('/academic/class?limit=1000&isActive=true'),
  getBatches: (classId?: string) =>
    classId
      ? api.get(`/batches/class/${classId}?isActive=true&limit=1000`)
      : api.get('/batches?isActive=true&limit=1000'),
  getStudentsByClassBatch: (classId: string, batchId: string) =>
    api.get(`/students?class=${classId}&batch=${batchId}&limit=1000`),
  getStudentByRegistrationId: (regId: string) =>
    api.get(`/students?search=${encodeURIComponent(regId)}&limit=1`),
  searchStudents: (q: string) =>
    api.get(`/students?search=${encodeURIComponent(q)}&isActive=true&limit=20`),
};

export default homeworkApi;
