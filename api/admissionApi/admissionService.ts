import api from '@/api/axios';
import {
  AdmissionsResponse,
  CreateAdmissionDto,
  UpdateAdmissionDto,
  AdmissionQueryParams,
  AdmissionItem,
  AdmissionStatistics,
  AdmissionStatus,
  BatchForDropdown,
  ClassForDropdown,
  GroupForDropdown,
  SubjectForDropdown,
  AdmissionType,
  SubjectItem,
} from './types/admission.types';

class AdmissionService {
  // Convert object to FormData for API submission
private toFormData(data: any, isUpdate: boolean = false): FormData {
  const formData = new FormData();
  
  console.log('🟡 [AdmissionService] Converting to FormData:', data);
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    if (value === undefined || value === null || value === '') {
      return;
    }
    
    // Handle file uploads
    if (key === 'photo' && value instanceof File) {
      formData.append('photo', value);
    } 
    // Handle batches array with proper API format
    else if (key === 'batches' && Array.isArray(value)) {
      if (value.length > 0) {
        formData.append('batches', JSON.stringify(value));
      }
    }
    // Handle _id field for updates
    else if (key === '_id' && value) {
      formData.append('_id', value);
    }
    // Handle arrays
    else if (Array.isArray(value)) {
      if (value.length > 0) {
        formData.append(key, JSON.stringify(value));
      }
    }
    // Handle dates
    else if (value instanceof Date) {
      formData.append(key, value.toISOString());
    }
    // Handle primitive values
    else {
      formData.append(key, value.toString());
    }
  });
  
  console.log('🟡 [AdmissionService] FormData keys:');
  for (let pair of (formData as any).entries()) {
    console.log(pair[0] + ', ' + pair[1]);
  }
  
  return formData;
}

  // Get all admissions with pagination and filtering
