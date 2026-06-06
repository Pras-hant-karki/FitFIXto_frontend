import { RouteShell } from "@/components/shared";

export default function ProductsPage() {
  return (
    <RouteShell
      eyebrow="Shop"
      title="Products"
      description="Browse gym equipment, supplements, cardio machines and strength essentials."
      actionHref="/cart"
      actionLabel="View Cart"
    >
      <div className="route-grid">
        {["Dumbbells", "Racks", "Cardio", "Supplements"].map((item) => (
          <article key={item}>
            <strong>{item}</strong>
            <span>Product list placeholder</span>
          </article>
        ))}
      </div>
    </RouteShell>
  );
}
