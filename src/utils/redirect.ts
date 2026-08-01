import { canRoleAccessPath, getDashboardRoute } from "./index";

/**
 * Resolves where to send a user after a successful sign-in.
 *
 * A `?redirect=` value is only honoured when it is a same-origin path the signed-in role is
 * actually allowed to open. Anything else — an absolute URL, a protocol-relative URL, or
 * another portal's page — falls back to that role's own dashboard, so nobody lands on a
 * screen their role cannot render.
 */
export function resolvePostLoginRedirect(role: string | null | undefined): string {
  const fallback = getDashboardRoute(role);

  if (typeof window === "undefined") return fallback;

  const requested = new URLSearchParams(window.location.search).get("redirect");

  if (!requested) return fallback;
  // Reject absolute and protocol-relative URLs.
  if (!requested.startsWith("/") || requested.startsWith("//")) return fallback;
  if (!canRoleAccessPath(role, requested)) return fallback;

  return requested;
}
