import { ProtectedRoute } from "@/components/shared";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={["customer"]}>{children}</ProtectedRoute>;
}
