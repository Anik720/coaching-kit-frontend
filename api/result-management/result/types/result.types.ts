// api/result-management/result/types/result.types.ts

export interface SubjectWiseMarks {
  subject: string;
  subjectName: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
}

export interface ResultExam {
  _id: string;
  examName: string;
  totalMarks: number;
  totalPassMarks?: number;
  enableGrading: boolean;
  useGPASystem: boolean;
}

export interface ResultStudent {
  _id: string;
  registrationId: string;
  nameEnglish: string;
  class: string;
  batch: string;
}

export interface ResultClass {
  _id: string;
  classname: string;
}

export interface ResultBatch {
  _id: string;
  batchName: string;
  sessionYear: string;
}

export interface ResultUser {
  _id: string;
  email: string;
  username: string;
  role: string;
  name?: string;
}

export interface Result {
  _id: string;
  exam: ResultExam;
  student: ResultStudent;
  class: ResultClass;
  batch: ResultBatch;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade?: string;
  gpa?: number;
  position?: number;
  isPassed: boolean;
  isAbsent: boolean;
  resultClass?: string;
  remarks?: string;
  subjectWiseMarks: SubjectWiseMarks[];
  createdBy: ResultUser;
  updatedBy?: ResultUser;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResultPaginatedResponse {
  data: Result[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ResultQueryParams {
  search?: string;
  exam?: string;
  student?: string;
  class?: string;
  batch?: string;
  isPassed?: boolean;
  isAbsent?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateResultDto {
  exam: string;
  student: string;
  class: string;
  batch: string;
  totalMarks: number;
  obtainedMarks: number;
  grade?: string;
  gpa?: number;
  isPassed?: boolean;
  isAbsent?: boolean;
  resultClass?: string;
  remarks?: string;
  subjectWiseMarks?: {
    subject: string;
    subjectName: string;
    totalMarks: number;
    obtainedMarks: number;
  }[];
}

export interface StudentForResultEntry {
  studentId: string;
  registrationId: string;
  name: string;
  marks: number;
  percentage: number;
  isPassed: boolean;
  isAbsent: boolean;
}

export interface ResultSummary {
  examId: string;
  examName: string;
  className: string;
  batchName: string;
  subjectName: string;
  totalStudents: number;
  presentStudents: number;
  passedStudents: number;
  failedStudents: number;
  absentStudents: number;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  topPerformers: any[];
}

export interface BulkStudentResult {
  only_total_marks: number;
  is_absent?: boolean;
  grade?: string;
  gpa?: string;
}

export interface BulkCreateResultDto {
  exam_id: string;
  results: Record<string, BulkStudentResult>;
}

export interface BulkResultResponse {
  successCount: number;
  failedCount: number;
  errors: { studentId: string; error: string }[];
  results: Result[];
}
