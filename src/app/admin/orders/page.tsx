import { RouteShell } from "@/components/shared";

export default function AdminOrdersPage() {
  return (
    <RouteShell
      eyebrow="Admin"
      title="Orders"
      description="Review orders, update statuses and manage fulfillment."
      actionHref="/admin/dashboard"
      actionLabel="Back to Dashboard"
    >
      <div className="empty-state">
        <strong>Order management</strong>
        <span>Admin orders placeholder</span>
      </div>
    </RouteShell>
  );
}
