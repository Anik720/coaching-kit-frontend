// src/services/examCategoryService.ts
import api from '@/api/axios';
import { CreateExamCategoryDto, ExamCategoriesResponse, ExamCategoryItem, ExamCategoryQueryParams, UpdateExamCategoryDto } from '../types/examCategory.types';


class ExamCategoryService {
  // Get all exam categories with pagination and filtering
  async getAllCategories(params?: ExamCategoryQueryParams): Promise<ExamCategoriesResponse> {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.search) queryParams.append('search', params.search);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    }

    const url = `/academic/exam-category${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<ExamCategoriesResponse>(url);
    return response.data;
  }

  // Get single exam category by ID
  async getCategoryById(id: string): Promise<ExamCategoryItem> {
    const response = await api.get<ExamCategoryItem>(`/academic/exam-category/${id}`);
    return response.data;
  }

  // Create new exam category
  async createCategory(categoryData: CreateExamCategoryDto): Promise<ExamCategoryItem> {
    const response = await api.post<ExamCategoryItem>('/academic/exam-category', categoryData);
    return response.data;
  }

  // Update exam category
  async updateCategory(id: string, categoryData: UpdateExamCategoryDto): Promise<ExamCategoryItem> {
    const response = await api.put<ExamCategoryItem>(`/academic/exam-category/${id}`, categoryData);
    return response.data;
  }

  // Delete exam category
  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/academic/exam-category/${id}`);
  }

  // Toggle active status
  async toggleCategoryActive(id: string): Promise<ExamCategoryItem> {
    const response = await api.put<ExamCategoryItem>(`/academic/exam-category/${id}/toggle-active`);
    return response.data;
  }

  // Optional: Get category status & statistics (if you implement it later)
  async getCategoryStatus(id: string): Promise<any> {
    const response = await api.get(`/academic/exam-category/${id}/status`);
    return response.data;
  }
}

export default new ExamCategoryService();