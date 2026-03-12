// api/result-management/create-exam/services/examService.ts
import api from '@/api/axios';
import { CreateExamDto, Exam, ExamQueryParams, ExamsPaginatedResponse, UpdateExamDto } from '../types/exam.types';

class ExamService {
  async create(data: CreateExamDto): Promise<Exam> {
    const response = await api.post<Exam>('/academic/exam', data);
    return response.data;
  }

  async getAll(params?: ExamQueryParams): Promise<ExamsPaginatedResponse> {
    const query = new URLSearchParams();

    if (params?.search) query.append('search', params.search);
    if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));
    if (params?.className) query.append('className', params.className);
    if (params?.subjectName) query.append('subjectName', params.subjectName);
    if (params?.examCategory) query.append('examCategory', params.examCategory);
    if (params?.batchName) query.append('batchName', params.batchName);
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const url = `/academic/exam${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await api.get<ExamsPaginatedResponse>(url);
    return response.data;
  }

  async getById(id: string): Promise<Exam> {
    const response = await api.get<Exam>(`/academic/exam/${id}`);
    return response.data;
  }

  async update(id: string, data: UpdateExamDto): Promise<Exam> {
    const response = await api.put<Exam>(`/academic/exam/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/academic/exam/${id}`);
  }

  async toggleActive(id: string): Promise<Exam> {
    const response = await api.put<Exam>(`/academic/exam/${id}/toggle-active`);
    return response.data;
  }

  async getStats(id: string): Promise<any> {
    const response = await api.get(`/academic/exam/${id}/stats`);
    return response.data;
  }

  // ==================== DROPDOWN DATA METHODS ====================

  async getClasses(): Promise<any[]> {
    try {
      console.log('🟡 [ExamService] Fetching classes...');
      const response = await api.get<any>('/academic/class');
      console.log('🟢 [ExamService] Classes API response:', response);
      
      // Handle different response formats
      let classesData: any[] = [];
      
      if (response.data) {
        // Format 1: { data: [], total, page, limit, totalPages }
        if (response.data.data && Array.isArray(response.data.data)) {
          console.log('📦 [ExamService] Using data.data format');
          classesData = response.data.data;
        } 
        // Format 2: Direct array in response.data
        else if (Array.isArray(response.data)) {
          console.log('📦 [ExamService] Using direct array format');
          classesData = response.data;
        }
        // Format 3: Maybe it's just the data property itself
        else if (typeof response.data === 'object') {
          // Check if it has the structure we expect
          if (response.data.classname) {
            // Single class object
            classesData = [response.data];
          }
        }
      }
      
      console.log('📊 [ExamService] Extracted classes:', classesData.length, 'items');
      
      // Map to consistent format
      const mappedClasses = classesData.map((cls: any) => ({
        _id: cls._id,
        classname: cls.classname,
        name: cls.classname || cls.name,
        description: cls.description,
        isActive: cls.isActive,
      }));
      
      console.log('✅ [ExamService] Mapped classes:', mappedClasses);
      return mappedClasses;
      
    } catch (error: any) {
      console.error('🔴 [ExamService] Failed to fetch classes:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return [];
    }
  }

  async getBatchesByClass(classId: string): Promise<any[]> {
    try {
      const response = await api.get(`/batches/class/${classId}`);
      console.log('Batches by class response:', response.data);
      
      // Handle different response formats
      let batches: any[] = [];
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        batches = response.data.data;
      } else if (Array.isArray(response.data)) {
        batches = response.data;
      } else if (response.data && Array.isArray(response.data)) {
        batches = response.data;
      }
      
      // Add name property for consistency
      return batches.map(batch => ({
        _id: batch._id,
        batchName: batch.batchName || batch.name,
        name: batch.batchName || batch.name || 'Unnamed Batch',
        sessionYear: batch.sessionYear,
        isActive: batch.isActive,
      }));
    } catch (error: any) {
      console.error('Failed to fetch batches by class:', error.response?.data?.message || error.message);
      return [];
    }
  }

  async getSubjects(): Promise<any[]> {
    try {
      const response = await api.get<any>('/academic/subject');
      console.log('Subjects API response:', response.data);
      
      // Handle response format: { data: [], meta: { total, page, limit, totalPages } }
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data.map((subject: any) => ({
          _id: subject._id,
          subjectName: subject.subjectName,
          name: subject.subjectName,
          description: subject.description,
          isActive: subject.isActive,
        }));
      }
      
      // Fallback if data structure is different
      return response.data || [];
    } catch (error: any) {
      console.error('Failed to fetch subjects:', error.response?.data?.message || error.message);
      return [];
    }
  }

  async getExamCategories(): Promise<any[]> {
    try {
      console.log('🟡 [ExamService] Fetching exam categories...');
      const response = await api.get<any>('/academic/exam-category');
      console.log('🟢 [ExamService] Exam categories API response:', response);
      
      let categoriesData: any[] = [];
      
      if (response.data) {
        // Format: { data: [], total, page, limit, totalPages }
        if (response.data.data && Array.isArray(response.data.data)) {
          console.log('📦 [ExamService] Categories: Using data.data format');
          categoriesData = response.data.data;
        }
        // Direct array
        else if (Array.isArray(response.data)) {
          console.log('📦 [ExamService] Categories: Using direct array format');
          categoriesData = response.data;
        }
      }
      
      console.log('📊 [ExamService] Extracted categories:', categoriesData.length, 'items');
      
      const mappedCategories = categoriesData.map((category: any) => ({
        _id: category._id,
        categoryName: category.categoryName,
        name: category.categoryName,
        description: category.description,
        isActive: category.isActive,
      }));
      
      console.log('✅ [ExamService] Mapped categories:', mappedCategories);
      return mappedCategories;
      
    } catch (error: any) {
      console.error('🔴 [ExamService] Failed to fetch exam categories:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return [];
    }
  }

  async getActiveBatches(): Promise<any[]> {
    try {
      const response = await api.get<any>('/batches/active');
      console.log('Active batches API response:', response.data);
      
      let batches: any[] = [];
      
      // Handle different response formats
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        batches = response.data.data;
      } else if (Array.isArray(response.data)) {
        batches = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        batches = response.data.data;
      }
      
      // Add name property for consistency
      return batches.map(batch => ({
        _id: batch._id,
        batchName: batch.batchName || batch.name,
        name: batch.batchName || batch.name || 'Unnamed Batch',
        sessionYear: batch.sessionYear,
        isActive: batch.isActive,
        classId: batch.classId || batch.class?._id,
      }));
    } catch (error: any) {
      console.error('Failed to fetch active batches:', error.response?.data?.message || error.message);
      return [];
    }
  }

  // Utility method to get all batches (not filtered by class)
  async getAllBatches(): Promise<any[]> {
    try {
      const response = await api.get<any>('/batches');
      console.log('All batches API response:', response.data);
      
      let batches: any[] = [];
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        batches = response.data.data;
      } else if (Array.isArray(response.data)) {
        batches = response.data;
      }
      
      return batches.map(batch => ({
        _id: batch._id,
        batchName: batch.batchName || batch.name,
        name: batch.batchName || batch.name || 'Unnamed Batch',
        sessionYear: batch.sessionYear,
        isActive: batch.isActive,
        classId: batch.classId || batch.class?._id,
      }));
    } catch (error: any) {
      console.error('Failed to fetch all batches:', error.response?.data?.message || error.message);
      return [];
    }
  }

  // Get suggestions for dropdowns (for autocomplete)
  async getClassSuggestions(): Promise<string[]> {
    try {
      const response = await api.get<ExamsPaginatedResponse>('/academic/exam?limit=100');
      const classes = [...new Set(response.data.data.map(exam => exam.className).filter(Boolean))];
      return classes.sort();
    } catch (error) {
      console.error('Failed to fetch class suggestions:', error);
      return [];
    }
  }

  async getBatchSuggestions(): Promise<string[]> {
    try {
      const response = await api.get<ExamsPaginatedResponse>('/academic/exam?limit=100');
      const batches = [...new Set(response.data.data.map(exam => exam.batchName).filter(Boolean))];
      return batches.sort();
    } catch (error) {
      console.error('Failed to fetch batch suggestions:', error);
      return [];
    }
  }
}

export default new ExamService();