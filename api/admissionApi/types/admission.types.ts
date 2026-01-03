// Base user interface
export interface User {
  _id: string;
  email: string;
  username: string;
  role: string;
}

// Batch subject interface
export interface BatchSubject {
  subjectName: string;
  subjectId: number | string;
}

// Admission batch interface
export interface AdmissionBatch {
  _id?: string;
  batch: string; // ObjectId as string
  batchName: string;
  batchId: number | string;
  subjects: BatchSubject[];
  admissionFee: number;
  tuitionFee: number;
  courseFee: number;
}

// Admission status enum
export enum AdmissionStatus {
  PENDING = 'pending',
  INCOMPLETE = 'incomplete',
  COMPLETED = 'completed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

// Admission type enum
export enum AdmissionType {
  MONTHLY = 'monthly',
  COURSE = 'course',
  FULL = 'full'
}

// Gender enum
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

// Religion enum
export enum Religion {
  ISLAM = 'islam',
  HINDUISM = 'hinduism',
  CHRISTIANITY = 'christianity',
  BUDDHISM = 'buddhism',
  OTHER = 'other'
}

// Main admission interface
export interface AdmissionItem {
  _id: string;
  registrationId: string;
  name: string;
  instituteName: string;
  studentGender: Gender;
  religion: Religion;
  guardianMobileNumber: string;
  admissionDate: string;
  nameNative?: string;
  studentDateOfBirth?: string;
  age?: number;
  presentAddress?: string;
  permanentAddress?: string;
  whatsappMobile?: string;
  studentMobileNumber?: string;
  fathersName?: string;
  mothersName?: string;
  motherMobileNumber?: string;
  admissionType: AdmissionType;
  courseFee: number;
  admissionFee: number;
  tuitionFee: number;
  referBy?: string;
  batches: AdmissionBatch[];
  status: AdmissionStatus;
  isCompleted: boolean;
  totalFee: number;
  paidAmount: number;
  dueAmount: number;
  photoUrl?: string;
  remarks?: string;
  completedAt?: string;
  approvedAt?: string;
  createdBy: User;
  updatedBy?: User;
  approvedBy?: User;
  createdAt: string;
  updatedAt: string;
}

// API response interfaces
export interface AdmissionsResponse {
  data: AdmissionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateAdmissionDto {
  registrationId?: string;
  name: string;
  instituteName: string;
  studentGender: Gender;
  religion: Religion;
  guardianMobileNumber: string;
  admissionDate?: string;
  nameNative?: string;
  studentDateOfBirth?: string;
  presentAddress?: string;
  permanentAddress?: string;
  whatsappMobile?: string;
  studentMobileNumber?: string;
  fathersName?: string;
  mothersName?: string;
  motherMobileNumber?: string;
  admissionType?: AdmissionType;
  courseFee?: number;
  admissionFee?: number;
  tuitionFee?: number;
  referBy?: string;
  batches?: AdmissionBatch[];
  remarks?: string;
  photo?: File;
}

export interface UpdateAdmissionDto {
  registrationId?: string;
  name?: string;
  instituteName?: string;
  studentGender?: Gender;
  religion?: Religion;
  guardianMobileNumber?: string;
  admissionDate?: string;
  nameNative?: string;
  studentDateOfBirth?: string;
  presentAddress?: string;
  permanentAddress?: string;
  whatsappMobile?: string;
  studentMobileNumber?: string;
  fathersName?: string;
  mothersName?: string;
  motherMobileNumber?: string;
  admissionType?: AdmissionType;
  courseFee?: number;
  admissionFee?: number;
  tuitionFee?: number;
  referBy?: string;
  batches?: AdmissionBatch[];
  status?: AdmissionStatus;
  paidAmount?: number;
  remarks?: string;
  photo?: File;
}

export interface AdmissionQueryParams {
  search?: string;
  status?: AdmissionStatus;
  isCompleted?: boolean;
  admissionType?: AdmissionType;
  startDate?: string;
  endDate?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdmissionStatistics {
  total: number;
  pending: number;
  completed: number;
  approved: number;
  rejected: number;
  cancelled: number;
  todayAdmissions: number;
  thisMonthAdmissions: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export interface AdmissionState {
  admissions: AdmissionItem[];
  currentAdmission: AdmissionItem | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statistics: AdmissionStatistics | null;
  batches: any[];
  classes: any[];
  groups: any[];
  subjects: any[];
}

// Batch related interfaces for dropdowns
export interface BatchForDropdown {
  _id: string;
  batchName: string;
  batchId: number;
  className: string;
  group: string;
  sessionYear: string;
  admissionFee: number;
  tuitionFee: number;
  courseFee: number;
  isActive: boolean;
  status: string;
}

export interface ClassForDropdown {
  _id: string;
  classname: string;
}

export interface GroupForDropdown {
  _id: string;
  groupName: string;
}

export interface SubjectForDropdown {
  _id: string;
  subjectName: string;
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