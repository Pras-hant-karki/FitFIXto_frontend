import { RouteShell } from "@/components/shared";

export default function CartPage() {
  return (
    <RouteShell
      eyebrow="Shopping"
      title="Cart"
      description="Review selected equipment and services before checkout."
      actionHref="/checkout"
      actionLabel="Continue to Checkout"
    >
      <div className="empty-state">
        <strong>Your cart is empty.</strong>
        <span>Add products from the shop to see them here.</span>
      </div>
    </RouteShell>
  );
}
