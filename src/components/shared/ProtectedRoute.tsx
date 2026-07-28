"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts";
import { getDashboardRoute } from "@/utils";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: string[];
  loginPath?: string;
};

/**
 * Gates a portal on an authenticated session with an allowed role.
 *
 * Redirects are deliberately withheld until `isLoading` is false. Auth is hydrated from the
 * session cookie before first paint, so this resolves within a single render — which is what
 * stops a hard refresh on /admin or /trainer from being read as "signed out" and bounced to
 * the customer dashboard. When a role genuinely does not belong here, it goes to its own
 * dashboard rather than a generic home page.
 */
export function ProtectedRoute({ children, allowedRoles, loginPath = "/login" }: ProtectedRouteProps) {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === loginPath;
  const isRoleAllowed = !allowedRoles?.length || (role != null && allowedRoles.includes(role));

  useEffect(() => {
    if (isLoginPage || isLoading) return;

    if (!isAuthenticated) {
      router.replace(`${loginPath}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isRoleAllowed) {
      router.replace(getDashboardRoute(role));
    }
  }, [isAuthenticated, isLoading, isLoginPage, isRoleAllowed, loginPath, pathname, role, router, user]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading || !isAuthenticated || !isRoleAllowed) {
    return null;
  }

  return <>{children}</>;
}
