import axiosInstance from '../../axios';
import { StudentFeeSummary, RecordStudentPaymentDto, StudentPaymentHistoryItem } from '../types/fee.types';

const API_URL = '/fees';

const feeService = {
  createCategory: async (data: any) => {
    const response = await axiosInstance.post(`${API_URL}/category`, data);
    return response.data;
  },

  getCategories: async () => {
    const response = await axiosInstance.get(`${API_URL}/category`);
    return response.data;
  },

  enrollStudent: async (data: any) => {
    const response = await axiosInstance.post(`${API_URL}/enroll`, data);
    return response.data;
  },

  generateFee: async (data: any) => {
    const response = await axiosInstance.post(`${API_URL}/generate`, data);
    return response.data;
  },

  processPayment: async (data: any) => {
    const response = await axiosInstance.post(`${API_URL}/payments`, data);
    return response.data;
  },

  processRefund: async (data: any) => {
    const response = await axiosInstance.post(`${API_URL}/refunds`, data);
    return response.data;
  },

  getHistory: async (params?: any) => {
    const response = await axiosInstance.get(`${API_URL}/history`, { params });
    return response.data;
  },

  getDueList: async (studentId?: string) => {
    const params = studentId ? { studentId } : undefined;
    const response = await axiosInstance.get(`${API_URL}/due-list`, { params });
    return response.data;
  },

  getStudentFeeSummary: async (studentId: string): Promise<StudentFeeSummary> => {
    const response = await axiosInstance.get(`${API_URL}/student-fee-summary/${studentId}`);
    return response.data;
  },

  recordStudentPayment: async (data: RecordStudentPaymentDto) => {
    const response = await axiosInstance.post(`${API_URL}/student-payment`, data);
    return response.data;
  },

  getPaymentHistory: async (params?: {
    batchId?: string;
    feeType?: string;
    startDate?: string;
    endDate?: string;
    studentId?: string;
  }): Promise<StudentPaymentHistoryItem[]> => {
    const response = await axiosInstance.get(`${API_URL}/payment-history`, { params });
    return response.data;
  },
};

export default feeService;