// In admissionService.ts
async getAllAdmissions(params?: AdmissionQueryParams): Promise<AdmissionsResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    console.log('🟡 [AdmissionService] Fetching admissions with params:', queryParams.toString());
    const response = await api.get<any>(
      `/admissions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    
    console.log('🟢 [AdmissionService] Admissions response:', response.data);
    
    // Handle different response formats
    let admissionsData: AdmissionItem[] = [];
    let total = 0;
    let page = 1;
    let limit = 10;
    let totalPages = 1;
    
    if (response.data.admissions && Array.isArray(response.data.admissions)) {
      admissionsData = response.data.admissions;
      total = response.data.total || admissionsData.length;
      page = response.data.page || 1;
      limit = response.data.limit || 10;
      totalPages = response.data.totalPages || Math.ceil(total / limit);
    } else if (Array.isArray(response.data)) {
      admissionsData = response.data;
      total = admissionsData.length;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      admissionsData = response.data.data;
      total = response.data.total || admissionsData.length;
      page = response.data.page || 1;
      limit = response.data.limit || 10;
      totalPages = response.data.totalPages || Math.ceil(total / limit);
    }
    
    return {
      data: admissionsData,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error: any) {
    console.error('🔴 [AdmissionService] Failed to fetch admissions:', error);
    throw error;
  }
}

  // Get admission by registration ID
  async getAdmissionByRegistrationId(registrationId: string): Promise<AdmissionItem> {
    const response = await api.get<AdmissionItem>(`/admissions/${registrationId}`);
    return response.data;
  }
// In admissionService.ts - Update the getBatchesByClass method
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

  // Create a new admission (form data)
async createAdmission(admissionData: CreateAdmissionDto): Promise<AdmissionItem> {
  console.log('🟡 [AdmissionService] Creating admission with data:', admissionData);
  
  // Generate registration ID if not provided
  if (!admissionData.registrationId) {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    admissionData.registrationId = `REG${timestamp.toString().slice(-6)}${randomNum}`;
  }
  
  // Format the data according to backend schema
  const formattedData = {
    registrationId: admissionData.registrationId,
    name: admissionData.name,
    nameNative: admissionData.nameNative || '',
    studentGender: admissionData.studentGender,
    studentDateOfBirth: admissionData.studentDateOfBirth || '',
    presentAddress: admissionData.presentAddress || '',
    permanentAddress: admissionData.permanentAddress || '',
    religion: admissionData.religion,
    whatsappMobile: admissionData.whatsappMobile || '',
    studentMobileNumber: admissionData.studentMobileNumber || '',
    instituteName: admissionData.instituteName,
    fathersName: admissionData.fathersName || '',
    mothersName: admissionData.mothersName || '',
    guardianMobileNumber: admissionData.guardianMobileNumber,
    motherMobileNumber: admissionData.motherMobileNumber || '',
    admissionType: admissionData.admissionType || AdmissionType.MONTHLY,
    courseFee: admissionData.courseFee || 0,
    admissionFee: admissionData.admissionFee || 0,
    tuitionFee: admissionData.tuitionFee || 0,
    referBy: admissionData.referBy || '',
    admissionDate: admissionData.admissionDate || new Date().toISOString().split('T')[0],
    batches: admissionData.batches || [],
    remarks: admissionData.remarks || '',
    photo: admissionData.photo,
  };

  const formData = this.toFormData(formattedData);

  try {
    console.log('🟡 [AdmissionService] Sending POST request to /admissions');
    const response = await api.post<AdmissionItem>('/admissions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('🟢 [AdmissionService] Admission created successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('🔴 [AdmissionService] Failed to create admission:', error);
    console.error('🔴 [AdmissionService] Error response:', error.response?.data);
    throw error;
  }
}

  // Update admission (form data)
// Update admission (form data)
async updateAdmission(registrationId: string, admissionData: UpdateAdmissionDto): Promise<AdmissionItem> {
  console.log('Updating admission:', registrationId, admissionData);
  
  // Include the _id in the form data for backend reference
  const formData = this.toFormData({
    _id: admissionData._id, // Add _id field
    ...admissionData,
    registration_id: admissionData.registrationId || registrationId,
    name: admissionData.name,
    name_native: admissionData.nameNative,
    student_gender: admissionData.studentGender,
    student_date_of_birth: admissionData.studentDateOfBirth,
    present_address: admissionData.presentAddress,
    permanent_address: admissionData.permanentAddress,
    religion: admissionData.religion,
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
    remarks: admissionData.remarks,
    photo: admissionData.photo,
    status: admissionData.status,
    paid_amount: admissionData.paidAmount,
  }, true);

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
// Update admission status
async updateAdmissionStatus(registrationId: string, status: AdmissionStatus): Promise<AdmissionItem> {
  // This should call the main update endpoint, not /status
  const response = await api.put<AdmissionItem>(`/admissions/${registrationId}`, { 
    status 
  });
  return response.data;
}

  // Update payment
  async updatePayment(registrationId: string, paidAmount: number): Promise<AdmissionItem> {
    const response = await api.put<AdmissionItem>(`/admissions/${registrationId}/payment`, { paidAmount });
    return response.data;
  }

  // Get active batches for dropdown
  async getActiveBatches(): Promise<BatchForDropdown[]> {
    try {
      const response = await api.get<BatchForDropdown[]>('/batches/active');
      return response.data;
    } catch (error: any) {
      // Fallback to empty array if endpoint fails (prevents modal hang)
      console.warn('Failed to fetch active batches:', error.response?.data?.message || error.message);
      return [];
    }
  }

  // Get all classes
// In admissionService.ts - update the getClasses method
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
  // Get all groups
  async getGroups(): Promise<GroupForDropdown[]> {
    const response = await api.get<GroupForDropdown[]>('/academic/group');
    return response.data;
  }

  // Get all subjects
  async getSubjects(): Promise<SubjectForDropdown[]> {
    const response = await api.get<SubjectForDropdown[]>('/academic/subject');
    return response.data;
  }

  // Generate new registration ID
  async generateRegistrationId(): Promise<string> {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `REG${timestamp.toString().slice(-6)}${randomNum}`;
  }
}

export default new AdmissionService();