"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Clock3, ImagePlus, Layers3, Pencil, Plus, Trash2, X } from "lucide-react";
import { TrainerDashboardShell } from "@/components/shared/trainer";
import {
  BackendTrainerProgram,
  createTrainerProgram,
  deleteTrainerProgram,
  fetchMyTrainerPrograms,
  normalizeTrainerPhotoUrl,
  updateTrainerProgram,
  uploadTrainerProgramImage,
} from "@/features/trainers";

type ProgramLevel = "beginner" | "intermediate" | "advanced";
type ProgramForm = {
  title: string;
  programType: string;
  level: ProgramLevel;
  sessions: string;
  durationWeeks: string;
  price: string;
  description: string;
  image: string;
  isActive: boolean;
};

const emptyForm: ProgramForm = {
  title: "", programType: "1-on-1", level: "beginner", sessions: "", durationWeeks: "",
  price: "", description: "", image: "", isActive: true,
};

export default function TrainerProgramsPage() {
  const [programs, setPrograms] = useState<BackendTrainerProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<BackendTrainerProgram | null>(null);
  const [form, setForm] = useState<ProgramForm>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const loadPrograms = async () => {
    setIsLoading(true);
    setError("");
    try { setPrograms(await fetchMyTrainerPrograms()); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load programs."); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadPrograms(); }, []);

  const openCreate = () => {
    setEditingProgram(null); setForm(emptyForm); setImageFile(null); setFormError(""); setShowModal(true);
  };

  const openEdit = (program: BackendTrainerProgram) => {
    setEditingProgram(program);
    setForm({
      title: program.title,
      programType: program.programType || "1-on-1",
      level: program.level || "beginner",
      sessions: String(program.sessions),
      durationWeeks: String(program.durationWeeks),
      price: String(program.price),
      description: program.description || "",
      image: normalizeTrainerPhotoUrl(program.image),
      isActive: program.isActive,
    });
    setImageFile(null); setFormError(""); setShowModal(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setShowModal(false); setEditingProgram(null); setForm(emptyForm); setImageFile(null); setFormError("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(""); setIsSubmitting(true);
    try {
      const image = imageFile ? await uploadTrainerProgramImage(imageFile) : form.image || undefined;
      const payload = {
        title: form.title.trim(),
        programType: form.programType.trim(),
        level: form.level,
        sessions: Number(form.sessions),
        durationWeeks: Number(form.durationWeeks),
        price: Number(form.price),
        description: form.description.trim() || undefined,
        image,
        isActive: form.isActive,
      };
      if (editingProgram) {
        const updated = await updateTrainerProgram(editingProgram._id, payload);
        if (updated) setPrograms((current) => current.map((program) => program._id === updated._id ? updated : program));
        setMessage("Program updated successfully.");
      } else {
        const created = await createTrainerProgram(payload);
        if (created) setPrograms((current) => [created, ...current]);
        setMessage("Program created successfully.");
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to save program.");
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (program: BackendTrainerProgram) => {
    if (!window.confirm(`Delete "${program.title}"?`)) return;
    setDeletingId(program._id); setError("");
    try { await deleteTrainerProgram(program._id); setPrograms((current) => current.filter((item) => item._id !== program._id)); setMessage("Program deleted."); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to delete program."); }
    finally { setDeletingId(""); }
  };

  return (
    <TrainerDashboardShell>
      <div className="customer-orders-panel trainer-programs-page">
        <div className="trainer-programs-heading">
          <div><h2>Programs</h2><p>{programs.length} program{programs.length === 1 ? "" : "s"} available for clients to book.</p></div>
          <button type="button" className="customer-reorder-button" onClick={openCreate}><Plus />Create Program</button>
        </div>
        {message ? <p className="customer-review-message">{message}</p> : null}
        {error ? <p className="auth-message error">{error}</p> : null}

        {isLoading ? <div className="customer-orders-empty">Loading programs...</div> : programs.length === 0 ? (
          <div className="trainer-programs-empty"><Layers3 /><strong>No programs yet</strong><span>Create your first program so clients can discover and book it.</span><button type="button" className="customer-reorder-button" onClick={openCreate}><Plus />Create Program</button></div>
        ) : (
          <div className="trainer-program-large-grid">
            {programs.map((program) => (
              <article className="trainer-program-large-card" key={program._id}>
                <div className="trainer-program-large-image">
                  {program.image ? <img src={normalizeTrainerPhotoUrl(program.image)} alt="" /> : <ImagePlus aria-hidden="true" />}
                </div>
                <div className="trainer-program-large-body">
                  <div className="trainer-program-tags"><span>{program.programType || "1-on-1"}</span><span>{program.level || "beginner"}</span></div>
                  <h3>{program.title}</h3>
                  <p>{program.description || "No program description added yet."}</p>
                  <div className="trainer-program-large-stats"><span><Layers3 />{program.sessions} sessions</span><span><Clock3 />{program.durationWeeks} weeks</span></div>
                  <div className="trainer-program-large-footer">
                    <strong>Npr {program.price.toLocaleString()}</strong>
                    <div><button type="button" onClick={() => openEdit(program)}><Pencil />Edit</button><button type="button" aria-label={`Delete ${program.title}`} onClick={() => handleDelete(program)} disabled={deletingId === program._id}><Trash2 /></button></div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {showModal ? (
        <div className="trainer-modal-backdrop" role="presentation" onClick={closeModal}>
          <section className="trainer-modal trainer-program-modal" role="dialog" aria-modal="true" aria-label={editingProgram ? "Edit program" : "Create program"} onClick={(event) => event.stopPropagation()}>
            <div className="trainer-modal-header"><h2>{editingProgram ? "Edit Program" : "Create Program"}</h2><button type="button" className="trainer-modal-close" onClick={closeModal}><X /></button></div>
            <form className="trainer-modal-form" onSubmit={handleSubmit}>
              <label>Title *<input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required maxLength={100} /></label>
              <div className="trainer-modal-row">
                <label>Type<input value={form.programType} onChange={(event) => setForm((current) => ({ ...current, programType: event.target.value }))} required /></label>
                <label>Level<select value={form.level} onChange={(event) => setForm((current) => ({ ...current, level: event.target.value as ProgramLevel }))}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
              </div>
              <div className="trainer-modal-row">
                <label>Sessions<input type="number" min="1" value={form.sessions} onChange={(event) => setForm((current) => ({ ...current, sessions: event.target.value }))} required /></label>
                <label>Weeks<input type="number" min="1" value={form.durationWeeks} onChange={(event) => setForm((current) => ({ ...current, durationWeeks: event.target.value }))} required /></label>
              </div>
              <label>Price (Npr)<input type="number" min="0" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} required /></label>
              <label>Program image
                <button type="button" className="trainer-program-image-picker" onClick={() => imageInputRef.current?.click()}><ImagePlus />{imageFile?.name || (form.image ? "Replace current image" : "Choose image")}</button>
                <input ref={imageInputRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
              </label>
              <label>Description<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} maxLength={500} /></label>
              <label className="trainer-modal-checkbox"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} /><span>Visible on public profile</span></label>
              {formError ? <p className="auth-message error">{formError}</p> : null}
              <div className="trainer-modal-actions"><button type="button" className="trainer-modal-cancel-btn" onClick={closeModal}>Cancel</button><button type="submit" className="trainer-modal-submit-btn" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Program"}</button></div>
            </form>
          </section>
        </div>
      ) : null}
    </TrainerDashboardShell>
  );
}
