import api from '@/api/axios';
import {
  StudentsResponse,
  CreateStudentDto,
  UpdateStudentDto,
  StudentQueryParams,
  CreateStudentResponse,
  StudentItem,
  StudentStatistics,
  PaymentDto,
  StatusUpdateDto,
  ClassForDropdown,
  BatchForDropdown,
} from '../types/student.types';

class StudentService {
  // Get all students with pagination and filtering
  async getAllStudents(params?: StudentQueryParams): Promise<StudentsResponse> {
    const queryParams = new URLSearchParams();
   
    if (params) {
      if (params.search) queryParams.append('search', params.search);
      if (params.class) queryParams.append('class', params.class);
      if (params.batch) queryParams.append('batch', params.batch);
      if (params.status) queryParams.append('status', params.status);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.gender) queryParams.append('gender', params.gender);
      if (params.admissionType) queryParams.append('admissionType', params.admissionType);
      if (params.createdBy) queryParams.append('createdBy', params.createdBy);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    }

    const response = await api.get<StudentItem[]>(
      `/students${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    
    // Transform the response to match our StudentsResponse interface
    const data = response.data as StudentItem[];
    return {
      students: data,
      data: data,
      total: data.length,
      page: params?.page || 1,
      limit: params?.limit || 10,
      totalPages: Math.ceil(data.length / (params?.limit || 10))
    };
  }

  // Get a single student by ID
  async getStudentById(id: string): Promise<StudentItem> {
    const response = await api.get<StudentItem>(`/students/${id}`);
    return response.data;
  }

  // Get student by registration ID
  async getStudentByRegistrationId(registrationId: string): Promise<StudentItem> {
    const response = await api.get<StudentItem>(`/students/registration/${registrationId}`);
    return response.data;
  }

  // Create a new student
  async createStudent(studentData: CreateStudentDto): Promise<CreateStudentResponse> {
    const response = await api.post<CreateStudentResponse>('/students', studentData);
    return response.data;
  }

  // Update a student
  async updateStudent(id: string, studentData: UpdateStudentDto): Promise<StudentItem> {
    const response = await api.patch<StudentItem>(`/students/${id}`, studentData);
    return response.data;
  }

  // Delete a student
  async deleteStudent(id: string): Promise<void> {
    await api.delete(`/students/${id}`);
  }

  // Update student status
  async updateStudentStatus(id: string, statusData: StatusUpdateDto): Promise<StudentItem> {
    const response = await api.patch<StudentItem>(`/students/${id}/status`, statusData);
    return response.data;
  }

  // Make payment
  async makePayment(id: string, paymentData: PaymentDto): Promise<StudentItem> {
    const response = await api.post<StudentItem>(`/students/${id}/payment`, paymentData);
    return response.data;
  }

  // Get statistics
  async getStatistics(): Promise<StudentStatistics> {
    const response = await api.get<StudentStatistics>('/students/statistics/overview');
    return response.data;
  }

  // Get my students (created by current user)
  async getMyStudents(params?: StudentQueryParams): Promise<StudentsResponse> {
    const queryParams = new URLSearchParams();
   
    if (params) {
      if (params.search) queryParams.append('search', params.search);
      if (params.class) queryParams.append('classId', params.class);
      if (params.batch) queryParams.append('batchId', params.batch);
      if (params.status) queryParams.append('status', params.status);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
    }

    const response = await api.get<StudentItem[]>(
      `/students/my-students${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    
    const data = response.data as StudentItem[];
    return {
      students: data,
      data: data,
      total: data.length,
      page: params?.page || 1,
      limit: params?.limit || 10,
      totalPages: Math.ceil(data.length / (params?.limit || 10))
    };
  }

  // Get my stats summary
  async getMyStatsSummary(): Promise<StudentStatistics> {
    const response = await api.get<StudentStatistics>('/students/my-stats/summary');
    return response.data;
  }

  // ========== NEW METHODS ==========

  // Get all classes for dropdown
  async getClasses(): Promise<ClassForDropdown[]> {
    try {
      const response = await api.get<any>('/academic/class');
      console.log('Classes API response:', response.data);
      
      // Extract classes from data.data
      if (response.data && response.data.data) {
        return response.data.data.map((cls: any) => ({
          _id: cls._id,
          classname: cls.classname,
        }));
      }
      
      // Fallback if data structure is different
      return response.data || [];
    } catch (error: any) {
      console.error('Failed to fetch classes:', error.response?.data?.message || error.message);
      return [];
    }
  }

  // Get batches by class ID
  async getBatchesByClass(classId: string): Promise<any[]> {
    try {
      const response = await api.get(`/batches/class/${classId}`);
      console.log('Batches by class response:', response.data);
      
      // Handle different response formats
      if (response.data.data) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error: any) {
      console.error('Failed to fetch batches by class:', error.response?.data?.message || error.message);
      return [];
    }
  }
}

export default new StudentService();