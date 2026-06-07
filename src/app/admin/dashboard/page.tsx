import { RouteShell } from "@/components/shared";

export default function AdminDashboardPage() {
  return (
    <RouteShell
      eyebrow="Admin"
      title="Dashboard"
      description="Monitor store activity, orders, products, users and trainer operations."
      actionHref="/admin/orders"
      actionLabel="Review Orders"
    >
      <div className="route-grid">
        {["Products", "Orders", "Users", "Trainers"].map((item) => (
          <article key={item}>
            <strong>{item}</strong>
            <span>Admin metric placeholder</span>
          </article>
        ))}
      </div>
    </RouteShell>
  );
}
