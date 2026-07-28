export type AppRole = "customer" | "trainer" | "admin";

export const ROLES: AppRole[] = ["customer", "trainer", "admin"];

export const isKnownRole = (role?: string | null): role is AppRole =>
  role === "customer" || role === "trainer" || role === "admin";

/** Landing page for a role after sign-in, and the target when a role hits a page it may not see. */
export function getDashboardRoute(role?: string | null): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "trainer") return "/trainer/dashboard";
  return "/user/dashboard";
}

/** The sign-in page that belongs to a role. */
export function getLoginRoute(role?: string | null): string {
  if (role === "admin") return "/admin/login";
  if (role === "trainer") return "/trainer/login";
  return "/login";
}

/**
 * Which portal a path belongs to. Drives both the redirect target for anonymous visitors
 * and which navigation chrome is rendered.
 */
export function getPortalForPath(pathname: string): AppRole {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/trainer" || pathname.startsWith("/trainer/")) return "trainer";
  return "customer";
}

/** True for the three sign-in pages, which render standalone without navigation chrome. */
export function isAuthRoute(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/admin/login" ||
    pathname === "/trainer/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email"
  );
}

/**
 * Customer-facing storefront routes a trainer is also allowed to browse.
 * Admins stay inside the admin console.
 */
export function canRoleAccessPath(role: string | null | undefined, pathname: string): boolean {
  const portal = getPortalForPath(pathname);

  if (portal === "admin") return role === "admin";
  if (portal === "trainer") return role === "trainer";
  if (pathname.startsWith("/user/")) return role === "customer";

  return true;
}
