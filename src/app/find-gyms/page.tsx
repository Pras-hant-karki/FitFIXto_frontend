import { RouteShell } from "@/components/shared";

export default function FindGymsPage() {
  return (
    <RouteShell
      eyebrow="Gyms"
      title="Find Gyms"
      description="Discover nearby training spaces, partner gyms and equipment-ready facilities."
      actionHref="/services"
      actionLabel="Explore Services"
    >
      <div className="empty-state">
        <strong>Gym finder</strong>
        <span>Gym listings placeholder</span>
      </div>
    </RouteShell>
  );
}
