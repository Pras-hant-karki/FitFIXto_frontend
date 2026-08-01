"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Eye, EyeOff, Plus, Search, Star, Trash2, X } from "lucide-react";
import { useToast } from "@/contexts";
import {
  AdminTrainerApplicationsResponse,
  approveTrainerApplication,
  BackendTrainerApplication,
  BackendTrainer,
  TrainerApplicationPaginationMeta,
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
import {
  AdminBookingsResponse,
  BackendBooking,
  BookingPaginationMeta,
  fetchAdminBookings,
  updateBookingStatus,
} from "@/features/bookings";

type TrainerTab = "created" | "bookings" | "applications" | "approved" | "rejected";

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

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));

const getBookingClientName = (b: BackendBooking): string => {
  if (typeof b.clientId === "string") return b.contactName || "Client";
  return `${b.clientId.firstName} ${b.clientId.lastName}`.trim() || b.contactName || "Client";
};

const getBookingTrainerName = (b: BackendBooking): string => {
  if (typeof b.trainerId === "string") return "Trainer";
  const t = b.trainerId as { userId?: { firstName?: string; lastName?: string } };
  return `${t.userId?.firstName || ""} ${t.userId?.lastName || ""}`.trim() || "Trainer";
};

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const DEFAULT_APP_PAGINATION: TrainerApplicationPaginationMeta = {
  total: 0, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPrevPage: false,
};

const DEFAULT_BOOKING_PAGINATION: BookingPaginationMeta = {
  total: 0, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPrevPage: false,
};

const PAGE_LIMIT = 20;

