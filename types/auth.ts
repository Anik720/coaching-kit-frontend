export interface User {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'staff';
  adminId: string | null;
  designation: string;
  salary: number;
  joiningDate: string;
  adName: string;
  username: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: 'staff';
  designation: string;
  salary: number;
  joiningDate: string;
  adName: string;
  username: string;
  addressName?: string;
  address: string;
  addressDescription?: string;
  itemOfName?: string;
  currentAddress?: string;
  responseContentNumber?: string;
  intervalAddress?: string;
  reminderAddress?: string;
  messageNumber?: string;
  numberingLevel?: string;
  material?: string;
  hostName?: string;
  notifyName?: string;
}

export interface RegisterResponse {
  user: User;
  accessToken: string;
}

export interface ValidationError {
  statusCode: number;
  message: string[];
  error: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  user: Pick<User, 'id' | 'email' | 'role'>;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}