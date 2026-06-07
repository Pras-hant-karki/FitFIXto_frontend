import { RouteShell } from "@/components/shared";

export default function AdminProductsPage() {
  return (
    <RouteShell
      eyebrow="Admin"
      title="Products"
      description="Create, update and organize equipment, supplements and accessories."
      actionHref="/admin/dashboard"
      actionLabel="Back to Dashboard"
    >
      <div className="empty-state">
        <strong>Product management</strong>
        <span>Admin products placeholder</span>
      </div>
    </RouteShell>
  );
}
