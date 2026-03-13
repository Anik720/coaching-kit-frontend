// api/result-management/combine-result/types/combine-result.types.ts

export interface CombineResultResponseDto {
  _id: string;
  name: string;
  class: { _id: string; classname: string };
  batches: { _id: string; batchName: string; sessionYear?: string }[];
  exams: {
    _id: string;
    examName: string;
    totalMarks: number;
    mcqMarks: number;
    cqMarks: number;
    writtenMarks: number;
    category: { _id: string; categoryName: string };
  }[];
  category: { _id: string; categoryName: string };
  startDate: string | Date;
  endDate: string | Date;
  totalMarks: number;
  mcqMarks: number;
  cqMarks: number;
  writtenMarks: number;
  isActive: boolean;
  isPublished: boolean;
  createdBy: { _id: string; email: string; username: string; role: string };
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface SearchCombineResultDto {
  class?: string;
  batches?: string[];
  category?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  status?: string;
}

export interface CreateCombineResultDto {
  name: string;
  class: string;
  batches: string[];
  exams: string[];
  category: string;
  startDate: string | Date;
  endDate: string | Date;
  isPublished?: boolean;
}

export interface CombineResultPaginatedResponse {
  data: CombineResultResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExamForCombineSearch {
  _id: string;
  examName: string;
  class: { _id: string; classname: string };
  batches: { _id: string; batchName: string }[];
  category: { _id: string; categoryName: string };
  totalMarks: number;
  mcqMarks: number;
  cqMarks: number;
  writtenMarks: number;
  examDate: string | Date;
  isPublished: boolean;
  isActive: boolean;
}

export interface QueryParams {
  search?: string;
  class?: string;
  category?: string;
  isPublished?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
