import { API_BASE_URL, API_ENDPOINTS, API_HEADERS } from '@/constants/api';
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
  private isRefreshing = false;
  private pendingRefreshResolvers: Array<(token: string | null) => void> = [];

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

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');
  }

  private getHeaders(overrideToken?: string): HeadersInit {
    const token = overrideToken !== undefined ? overrideToken : this.getAuthToken();
    return {
      ...this.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Dispatches a custom event that AuthContext listens to in order to clear
  // the user state and redirect via React Router (no hard navigation).
  private signalUnauthorized(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
  }

  // Attempts to exchange the stored refresh token for a new access token.
  // Concurrent calls are deduplicated: only one network request is made and
  // all callers awaiting the result share the same outcome.
  private async attemptRefresh(): Promise<string | null> {
    if (this.isRefreshing) {
      return new Promise<string | null>((resolve) => {
        this.pendingRefreshResolvers.push(resolve);
      });
    }

    const storedRefreshToken = this.getRefreshToken();
    if (!storedRefreshToken) {
      this.signalUnauthorized();
      return null;
    }

    this.isRefreshing = true;

    try {
      const url = this.buildUrl(API_ENDPOINTS.auth.refresh);
      const response = await fetch(url, {
        method: 'POST',
        headers: { ...this.headers },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      let responseData: any;
      try {
        responseData = await response.json();
      } catch {
        responseData = {};
      }

      if (!response.ok) {
        throw new Error(responseData.message || 'Refresh failed');
      }

      const newTokens = responseData?.data?.tokens;
      if (!newTokens?.accessToken) {
        throw new Error('Invalid refresh response');
      }

      const stored = this.getStoredTokens();
      const remember = stored?.remember ?? true;
      this.setTokens(newTokens, remember);

      this.pendingRefreshResolvers.forEach((resolve) => resolve(newTokens.accessToken));
      this.pendingRefreshResolvers = [];
      this.isRefreshing = false;

      return newTokens.accessToken as string;
    } catch {
      this.clearAuthToken();
      this.pendingRefreshResolvers.forEach((resolve) => resolve(null));
      this.pendingRefreshResolvers = [];
      this.isRefreshing = false;
      this.signalUnauthorized();
      return null;
    }
  }

  async request<T = unknown>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      ...fetchOptions,
      headers: this.getHeaders(),
    });

    let data: any;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      if (response.status === 401) {
        const newAccessToken = await this.attemptRefresh();
        if (newAccessToken) {
          // Retry the original request with the fresh access token
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers: this.getHeaders(newAccessToken),
          });
          let retryData: any;
          try {
            retryData = await retryResponse.json();
          } catch {
            retryData = {};
          }
          if (!retryResponse.ok) {
            throw new Error(retryData.message || 'API request failed');
          }
          return retryData;
        }
        // attemptRefresh already cleared tokens and dispatched auth:unauthorized
        throw new Error(data.message || 'Session expired. Please sign in again.');
      }
      throw new Error(data.message || 'API request failed');
    }

    return data;
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
