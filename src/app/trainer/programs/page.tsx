"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Dumbbell } from "lucide-react";
import { TrainerDashboardShell } from "@/components/shared/trainer";
import { API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";

interface TrainerProgram {
  _id: string;
  title: string;
  description?: string;
  durationWeeks: number;
  sessions: number;
  price: number;
  isActive: boolean;
  createdAt: string;
}

type ProgramForm = {
  title: string;
  description: string;
  durationWeeks: string;
  sessions: string;
  price: string;
  isActive: boolean;
};

const emptyForm: ProgramForm = {
  title: "",
  description: "",
  durationWeeks: "",
  sessions: "",
  price: "",
  isActive: true,
};

export default function TrainerProgramsPage() {
  const [programs, setPrograms] = useState<TrainerProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<TrainerProgram | null>(null);
  const [form, setForm] = useState<ProgramForm>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const loadPrograms = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await apiClient.get<{ programs: TrainerProgram[] }>(API_ENDPOINTS.trainers.myPrograms);
      setPrograms(res.data?.programs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load programs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadPrograms(); }, []);

  const openCreate = () => {
    setEditingProgram(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (program: TrainerProgram) => {
    setEditingProgram(program);
    setForm({
      title: program.title,
      description: program.description || "",
      durationWeeks: String(program.durationWeeks),
      sessions: String(program.sessions),
      price: String(program.price),
      isActive: program.isActive,
    });
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setShowModal(false);
    setEditingProgram(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      durationWeeks: Number(form.durationWeeks),
      sessions: Number(form.sessions),
      price: Number(form.price),
      isActive: form.isActive,
    };

    if (!payload.title) { setFormError("Program title is required."); return; }
    if (payload.durationWeeks < 1) { setFormError("Duration must be at least 1 week."); return; }
    if (payload.sessions < 1) { setFormError("Sessions must be at least 1."); return; }
    if (payload.price < 0) { setFormError("Price cannot be negative."); return; }

    setIsSubmitting(true);
    try {
      if (editingProgram) {
        const res = await apiClient.put<{ program: TrainerProgram }>(
          API_ENDPOINTS.trainers.programDetail(editingProgram._id),
          payload
        );
        if (res.data?.program) {
          setPrograms((cur) => cur.map((p) => (p._id === editingProgram._id ? res.data!.program : p)));
        }
        setMessage("Program updated successfully.");
      } else {
        const res = await apiClient.post<{ program: TrainerProgram }>(
          API_ENDPOINTS.trainers.programs,
          payload
        );
        if (res.data?.program) {
          setPrograms((cur) => [res.data!.program, ...cur]);
        }
        setMessage("Program created successfully.");
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to save program.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (program: TrainerProgram) => {
    if (!window.confirm(`Delete "${program.title}"?`)) return;
    setDeletingId(program._id);
    setError(""); setMessage("");
    try {
      await apiClient.delete(API_ENDPOINTS.trainers.programDetail(program._id));
      setPrograms((cur) => cur.filter((p) => p._id !== program._id));
      setMessage("Program deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete program.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <TrainerDashboardShell>
      <div className="customer-orders-panel">
        <div className="customer-orders-heading">
          <h2>Programs</h2>
          <button type="button" className="customer-reorder-button" onClick={openCreate}>
            <Plus aria-hidden="true" />
            New Program
          </button>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0, marginBottom: 20 }}>
          Create and manage your training programs. Clients can enroll directly from your profile.
        </p>

        {message ? <p className="customer-review-message" style={{ marginBottom: 14 }}>{message}</p> : null}
        {error ? <p className="auth-message error" style={{ marginBottom: 14 }}>{error}</p> : null}

        {isLoading ? (
          <div className="customer-orders-empty">Loading programs...</div>
        ) : programs.length === 0 ? (
          <div className="trainer-programs-empty">
            <Dumbbell aria-hidden="true" />
            <strong>No programs yet</strong>
            <span>Create your first training program so clients can discover and book it.</span>
            <button type="button" className="customer-reorder-button" onClick={openCreate}>
              <Plus aria-hidden="true" />
              Create Program
            </button>
          </div>
        ) : (
          <div className="trainer-program-list-page">
            {programs.map((program) => (
              <article className="trainer-program-list-card" key={program._id}>
                <div className="trainer-program-list-info">
                  <div className="trainer-program-list-meta">
                    <strong>{program.title}</strong>
                    <span className={`trainer-program-badge ${program.isActive ? "active" : "inactive"}`}>
                      {program.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {program.description ? (
                    <p>{program.description}</p>
                  ) : null}
                  <div className="trainer-program-list-stats">
                    <span>{program.durationWeeks} week{program.durationWeeks === 1 ? "" : "s"}</span>
                    <span>·</span>
                    <span>{program.sessions} session{program.sessions === 1 ? "" : "s"}</span>
                    <span>·</span>
                    <strong>Npr {program.price.toLocaleString()}</strong>
                  </div>
                </div>
                <div className="trainer-program-list-actions">
                  <button
                    type="button"
                    className="trainer-program-edit-btn"
                    onClick={() => openEdit(program)}
                    aria-label={`Edit ${program.title}`}
                  >
                    <Pencil aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="trainer-program-delete-btn"
                    onClick={() => handleDelete(program)}
                    disabled={deletingId === program._id}
                    aria-label={`Delete ${program.title}`}
                  >
                    <Trash2 aria-hidden="true" />
                    {deletingId === program._id ? "..." : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal ? (
        <div className="trainer-modal-backdrop" role="presentation" onClick={closeModal}>
          <section
            className="trainer-modal"
            role="dialog"
            aria-modal="true"
            aria-label={editingProgram ? "Edit program" : "Create program"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="trainer-modal-header">
              <h2>{editingProgram ? "Edit Program" : "New Program"}</h2>
              <button type="button" className="trainer-modal-close" onClick={closeModal} aria-label="Close modal">
                <X aria-hidden="true" />
              </button>
            </div>

            <form className="trainer-modal-form" onSubmit={handleSubmit}>
              <label>
                Title *
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
                  required
                  disabled={isSubmitting}
                  placeholder="e.g. 12-Week Strength Builder"
                  maxLength={100}
                />
              </label>

              <label>
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                  disabled={isSubmitting}
                  placeholder="What's included? Who is it for?"
                  maxLength={500}
                />
              </label>

              <div className="trainer-modal-row">
                <label>
                  Duration (weeks) *
                  <input
                    type="number"
                    value={form.durationWeeks}
                    onChange={(e) => setForm((c) => ({ ...c, durationWeeks: e.target.value }))}
                    required
                    min={1}
                    disabled={isSubmitting}
                    placeholder="e.g. 8"
                  />
                </label>
                <label>
                  Total sessions *
                  <input
                    type="number"
                    value={form.sessions}
                    onChange={(e) => setForm((c) => ({ ...c, sessions: e.target.value }))}
                    required
                    min={1}
                    disabled={isSubmitting}
                    placeholder="e.g. 16"
                  />
                </label>
              </div>

              <label>
                Price (Npr) *
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((c) => ({ ...c, price: e.target.value }))}
                  required
                  min={0}
                  disabled={isSubmitting}
                  placeholder="e.g. 15000"
                />
              </label>

              <label className="trainer-modal-checkbox">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((c) => ({ ...c, isActive: e.target.checked }))}
                  disabled={isSubmitting}
                />
                <span>Visible on public profile (active)</span>
              </label>

              {formError ? <p className="auth-message error">{formError}</p> : null}

              <div className="trainer-modal-actions">
                <button type="button" className="trainer-modal-cancel-btn" onClick={closeModal} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="trainer-modal-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingProgram ? "Save Changes" : "Create Program"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </TrainerDashboardShell>
  );
}
