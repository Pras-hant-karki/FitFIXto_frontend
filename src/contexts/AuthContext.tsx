"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@/constants/api";
import { apiClient, sessionStore, type SessionEnvelope, type SessionUser } from "@/lib";
import { getLoginRoute } from "@/utils";

export type AuthUser = SessionUser;

type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

type AuthResponseData = {
  user: AuthUser;
  tokens: AuthTokens;
  session: SessionEnvelope;
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
  /** Authoritative role for conditional rendering; null when signed out. */
  role: string | null;
  isAuthenticated: boolean;
  /** True until the cookie session has been read. Gate redirects on this. */
  isLoading: boolean;
  login: (payload: LoginPayload, remember?: boolean) => Promise<LoginResult>;
  trainerLogin: (payload: LoginPayload, remember?: boolean) => Promise<LoginResult>;
  adminLogin: (payload: LoginPayload, remember?: boolean) => Promise<AuthUser>;
  register: (payload: RegisterPayload, remember?: boolean) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// useLayoutEffect would warn during SSR; on the server there is nothing to lay out anyway.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  // Remembers the last committed role so a terminated session can be sent back to the right
  // sign-in page. Written in an effect rather than during render.
  const roleRef = useRef<string | null>(null);

  useEffect(() => {
    roleRef.current = user ? String(user.role) : null;
  }, [user]);

  /** Terminates the session and sends the user to the sign-in page for the role they held. */
  const endSession = useCallback(
    (options: { redirect?: boolean } = {}) => {
      const previousRole = roleRef.current;

      sessionStore.clear();
      setUser(null);
      setIsLoading(false);

      if (options.redirect) {
        router.replace(getLoginRoute(previousRole));
      }
    },
    [router]
  );

  // Read the cookie session before the first paint. Doing this synchronously is what keeps a
  // reload on /admin or /trainer from being treated as signed-out and bounced to the customer
  // home screen — the role is known on the very first render pass.
  useIsomorphicLayoutEffect(() => {
    const stored = sessionStore.read();

    if (stored) {
      setUser(stored.user);
    }

    setIsLoading(false);
  }, []);

  // Any edit to the session cookies terminates the session immediately.
  useEffect(() => {
    const stopWatching = sessionStore.startWatching();
    const unsubscribe = sessionStore.onTamper(() => {
      endSession({ redirect: true });
    });

    return () => {
      stopWatching();
      unsubscribe();
    };
  }, [endSession]);

  // Raised by api-client when a 401 could not be recovered.
  useEffect(() => {
    const handleUnauthorized = () => {
      endSession({ redirect: true });
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [endSession]);

  const storeAuthResult = useCallback((data: AuthResponseData, remember = false) => {
    sessionStore.resetTamperFlag();
    sessionStore.save({
      user: data.user,
      tokens: data.tokens,
      envelope: data.session,
      remember,
    });
    setUser(data.user);
    setIsLoading(false);
    return data.user;
  }, []);

  /**
   * Confirms the access token server-side and re-syncs the role.
   * This is the authoritative check; the cookie is only a fast local mirror of it.
   */
  const refreshUser = useCallback(async () => {
    // Callers only invoke this for an existing session; bail without touching state so the
    // caller's effect never triggers a synchronous re-render.
    if (!sessionStore.read()) return null;

    try {
      const response = await apiClient.get<{ user: AuthUser; role: string; session: SessionEnvelope }>(
        API_ENDPOINTS.auth.session
      );

      const nextUser = response.data?.user ?? null;
      const nextSession = response.data?.session;

      if (!nextUser || !nextSession) return null;

      // Keep the cookie in step with server truth, including a role changed by an admin.
      const current = sessionStore.read();
      sessionStore.save({
        user: nextUser,
        tokens: {
          accessToken: current?.accessToken ?? "",
          refreshToken: current?.refreshToken,
        },
        envelope: nextSession,
        remember: current?.remember ?? false,
      });

      setUser(nextUser);
      return nextUser;
    } catch {
      // A fatal session error already cleared state via the auth:unauthorized listener.
      // Transient network failures intentionally leave the cached session intact.
      return null;
    }
  }, []);

  // Revalidate against the server once the cookie session has been picked up. This is the
  // "subscribe to an external system" case: every state update happens after the await, in a
  // network callback, never synchronously during this effect.
  // Keyed on user.id so it runs per identity, not on every user object update.
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (isLoading || !user) return;
    void refreshUser();
  }, [isLoading, user?.id]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const login = useCallback(
    async (payload: LoginPayload, remember = false): Promise<LoginResult> => {
      const response = await apiClient.post<AuthResponseData>(API_ENDPOINTS.auth.login, payload);

      if (!response.data?.tokens?.accessToken || !response.data.user || !response.data.session) {
        throw new Error("Login succeeded, but the server response was incomplete.");
      }

      if (response.data.user.role !== "customer") {
        throw new Error(
          response.data.user.role === "trainer"
            ? "Trainer accounts have a dedicated sign-in page. Please visit /trainer/login"
            : "Admin accounts have a dedicated sign-in page. Please visit /admin/login"
        );
      }

      const loggedIn = storeAuthResult(response.data, remember);
      return { ...loggedIn, passwordIsWeak: response.data.passwordIsWeak ?? false };
    },
    [storeAuthResult]
  );

  const trainerLogin = useCallback(
    async (payload: LoginPayload, remember = false): Promise<LoginResult> => {
      const response = await apiClient.post<AuthResponseData>(API_ENDPOINTS.auth.login, payload);

      if (!response.data?.tokens?.accessToken || !response.data.user || !response.data.session) {
        throw new Error("Login succeeded, but the server response was incomplete.");
      }

      if (response.data.user.role !== "trainer") {
        throw new Error("These credentials belong to a customer account. Please use the regular sign-in page.");
      }

      const loggedIn = storeAuthResult(response.data, remember);
      return { ...loggedIn, passwordIsWeak: response.data.passwordIsWeak ?? false };
    },
    [storeAuthResult]
  );

  const adminLogin = useCallback(
    async (payload: LoginPayload, remember = false) => {
      const response = await apiClient.post<AuthResponseData>(API_ENDPOINTS.admin.login, payload);

      if (!response.data?.tokens?.accessToken || !response.data.user || !response.data.session) {
        throw new Error("Admin login succeeded, but the server response was incomplete.");
      }

      if (response.data.user.role !== "admin") {
        throw new Error("These credentials do not grant admin access.");
      }

      return storeAuthResult(response.data, remember);
    },
    [storeAuthResult]
  );

  const register = useCallback(
    async (payload: RegisterPayload, remember = false) => {
      const response = await apiClient.post<AuthResponseData>(API_ENDPOINTS.auth.signup, payload);

      if (!response.data?.tokens?.accessToken || !response.data.user || !response.data.session) {
        throw new Error("Account created, but the server response was incomplete.");
      }

      return storeAuthResult(response.data, remember);
    },
    [storeAuthResult]
  );

  const logout = useCallback(() => {
    endSession({ redirect: false });
    router.replace("/");
  }, [endSession, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user ? String(user.role) : null,
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
