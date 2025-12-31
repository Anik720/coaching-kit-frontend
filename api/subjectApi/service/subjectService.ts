import api from '@/api/axios';
import {
  SubjectsResponse,
  CreateSubjectDto,
  UpdateSubjectDto,
  SubjectQueryParams,
  CreateSubjectResponse,
  SubjectItem,
} from '../types/subject.types';

class SubjectService {
  // Get all subjects with pagination and filtering
  async getAllSubjects(params?: SubjectQueryParams): Promise<SubjectsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.search) queryParams.append('search', params.search);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    }

    const response = await api.get<SubjectsResponse>(
      `/academic/subject${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
  }

  // Get a single subject by ID
  async getSubjectById(id: string): Promise<SubjectItem> {
    const response = await api.get<SubjectItem>(`/academic/subject/${id}`);
    return response.data;
  }

  // Create a new subject
  async createSubject(subjectData: CreateSubjectDto): Promise<CreateSubjectResponse> {
    const response = await api.post<CreateSubjectResponse>('/academic/subject', subjectData);
    return response.data;
  }

  // Update a subject
  async updateSubject(id: string, subjectData: UpdateSubjectDto): Promise<SubjectItem> {
    const response = await api.put<SubjectItem>(`/academic/subject/${id}`, subjectData);
    return response.data;
  }

  // Delete a subject
  async deleteSubject(id: string): Promise<void> {
    await api.delete(`/academic/subject/${id}`);
  }

  // Toggle subject active status
  async toggleSubjectActive(id: string): Promise<SubjectItem> {
    const response = await api.put<SubjectItem>(`/academic/subject/${id}/toggle-active`);
    return response.data;
  }

  // Get subject status and statistics
  async getSubjectStatus(id: string): Promise<any> {
    const response = await api.get(`/academic/subject/${id}/status`);
    return response.data;
  }

  // Get subjects created by current user
  async getMySubjects(params?: Omit<SubjectQueryParams, 'sortBy' | 'sortOrder'>): Promise<SubjectsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.search) queryParams.append('search', params.search);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
    }

    const response = await api.get<SubjectsResponse>(
      `/academic/subject/my-subjects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
  }
}

export default new SubjectService();