import { apiClient } from '../api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  position?: string;
  location?: string;
  preferences?: string[];
  allergies?: string[];
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  position?: string;
  role: 'ADMIN' | 'CLIENT';
  tier?: string;
  location?: string;
  preferences?: string[];
  allergies?: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  async login(data: LoginData): Promise<{ user: User; token: string } | null> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    if (response.data) {
      apiClient.setToken(response.data.token);
      return response.data;
    }
    throw new Error(response.error || 'Login failed');
  },

  async register(data: RegisterData): Promise<{ user: User; token: string } | null> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    if (response.data) {
      apiClient.setToken(response.data.token);
      return response.data;
    }
    throw new Error(response.error || 'Registration failed');
  },

  async getProfile(): Promise<User | null> {
    const response = await apiClient.get<User>('/auth/profile');
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get profile');
  },

  async updateProfile(data: Partial<RegisterData>): Promise<User | null> {
    const response = await apiClient.put<User>('/auth/profile', data);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to update profile');
  },

  logout() {
    apiClient.setToken(null);
  },

  isAuthenticated(): boolean {
    return !!apiClient.getToken();
  },
};
