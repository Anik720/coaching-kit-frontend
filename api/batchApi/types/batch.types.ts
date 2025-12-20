export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
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

export interface SubjectItem {
  _id: string;
  subjectName: string;
  subjectCode: string;
  description: string;
  isActive: boolean;
  createdBy: User;
  updatedBy: User | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface BatchItem {
  _id: string;
  batchName: string;
  className: string | { _id: string; classname: string };
  group: string | { _id: string; groupName: string };
  subject: string | { _id: string; subjectName: string };
  sessionYear: string;
  batchStartingDate: string;
  batchClosingDate: string;
  admissionFee: number;
  tuitionFee: number;
  courseFee: number;
  totalFee?: number;
  daysRemaining?: number;
  isActiveSession?: boolean;
  status: 'active' | 'inactive' | 'completed' | 'upcoming';
  isActive: boolean;
  description: string;
  maxStudents: number;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface BatchesResponse {
  data: BatchItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateBatchDto {
  batchName: string;
  className: string;
  group: string;
  subject: string;
  sessionYear?: string;
  batchStartingDate: string;
  batchClosingDate: string;
  admissionFee: number;
  tuitionFee: number;
  courseFee: number;
  status?: 'active' | 'inactive' | 'completed' | 'upcoming';
  isActive?: boolean;
  description?: string;
  maxStudents?: number;
  createdBy?: string;
}

export interface UpdateBatchDto {
  batchName?: string;
  className?: string;
  group?: string;
  subject?: string;
  sessionYear?: string;
  batchStartingDate?: string;
  batchClosingDate?: string;
  admissionFee?: number;
  tuitionFee?: number;
  courseFee?: number;
  status?: 'active' | 'inactive' | 'completed' | 'upcoming';
  isActive?: boolean;
  description?: string;
  maxStudents?: number;
}

export interface BatchQueryParams {
  search?: string;
  className?: string;
  group?: string;
  subject?: string;
  sessionYear?: string;
  status?: 'active' | 'inactive' | 'completed' | 'upcoming';
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BatchState {
  batches: BatchItem[];
  currentBatch: BatchItem | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  classes: ClassItem[];
  groups: GroupItem[];
  subjects: SubjectItem[];
}

export interface CreateBatchResponse {
  _id: string;
  batchName: string;
  className: string | { _id: string; classname: string };
  group: string | { _id: string; groupName: string };
  subject: string | { _id: string; subjectName: string };
  sessionYear: string;
  batchStartingDate: string;
  batchClosingDate: string;
  admissionFee: number;
  tuitionFee: number;
  courseFee: number;
  status: string;
  isActive: boolean;
  description: string;
  maxStudents: number;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface BatchStats {
  totalBatches: number;
  activeBatches: number;
  inactiveBatches: number;
  completedBatches: number;
  upcomingBatches: number;
  averageStudentsPerBatch: number;
  totalRevenue: number;
  batchByStatus: {
    active: number;
    inactive: number;
    completed: number;
    upcoming: number;
  };
}