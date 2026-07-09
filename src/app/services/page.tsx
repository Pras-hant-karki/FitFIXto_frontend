"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { BackendService, fetchPublicServices } from "@/features/services";
import { createServiceBooking } from "@/features/serviceBookings";
import { useAuth } from "@/contexts";
import { resolveAssetUrl } from "@/constants/api";

function serviceImage(service: BackendService) {
  if (!service.image) return "/ctabanner.png";
  if (service.image.startsWith("http") || service.image.startsWith("/")) return service.image;
  return resolveAssetUrl(service.image);
}

const WHY_ITEMS = [
  "Certified technicians",
  "Premium imported equipment",
  "Custom layout design",
  "Insured & licensed",
  "On-time installation",
  "Lifetime support",
];

// ── Booking Modal ──────────────────────────────────────────────────────────

function BookingModal({ service, onClose }: { service: BackendService; onClose: () => void }) {
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    scheduledDate: "",
    contactName: user ? `${(user as any).firstName ?? ""} ${(user as any).lastName ?? ""}`.trim() : "",
    contactEmail: (user as any)?.email ?? "",
    contactPhone: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createServiceBooking({
        serviceId: service._id,
        scheduledDate: form.scheduledDate,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        notes: form.notes || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book service.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="svc-overlay" onClick={onClose}>
        <div className="svc-modal svc-modal--success" onClick={(e) => e.stopPropagation()}>
          <div className="svc-success-icon"><Check size={32} /></div>
          <h3>Booking Confirmed!</h3>
          <p>Your <strong>{service.name}</strong> booking request has been submitted. We&apos;ll confirm your appointment soon.</p>
          <Link href="/user/bookings" className="svc-btn-primary" onClick={onClose}>
            View My Bookings
          </Link>
          <button className="svc-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="svc-overlay" onClick={onClose}>
      <div className="svc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="svc-modal-head">
          <div>
            <h3>Book Service</h3>
            <p className="svc-modal-sub">{service.name} · {service.priceLabel || `Npr ${service.charge}`}</p>
          </div>
          <button className="svc-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form className="svc-modal-body" onSubmit={handleSubmit}>
          <div className="svc-field">
            <label>Preferred Date *</label>
            <input type="date" required min={minDateStr} value={form.scheduledDate}
              onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))} />
          </div>
          <div className="svc-field">
            <label>Your Name *</label>
            <input required placeholder="Full name" value={form.contactName}
              onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} />
          </div>
          <div className="svc-row">
            <div className="svc-field">
              <label>Email *</label>
              <input type="email" required placeholder="you@email.com" value={form.contactEmail}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} />
            </div>
            <div className="svc-field">
              <label>Phone *</label>
              <input required placeholder="+977 98XXXXXXXX" value={form.contactPhone}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} />
            </div>
          </div>
          <div className="svc-field">
            <label>Notes <span className="svc-optional">(optional)</span></label>
            <textarea rows={3} placeholder="Any special requirements or questions…" value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          {error && <p className="svc-err">{error}</p>}
          <div className="svc-modal-foot">
            <button type="button" className="svc-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="svc-btn-primary" disabled={submitting}>
              {submitting ? "Submitting…" : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Service Card ───────────────────────────────────────────────────────────

function ServiceCard({ service, onBook }: { service: BackendService; onBook: (s: BackendService) => void }) {
  return (
    <div className="service-card">
      <img src={serviceImage(service)} alt={service.name} />
      <div className="service-body">
        <div className="service-title-row">
          <h3>{service.name}</h3>
          {service.priceLabel && <strong>{service.priceLabel}</strong>}
        </div>
        <p>{service.description}</p>
        {service.features.length > 0 && (
          <ul>
            {service.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        )}
        <button className="service-book-btn" type="button" onClick={() => onBook(service)}>
          Book Now
        </button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const { isAuthenticated } = useAuth();
  const [services, setServices] = useState<BackendService[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BackendService | null>(null);

  useEffect(() => {
    fetchPublicServices()
      .then(setServices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleBook = (service: BackendService) => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent("/services")}`;
      return;
    }
    setBooking(service);
  };

  return (
    <div className="services-page">
      <section className="services-hero">
        <div className="services-hero-inner">
          <h1>Build the gym you&apos;ve always wanted.</h1>
          <p>Design, install, and maintain — at home, in your office, or for a commercial facility.</p>
        </div>
      </section>

      <section className="services-main">
        <div className="section-inner">
          <div className="section-heading">
            <p>Services</p>
            <h2>What we build</h2>
          </div>

          {loading ? (
            <div className="services-loading">Loading services…</div>
          ) : services.length === 0 ? (
            <div className="services-empty">No services available at the moment.</div>
          ) : (
            <div className="service-grid">
              {services.map((service) => (
                <ServiceCard key={service._id} service={service} onBook={handleBook} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose FitFIXto */}
      <section className="svc-why">
        <div className="svc-why-inner">
          <div className="svc-why-text">
            <p className="svc-why-label">WHY US</p>
            <h2>Why Choose FitFIXto</h2>
            <div className="svc-why-grid">
              {WHY_ITEMS.map((item) => (
                <div key={item} className="svc-why-item">
                  <Check size={15} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="svc-why-image">
            <img src="/ctabanner.png" alt="FitFIXto gym installation" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="svc-cta">
        <h2>Ready to build your space?</h2>
        <p>Free 30-min consultation with a FitFIXto specialist.</p>
        <button className="svc-cta-btn" onClick={() => services[0] && handleBook(services[0])}>
          Schedule Consultation →
        </button>
      </section>

      {booking && <BookingModal service={booking} onClose={() => setBooking(null)} />}
    </div>
  );
}
