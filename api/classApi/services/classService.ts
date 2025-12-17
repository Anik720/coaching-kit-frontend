
import api from '@/api/axios';
import {
  ClassesResponse,
  CreateClassDto,
  UpdateClassDto,
  ClassQueryParams,
  CreateClassResponse,
  ClassItem,
} from '../types/class.types';

class ClassService {
  // Get all classes with pagination and filtering
  async getAllClasses(params?: ClassQueryParams): Promise<ClassesResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.search) queryParams.append('search', params.search);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    }

    const response = await api.get<ClassesResponse>(
      `/academic/class${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
  }

  // Get a single class by ID
  async getClassById(id: string): Promise<ClassItem> {
    const response = await api.get<ClassItem>(`/academic/class/${id}`);
    return response.data;
  }

  // Create a new class
  async createClass(classData: CreateClassDto): Promise<CreateClassResponse> {
    const response = await api.post<CreateClassResponse>('/academic/class', classData);
    return response.data;
  }

  // Update a class
  async updateClass(id: string, classData: UpdateClassDto): Promise<ClassItem> {
    const response = await api.put<ClassItem>(`/academic/class/${id}`, classData);
    return response.data;
  }

  // Delete a class
  async deleteClass(id: string): Promise<void> {
    await api.delete(`/academic/class/${id}`);
  }

  // Toggle class active status
  async toggleClassActive(id: string): Promise<ClassItem> {
    const response = await api.put<ClassItem>(`/academic/class/${id}/toggle-active`);
    return response.data;
  }

  // Get class status and statistics
  async getClassStatus(id: string): Promise<any> {
    const response = await api.get(`/academic/class/${id}/status`);
    return response.data;
  }
}

export default new ClassService();