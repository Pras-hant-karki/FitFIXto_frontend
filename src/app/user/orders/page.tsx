import { RouteShell } from "@/components/shared";

export default function UserOrdersPage() {
  return (
    <RouteShell
      eyebrow="Account"
      title="Orders"
      description="Track equipment orders, service bookings and delivery updates."
      actionHref="/shop"
      actionLabel="Continue Shopping"
    >
      <div className="empty-state">
        <strong>No orders yet.</strong>
        <span>Your order history will appear here.</span>
      </div>
    </RouteShell>
  );
}
