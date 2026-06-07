import { RouteShell } from "@/components/shared";

export default function UserDashboardPage() {
  return (
    <RouteShell
      eyebrow="Account"
      title="User Dashboard"
      description="View your orders, saved items, trainer bookings and account activity."
      actionHref="/user/orders"
      actionLabel="View Orders"
    >
      <div className="route-grid">
        {["Recent Orders", "Saved Items", "Trainer Bookings"].map((item) => (
          <article key={item}>
            <strong>{item}</strong>
            <span>Dashboard placeholder</span>
          </article>
        ))}
      </div>
    </RouteShell>
  );
}
