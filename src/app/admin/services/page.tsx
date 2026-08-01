"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, CheckCircle, Clock, Edit2, Plus, Search, Trash2, X, XCircle } from "lucide-react";
import {
  BackendService,
  ServicePayload,
  createService,
  deleteService,
  fetchAdminServices,
  updateService,
  uploadServiceImage,
} from "@/features/services";
import { BackendServiceBooking, ServiceBookingStatus, fetchAllServiceBookings, updateServiceBookingStatus } from "@/features/serviceBookings";

type ServiceForm = {
  name: string;
  description: string;
  priceLabel: string;
  charge: string;
  features: string[];
  featureInput: string;
  image: string;
  isActive: boolean;
};

const emptyForm: ServiceForm = {
  name: "",
  description: "",
  priceLabel: "",
  charge: "0",
  features: [],
  featureInput: "",
  image: "",
  isActive: true,
};

const toForm = (s: BackendService): ServiceForm => ({
  name: s.name,
  description: s.description,
  priceLabel: s.priceLabel || "",
  charge: String(s.charge ?? 0),
  features: [...s.features],
  featureInput: "",
  image: s.image || "",
  isActive: s.isActive,
});

const toPayload = (f: ServiceForm): ServicePayload => ({
  name: f.name.trim(),
  description: f.description.trim(),
  priceLabel: f.priceLabel.trim() || undefined,
  charge: Number(f.charge) || 0,
  features: f.features.filter(Boolean),
  image: f.image.trim() || undefined,
  isActive: f.isActive,
});

