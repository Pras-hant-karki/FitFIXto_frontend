"use client";

import { usePathname } from "next/navigation";
import { AdminShell } from "@/components/admin";
import { ProtectedRoute } from "@/components/shared";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]} loginPath="/admin/login">
      <AdminShell>{children}</AdminShell>
    </ProtectedRoute>
  );
}
