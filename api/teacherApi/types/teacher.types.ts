export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export enum PaymentType {
  PER_CLASS = 'per_class',
  PER_CLASS_HOURLY = 'per_class_hourly',
  MONTHLY = 'monthly',
  MONTHLY_HOURLY = 'monthly_hourly',
  DAILY = 'daily',
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
  enableExtraPayment?: boolean;
}

export interface UpdateTeacherDto extends Partial<CreateTeacherDto> {
  updatedBy?: string;
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
  enableExtraPayment: boolean;
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
  status: TeacherStatus;
  isActive: boolean;
}

export interface ChangePasswordParams {
  newPassword: string;
}

export interface CreateAssignmentDto {
  teacher: string;
  subject: string;
  class?: string;
  batch?: string;
  paymentType: PaymentType;
  amount: number;
  effectiveFrom: string;
  effectiveTo?: string;
  totalClassesPerMonth?: number;
  totalHoursPerMonth?: number;
  totalClassPerDay?: number;
  hasTotalClass?: boolean;
  ratePerClass?: number;
  ratePerHour?: number;
  status?: string;
  notes?: string;
}

export interface TeacherAssignment {
  _id: string;
  teacher: { _id: string; fullName: string; email: string; designation: string; contactNumber?: string };
  subject: { _id: string; subjectName: string; subjectCode?: string };
  class?: { _id: string; classname: string };
  batch?: { _id: string; batchName: string; sessionYear?: string };
  paymentType: PaymentType;
  amount: number;
  effectiveFrom: string;
  effectiveTo?: string;
  totalClassesPerMonth?: number;
  totalHoursPerMonth?: number;
  totalClassPerDay?: number;
  hasTotalClass?: boolean;
  ratePerClass?: number;
  ratePerHour?: number;
  status: string;
  notes?: string;
  createdBy?: any;
  updatedBy?: any;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAssignmentDto extends Partial<CreateAssignmentDto> {}

export interface AssignmentQueryParams {
  page?: number;
  limit?: number;
  teacher?: string;
  subject?: string;
  class?: string;
  batch?: string;
  paymentType?: PaymentType;
  status?: string;
  search?: string;
}

export interface AssignmentsResponse {
  assignments: TeacherAssignment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}