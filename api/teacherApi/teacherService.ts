// src/api/teacherApi/teacherService.ts

import api from '@/api/axios';
import {
  TeachersResponse,
  CreateTeacherDto,
  UpdateTeacherDto,
  TeacherQueryParams,
  TeacherItem,
  Statistics,
  MyStatsSummary,
  Gender,
  Religion,
  BloodGroup,
  Designation,
  AssignType
} from './types/teacher.types';

class TeacherService {
  // Get all teachers with pagination and filtering
  async getAllTeachers(params?: TeacherQueryParams): Promise<TeachersResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.search) queryParams.append('search', params.search);
      if (params.designation) queryParams.append('designation', params.designation);
      if (params.assignType) queryParams.append('assignType', params.assignType);
      if (params.status) queryParams.append('status', params.status);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.gender) queryParams.append('gender', params.gender);
      if (params.religion) queryParams.append('religion', params.religion);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    }

    const response = await api.get<TeachersResponse>(
      `/teachers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
  }

  // Get a single teacher by ID
  async getTeacherById(id: string): Promise<TeacherItem> {
    const response = await api.get<TeacherItem>(`/teachers/${id}`);
    return response.data;
  }

  // Create a new teacher
  async createTeacher(teacherData: CreateTeacherDto): Promise<TeacherItem> {
    const response = await api.post<TeacherItem>('/teachers', teacherData);
    return response.data;
  }

  // Update a teacher
  async updateTeacher(id: string, teacherData: UpdateTeacherDto): Promise<TeacherItem> {
    const response = await api.put<TeacherItem>(`/teachers/${id}`, teacherData);
    return response.data;
  }

  // Delete a teacher
  async deleteTeacher(id: string): Promise<void> {
    await api.delete(`/teachers/${id}`);
  }

  // Toggle teacher active status
  async toggleTeacherActive(id: string, isActive: boolean): Promise<TeacherItem> {
    const response = await api.patch<TeacherItem>(`/teachers/${id}/status`, { isActive });
    return response.data;
  }

  // Verify teacher email
  async verifyEmail(id: string): Promise<TeacherItem> {
    const response = await api.patch<TeacherItem>(`/teachers/${id}/verify-email`);
    return response.data;
  }

  // Verify teacher phone
  async verifyPhone(id: string): Promise<TeacherItem> {
    const response = await api.patch<TeacherItem>(`/teachers/${id}/verify-phone`);
    return response.data;
  }

  // Get teacher statistics
  async getStatistics(): Promise<Statistics> {
    const response = await api.get<Statistics>('/teachers/statistics/overview');
    return response.data;
  }

  // Get my teachers (created by current user)
  async getMyTeachers(params?: TeacherQueryParams): Promise<TeachersResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.search) queryParams.append('search', params.search);
      if (params.designation) queryParams.append('designation', params.designation);
      if (params.assignType) queryParams.append('assignType', params.assignType);
      if (params.status) queryParams.append('status', params.status);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.gender) queryParams.append('gender', params.gender);
      if (params.religion) queryParams.append('religion', params.religion);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    }

    const response = await api.get<TeachersResponse>(
      `/teachers/my-teachers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
  }

  // Get my stats summary
  async getMyStatsSummary(): Promise<MyStatsSummary> {
    const response = await api.get<MyStatsSummary>('/teachers/my-stats/summary');
    return response.data;
  }

  // Get teachers by email
  async getTeacherByEmail(email: string): Promise<TeacherItem> {
    const response = await api.get<TeacherItem>(`/teachers/email/${email}`);
    return response.data;
  }

  // Change password
  async changePassword(id: string, newPassword: string): Promise<TeacherItem> {
    const response = await api.patch<TeacherItem>(`/teachers/${id}/change-password`, { newPassword });
    return response.data;
  }

  // Get enum values for dropdowns
  getGenderOptions(): Array<{ value: Gender; label: string }> {
    return [
      { value: Gender.MALE, label: 'Male' },
      { value: Gender.FEMALE, label: 'Female' },
      { value: Gender.OTHER, label: 'Other' },
    ];
  }

  getReligionOptions(): Array<{ value: Religion; label: string }> {
    return [
      { value: Religion.ISLAM, label: 'Islam' },
      { value: Religion.HINDUISM, label: 'Hinduism' },
      { value: Religion.CHRISTIANITY, label: 'Christianity' },
      { value: Religion.BUDDHISM, label: 'Buddhism' },
      { value: Religion.OTHER, label: 'Other' },
    ];
  }

  getBloodGroupOptions(): Array<{ value: BloodGroup; label: string }> {
    return [
      { value: BloodGroup.A_POSITIVE, label: 'A+' },
      { value: BloodGroup.A_NEGATIVE, label: 'A-' },
      { value: BloodGroup.B_POSITIVE, label: 'B+' },
      { value: BloodGroup.B_NEGATIVE, label: 'B-' },
      { value: BloodGroup.O_POSITIVE, label: 'O+' },
      { value: BloodGroup.O_NEGATIVE, label: 'O-' },
      { value: BloodGroup.AB_POSITIVE, label: 'AB+' },
      { value: BloodGroup.AB_NEGATIVE, label: 'AB-' },
    ];
  }

  getDesignationOptions(): Array<{ value: Designation; label: string }> {
    return [
      { value: Designation.HEAD_TEACHER, label: 'Head Teacher' },
      { value: Designation.ASSISTANT_TEACHER, label: 'Assistant Teacher' },
      { value: Designation.SUBJECT_TEACHER, label: 'Subject Teacher' },
      { value: Designation.CO_TEACHER, label: 'Co-Teacher' },
      { value: Designation.VISITING_TEACHER, label: 'Visiting Teacher' },
    ];
  }

  getAssignTypeOptions(): Array<{ value: AssignType; label: string }> {
    return [
      { value: AssignType.MONTHLY_BASIS, label: 'Monthly Basis' },
      { value: AssignType.CLASS_BASIS, label: 'Class Basis' },
      { value: AssignType.BOTH, label: 'Both' },
    ];
  }

  getStatusOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'suspended', label: 'Suspended' },
      { value: 'resigned', label: 'Resigned' },
    ];
  }
}

export default new TeacherService();