const SVC_STATUS_LABELS: Record<ServiceBookingStatus, string> = {
  pending: "Pending", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled",
};
const formatDate = (d: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

export default function AdminServicesPage() {
  const [tab, setTab] = useState<"services" | "bookings">("services");

  // Services tab
  const [services, setServices] = useState<BackendService[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<BackendService | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Bookings tab
  const [svcBookings, setSvcBookings] = useState<BackendServiceBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<"all" | ServiceBookingStatus>("all");
  const [updatingBookingId, setUpdatingBookingId] = useState("");
  const [bookingMsg, setBookingMsg] = useState("");

  const filtered = search.trim()
    ? services.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.description.toLowerCase().includes(search.toLowerCase())
      )
    : services;

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchAdminServices();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load services.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadBookings = async () => {
    setBookingsLoading(true);
    try { setSvcBookings(await fetchAllServiceBookings()); } catch {} finally { setBookingsLoading(false); }
  };
  useEffect(() => { if (tab === "bookings") loadBookings(); }, [tab]);

  const handleBookingStatusChange = async (id: string, status: ServiceBookingStatus) => {
    setUpdatingBookingId(id);
    setBookingMsg("");
    try {
      const updated = await updateServiceBookingStatus(id, status);
      setSvcBookings((cur) => cur.map((b) => b._id === id ? updated : b));
      setBookingMsg(`Status updated to ${SVC_STATUS_LABELS[status]}.`);
    } catch {} finally { setUpdatingBookingId(""); }
  };

  const openCreate = () => {
    setEditingService(null);
    setForm(emptyForm);
    setFormError("");
    setIsFormOpen(true);
    setMessage("");
    setError("");
  };

  const openEdit = (s: BackendService) => {
    setEditingService(s);
    setForm(toForm(s));
    setFormError("");
    setIsFormOpen(true);
    setMessage("");
    setError("");
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingService(null);
    setForm(emptyForm);
    setFormError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addFeature = () => {
    const val = form.featureInput.trim();
    if (!val) return;
    if (form.features.includes(val)) { setFormError("Feature already added."); return; }
    setForm((c) => ({ ...c, features: [...c.features, val], featureInput: "" }));
    setFormError("");
  };

  const removeFeature = (i: number) => {
    setForm((c) => ({ ...c, features: c.features.filter((_, idx) => idx !== i) }));
  };

  const handleImageUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      setFormError("Choose an image file first.");
      return;
    }
    setIsUploading(true);
    setFormError("");
    try {
      const url = await uploadServiceImage(fileInputRef.current.files[0]);
      setForm((c) => ({ ...c, image: url }));
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    const payload = toPayload(form);
    if (!payload.name) { setFormError("Service name is required."); return; }
    if (!payload.description) { setFormError("Description is required."); return; }

    setIsSaving(true);
    try {
      if (editingService) {
        const updated = await updateService(editingService._id, payload);
        if (updated) setServices((cur) => cur.map((s) => (s._id === editingService._id ? updated : s)));
        setMessage("Service updated.");
      } else {
        const created = await createService(payload);
        if (created) setServices((cur) => [created, ...cur]);
        setMessage("Service created.");
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to save service.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (s: BackendService) => {
    if (!window.confirm(`Delete "${s.name}"?`)) return;
    setError(""); setMessage("");
    try {
      await deleteService(s._id);
      setServices((cur) => cur.filter((item) => item._id !== s._id));
      setMessage("Service deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete service.");
    }
  };

  const filteredBookings = bookingStatusFilter === "all"
    ? svcBookings
    : svcBookings.filter((b) => b.status === bookingStatusFilter);

  const getClientName = (b: BackendServiceBooking) =>
    typeof b.clientId === "string" ? b.contactName : `${b.clientId.firstName} ${b.clientId.lastName}`;
  const getClientEmail = (b: BackendServiceBooking) =>
    typeof b.clientId === "string" ? b.contactEmail : b.clientId.email;
  const getServiceName = (b: BackendServiceBooking) =>
    typeof b.serviceId === "string" ? "Service" : b.serviceId.name;

  return (
    <section className="admin-products-page">
      <header className="admin-products-header">
        <div>
          <h1>Services</h1>
          <p>
            {tab === "services"
              ? `${services.length} service${services.length === 1 ? "" : "s"} customers can purchase.`
              : `${svcBookings.length} service booking${svcBookings.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        {tab === "services" && (
          <button type="button" className="admin-create-button" onClick={openCreate}>
            <Plus aria-hidden="true" />
            Create Service
          </button>
        )}
      </header>

      {/* Tab toggle */}
      <div className="bookings-main-tabs" style={{ marginBottom: 24 }}>
        <button
          type="button"
          className={`bookings-main-tab${tab === "services" ? " active" : ""}`}
          onClick={() => setTab("services")}
        >
          Services
          <span className="bookings-tab-count">{services.length}</span>
        </button>
        <button
          type="button"
          className={`bookings-main-tab${tab === "bookings" ? " active" : ""}`}
          onClick={() => setTab("bookings")}
        >
          Bookings
          <span className="bookings-tab-count">{svcBookings.length}</span>
        </button>
      </div>

      {/* ── Bookings tab ── */}
      {tab === "bookings" && (
        <div>
          <div className="trainer-booking-filters" style={{ marginBottom: 16 }}>
            {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`trainer-booking-filter-btn${bookingStatusFilter === f ? " active" : ""}`}
                onClick={() => setBookingStatusFilter(f as "all" | ServiceBookingStatus)}
              >
                {f === "all" ? "All" : SVC_STATUS_LABELS[f as ServiceBookingStatus]}
              </button>
            ))}
          </div>
          {bookingMsg && <p className="admin-products-message success">{bookingMsg}</p>}
          {bookingsLoading ? (
            <div className="admin-products-empty">Loading bookings…</div>
          ) : filteredBookings.length === 0 ? (
            <div className="admin-products-empty">
              {bookingStatusFilter === "all" ? "No service bookings yet." : `No ${SVC_STATUS_LABELS[bookingStatusFilter as ServiceBookingStatus]?.toLowerCase()} bookings.`}
            </div>
          ) : (
            <div className="trainer-booking-list">
              {filteredBookings.map((b) => {
                const isUpdating = updatingBookingId === b._id;
                return (
                  <article className="trainer-booking-card svc-admin-booking-card" key={b._id}>
                    <div className="svc-admin-booking-top">
                      <div className="svc-admin-booking-info">
                        <strong className="svc-admin-booking-service">{getServiceName(b)}</strong>
                        <span>{getClientName(b)} · {getClientEmail(b)}</span>
                        {b.contactPhone && <span>{b.contactPhone}</span>}
                        <span>Scheduled: {formatDate(b.scheduledDate)}</span>
                        <span>Amount: Npr {b.amount.toLocaleString()}</span>
                      </div>
                      <div className="svc-admin-booking-status-col">
                        <span className={`trainer-booking-status trainer-booking-status-${b.status}`}>
                          {b.status === "pending" && <Clock size={14} />}
                          {(b.status === "confirmed" || b.status === "completed") && <CheckCircle size={14} />}
                          {b.status === "cancelled" && <XCircle size={14} />}
                          {SVC_STATUS_LABELS[b.status]}
                        </span>
                        {b.status !== "cancelled" && (
                          <select
                            className="svc-admin-status-select"
                            value={b.status}
                            disabled={isUpdating}
                            onChange={(e) => handleBookingStatusChange(b._id, e.target.value as ServiceBookingStatus)}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancel</option>
                          </select>
                        )}
                      </div>
                    </div>
                    {b.notes && <p className="trainer-booking-notes"><strong>Client note:</strong> {b.notes}</p>}
                    {b.adminNotes && <p className="trainer-booking-notes trainer-booking-trainer-response"><strong>Admin note:</strong> {b.adminNotes}</p>}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Services tab ── */}
      {tab === "services" && (
        <>
      <form
        className="admin-product-search"
        onSubmit={(e) => e.preventDefault()}
      >
        <Search aria-hidden="true" />
        <input
          type="search"
          placeholder="Search services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      {message ? <p className="admin-products-message success">{message}</p> : null}
      {error ? <p className="admin-products-message error">{error}</p> : null}

      {/* Create / Edit Form */}
      {isFormOpen ? (
        <div className="admin-product-form-card">
          <div className="admin-card-header">
            <h2>{editingService ? "Edit Service" : "Create Service"}</h2>
            <button type="button" className="admin-form-close" onClick={closeForm} aria-label="Close form">
              <X aria-hidden="true" />
            </button>
          </div>
          <form className="admin-product-form" onSubmit={handleSubmit}>
            <label>
              Service name *
              <input
                required
                value={form.name}
                onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                disabled={isSaving}
                placeholder="e.g. Full Gym Setup"
              />
            </label>

            <label>
              Price label
              <input
                value={form.priceLabel}
                onChange={(e) => setForm((c) => ({ ...c, priceLabel: e.target.value }))}
                disabled={isSaving}
                placeholder="e.g. From Npr 4,999"
              />
            </label>

            <label>
              Charge (Npr)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.charge}
                onChange={(e) => setForm((c) => ({ ...c, charge: e.target.value }))}
                disabled={isSaving}
              />
            </label>

            {/* Image upload */}
            <div className="admin-upload-field">
              <span>Service image</span>
              <button
                type="button"
                className="admin-upload-drop"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Choose service image"
              >
                <Plus aria-hidden="true" />
              </button>
              <input
                ref={fileInputRef}
                className="admin-hidden-file-input"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={isUploading}
              />
              <small>
                Choose file{" "}
                <span>
                  {fileInputRef.current?.files?.[0]?.name || "No file chosen"}
                </span>
              </small>
              <button
                type="button"
                className="admin-upload-picture-button"
                disabled={isUploading}
                onClick={handleImageUpload}
              >
                {isUploading ? "Uploading..." : "Upload Image"}
              </button>
            </div>

            {form.image ? (
              <div className="admin-product-image-preview">
                <img src={form.image} alt="" />
                <span>Current service image</span>
              </div>
            ) : null}

            {/* Features */}
            <div className="admin-service-features-field">
              <span>Features (what&apos;s included)</span>
              <div className="admin-service-feature-input-row">
                <input
                  type="text"
                  placeholder="e.g. Free consultation"
                  value={form.featureInput}
                  onChange={(e) => setForm((c) => ({ ...c, featureInput: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                  disabled={isSaving}
                />
                <button type="button" className="admin-service-add-feature-btn" onClick={addFeature} disabled={isSaving}>
                  <Plus aria-hidden="true" /> Add
                </button>
              </div>
              {form.features.length > 0 ? (
                <ul className="admin-service-feature-list">
                  {form.features.map((feat, i) => (
                    <li key={i}>
                      <span>{feat}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(i)}
                        aria-label={`Remove feature: ${feat}`}
                        disabled={isSaving}
                      >
                        <X aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <label className="admin-product-form-wide">
              Description *
              <textarea
                required
                minLength={5}
                value={form.description}
                onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                disabled={isSaving}
                placeholder="Describe what this service offers..."
              />
            </label>

            <label className="admin-feature-check">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((c) => ({ ...c, isActive: e.target.checked }))}
                disabled={isSaving}
              />
              Visible to customers (active)
            </label>

            {formError ? <p className="admin-products-message error">{formError}</p> : null}

            <button type="submit" disabled={isSaving || isUploading}>
              {isSaving ? "Saving..." : editingService ? "Update Service" : "Create Service"}
            </button>
          </form>
        </div>
      ) : null}

      {/* Services Table */}
      <div className="admin-products-table-card">
        <div className="admin-services-table">
          <div className="admin-services-head">
            <span>Service</span>
            <span>Price Label</span>
            <span>Charge</span>
            <span>Includes</span>
            <span>Actions</span>
          </div>

          {isLoading ? (
            <div className="admin-products-empty">Loading services...</div>
          ) : filtered.length === 0 ? (
            <div className="admin-products-empty">
              {search ? "No services match your search." : "No services yet. Create your first one."}
            </div>
          ) : (
            filtered.map((s) => (
              <div className="admin-services-row" key={s._id}>
                <div className="admin-service-cell">
                  {s.image ? (
                    <img src={s.image} alt={s.name} />
                  ) : (
                    <span className="admin-product-no-image">No image</span>
                  )}
                  <div>
                    <strong>{s.name}</strong>
                    <span title={s.description}>
                      {s.description.length > 52
                        ? `${s.description.slice(0, 52)}…`
                        : s.description}
                    </span>
                  </div>
                </div>
                <span>{s.priceLabel || "—"}</span>
                <strong>Npr {s.charge.toLocaleString()}</strong>
                <span>{s.features.length} feature{s.features.length === 1 ? "" : "s"}</span>
                <div className="admin-product-actions">
                  <button type="button" onClick={() => openEdit(s)}>
                    <Edit2 aria-hidden="true" />
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(s)}>
                    <Trash2 aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
        </>
      )}
    </section>
  );
}
