import api from '@/api/axios';
import {
  AdmissionsResponse,
  CreateAdmissionDto,
  UpdateAdmissionDto,
  AdmissionQueryParams,
  AdmissionItem,
  AdmissionStatistics,
  AdmissionStatus,
} from './types/admission.types';

class AdmissionService {
  // Convert object to FormData
  private toFormData(data: any): FormData {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      const value = data[key];
      
      if (value === undefined || value === null) {
        return;
      }
      
      if (key === 'photo' && value instanceof File) {
        formData.append('photo', value);
      } else if (key === 'batches' && Array.isArray(value)) {
        // Handle batches array - convert to JSON string
        formData.append('batch_with_subjects', JSON.stringify(value));
      } else if (Array.isArray(value)) {
        // Handle other arrays
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            formData.append(`${key}[${index}]`, JSON.stringify(item));
          } else {
            formData.append(`${key}[${index}]`, item);
          }
        });
      } else if (typeof value === 'object') {
        // Convert objects to JSON string
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    });
    
    return formData;
  }

  // Get all admissions with pagination and filtering
  async getAllAdmissions(params?: AdmissionQueryParams): Promise<AdmissionsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          } else if (typeof value === 'object') {
            queryParams.append(key, JSON.stringify(value));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }

    const response = await api.get<AdmissionsResponse>(
      `/admissions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
  }

  // Get admission by registration ID
  async getAdmissionByRegistrationId(registrationId: string): Promise<AdmissionItem> {
    const response = await api.get<AdmissionItem>(`/admissions/${registrationId}`);
    return response.data;
  }

  // Create a new admission (form data)
  async createAdmission(admissionData: CreateAdmissionDto): Promise<AdmissionItem> {
    const formData = this.toFormData({
      ...admissionData,
      registration_id: admissionData.registrationId,
      name: admissionData.name,
      name_native: admissionData.nameNative,
      student_gender: admissionData.studentGender,
      student_date_of_birth: admissionData.studentDateOfBirth,
      present_address: admissionData.presentAddress,
      permanent_address: admissionData.permanentAddress,
      whatsapp_mobile: admissionData.whatsappMobile,
      student_mobile_number: admissionData.studentMobileNumber,
      institute_name: admissionData.instituteName,
      fathers_name: admissionData.fathersName,
      mothers_name: admissionData.mothersName,
      guardian_mobile_number: admissionData.guardianMobileNumber,
      mother_mobile_number: admissionData.motherMobileNumber,
      admission_type: admissionData.admissionType,
      course_fee: admissionData.courseFee,
      admission_fee: admissionData.admissionFee,
      tution_fee: admissionData.tuitionFee,
      refer_by: admissionData.referBy,
      admission_date: admissionData.admissionDate,
      batch_with_subjects: admissionData.batches,
      photo: admissionData.photo,
    });

    const response = await api.post<AdmissionItem>('/admissions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Update admission (form data)
  async updateAdmission(registrationId: string, admissionData: UpdateAdmissionDto): Promise<AdmissionItem> {
    const formData = this.toFormData({
      ...admissionData,
      registration_id: admissionData.registrationId || registrationId,
      name: admissionData.name,
      name_native: admissionData.nameNative,
      student_gender: admissionData.studentGender,
      student_date_of_birth: admissionData.studentDateOfBirth,
      present_address: admissionData.presentAddress,
      permanent_address: admissionData.permanentAddress,
      whatsapp_mobile: admissionData.whatsappMobile,
      student_mobile_number: admissionData.studentMobileNumber,
      institute_name: admissionData.instituteName,
      fathers_name: admissionData.fathersName,
      mothers_name: admissionData.mothersName,
      guardian_mobile_number: admissionData.guardianMobileNumber,
      mother_mobile_number: admissionData.motherMobileNumber,
      admission_type: admissionData.admissionType,
      course_fee: admissionData.courseFee,
      admission_fee: admissionData.admissionFee,
      tution_fee: admissionData.tuitionFee,
      refer_by: admissionData.referBy,
      admission_date: admissionData.admissionDate,
      batch_with_subjects: admissionData.batches,
      photo: admissionData.photo,
    });

    const response = await api.put<AdmissionItem>(`/admissions/${registrationId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Delete admission
  async deleteAdmission(registrationId: string): Promise<void> {
    await api.delete(`/admissions/${registrationId}`);
  }

  // Get admission statistics
  async getAdmissionStatistics(): Promise<AdmissionStatistics> {
    const response = await api.get<AdmissionStatistics>('/admissions/statistics/summary');
    return response.data;
  }

  // Quick search admissions
  async quickSearch(query: string): Promise<AdmissionItem[]> {
    const response = await api.get<AdmissionItem[]>(`/admissions/search/quick?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  // Get my admissions (created by current user)
  async getMyAdmissions(params?: AdmissionQueryParams): Promise<AdmissionsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await api.get<AdmissionsResponse>(
      `/admissions/my-admissions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
  }

  // Update admission status
  async updateAdmissionStatus(registrationId: string, status: AdmissionStatus): Promise<AdmissionItem> {
    const response = await api.put<AdmissionItem>(`/admissions/${registrationId}/status`, { status });
    return response.data;
  }

  // Update payment
  async updatePayment(registrationId: string, paidAmount: number): Promise<AdmissionItem> {
    const response = await api.put<AdmissionItem>(`/admissions/${registrationId}/payment`, { paidAmount });
    return response.data;
  }
}

export default new AdmissionService();