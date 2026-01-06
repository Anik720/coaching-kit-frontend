// ==========================================
// Student Module - Type Definitions
// ==========================================

export interface User {
  _id: string;
  email: string;
  username: string;
  role: string;
  name?: string;
}

export interface ClassDetails {
  _id: string;
  classname: string;
}

export interface BatchDetails {
  _id: string;
  batchName: string;
  sessionYear: string;
  batchStartingDate: string;
  batchClosingDate: string;
  classDetails?: ClassDetails;
  groupDetails?: {
    _id: string;
    groupName: string;
  };
  subjectDetails?: Array<{
    _id: string;
    subjectName: string;
  }>;
}

export enum AdmissionType {
  MONTHLY = 'monthly',
  COURSE = 'course'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export enum Religion {
  ISLAM = 'islam',
  HINDUISM = 'hinduism',
  CHRISTIANITY = 'christianity',
  BUDDHISM = 'buddhism',
  OTHER = 'other'
}

export enum StudentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  GRADUATED = 'graduated',
  DROPPED = 'dropped',
  SUSPENDED = 'suspended'
}

export interface StudentItem {
  _id: string;
  registrationId: string;
  class?: ClassDetails;
  batch?: BatchDetails;
  nameEnglish: string;
  subunitCategory?: string;
  dateOfBirth: string;
  gender: Gender;
  religion: Religion;
  studentMobileNumber?: string;
  wardNumber?: string;
  presentAddress: string;
  permanentAddress?: string;
  photoUrl?: string;
  fatherName: string;
  fatherMobileNumber: string;
  motherName?: string;
  motherMobileNumber?: string;
  admissionType: AdmissionType;
  admissionFee: number;
  monthlyTuitionFee?: number;
  courseFee?: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  admissionDate: string;
  nextPaymentDate?: string;
  referredBy?: string;
  status: StudentStatus;
  isActive: boolean;
  remarks?: string;
  createdBy?: User;
  updatedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface StudentsResponse {
  data?: StudentItem[];
  students?: StudentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateStudentDto {
  registrationId: string;
  class: string;
  batch?: string;
  nameEnglish: string;
  subunitCategory?: string;
  dateOfBirth: string;
  gender: Gender;
  religion: Religion;
  instituteName?: string;
  studentMobileNumber?: string;
  wardNumber?: string;
  whatsappMobile?: string;
  presentAddress: string;
  permanentAddress?: string;
  photoUrl?: string;
  fatherName: string;
  fatherMobileNumber: string;
  motherName?: string;
  motherMobileNumber?: string;
  admissionType: AdmissionType;
  admissionFee: number;
  monthlyTuitionFee?: number;
  courseFee?: number;
  totalAmount: number;
  paidAmount?: number;
  admissionDate: string;
  nextPaymentDate?: string;
  referredBy?: string;
  status?: StudentStatus;
  isActive?: boolean;
  remarks?: string;
}

export interface UpdateStudentDto {
  registrationId?: string;
  class?: string;
  batch?: string;
  nameEnglish?: string;
  subunitCategory?: string;
  dateOfBirth?: string;
  gender?: Gender;
  religion?: Religion;
  studentMobileNumber?: string;
  wardNumber?: string;
  presentAddress?: string;
  permanentAddress?: string;
  photoUrl?: string;
  fatherName?: string;
  fatherMobileNumber?: string;
  motherName?: string;
  motherMobileNumber?: string;
  admissionType?: AdmissionType;
  admissionFee?: number;
  monthlyTuitionFee?: number;
  courseFee?: number;
  totalAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  nextPaymentDate?: string;
  referredBy?: string;
  status?: StudentStatus;
  isActive?: boolean;
  remarks?: string;
}

export interface StudentQueryParams {
  search?: string;
  class?: string;
  batch?: string;
  status?: StudentStatus;
  isActive?: boolean;
  gender?: Gender;
  admissionType?: AdmissionType;
  createdBy?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StudentState {
  students: StudentItem[];
  currentStudent: StudentItem | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  classes: ClassForDropdown[];
  batches: any[];
  dropdownLoaded: boolean; // ← ADD THIS LINE
}

export interface CreateStudentResponse extends StudentItem {}

export interface StudentStatistics {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  totalDueAmount: number;
  duePayments: number;
  monthlyStudents: number;
  classDistribution?: Array<{
    className: string;
    count: number;
  }>;
}

export interface PaymentDto {
  amount: number;
  paymentDate?: string;
  paymentMethod?: string;
  remarks?: string;
}

export interface StatusUpdateDto {
  status: StudentStatus;
  isActive: boolean;
  remarks?: string;
}

// ========== DROPDOWN INTERFACES ==========

export interface ClassForDropdown {
  _id: string;
  classname: string;
}

export interface BatchForDropdown {
  _id: string;
  batchName: string;
  batchId: number | string;
  sessionYear: string;
  className?: {
    classname: string;
  };
  admissionFee?: number;
  tuitionFee?: number;
  courseFee?: number;
}