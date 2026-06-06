import { RouteShell } from "@/components/shared";

export default function ProfilePage() {
  return (
    <RouteShell
      eyebrow="Account"
      title="Profile"
      description="Manage your personal details, saved addresses and account preferences."
      actionHref="/orders"
      actionLabel="View Orders"
    >
      <div className="empty-state">
        <strong>Profile details</strong>
        <span>User profile placeholder</span>
      </div>
    </RouteShell>
  );
}
