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

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload, remember?: boolean) => Promise<AuthUser>;
  trainerLogin: (payload: LoginPayload, remember?: boolean) => Promise<AuthUser>;
  adminLogin: (payload: LoginPayload, remember?: boolean) => Promise<AuthUser>;
  register: (payload: RegisterPayload, remember?: boolean) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      apiClient.clearAuthToken();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const hydrateAuth = async () => {
      try {
        const nextUser = await refreshUser();
        if (!isActive) return;
        setUser(nextUser);
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
    async (payload: LoginPayload, remember = false) => {
      const response = await apiClient.post<AuthResponseData>(API_ENDPOINTS.auth.login, payload);

      if (!response.data?.tokens?.accessToken || !response.data.user) {
        throw new Error("Login succeeded, but the server response was incomplete.");
      }

      return storeAuthResult(response.data, remember);
    },
    [storeAuthResult]
  );

  const trainerLogin = useCallback(
    async (payload: LoginPayload, remember = false) => {
      const response = await apiClient.post<AuthResponseData>(API_ENDPOINTS.auth.login, payload);

      if (!response.data?.tokens?.accessToken || !response.data.user) {
        throw new Error("Login succeeded, but the server response was incomplete.");
      }

      if (response.data.user.role !== "trainer") {
        throw new Error("These credentials belong to a customer account. Please use the regular sign-in page.");
      }

      return storeAuthResult(response.data, remember);
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