export default function AdminTrainersPage() {
  const [trainers, setTrainers] = useState<BackendTrainer[]>([]);
  const [applications, setApplications] = useState<BackendTrainerApplication[]>([]);
  const [appPagination, setAppPagination] = useState<TrainerApplicationPaginationMeta>(DEFAULT_APP_PAGINATION);
  const [appPage, setAppPage] = useState(1);

  // Bookings tab
  const [bookings, setBookings] = useState<BackendBooking[]>([]);
  const [bookingsPagination, setBookingsPagination] = useState<BookingPaginationMeta>(DEFAULT_BOOKING_PAGINATION);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsSearch, setBookingsSearch] = useState("");
  const [bookingsStatus, setBookingsStatus] = useState("all");
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const bookingsSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const featuredCount = trainers.filter((trainer) => trainer.isFeatured).length;

  // ── Applications loading ──────────────────────────────────────────────────
  const loadApplications = useCallback(async (status: string, page: number) => {
    try {
      const result = await fetchTrainerApplications({ status, page, limit: PAGE_LIMIT });
      setApplications(result.applications);
      setAppPagination(result.pagination);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to load trainer applications.");
    }
  }, [toast]);

  // ── Bookings loading ──────────────────────────────────────────────────────
  const loadBookings = useCallback(async (page: number, search: string, status: string) => {
    setBookingsLoading(true);
    try {
      const result = await fetchAdminBookings({
        page,
        limit: PAGE_LIMIT,
        search: search.trim() || undefined,
        status: status !== "all" ? status : undefined,
      });
      setBookings(result.bookings);
      setBookingsPagination(result.pagination);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to load bookings.");
    } finally {
      setBookingsLoading(false);
    }
  }, [toast]);

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

  useEffect(() => {
    loadTrainers();
    loadApplications("pending", 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When tab changes, load the right data
  const handleTabChange = (tab: TrainerTab) => {
    setActiveTab(tab);
    if (tab === "applications") { setAppPage(1); loadApplications("pending", 1); }
    else if (tab === "approved") { setAppPage(1); loadApplications("approved", 1); }
    else if (tab === "rejected") { setAppPage(1); loadApplications("rejected", 1); }
    else if (tab === "bookings") { setBookingsPage(1); loadBookings(1, bookingsSearch, bookingsStatus); }
  };

  const handleAppPageChange = (newPage: number) => {
    setAppPage(newPage);
    const status = activeTab === "approved" ? "approved" : activeTab === "rejected" ? "rejected" : "pending";
    loadApplications(status, newPage);
  };

  const handleBookingsSearchChange = (query: string) => {
    setBookingsSearch(query);
    if (bookingsSearchRef.current) clearTimeout(bookingsSearchRef.current);
    bookingsSearchRef.current = setTimeout(() => {
      setBookingsPage(1);
      loadBookings(1, query, bookingsStatus);
    }, 350);
  };

  const handleBookingsStatusChange = (status: string) => {
    setBookingsStatus(status);
    setBookingsPage(1);
    loadBookings(1, bookingsSearch, status);
  };

  const handleBookingsPageChange = (newPage: number) => {
    setBookingsPage(newPage);
    loadBookings(newPage, bookingsSearch, bookingsStatus);
  };

  const handleBookingStatusUpdate = async (booking: BackendBooking, status: "confirmed" | "cancelled" | "completed") => {
    try {
      const updated = await updateBookingStatus(booking._id, status);
      if (updated) {
        setBookings((current) => current.map((b) => (b._id === updated._id ? updated : b)));
      }
      toast.success(`Booking status updated to ${BOOKING_STATUS_LABELS[status]}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update booking status.");
    }
  };

  // ── Form helpers ──────────────────────────────────────────────────────────
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
      loadApplications("pending", 1);
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

  const applicationPaginationControls = appPagination.totalPages > 1 ? (
    <div className="admin-pagination" style={{ marginTop: 16 }}>
      <button
        type="button"
        disabled={!appPagination.hasPrevPage}
        onClick={() => handleAppPageChange(appPage - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft aria-hidden="true" />
      </button>
      <span>Page {appPagination.page} of {appPagination.totalPages}</span>
      <button
        type="button"
        disabled={!appPagination.hasNextPage}
        onClick={() => handleAppPageChange(appPage + 1)}
        aria-label="Next page"
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
  ) : null;

  return (
    <section className="admin-trainers-page">
      <header className="admin-trainers-header">
        <div>
          <h1>Trainers</h1>
          <p>
            {trainers.length} created · {featuredCount}/6 featured on homepage
          </p>
        </div>
        <button type="button" className="admin-create-button" onClick={openCreateForm}>
          <Plus aria-hidden="true" />
          Add Trainer
        </button>
      </header>

      <div className="admin-trainer-tabs" role="tablist" aria-label="Trainer management tabs">
        <button type="button" className={activeTab === "created" ? "active" : ""} onClick={() => handleTabChange("created")}>
          Created {trainers.length}
        </button>
        <button type="button" className={activeTab === "bookings" ? "active" : ""} onClick={() => handleTabChange("bookings")}>
          Bookings {activeTab === "bookings" ? bookingsPagination.total : ""}
        </button>
        <button type="button" className={activeTab === "applications" ? "active" : ""} onClick={() => handleTabChange("applications")}>
          Applications {activeTab === "applications" ? appPagination.total : ""}
        </button>
        <button type="button" className={activeTab === "approved" ? "active" : ""} onClick={() => handleTabChange("approved")}>
          Approved {activeTab === "approved" ? appPagination.total : ""}
        </button>
        <button type="button" className={activeTab === "rejected" ? "active" : ""} onClick={() => handleTabChange("rejected")}>
          Rejected {activeTab === "rejected" ? appPagination.total : ""}
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

      {/* Created trainers */}
      {activeTab === "created" && isLoading ? (
        <div className="admin-products-empty" style={{ textAlign: "left" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid var(--line)" }}>
              <div className="skeleton skeleton-avatar" style={{ width: 40, height: 40 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                <div className="skeleton skeleton-text wide" />
                <div className="skeleton skeleton-text mid" />
              </div>
            </div>
          ))}
        </div>
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

      {/* Bookings tab */}
      {activeTab === "bookings" ? (
        <div>
          <div className="trainer-booking-filters" style={{ marginBottom: 12 }}>
            {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={`trainer-booking-filter-btn${bookingsStatus === s ? " active" : ""}`}
                onClick={() => handleBookingsStatusChange(s)}
              >
                {s === "all" ? "All" : BOOKING_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <label className="admin-user-search" style={{ marginBottom: 16 }}>
            <Search aria-hidden="true" />
            <input
              type="search"
              placeholder="Search bookings..."
              value={bookingsSearch}
              onChange={(e) => handleBookingsSearchChange(e.target.value)}
            />
          </label>
          {bookingsLoading ? (
            <div className="admin-products-empty" style={{ textAlign: "left" }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid var(--line)" }}>
                  <div className="skeleton skeleton-avatar" style={{ width: 36, height: 36 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                    <div className="skeleton skeleton-text wide" />
                    <div className="skeleton skeleton-text mid" />
                  </div>
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="admin-products-empty">No trainer bookings found.</div>
          ) : (
            <div className="trainer-booking-list">
              {bookings.map((b) => (
                <article className="trainer-booking-card" key={b._id}>
                  <div className="trainer-booking-header">
                    <div>
                      <strong>{getBookingClientName(b)}</strong>
                      <span>{b.contactEmail}</span>
                    </div>
                    <span className={`trainer-booking-status trainer-booking-status-${b.status}`}>
                      {BOOKING_STATUS_LABELS[b.status] || b.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                    <span>Trainer: {getBookingTrainerName(b)}</span>
                    {" · "}
                    <span>{formatDate(b.slotDate)} · {b.timeLabel}</span>
                    {" · "}
                    <span>Npr {b.totalAmount}</span>
                  </div>
                  {b.notes ? <p className="trainer-booking-notes"><strong>Note:</strong> {b.notes}</p> : null}
                  {(b.status === "pending" || b.status === "confirmed") ? (
                    <div className="trainer-booking-actions">
                      {b.status === "pending" ? (
                        <button type="button" onClick={() => handleBookingStatusUpdate(b, "confirmed")}>
                          Confirm
                        </button>
                      ) : null}
                      {b.status === "confirmed" ? (
                        <button type="button" onClick={() => handleBookingStatusUpdate(b, "completed")}>
                          Complete
                        </button>
                      ) : null}
                      <button type="button" onClick={() => handleBookingStatusUpdate(b, "cancelled")}>
                        Cancel
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
          {bookingsPagination.totalPages > 1 ? (
            <div className="admin-pagination" style={{ marginTop: 16 }}>
              <button
                type="button"
                disabled={!bookingsPagination.hasPrevPage}
                onClick={() => handleBookingsPageChange(bookingsPage - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <span>Page {bookingsPagination.page} of {bookingsPagination.totalPages}</span>
              <button
                type="button"
                disabled={!bookingsPagination.hasNextPage}
                onClick={() => handleBookingsPageChange(bookingsPage + 1)}
                aria-label="Next page"
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Pending applications */}
      {activeTab === "applications" ? (
        <>
          {applications.length ? (
            <div className="admin-trainer-grid">{applications.map(renderApplicationCard)}</div>
          ) : (
            <div className="admin-products-empty">No pending trainer applications.</div>
          )}
          {applicationPaginationControls}
        </>
      ) : null}

      {/* Approved applications */}
      {activeTab === "approved" ? (
        <>
          {applications.length ? (
            <div className="admin-trainer-grid">{applications.map(renderApplicationCard)}</div>
          ) : (
            <div className="admin-products-empty">No approved trainer applications.</div>
          )}
          {applicationPaginationControls}
        </>
      ) : null}

      {/* Rejected applications */}
      {activeTab === "rejected" ? (
        <>
          {applications.length ? (
            <div className="admin-trainer-grid">{applications.map(renderApplicationCard)}</div>
          ) : (
            <div className="admin-products-empty">No rejected trainer applications.</div>
          )}
          {applicationPaginationControls}
        </>
      ) : null}
    </section>
  );
}
