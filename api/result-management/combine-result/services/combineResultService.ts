// api/result-management/combine-result/services/combineResultService.ts
import api from '@/api/axios';
import {
  CombineResultResponseDto,
  SearchCombineResultDto,
  CreateCombineResultDto,
  CombineResultPaginatedResponse,
  ExamForCombineSearch,
  QueryParams,
} from '../types/combine-result.types';

class CombineResultService {
  async create(data: CreateCombineResultDto): Promise<CombineResultResponseDto> {
    const response = await api.post<CombineResultResponseDto>('/results/combine', data);
    return response.data;
  }

  async searchExams(data: SearchCombineResultDto): Promise<ExamForCombineSearch[]> {
    const response = await api.post<ExamForCombineSearch[]>('/results/combine/search-exams', data);
    return response.data;
  }

  async getAll(params?: QueryParams): Promise<CombineResultPaginatedResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.class) query.append('class', params.class);
    if (params?.category) query.append('category', params.category);
    if (params?.isPublished !== undefined) query.append('isPublished', String(params.isPublished));
    if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const url = `/results/combine${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await api.get<CombineResultPaginatedResponse>(url);
    return response.data;
  }

  async getById(id: string): Promise<CombineResultResponseDto> {
    const response = await api.get<CombineResultResponseDto>(`/results/combine/${id}`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/results/combine/${id}`);
  }

  async togglePublish(id: string): Promise<CombineResultResponseDto> {
    const response = await api.put<CombineResultResponseDto>(`/results/combine/${id}/toggle-publish`);
    return response.data;
  }

  async toggleActive(id: string): Promise<CombineResultResponseDto> {
    const response = await api.put<CombineResultResponseDto>(`/results/combine/${id}/toggle-active`);
    return response.data;
  }
}

export default new CombineResultService();
