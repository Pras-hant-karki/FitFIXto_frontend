export function getDashboardRoute(role?: string | null): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "trainer") return "/trainer/dashboard";
  return "/user/dashboard";
}
