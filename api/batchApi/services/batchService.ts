import api from '@/api/axios';
import {
  BatchesResponse,
  CreateBatchDto,
  UpdateBatchDto,
  BatchQueryParams,
  CreateBatchResponse,
  BatchItem,
  ClassItem,
  GroupItem,
  SubjectItem,
} from '../types/batch.types';

class BatchService {
  // Get all batches with pagination and filtering
  async getAllBatches(params?: BatchQueryParams): Promise<BatchesResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.search) queryParams.append('search', params.search);
      if (params.className) queryParams.append('className', params.className);
      if (params.group) queryParams.append('group', params.group);
      if (params.subject) queryParams.append('subject', params.subject);
      if (params.sessionYear) queryParams.append('sessionYear', params.sessionYear);
      if (params.status) queryParams.append('status', params.status);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    }

    const response = await api.get<BatchesResponse>(
      `/batches${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
  }

  // Get a single batch by ID
  async getBatchById(id: string): Promise<BatchItem> {
    const response = await api.get<BatchItem>(`/batches/${id}`);
    return response.data;
  }

  // Create a new batch
// Update batchService.ts
async createBatch(batchData: CreateBatchDto): Promise<CreateBatchResponse> {
  try {
    console.log('🟡 [BatchService] Sending POST to /batches with data:', batchData);
    
    const response = await api.post<CreateBatchResponse>('/batches', batchData);
    
    console.log('🟢 [BatchService] Response received:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('🔴 [BatchService] Error creating batch:', error);
    
    if (error.response) {
      console.error('🔴 [BatchService] Error status:', error.response.status);
      console.error('🔴 [BatchService] Error data:', error.response.data);
      console.error('🔴 [BatchService] Error headers:', error.response.headers);
    } else if (error.request) {
      console.error('🔴 [BatchService] No response received:', error.request);
    } else {
      console.error('🔴 [BatchService] Error message:', error.message);
    }
    
    throw error;
  }
}

  // Update a batch
  async updateBatch(id: string, batchData: UpdateBatchDto): Promise<BatchItem> {
    const response = await api.patch<BatchItem>(`/batches/${id}`, batchData);
    return response.data;
  }

  // Delete a batch
  async deleteBatch(id: string): Promise<void> {
    await api.delete(`/batches/${id}`);
  }

  // Toggle batch active status
  async toggleBatchStatus(id: string): Promise<BatchItem> {
    const response = await api.patch<BatchItem>(`/batches/${id}/toggle-status`);
    return response.data;
  }

  // Get batch statistics
  async getBatchStats(): Promise<any> {
    const response = await api.get('/batches/stats');
    return response.data;
  }

  // Get batch availability
  async getBatchAvailability(id: string): Promise<any> {
    const response = await api.get(`/batches/${id}/availability`);
    return response.data;
  }

  // Get all classes (for dropdown)
  async getAllClasses(): Promise<ClassItem[]> {
    const response = await api.get('/academic/class');
    return response.data.data;
  }

  // Get all groups (for dropdown)
  async getAllGroups(): Promise<GroupItem[]> {
    const response = await api.get('/academic/group');
    return response.data.data;
  }

  // Get all subjects (for dropdown)
  async getAllSubjects(): Promise<SubjectItem[]> {
    const response = await api.get('/academic/subject');
    return response.data.data;
  }

  // Get batches by date range
  async getBatchesByDateRange(startDate: string, endDate: string): Promise<BatchItem[]> {
    const response = await api.get(`/batches/date-range/${startDate}/${endDate}`);
    return response.data;
  }
}

export default new BatchService();