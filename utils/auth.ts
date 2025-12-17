import { LoginResponse, User } from "@/types/auth";


class AuthService {
  static setAuthData(data: LoginResponse): void {
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
  }

  static getAuthData(): { token: string | null; user: User | null } {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) as User : null;
    
    return { token, user };
  }

  static clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }

  static isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    return !!token;
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) as User : null;
  }

  static getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  static isTokenExpired(token: string): boolean {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

export default AuthService;