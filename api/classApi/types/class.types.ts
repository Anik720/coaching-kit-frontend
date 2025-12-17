export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

export interface ClassItem {
  _id: string;
  classname: string;
  description: string;
  isActive: boolean;
  createdBy: User;
  updatedBy: User | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ClassesResponse {
  data: ClassItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateClassDto {
  classname: string;
  description: string;
}

export interface UpdateClassDto {
  classname?: string;
  description?: string;
  isActive?: boolean;
}

export interface ClassQueryParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ClassState {
  classes: ClassItem[];
  currentClass: ClassItem | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateClassResponse {
  _id: string;
  classname: string;
  description: string;
  isActive: boolean;
  createdBy: User;
  updatedBy: User | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}