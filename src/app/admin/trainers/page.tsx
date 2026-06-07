import { RouteShell } from "@/components/shared";

export default function AdminTrainersPage() {
  return (
    <RouteShell
      eyebrow="Admin"
      title="Trainers"
      description="Approve trainers, manage profiles and review booking availability."
      actionHref="/admin/dashboard"
      actionLabel="Back to Dashboard"
    >
      <div className="empty-state">
        <strong>Trainer management</strong>
        <span>Admin trainers placeholder</span>
      </div>
    </RouteShell>
  );
}
