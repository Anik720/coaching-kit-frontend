// api/result-management/create-exam/types/exam.types.ts
export interface MarksField {
  type: string; // 'mcq', 'cq', 'written'
  totalMarks: number;
  enablePassMarks?: boolean;
  passMarks?: number;
  enableNegativeMarking?: boolean;
  negativeMarks?: number;
}

export interface UserRef {
  _id: string;
  username: string;
  email: string;
  role: string;
}

export interface Exam {
  _id: string;
  examName: string;
  topicName: string;
  className: string;
  batchName: string;
  subjectName: string;
  examCategory: string;
  examDate: string;
  showMarksTitle: boolean;
  marksFields: MarksField[];
  totalMarks: number;
  enableGrading: boolean;
  totalPassMarks?: number;
  showPercentageInResult: boolean;
  showGPAInResult: boolean;
  useGPASystem: boolean;
  isActive: boolean;
  isPublished: boolean;
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
  className: string;
  batchName: string;
  subjectName: string;
  examCategory: string;
  examDate: string;
  showMarksTitle?: boolean;
  marksFields?: MarksField[];
  totalMarks: number;
  enableGrading?: boolean;
  totalPassMarks?: number;
  showPercentageInResult?: boolean;
  showGPAInResult?: boolean;
  useGPASystem?: boolean;
  isPublished?: boolean;
}

export interface UpdateExamDto {
  examName?: string;
  topicName?: string;
  className?: string;
  batchName?: string;
  subjectName?: string;
  examCategory?: string;
  examDate?: string;
  showMarksTitle?: boolean;
  marksFields?: MarksField[];
  totalMarks?: number;
  enableGrading?: boolean;
  totalPassMarks?: number;
  showPercentageInResult?: boolean;
  showGPAInResult?: boolean;
  useGPASystem?: boolean;
  isPublished?: boolean;
}

export interface ExamQueryParams {
  search?: string;
  isActive?: boolean;
  className?: string;
  subjectName?: string;
  examCategory?: string;
  batchName?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}