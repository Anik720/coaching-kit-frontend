export interface UserRef {
  _id: string;
  username: string;
  email: string;
  role: string;
}

export interface ClassRef {
  _id: string;
  classname: string;
  description?: string;
}

export interface BatchRef {
  _id: string;
  batchName: string;
  sessionYear?: string;
}

export interface SubjectRef {
  _id: string;
  subjectName: string;
  subjectCode?: string;
}

export interface ExamCategoryRef {
  _id: string;
  categoryName: string;
}

export interface MarkTitle {
  title: string;
  marks: number;
  passMarks?: number;
}

export interface Grade {
  grade: string;
  description?: string;
  minPercentage: number;
  maxPercentage: number;
}

export interface Exam {
  _id: string;
  examName: string;
  topicName: string;
  class: ClassRef;
  batches: BatchRef[];
  subject: SubjectRef;
  examCategory: ExamCategoryRef;
  examDate: string;
  showMarksTitle: boolean;
  markTitles: MarkTitle[];
  totalMarks: number;
  enableGrading: boolean;
  passMarksPercentage?: number;
  grades: Grade[];
  instructions?: string;
  duration?: number;
  isActive: boolean;
  createdBy: UserRef;
  updatedBy?: UserRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamsPaginatedResponse {
  data: Exam[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateExamDto {
  examName: string;
  topicName: string;
  classId: string;
  batchIds: string[];
  subjectId: string;
  examCategoryId: string;
  examDate: string; // "YYYY-MM-DD" or ISO
  showMarksTitle?: boolean;
  markTitles?: MarkTitle[];
  totalMarks: number;
  enableGrading?: boolean;
  passMarksPercentage?: number;
  grades?: Grade[];
  instructions?: string;
  duration?: number;
  isActive?: boolean;
}

export interface UpdateExamDto {
  examName?: string;
  topicName?: string;
  classId?: string;
  batchIds?: string[];
  subjectId?: string;
  examCategoryId?: string;
  examDate?: string;
  showMarksTitle?: boolean;
  markTitles?: MarkTitle[];
  totalMarks?: number;
  enableGrading?: boolean;
  passMarksPercentage?: number;
  grades?: Grade[];
  instructions?: string;
  duration?: number;
  isActive?: boolean;
}

export interface ExamQueryParams {
  search?: string;
  isActive?: boolean;
  classId?: string;
  subjectId?: string;
  examCategoryId?: string;
  batchId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}