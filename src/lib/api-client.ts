import { API_BASE_URL, API_HEADERS } from '@/constants/api';
import { ApiResponse } from '@/types';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

export type StoredTokens = {
  accessToken: string;
  refreshToken?: string;
  remember: boolean;
};

class ApiClient {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.headers = { ...API_HEADERS };
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    return url.toString();
  }

  getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
  }

  getStoredTokens(): StoredTokens | null {
    if (typeof window === 'undefined') return null;

    const sessionAccessToken = sessionStorage.getItem('authToken');
    if (sessionAccessToken) {
      return {
        accessToken: sessionAccessToken,
        refreshToken: sessionStorage.getItem('refreshToken') || undefined,
        remember: false,
      };
    }

    const localAccessToken = localStorage.getItem('authToken');
    if (!localAccessToken) return null;

    return {
      accessToken: localAccessToken,
      refreshToken: localStorage.getItem('refreshToken') || undefined,
      remember: true,
    };
  }

  private getHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      ...this.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async request<T = unknown>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid — clear stored credentials so the next
          // page load restores the unauthenticated state cleanly.
          this.clearAuthToken();
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/admin/login')) {
            const isAdmin = window.location.pathname.startsWith('/admin');
            window.location.href = isAdmin ? '/admin/login' : `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          }
        }
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async get<T = unknown>(endpoint: string, options?: FetchOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string, options?: FetchOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  setAuthToken(token: string, remember = false): void {
    if (typeof window !== 'undefined') {
      const primaryStorage = remember ? localStorage : sessionStorage;
      const secondaryStorage = remember ? sessionStorage : localStorage;

      secondaryStorage.removeItem('authToken');
      primaryStorage.setItem('authToken', token);
    }
  }

  setRefreshToken(token: string, remember = false): void {
    if (typeof window !== 'undefined') {
      const primaryStorage = remember ? localStorage : sessionStorage;
      const secondaryStorage = remember ? sessionStorage : localStorage;

      secondaryStorage.removeItem('refreshToken');
      primaryStorage.setItem('refreshToken', token);
    }
  }

  setTokens(tokens: { accessToken: string; refreshToken?: string }, remember = false): void {
    this.setAuthToken(tokens.accessToken, remember);

    if (tokens.refreshToken) {
      this.setRefreshToken(tokens.refreshToken, remember);
    }
  }

  clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('refreshToken');
    }
  }
}

export const apiClient = new ApiClient();
