"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Plus, Star, Trash2, X } from "lucide-react";
import {
  BackendTrainer,
  TrainerPayload,
  createTrainer,
  deleteTrainer,
  fetchAdminTrainers,
  updateTrainer,
  uploadTrainerPhoto,
} from "@/features/trainers";

type TrainerFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  location: string;
  sessionRate: string;
  experienceYears: string;
  specialties: string;
  certifications: string;
  bio: string;
  profilePicture: string;
  isFeatured: boolean;
};

const emptyForm: TrainerFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  location: "",
  sessionRate: "",
  experienceYears: "",
  specialties: "",
  certifications: "",
  bio: "",
  profilePicture: "",
  isFeatured: false,
};

const toList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toFormState = (trainer: BackendTrainer): TrainerFormState => ({
  firstName: trainer.userId.firstName,
  lastName: trainer.userId.lastName,
  email: trainer.userId.email,
  phone: trainer.userId.phone,
  password: "",
  location: trainer.location || "",
  sessionRate: String(trainer.sessionRate),
  experienceYears: String(trainer.experienceYears),
  specialties: trainer.specialties.join(", "),
  certifications: trainer.certifications.join(", "),
  bio: trainer.userId.bio || "",
  profilePicture: trainer.userId.profilePicture || "",
  isFeatured: trainer.isFeatured,
});

const toPayload = (form: TrainerFormState, isEditing: boolean): TrainerPayload & { password?: string } => ({
  firstName: form.firstName.trim(),
  lastName: form.lastName.trim(),
  email: form.email.trim(),
  phone: form.phone.trim(),
  ...(form.password || !isEditing ? { password: form.password } : {}),
  location: form.location.trim() || undefined,
  sessionRate: Number(form.sessionRate || 0),
  experienceYears: Number(form.experienceYears || 0),
  specialties: toList(form.specialties),
  certifications: toList(form.certifications),
  bio: form.bio.trim() || undefined,
  profilePicture: form.profilePicture.trim() || undefined,
  isFeatured: form.isFeatured,
});

