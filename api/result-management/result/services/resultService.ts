// api/result-management/result/services/resultService.ts
import api from '@/api/axios';
import {
  BulkCreateResultDto,
  BulkResultResponse,
  CreateResultDto,
  Result,
  ResultPaginatedResponse,
  ResultQueryParams,
  ResultSummary,
  StudentForResultEntry,
} from '../types/result.types';

class ResultService {
  async create(data: CreateResultDto): Promise<Result> {
    const response = await api.post<Result>('/results', data);
    return response.data;
  }

  async bulkCreate(data: BulkCreateResultDto): Promise<BulkResultResponse> {
    const response = await api.post<BulkResultResponse>('/results/bulk', data);
    return response.data;
  }

  async getAll(params?: ResultQueryParams): Promise<ResultPaginatedResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.exam) query.append('exam', params.exam);
    if (params?.student) query.append('student', params.student);
    if (params?.class) query.append('class', params.class);
    if (params?.batch) query.append('batch', params.batch);
    if (params?.isPassed !== undefined) query.append('isPassed', String(params.isPassed));
    if (params?.isAbsent !== undefined) query.append('isAbsent', String(params.isAbsent));
    if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const url = `/results${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await api.get<ResultPaginatedResponse>(url);
    return response.data;
  }

  async getById(id: string): Promise<Result> {
    const response = await api.get<Result>(`/results/${id}`);
    return response.data;
  }

  async getExamResults(examId: string, params?: ResultQueryParams): Promise<ResultPaginatedResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const url = `/results/exam/${examId}/results${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await api.get<ResultPaginatedResponse>(url);
    return response.data;
  }

  async getResultSummary(examId: string): Promise<ResultSummary> {
    const response = await api.get<ResultSummary>(`/results/exam/${examId}/summary`);
    return response.data;
  }

  async getStatsSummary(examId: string, classId: string, batchId: string): Promise<any> {
    const response = await api.get<any>(`/results?exam=${examId}&class=${classId}&batch=${batchId}`);
    return response.data;
  }

  async getStudentsForResultEntry(classId: string, batchId: string): Promise<StudentForResultEntry[]> {
    const response = await api.get<StudentForResultEntry[]>(
      `/results/students/for-result-entry?classId=${classId}&batchId=${batchId}`
    );
    return response.data;
  }

  async update(id: string, data: Partial<CreateResultDto>): Promise<Result> {
    const response = await api.put<Result>(`/results/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/results/${id}`);
  }

  async toggleActive(id: string): Promise<Result> {
    const response = await api.put<Result>(`/results/${id}/toggle-active`);
    return response.data;
  }

  // Get students by class and batch
  async getStudentsByClassAndBatch(classId: string, batchId: string): Promise<any[]> {
    try {
      const response = await api.get<any>(`/students?class=${classId}&batch=${batchId}&limit=500`);
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch students by class and batch:', error);
      return [];
    }
  }
}

export default new ResultService();
