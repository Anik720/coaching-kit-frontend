import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import { toast } from 'react-toastify';

// Define your custom error interface
interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}

interface ApiErrorResponse {
  data: ApiError;
}

const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      // Ensure headers exist before setting
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
            toast.error('Session expired. Please login again.');
          }
          break;
        case 403:
          toast.error('Access denied');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 409:
          toast.error(data?.message || 'Conflict occurred');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(data?.message || 'An error occurred');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

export default api;