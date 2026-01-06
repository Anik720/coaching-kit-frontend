// src/api/teacherApi/types/teacher.types.ts

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  name?: string;
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

export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-'
}

export enum Designation {
  HEAD_TEACHER = 'head_teacher',
  ASSISTANT_TEACHER = 'assistant_teacher',
  SUBJECT_TEACHER = 'subject_teacher',
  CO_TEACHER = 'co_teacher',
  VISITING_TEACHER = 'visiting_teacher'
}

export enum AssignType {
  MONTHLY_BASIS = 'monthly_basis',
  CLASS_BASIS = 'class_basis',
  BOTH = 'both'
}

export interface TeacherItem {
  _id: string;
  fullName: string;
  fatherName?: string;
  motherName?: string;
  religion: Religion;
  gender: Gender;
  dateOfBirth: string;
  contactNumber: string;
  emergencyContactNumber: string;
  presentAddress: string;
  permanentAddress: string;
  whatsappNumber?: string;
  email: string;
  secondaryEmail?: string;
  nationalId?: string;
  bloodGroup?: BloodGroup;
  profilePicture?: string;
  password: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  designation: Designation;
  assignType: AssignType;
  monthlyTotalClass?: number;
  salary?: number;
  joiningDate: string;
  status: 'active' | 'inactive' | 'suspended' | 'resigned';
  isActive: boolean;
  remarks?: string;
  createdBy: User;
  updatedBy?: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeachersResponse {
  data: TeacherItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTeacherDto {
  fullName: string;
  fatherName?: string;
  motherName?: string;
  religion: Religion;
  gender: Gender;
  dateOfBirth: string;
  contactNumber: string;
  emergencyContactNumber: string;
  presentAddress: string;
  permanentAddress: string;
  whatsappNumber?: string;
  email: string;
  secondaryEmail?: string;
  nationalId?: string;
  bloodGroup?: BloodGroup;
  profilePicture?: string;
  password: string;
  designation: Designation;
  assignType: AssignType;
  monthlyTotalClass?: number;
  salary?: number;
  joiningDate: string;
  remarks?: string;
}

export interface UpdateTeacherDto {
  fullName?: string;
  fatherName?: string;
  motherName?: string;
  religion?: Religion;
  gender?: Gender;
  dateOfBirth?: string;
  contactNumber?: string;
  emergencyContactNumber?: string;
  presentAddress?: string;
  permanentAddress?: string;
  whatsappNumber?: string;
  email?: string;
  secondaryEmail?: string;
  nationalId?: string;
  bloodGroup?: BloodGroup;
  profilePicture?: string;
  designation?: Designation;
  assignType?: AssignType;
  monthlyTotalClass?: number;
  salary?: number;
  joiningDate?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'resigned';
  isActive?: boolean;
  remarks?: string;
}

export interface TeacherQueryParams {
  search?: string;
  designation?: Designation;
  assignType?: AssignType;
  status?: string;
  isActive?: boolean;
  gender?: Gender;
  religion?: Religion;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TeacherState {
  teachers: TeacherItem[];
  currentTeacher: TeacherItem | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Statistics {
  totalTeachers: number;
  activeTeachers: number;
  inactiveTeachers: number;
  verifiedEmail: number;
  verifiedPhone: number;
  byDesignation: Array<{ _id: string; count: number }>;
  byAssignType: Array<{ _id: string; count: number }>;
  genderDistribution: Array<{ _id: string; count: number }>;
}

export interface MyStatsSummary {
  totalTeachers: number;
  activeTeachers: number;
  inactiveTeachers: number;
  verifiedEmail: number;
  verifiedPhone: number;
}