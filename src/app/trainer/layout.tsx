import { ProtectedRoute } from "@/components/shared";

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={["trainer"]}>{children}</ProtectedRoute>;
}
