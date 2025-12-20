export interface User {
  _id: string;
  email: string;
  username: string;
  role: string;
}

export interface SubjectItem {
  _id: string;
  subjectName: string;
  description: string;
  isActive: boolean;
  createdBy: User;
  updatedBy: User | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface SubjectsResponse {
  data: SubjectItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateSubjectDto {
  subjectName: string;
  description: string;
}

export interface UpdateSubjectDto {
  subjectName?: string;
  description?: string;
  isActive?: boolean;
}

export interface SubjectQueryParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SubjectState {
  subjects: SubjectItem[];
  currentSubject: SubjectItem | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateSubjectResponse {
  _id: string;
  subjectName: string;
  description: string;
  isActive: boolean;
  createdBy: User;
  updatedBy: User | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}