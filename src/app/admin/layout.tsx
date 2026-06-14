import { ProtectedRoute } from "@/components/shared";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["admin"]} loginPath="/admin/login">
      {children}
    </ProtectedRoute>
  );
}