export default function AdminTrainersPage() {
  const [trainers, setTrainers] = useState<BackendTrainer[]>([]);
  const [form, setForm] = useState<TrainerFormState>(emptyForm);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [editingTrainer, setEditingTrainer] = useState<BackendTrainer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const trainerPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const selectedPhotoLabel = selectedPhotoFile?.name || "No file chosen";

  const loadTrainers = async () => {
    setIsLoading(true);
    setError("");

    try {
      setTrainers(await fetchAdminTrainers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load trainers.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrainers();
  }, []);

  const openCreateForm = () => {
    setEditingTrainer(null);
    setForm(emptyForm);
    setSelectedPhotoFile(null);
    setIsFormOpen(true);
    setMessage("");
    setError("");
  };

  const openEditForm = (trainer: BackendTrainer) => {
    setEditingTrainer(trainer);
    setForm(toFormState(trainer));
    setSelectedPhotoFile(null);
    setIsFormOpen(true);
    setMessage("");
    setError("");
  };

  const closeForm = () => {
    setEditingTrainer(null);
    setForm(emptyForm);
    setSelectedPhotoFile(null);
    if (trainerPhotoInputRef.current) {
      trainerPhotoInputRef.current.value = "";
    }
    setIsFormOpen(false);
  };

  const handleTrainerPhotoUpload = async () => {
    if (!selectedPhotoFile) {
      setError("Please choose a trainer photo before uploading.");
      return;
    }

    setIsUploading(true);
    setError("");
    setMessage("");

    try {
      const photoUrl = await uploadTrainerPhoto(selectedPhotoFile);
      setForm((current) => ({ ...current, profilePicture: photoUrl }));
      setSelectedPhotoFile(null);
      if (trainerPhotoInputRef.current) {
        trainerPhotoInputRef.current.value = "";
      }
      setMessage("Trainer photo uploaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload trainer photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = toPayload(form, Boolean(editingTrainer));

      if (editingTrainer) {
        await updateTrainer(editingTrainer._id, payload);
        setMessage("Trainer updated successfully.");
      } else {
        await createTrainer(payload as TrainerPayload & { password: string });
        setMessage("Trainer created successfully.");
      }

      closeForm();
      await loadTrainers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save trainer.");
    } finally {
      setIsSaving(false);
    }
  };

  const patchTrainer = async (trainer: BackendTrainer, payload: Partial<TrainerPayload>) => {
    setError("");
    setMessage("");

    try {
      const updated = await updateTrainer(trainer._id, payload);
      if (updated) {
        setTrainers((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      }
      setMessage("Trainer updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update trainer.");
    }
  };

  const handleDelete = async (trainer: BackendTrainer) => {
    if (!window.confirm(`Delete ${trainer.userId.firstName} ${trainer.userId.lastName}?`)) return;

    setError("");
    setMessage("");

    try {
      await deleteTrainer(trainer._id);
      setTrainers((current) => current.filter((item) => item._id !== trainer._id));
      setMessage("Trainer deleted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete trainer.");
    }
  };

  return (
    <section className="admin-trainers-page">
      <header className="admin-trainers-header">
        <div>
          <h1>Trainers</h1>
          <p>{trainers.length} Trainers created</p>
        </div>
        <button type="button" className="admin-create-button" onClick={openCreateForm}>
          <Plus aria-hidden="true" />
          Add Trainer
        </button>
      </header>

      {message ? <p className="admin-products-message success">{message}</p> : null}
      {error ? <p className="admin-products-message error">{error}</p> : null}

      {isFormOpen ? (
        <div className="admin-trainer-form-panel">
          <div className="admin-card-header">
            <h2>{editingTrainer ? "Edit Trainer" : "Add Trainer"}</h2>
            <button type="button" className="admin-form-close" onClick={closeForm} aria-label="Close trainer form">
              <X aria-hidden="true" />
            </button>
          </div>
          <form className="admin-trainer-form" onSubmit={handleSubmit}>
            <label>
              First name
              <input required value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
            </label>
            <label>
              Last name
              <input required value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
            </label>
            <label>
              Email
              <input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label>
              Phone
              <input required value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <label>
              Password
              <input
                required={!editingTrainer}
                minLength={6}
                type="password"
                placeholder={editingTrainer ? "Leave blank to keep current" : ""}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
            <label>
              Location
              <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
            </label>
            <label>
              Session rate
              <input required min="0" type="number" value={form.sessionRate} onChange={(event) => setForm((current) => ({ ...current, sessionRate: event.target.value }))} />
            </label>
            <label>
              Experience years
              <input required min="0" type="number" value={form.experienceYears} onChange={(event) => setForm((current) => ({ ...current, experienceYears: event.target.value }))} />
            </label>
            <div className="admin-trainer-photo-row">
              <div className="admin-upload-field">
                <span>Upload trainer photo</span>
                <button
                  type="button"
                  className="admin-upload-drop"
                  onClick={() => trainerPhotoInputRef.current?.click()}
                  aria-label="Choose trainer photo"
                >
                  <Plus aria-hidden="true" />
                </button>
                <input
                  ref={trainerPhotoInputRef}
                  className="admin-hidden-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  disabled={isUploading}
                  onChange={(event) => setSelectedPhotoFile(event.target.files?.[0] || null)}
                />
                <small>
                  Choose files <span>{selectedPhotoLabel}</span>
                </small>
                <button
                  type="button"
                  className="admin-upload-picture-button"
                  disabled={isUploading}
                  onClick={handleTrainerPhotoUpload}
                >
                  {isUploading ? "Uploading..." : "Upload Picture"}
                </button>
              </div>
              {form.profilePicture ? (
                <div className="admin-trainer-photo-preview">
                  <img src={form.profilePicture} alt="" />
                  <span>Current trainer photo</span>
                </div>
              ) : null}
            </div>
            <label className="admin-trainer-form-wide">
              Specialties
              <input placeholder="Strength, Powerlifting, Hypertrophy" value={form.specialties} onChange={(event) => setForm((current) => ({ ...current, specialties: event.target.value }))} />
            </label>
            <label className="admin-trainer-form-wide">
              Certifications
              <input placeholder="NSCA CSCS, NASM CPT" value={form.certifications} onChange={(event) => setForm((current) => ({ ...current, certifications: event.target.value }))} />
            </label>
            <label className="admin-trainer-form-wide">
              Bio
              <textarea value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} />
            </label>
            <label className="admin-feature-check">
              <input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))} />
              Feature trainer
            </label>
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : editingTrainer ? "Update Trainer" : "Create Trainer"}
            </button>
          </form>
        </div>
      ) : null}

      {isLoading ? (
        <div className="admin-products-empty">Loading trainers...</div>
      ) : trainers.length === 0 ? (
        <div className="admin-products-empty">No trainers found.</div>
      ) : (
        <div className="admin-trainer-grid">
          {trainers.map((trainer) => {
            const fullName = `${trainer.userId.firstName} ${trainer.userId.lastName}`;
            const initials = `${trainer.userId.firstName[0] ?? ""}${trainer.userId.lastName[0] ?? ""}`;

            return (
              <article className={`admin-trainer-card ${trainer.isSuspended ? "suspended" : ""}`} key={trainer._id}>
                <div className="admin-trainer-card-main">
                  {trainer.userId.profilePicture ? (
                    <img src={trainer.userId.profilePicture} alt="" />
                  ) : (
                    <span className="admin-trainer-avatar">{initials}</span>
                  )}
                  <div>
                    <h2>{fullName}</h2>
                    <p>{trainer.userId.email}</p>
                    <span>
                      {trainer.location || "Location not set"} · {trainer.experienceYears}y exp · Npr {trainer.sessionRate}/session
                    </span>
                    <div className="admin-trainer-tags">
                      {trainer.specialties.slice(0, 4).map((item) => (
                        <strong key={item}>{item}</strong>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`admin-trainer-star ${trainer.isFeatured ? "active" : ""}`}
                    onClick={() => patchTrainer(trainer, { isFeatured: !trainer.isFeatured })}
                    aria-label={trainer.isFeatured ? "Unfeature trainer" : "Feature trainer"}
                  >
                    <Star aria-hidden="true" />
                  </button>
                </div>
                <p className="admin-trainer-bio">{trainer.userId.bio || "No trainer bio added yet."}</p>
                <div className="admin-trainer-certs">
                  {trainer.certifications.length ? trainer.certifications.join(" · ") : "No certifications listed"}
                </div>
                <div className="admin-trainer-actions">
                  <button type="button" onClick={() => openEditForm(trainer)}>
                    Edit Trainer
                  </button>
                  <button type="button" onClick={() => patchTrainer(trainer, { isSuspended: !trainer.isSuspended })}>
                    <X aria-hidden="true" />
                    {trainer.isSuspended ? "Resume" : "Suspend"}
                  </button>
                  <button type="button" className="danger" onClick={() => handleDelete(trainer)}>
                    <Trash2 aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
