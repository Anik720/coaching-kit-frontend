// src/types/examCategory.types.ts

export interface User {
  _id: string;
  email: string;
  username: string;
  role: string;
}

export interface ExamCategoryItem {
  _id: string;
  categoryName: string;
  description: string | null;
  isActive: boolean;
  createdBy: User;
  updatedBy: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamCategoriesResponse {
  data: ExamCategoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateExamCategoryDto {
  categoryName: string;
  description?: string;
}

export interface UpdateExamCategoryDto {
  categoryName?: string;
  description?: string;
  isActive?: boolean;
}

export interface ExamCategoryQueryParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExamCategoryState {
  categories: ExamCategoryItem[];
  currentCategory: ExamCategoryItem | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}