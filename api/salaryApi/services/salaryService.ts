import axiosInstance from '@/api/axios';
import {
  SalariesResponse,
  UnpaidSalariesResponse,
  SalaryQueryParams,
  CreateSalaryDto,
  SalaryItem,
} from '../types/salary.types';

class SalaryService {
  async getSalaries(params?: SalaryQueryParams): Promise<SalariesResponse> {
    const response = await axiosInstance.get('/salaries', { params });
    return response.data;
  }

  async getUnpaidSalaries(
    userType: 'teacher' | 'staff',
    month: string,
    page: number = 1,
    limit: number = 10
  ): Promise<UnpaidSalariesResponse> {
    const response = await axiosInstance.get('/salaries/unpaid', {
      params: { userType, month, page, limit },
    });
    return response.data;
  }

  async createSalary(data: CreateSalaryDto): Promise<SalaryItem> {
    const response = await axiosInstance.post('/salaries', data);
    return response.data;
  }
}

const salaryService = new SalaryService();
export default salaryService;
