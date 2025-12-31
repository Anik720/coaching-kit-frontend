import api from '@/api/axios';
import {
  GroupsResponse,
  CreateGroupDto,
  UpdateGroupDto,
  GroupQueryParams,
  CreateGroupResponse,
  GroupItem,
  GroupStatusResponse,
} from '../types/group.types';

class GroupService {
  // Get all groups with pagination and filtering
  async getAllGroups(params?: GroupQueryParams): Promise<GroupsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.search) queryParams.append('search', params.search);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    }

    const response = await api.get<GroupsResponse>(
      `/academic/group${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
  }

  // Get a single group by ID
  async getGroupById(id: string): Promise<GroupItem> {
    const response = await api.get<GroupItem>(`/academic/group/${id}`);
    return response.data;
  }

  // Create a new group
  async createGroup(groupData: CreateGroupDto): Promise<CreateGroupResponse> {
    const response = await api.post<CreateGroupResponse>('/academic/group', groupData);
    return response.data;
  }

  // Update a group
  async updateGroup(id: string, groupData: UpdateGroupDto): Promise<GroupItem> {
    const response = await api.put<GroupItem>(`/academic/group/${id}`, groupData);
    return response.data;
  }

  // Delete a group
  async deleteGroup(id: string): Promise<void> {
    await api.delete(`/academic/group/${id}`);
  }

  // Toggle group active status
  async toggleGroupActive(id: string): Promise<GroupItem> {
    const response = await api.put<GroupItem>(`/academic/group/${id}/toggle-active`);
    return response.data;
  }

  // Get group status and statistics
  async getGroupStatus(id: string): Promise<GroupStatusResponse> {
    const response = await api.get<GroupStatusResponse>(`/academic/group/${id}/status`);
    return response.data;
  }

  // Get groups created by current user
  async getMyGroups(params?: Omit<GroupQueryParams, 'sortBy' | 'sortOrder'>): Promise<GroupsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.search) queryParams.append('search', params.search);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
    }

    const response = await api.get<GroupsResponse>(
      `/academic/group/my-groups${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
  }
}

export default new GroupService();