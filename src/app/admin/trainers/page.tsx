"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, Eye, EyeOff, Plus, Star, Trash2, X } from "lucide-react";
import { useToast } from "@/contexts";
import {
  approveTrainerApplication,
  BackendTrainerApplication,
  BackendTrainer,
  TrainerPayload,
  createTrainer,
  deleteTrainer,
  fetchAdminTrainers,
  fetchTrainerApplications,
  normalizeTrainerPhotoUrl,
  rejectTrainerApplication,
  updateTrainer,
  uploadTrainerPhoto,
} from "@/features/trainers";

type TrainerTab = "created" | "applications" | "approved" | "rejected";

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
  applicationId?: string;
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
  applicationId: undefined,
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
  profilePicture: normalizeTrainerPhotoUrl(trainer.userId.profilePicture),
  isFeatured: trainer.isFeatured,
  applicationId: undefined,
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
  applicationId: form.applicationId,
});

const generateTrainerPassword = () => {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `Fit${randomPart}#${Math.floor(100 + Math.random() * 900)}`;
};

const applicationToFormState = (application: BackendTrainerApplication): TrainerFormState => ({
  firstName: application.firstName,
  lastName: application.lastName,
  email: application.email,
  phone: application.phone || "",
  password: generateTrainerPassword(),
  location: application.location || "",
  sessionRate: String(application.sessionRate || 0),
  experienceYears: String(application.experienceYears || 0),
  specialties: application.specialties.join(", "),
  certifications: application.certifications.join(", "),
  bio: application.bio || "",
  profilePicture: normalizeTrainerPhotoUrl(application.profilePicture),
  isFeatured: false,
  applicationId: application._id,
});

