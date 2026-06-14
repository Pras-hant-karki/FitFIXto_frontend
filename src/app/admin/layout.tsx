import { ProtectedRoute } from "@/components/shared";
import { AdminShell } from "@/components/admin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["admin"]} loginPath="/admin/login">
      <AdminShell>{children}</AdminShell>
    </ProtectedRoute>
  );
}
