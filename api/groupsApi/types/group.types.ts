export interface User {
  _id: string;
  email: string;
  username: string;
  role: string;
}

export interface GroupItem {
  _id: string;
  groupName: string;
  description: string;
  isActive: boolean;
  createdBy: User;
  updatedBy: User | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface GroupsResponse {
  data: GroupItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateGroupDto {
  groupName: string;
  description: string;
}

export interface UpdateGroupDto {
  groupName?: string;
  description?: string;
  isActive?: boolean;
}

export interface GroupQueryParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GroupState {
  groups: GroupItem[];
  currentGroup: GroupItem | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateGroupResponse {
  _id: string;
  groupName: string;
  description: string;
  isActive: boolean;
  createdBy: User;
  updatedBy: User | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface GroupStatusResponse {
  group: GroupItem;
  totalBatches: number;
  activeBatches: number;
  totalStudents: number;
  averageStudentsPerBatch: number;
}