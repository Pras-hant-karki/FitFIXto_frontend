import { RouteShell } from "@/components/shared";

export default function TrainersPage() {
  return (
    <RouteShell
      eyebrow="Coaching"
      title="Trainers"
      description="Find certified coaches for strength, fat loss, mobility and performance."
      actionHref="/login"
      actionLabel="Book a Trainer"
    >
      <div className="route-grid">
        {["Strength Coach", "Nutrition Coach", "Mobility Coach"].map((item) => (
          <article key={item}>
            <strong>{item}</strong>
            <span>Trainer card placeholder</span>
          </article>
        ))}
      </div>
    </RouteShell>
  );
}
