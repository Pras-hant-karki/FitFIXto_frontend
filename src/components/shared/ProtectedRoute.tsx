"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts";
import { getDashboardRoute } from "@/utils";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: string[];
  loginPath?: string;
};

export function ProtectedRoute({ children, allowedRoles, loginPath = "/login" }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === loginPath;

  // Safety valve: if auth hydration takes more than 10 seconds, treat it as
  // unauthenticated so the page never freezes on a blank screen indefinitely.
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }
    const t = setTimeout(() => setTimedOut(true), 10_000);
    return () => clearTimeout(t);
  }, [isLoading]);

  const effectiveLoading = isLoading && !timedOut;

  useEffect(() => {
    if (isLoginPage) return;
    if (effectiveLoading) return;

    if (!isAuthenticated) {
      router.replace(`${loginPath}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (allowedRoles?.length && user && !allowedRoles.includes(user.role)) {
      router.replace(getDashboardRoute(user.role));
    }
  }, [allowedRoles, isAuthenticated, effectiveLoading, isLoginPage, loginPath, pathname, router, user]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (effectiveLoading || !isAuthenticated) {
    return null;
  }

  if (allowedRoles?.length && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
