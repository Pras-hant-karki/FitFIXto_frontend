import { API_BASE_URL, API_ENDPOINTS, API_HEADERS } from '@/constants/api';
import { ApiResponse } from '@/types';
import { sessionStore, type SessionEnvelope, type SessionTokens } from './session-store';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

/** Shape shared by every backend response, success or failure. */
type RawPayload<T = unknown> = Partial<ApiResponse<T>> & { code?: string };

type RefreshPayload = RawPayload<{ tokens?: SessionTokens; session?: SessionEnvelope }>;

/** Server error codes that must end the session outright rather than trigger a refresh. */
const FATAL_SESSION_CODES = new Set(['SESSION_TAMPERED', 'ROLE_CHANGED', 'SESSION_EXPIRED']);

class ApiClient {
  private baseUrl: string;
  private headers: HeadersInit;
  private isRefreshing = false;
  private pendingRefreshResolvers: Array<(token: string | null) => void> = [];

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.headers = { ...API_HEADERS };
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  getAuthToken(): string | null {
    return sessionStore.getAccessToken();
  }

  private getRefreshToken(): string | null {
    return sessionStore.getRefreshToken();
  }

  private getHeaders(overrideToken?: string): HeadersInit {
    const token = overrideToken !== undefined ? overrideToken : this.getAuthToken();

    return {
      ...this.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
      // Mirrors the session cookie so the server can detect client-side tampering.
      ...sessionStore.getIntegrityHeaders(),
    };
  }

  // Dispatched when a 401 cannot be recovered. AuthContext listens and clears state,
  // so redirects happen through the router rather than a hard navigation.
  private signalUnauthorized(reason?: string): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { reason } }));
    }
  }

  private endSession(reason: string): void {
    sessionStore.clear();
    this.signalUnauthorized(reason);
  }

  // Exchanges the stored refresh token for a new access token. Concurrent callers are
  // deduplicated: one network request, shared outcome.
  private async attemptRefresh(): Promise<string | null> {
    if (this.isRefreshing) {
      return new Promise<string | null>((resolve) => {
        this.pendingRefreshResolvers.push(resolve);
      });
    }

    const storedRefreshToken = this.getRefreshToken();
    if (!storedRefreshToken) {
      this.endSession('Your session has ended. Please sign in again.');
      return null;
    }

    this.isRefreshing = true;

    const settle = (token: string | null) => {
      this.pendingRefreshResolvers.forEach((resolve) => resolve(token));
      this.pendingRefreshResolvers = [];
      this.isRefreshing = false;
    };

    try {
      const url = this.buildUrl(API_ENDPOINTS.auth.refresh);
      const response = await fetch(url, {
        method: 'POST',
        headers: { ...this.headers },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      let responseData: RefreshPayload;
      try {
        responseData = (await response.json()) as RefreshPayload;
      } catch {
        responseData = {};
      }

      if (!response.ok) {
        settle(null);

        // Only an actually rejected refresh token means the session is over. Rate limiting,
        // server faults and outages are transient — ending the session on those is what
        // produced a spurious bounce back to the login form mid-session.
        if (response.status === 401 || response.status === 403) {
          this.endSession(responseData.message || 'Your session has expired. Please sign in again.');
        }

        return null;
      }

      const newTokens = responseData.data?.tokens;
      const newSession = responseData.data?.session;

      if (!newTokens?.accessToken || !newSession?.state || !newSession?.signature) {
        settle(null);
        return null;
      }

      // Rotate the cookie in step with the token so the envelope stays token-bound.
      sessionStore.updateTokens(newTokens, newSession);

      settle(newTokens.accessToken);
      return newTokens.accessToken;
    } catch {
      // Network or parse failure: transient, so the stored session is left intact.
      settle(null);
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

    let data: RawPayload<T>;
    try {
      data = (await response.json()) as RawPayload<T>;
    } catch {
      data = {};
    }

    if (!response.ok) {
      if (response.status === 401) {
        // A tampered or repudiated session is never recoverable by refreshing.
        if (typeof data.code === 'string' && FATAL_SESSION_CODES.has(data.code)) {
          this.endSession(data.message || 'Your session has ended. Please sign in again.');
          throw new Error(data.message || 'Your session has ended. Please sign in again.');
        }

        const newAccessToken = await this.attemptRefresh();
        if (newAccessToken) {
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers: this.getHeaders(newAccessToken),
          });
          let retryData: RawPayload<T>;
          try {
            retryData = (await retryResponse.json()) as RawPayload<T>;
          } catch {
            retryData = {};
          }
          if (!retryResponse.ok) {
            // End the session only when the server explicitly says it is dead. A bare 401
            // from one endpoint (a route this role may not touch, say) must not sign the
            // user out everywhere.
            if (typeof retryData.code === 'string' && FATAL_SESSION_CODES.has(retryData.code)) {
              this.endSession(retryData.message || 'Your session has ended. Please sign in again.');
            }
            throw new Error(retryData.message || 'API request failed');
          }
          return retryData as ApiResponse<T>;
        }

        // Refresh did not yield a token. If it was fatal the session is already gone;
        // otherwise this was transient and the caller just sees the original failure.
        throw new Error(data.message || 'Request failed. Please try again.');
      }
      throw new Error(data.message || 'API request failed');
    }

    return data as ApiResponse<T>;
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

  clearAuthToken(): void {
    sessionStore.clear();
  }
}

export const apiClient = new ApiClient();
