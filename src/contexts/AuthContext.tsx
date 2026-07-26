"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "customer" | "trainer" | "admin" | string;
  profilePicture?: string | null;
  bio?: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

type AuthResponseData = {
  user: AuthUser;
  tokens: AuthTokens;
  passwordIsWeak?: boolean;
};

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export type LoginResult = AuthUser & { passwordIsWeak?: boolean };

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload, remember?: boolean) => Promise<LoginResult>;
  trainerLogin: (payload: LoginPayload, remember?: boolean) => Promise<LoginResult>;
  adminLogin: (payload: LoginPayload, remember?: boolean) => Promise<AuthUser>;
  register: (payload: RegisterPayload, remember?: boolean) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for the custom event dispatched by api-client when a 401 cannot be
  // recovered (no refresh token or refresh also failed). Clears auth state so
  // ProtectedRoute can redirect to the right login page via React Router.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUnauthorized = () => {
      apiClient.clearAuthToken();
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const storeAuthResult = useCallback((data: AuthResponseData, remember = false) => {
    apiClient.setTokens(data.tokens, remember);
    setUser(data.user);
    return data.user;
  }, []);

  const refreshUser = useCallback(async () => {
    if (!apiClient.getStoredTokens()) {
      setUser(null);
      return null;
    }

    try {
      const response = await apiClient.get<{ user: AuthUser }>(API_ENDPOINTS.auth.me);
      const nextUser = response.data?.user ?? null;
      setUser(nextUser);
      return nextUser;
    } catch {
      // Do NOT clear tokens here. If the failure was a 401, api-client already
      // attempted a token refresh and dispatched auth:unauthorized if that also
      // failed. For transient network errors we leave auth state intact.
      return null;
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const hydrateAuth = async () => {
      try {
        await refreshUser();
        if (!isActive) return;
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    hydrateAuth();

    return () => {
      isActive = false;
    };
  }, [refreshUser]);

  const login = useCallback(
    async (payload: LoginPayload, remember = false): Promise<LoginResult> => {
      const response = await apiClient.post<AuthResponseData>(API_ENDPOINTS.auth.login, payload);

      if (!response.data?.tokens?.accessToken || !response.data.user) {
        throw new Error("Login succeeded, but the server response was incomplete.");
      }

      if (response.data.user.role === "trainer") {
        throw new Error("Trainer accounts have a dedicated sign-in page. Please visit /trainer/login");
      }

      const user = storeAuthResult(response.data, remember);
      return { ...user, passwordIsWeak: response.data.passwordIsWeak ?? false };
    },
    [storeAuthResult]
  );

  const trainerLogin = useCallback(
    async (payload: LoginPayload, remember = false): Promise<LoginResult> => {
      const response = await apiClient.post<AuthResponseData>(API_ENDPOINTS.auth.login, payload);

      if (!response.data?.tokens?.accessToken || !response.data.user) {
        throw new Error("Login succeeded, but the server response was incomplete.");
      }

      if (response.data.user.role !== "trainer") {
        throw new Error("These credentials belong to a customer account. Please use the regular sign-in page.");
      }

      const user = storeAuthResult(response.data, remember);
      return { ...user, passwordIsWeak: response.data.passwordIsWeak ?? false };
    },
    [storeAuthResult]
  );

  const adminLogin = useCallback(
    async (payload: LoginPayload, remember = false) => {
      const response = await apiClient.post<AuthResponseData>(API_ENDPOINTS.admin.login, payload);

      if (!response.data?.tokens?.accessToken || !response.data.user) {
        throw new Error("Admin login succeeded, but the server response was incomplete.");
      }

      return storeAuthResult(response.data, remember);
    },
    [storeAuthResult]
  );

  const register = useCallback(
    async (payload: RegisterPayload, remember = false) => {
      const response = await apiClient.post<AuthResponseData>(API_ENDPOINTS.auth.signup, payload);

      if (!response.data?.tokens?.accessToken || !response.data.user) {
        throw new Error("Account created, but the server response was incomplete.");
      }

      return storeAuthResult(response.data, remember);
    },
    [storeAuthResult]
  );

  const logout = useCallback(() => {
    apiClient.clearAuthToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      trainerLogin,
      adminLogin,
      register,
      logout,
      refreshUser,
    }),
    [adminLogin, isLoading, login, trainerLogin, logout, refreshUser, register, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
