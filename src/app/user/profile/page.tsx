import { RouteShell } from "@/components/shared";

export default function UserProfilePage() {
  return (
    <RouteShell
      eyebrow="Account"
      title="Profile"
      description="Manage your personal details, saved addresses and account preferences."
      actionHref="/user/orders"
      actionLabel="View Orders"
    >
      <div className="empty-state">
        <strong>Profile details</strong>
        <span>User profile placeholder</span>
      </div>
    </RouteShell>
  );
}
