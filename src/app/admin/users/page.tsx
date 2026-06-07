import { RouteShell } from "@/components/shared";

export default function AdminUsersPage() {
  return (
    <RouteShell
      eyebrow="Admin"
      title="Users"
      description="Manage customer accounts, roles and profile activity."
      actionHref="/admin/dashboard"
      actionLabel="Back to Dashboard"
    >
      <div className="empty-state">
        <strong>User management</strong>
        <span>Admin users placeholder</span>
      </div>
    </RouteShell>
  );
}
