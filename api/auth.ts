import { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse, RegisterRequest, RegisterResponse, TokenValidationResponse, User } from '@/types/auth';
import api from './axios';

export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/logout');
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/profile');
    return response.data;
  },

  refreshToken: async (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    const response = await api.post<RefreshTokenResponse>('/auth/refresh', data);
    return response.data;
  },

  validateToken: async (token: string): Promise<TokenValidationResponse> => {
    const response = await api.post<TokenValidationResponse>('/auth/validate', { token });
    return response.data;
  },
};