export default function AdminTrainersPage() {
  const [trainers, setTrainers] = useState<BackendTrainer[]>([]);
  const [applications, setApplications] = useState<BackendTrainerApplication[]>([]);
  const [activeTab, setActiveTab] = useState<TrainerTab>("created");
  const [form, setForm] = useState<TrainerFormState>(emptyForm);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [editingTrainer, setEditingTrainer] = useState<BackendTrainer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showTrainerPassword, setShowTrainerPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const trainerPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const selectedPhotoLabel = selectedPhotoFile?.name || "No file chosen";
  const pendingApplications = applications.filter((application) => application.status === "pending");
  const approvedApplications = applications.filter((application) => application.status === "approved");
  const rejectedApplications = applications.filter((application) => application.status === "rejected");
  const featuredCount = trainers.filter((trainer) => trainer.isFeatured).length;

  const loadTrainers = async () => {
    setIsLoading(true);

    try {
      setTrainers(await fetchAdminTrainers());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to load trainers.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      setApplications(await fetchTrainerApplications());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to load trainer applications.");
    }
  };

  useEffect(() => {
    loadTrainers();
    loadApplications();
  }, []);

  const openCreateForm = () => {
    setEditingTrainer(null);
    setForm(emptyForm);
    setSelectedPhotoFile(null);
    setShowTrainerPassword(false);
    setIsFormOpen(true);
  };

  const openCreateFormFromApplication = (application: BackendTrainerApplication) => {
    setEditingTrainer(null);
    setForm(applicationToFormState(application));
    setSelectedPhotoFile(null);
    setShowTrainerPassword(false);
    setIsFormOpen(true);
    setActiveTab("created");
    toast.info("Trainer form filled from approved application. The password will be emailed after account creation.");
  };

  const openEditForm = (trainer: BackendTrainer) => {
    setEditingTrainer(trainer);
    setForm(toFormState(trainer));
    setSelectedPhotoFile(null);
    setShowTrainerPassword(false);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingTrainer(null);
    setForm(emptyForm);
    setSelectedPhotoFile(null);
    setShowTrainerPassword(false);
    if (trainerPhotoInputRef.current) {
      trainerPhotoInputRef.current.value = "";
    }
    setIsFormOpen(false);
  };

  const handleTrainerPhotoUpload = async () => {
    if (!selectedPhotoFile) {
      toast.error("Please choose a trainer photo before uploading.");
      return;
    }

    setIsUploading(true);

    try {
      const photoUrl = await uploadTrainerPhoto(selectedPhotoFile);
      setForm((current) => ({ ...current, profilePicture: photoUrl }));
      setSelectedPhotoFile(null);
      if (trainerPhotoInputRef.current) {
        trainerPhotoInputRef.current.value = "";
      }
      toast.success("Trainer photo uploaded successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to upload trainer photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const payload = toPayload(form, Boolean(editingTrainer));

      if (editingTrainer) {
        await updateTrainer(editingTrainer._id, payload);
        toast.success("Trainer updated successfully.");
      } else {
        await createTrainer(payload as TrainerPayload & { password: string });
        toast.success("Trainer created successfully.");
      }

      closeForm();
      await loadTrainers();
      await loadApplications();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save trainer.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplicationStatus = async (application: BackendTrainerApplication, status: "approved" | "rejected") => {
    try {
      const updated =
        status === "approved"
          ? await approveTrainerApplication(application._id)
          : await rejectTrainerApplication(application._id);

      if (updated) {
        setApplications((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      }

      toast.success(status === "approved" ? "Trainer application approved." : "Trainer application rejected.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update trainer application.");
    }
  };

  const patchTrainer = async (trainer: BackendTrainer, payload: Partial<TrainerPayload>) => {
    try {
      const updated = await updateTrainer(trainer._id, payload);
      if (updated) {
        setTrainers((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      }
      toast.success("Trainer updated successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update trainer.");
    }
  };

  const handleDelete = async (trainer: BackendTrainer) => {
    if (!window.confirm(`Delete ${trainer.userId.firstName} ${trainer.userId.lastName}?`)) return;

    try {
      await deleteTrainer(trainer._id);
      setTrainers((current) => current.filter((item) => item._id !== trainer._id));
      toast.success("Trainer deleted successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete trainer.");
    }
  };

  const renderApplicationCard = (application: BackendTrainerApplication) => {
    const fullName = `${application.firstName} ${application.lastName}`;
    const initials = `${application.firstName[0] ?? ""}${application.lastName[0] ?? ""}`;
    const canCreateTrainer = application.status === "approved" && !application.createdTrainerId;

    return (
      <article className="admin-trainer-card admin-trainer-application-card" key={application._id}>
        <div className="admin-trainer-card-main">
          {normalizeTrainerPhotoUrl(application.profilePicture) ? (
            <img src={normalizeTrainerPhotoUrl(application.profilePicture)} alt="" />
          ) : (
            <span className="admin-trainer-avatar">{initials}</span>
          )}
          <div>
            <h2>{fullName}</h2>
            <p>{application.email}</p>
            <span>
              {application.location || "Location not set"} · {application.experienceYears}y exp · Npr {application.sessionRate}/session
            </span>
            <div className="admin-trainer-tags">
              {application.specialties.slice(0, 4).map((item) => (
                <strong key={item}>{item}</strong>
              ))}
            </div>
          </div>
        </div>
        <p className="admin-trainer-bio">{application.bio || "No application bio added."}</p>
        <div className="admin-trainer-certs">
          {application.certifications.length ? application.certifications.join(" · ") : "No certifications listed"}
        </div>
        {application.certificationFiles?.length ? (
          <div className="admin-trainer-application-files">
            <strong>Certification files</strong>
            {application.certificationFiles.map((file, index) => (
              <a href={normalizeTrainerPhotoUrl(file)} target="_blank" rel="noreferrer" key={file}>
                View certificate {index + 1}
              </a>
            ))}
          </div>
        ) : null}
        <div className="admin-trainer-actions application-actions">
          {application.status === "pending" ? (
            <>
              <button type="button" className="approve" onClick={() => handleApplicationStatus(application, "approved")}>
                <Check aria-hidden="true" />
                Approve
              </button>
              <button type="button" onClick={() => handleApplicationStatus(application, "rejected")}>
                <X aria-hidden="true" />
                Reject
              </button>
            </>
          ) : null}
          {canCreateTrainer ? (
            <button type="button" className="approve" onClick={() => openCreateFormFromApplication(application)}>
              <Plus aria-hidden="true" />
              Create Trainer
            </button>
          ) : null}
          {application.status === "approved" && application.createdTrainerId ? <span>Trainer account created</span> : null}
          {application.status === "rejected" ? <span>Application rejected</span> : null}
        </div>
      </article>
    );
  };

  return (
    <section className="admin-trainers-page">
      <header className="admin-trainers-header">
        <div>
          <h1>Trainers</h1>
          <p>
            {trainers.length} created · {approvedApplications.length} approved · {pendingApplications.length} pending · {featuredCount}/6 featured on homepage
          </p>
        </div>
        <button type="button" className="admin-create-button" onClick={openCreateForm}>
          <Plus aria-hidden="true" />
          Add Trainer
        </button>
      </header>

      <div className="admin-trainer-tabs" role="tablist" aria-label="Trainer management tabs">
        <button type="button" className={activeTab === "created" ? "active" : ""} onClick={() => setActiveTab("created")}>
          Created {trainers.length}
        </button>
        <button type="button" className={activeTab === "applications" ? "active" : ""} onClick={() => setActiveTab("applications")}>
          Applications {pendingApplications.length}
        </button>
        <button type="button" className={activeTab === "approved" ? "active" : ""} onClick={() => setActiveTab("approved")}>
          Approved {approvedApplications.length}
        </button>
        <button type="button" className={activeTab === "rejected" ? "active" : ""} onClick={() => setActiveTab("rejected")}>
          Rejected {rejectedApplications.length}
        </button>
      </div>

      {isFormOpen && activeTab === "created" ? (
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
              <span className="admin-trainer-password-field">
                <input
                  required={!editingTrainer}
                  minLength={6}
                  type={showTrainerPassword ? "text" : "password"}
                  placeholder={editingTrainer ? "Leave blank to keep current" : ""}
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowTrainerPassword((isVisible) => !isVisible)}
                  aria-label={showTrainerPassword ? "Hide password" : "Show password"}
                >
                  {showTrainerPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </span>
              {!editingTrainer ? <small>This password will be emailed to the trainer after account creation.</small> : null}
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
              {normalizeTrainerPhotoUrl(form.profilePicture) ? (
                <div className="admin-trainer-photo-preview">
                  <img src={normalizeTrainerPhotoUrl(form.profilePicture)} alt="" />
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

      {activeTab === "created" && isLoading ? (
        <div className="admin-products-empty">Loading trainers...</div>
      ) : activeTab === "created" && trainers.length === 0 ? (
        <div className="admin-products-empty">No trainers found.</div>
      ) : activeTab === "created" ? (
        <div className="admin-trainer-grid">
          {trainers.map((trainer) => {
            const fullName = `${trainer.userId.firstName} ${trainer.userId.lastName}`;
            const initials = `${trainer.userId.firstName[0] ?? ""}${trainer.userId.lastName[0] ?? ""}`;

            return (
              <article className={`admin-trainer-card ${trainer.isSuspended ? "suspended" : ""}`} key={trainer._id}>
                <div className="admin-trainer-card-main">
                  {normalizeTrainerPhotoUrl(trainer.userId.profilePicture) ? (
                    <img src={normalizeTrainerPhotoUrl(trainer.userId.profilePicture)} alt="" />
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
      ) : null}

      {activeTab === "applications" ? (
        pendingApplications.length ? (
          <div className="admin-trainer-grid">{pendingApplications.map(renderApplicationCard)}</div>
        ) : (
          <div className="admin-products-empty">No pending trainer applications.</div>
        )
      ) : null}

      {activeTab === "approved" ? (
        approvedApplications.length ? (
          <div className="admin-trainer-grid">{approvedApplications.map(renderApplicationCard)}</div>
        ) : (
          <div className="admin-products-empty">No approved trainer applications.</div>
        )
      ) : null}

      {activeTab === "rejected" ? (
        rejectedApplications.length ? (
          <div className="admin-trainer-grid">{rejectedApplications.map(renderApplicationCard)}</div>
        ) : (
          <div className="admin-products-empty">No rejected trainer applications.</div>
        )
      ) : null}
    </section>
  );
}
