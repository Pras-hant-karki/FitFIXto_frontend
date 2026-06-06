import { RouteShell } from "@/components/shared";

export default function OrdersPage() {
  return (
    <RouteShell
      eyebrow="Account"
      title="Orders"
      description="Track equipment orders, service bookings and delivery updates."
      actionHref="/products"
      actionLabel="Continue Shopping"
    >
      <div className="empty-state">
        <strong>No orders yet.</strong>
        <span>Your order history will appear here.</span>
      </div>
    </RouteShell>
  );
}
