import { RouteShell } from "@/components/shared";

export default function WishlistPage() {
  return (
    <RouteShell
      eyebrow="Shopping"
      title="Wishlist"
      description="Save equipment, services and trainers you want to revisit later."
      actionHref="/shop"
      actionLabel="Continue Shopping"
    >
      <div className="empty-state">
        <strong>Your wishlist is empty.</strong>
        <span>Saved items will appear here.</span>
      </div>
    </RouteShell>
  );
}
