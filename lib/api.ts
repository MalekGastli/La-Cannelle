// API Configuration and Client

function getDefaultApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }
    return '/api';
  }

  return process.env.BACKEND_API_URL || 'http://localhost:3001/api';
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || getDefaultApiBaseUrl();

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

const sanitizeString = (value: string) => {
  return value
    .replace(/\uFFFD/g, "'")
    .replace(/â€™|â€˜/g, "'")
    .replace(/â€œ|â€�/g, '"');
};

const sanitizeDeep = <T,>(value: T): T => {
  if (typeof value === 'string') {
    return sanitizeString(value) as T;
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDeep(item)) as T;
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    record[key] = sanitizeDeep(record[key]);
  }
  return value;
};

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
        cache: 'no-store',
      });

      const text = await response.text();
      let data: any = undefined;
      if (text) {
        try {
          data = sanitizeDeep(JSON.parse(text));
        } catch (parseError) {
          return {
            error: parseError instanceof Error ? parseError.message : 'Invalid response format',
          };
        }
      }

      if (!response.ok) {
        return {
          error: (data && data.error) || text || `HTTP error! status: ${response.status}`,
        };
      }

      return { data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      const hintedMessage =
        typeof window !== 'undefined'
        && /failed to fetch/i.test(message)
        && /localhost:3001/i.test(this.baseURL)
          ? 'Backend unavailable (start the backend on port 3001)'
          : message;
      return {
        error: hintedMessage,
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
