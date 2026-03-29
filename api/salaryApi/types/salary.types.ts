export interface SalaryUser {
  _id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  designation?: string;
}

export interface SalaryItem {
  _id: string;
  userType: 'teacher' | 'staff';
  user: SalaryUser;
  month: string;
  amount: number;
  paymentType: 'regular' | 'advance';
  paymentDate: string;
  method: 'cash' | 'bank' | 'mobile_banking';
  note?: string;
  paidBy: {
    _id: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UnpaidSalaryUser {
  user: {
    _id: string;
    fullName: string;
    email: string;
    profilePicture?: string;
    designation: string;
    salary: number;
  };
  expectedSalary: number;
  month: string;
}

export interface SalariesResponse {
  data: SalaryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UnpaidSalariesResponse {
  data: UnpaidSalaryUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SalaryQueryParams {
  page?: number;
  limit?: number;
  month?: string;
  userType?: 'teacher' | 'staff';
  paymentType?: 'regular' | 'advance';
  search?: string;
}

export interface CreateSalaryDto {
  userType: 'teacher' | 'staff';
  userId: string;
  month: string;
  amount: number;
  paymentType: 'regular' | 'advance';
  method: 'cash' | 'bank' | 'mobile_banking';
  note?: string;
}

export interface SalaryState {
  salaries: SalaryItem[];
  unpaidSalaries: UnpaidSalaryUser[];
  loading: boolean;
  error: string | null;
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
