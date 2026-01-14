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
  VISITING_TEACHER = 'visiting_teacher',
  PRINCIPAL = 'principal',
  VICE_PRINCIPAL = 'vice_principal',
  DEPARTMENT_HEAD = 'department_head'
}

export enum AssignType {
  MONTHLY_BASIS = 'monthly_basis',
  CLASS_BASIS = 'class_basis',
  BOTH = 'both',
  HOURLY_BASIS = 'hourly_basis'
}

export enum TeacherStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  RESIGNED = 'resigned',
  ON_LEAVE = 'on_leave'
}

export interface CreateTeacherDto {
  fullName: string;
  fatherName: string;
  motherName: string;
  religion: Religion;
  gender: Gender;
  dateOfBirth: string;
  contactNumber: string;
  emergencyContactNumber: string;
  presentAddress: string;
  permanentAddress: string;
  whatsappNumber: string;
  email: string;
  secondaryEmail?: string;
  nationalId: string;
  bloodGroup: BloodGroup;
  profilePicture?: string;
  
  // System Access
  systemEmail: string;
  password: string;
  
  // Job Information
  designation: Designation;
  assignType: AssignType;
  monthlyTotalClass?: number;
  salary?: number;
  joiningDate: string;
  status?: TeacherStatus;
  remarks?: string;
  
  // Verification
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isActive?: boolean;
}

export interface UpdateTeacherDto extends Partial<CreateTeacherDto> {
  updatedBy?: string;
}

export interface UpdateTeacherParams {
  id: string;
  teacherData: UpdateTeacherDto;
}

export interface TeacherItem {
  _id: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  religion: Religion;
  gender: Gender;
  dateOfBirth: string;
  contactNumber: string;
  emergencyContactNumber: string;
  presentAddress: string;
  permanentAddress: string;
  whatsappNumber: string;
  email: string;
  secondaryEmail?: string;
  nationalId: string;
  bloodGroup: BloodGroup;
  profilePicture?: string;
  
  // System Access
  systemEmail: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  
  // Job Information
  designation: Designation;
  assignType: AssignType;
  monthlyTotalClass?: number;
  salary?: number;
  joiningDate: string;
  status: TeacherStatus;
  isActive: boolean;
  remarks?: string;
  
  // Meta
  createdBy: {
    _id: string;
    email: string;
    username: string;
    role: string;
    name: string;
  };
  updatedBy?: {
    _id: string;
    email: string;
    username: string;
    role: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TeacherStatistics {
  totalTeachers: number;
  activeTeachers: number;
  inactiveTeachers: number;
  verifiedEmail: number;
  verifiedPhone: number;
  byDesignation: Array<{ _id: Designation; count: number }>;
  byAssignType: Array<{ _id: AssignType; count: number }>;
  byStatus: Array<{ _id: TeacherStatus; count: number }>;
  byGender: Array<{ _id: Gender; count: number }>;
  byReligion: Array<{ _id: Religion; count: number }>;
  byBloodGroup: Array<{ _id: BloodGroup; count: number }>;
  recentTeachers: TeacherItem[];
}

export interface TeacherListResponse {
  teachers: TeacherItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TeacherFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  designation?: Designation;
  assignType?: AssignType;
  status?: TeacherStatus;
  isActive?: boolean;
  gender?: Gender;
  religion?: Religion;
  bloodGroup?: BloodGroup;
  createdBy?: string;
}

export interface UpdateStatusParams {
  id: string;
  status: TeacherStatus;
  isActive: boolean;
}

export interface ChangePasswordParams {
  id: string;
  newPassword: string;
}

export interface BulkUpdateParams {
  teacherIds: string[];
  status: TeacherStatus;
  isActive: boolean;
}

export interface TeacherQueryParams {
  search?: string;
  designation?: string;
  assignType?: string;
  status?: TeacherStatus;
  isActive?: boolean;
  gender?: string;
  religion?: string;
  bloodGroup?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TeachersResponse {
  teachers: TeacherItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MyStatsSummary {
  totalTeachers: number;
  activeTeachers: number;
  inactiveTeachers: number;
  verifiedEmail: number;
  verifiedPhone: number;
  byDesignation: Array<{ _id: Designation; count: number }>;
  byAssignType: Array<{ _id: AssignType; count: number }>;
  byStatus: Array<{ _id: TeacherStatus; count: number }>;
  byGender: Array<{ _id: Gender; count: number }>;
  byReligion: Array<{ _id: Religion; count: number }>;
  byBloodGroup: Array<{ _id: BloodGroup; count: number }>;
}