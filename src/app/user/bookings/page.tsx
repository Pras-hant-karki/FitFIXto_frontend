"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle, Clock, User, X, XCircle } from "lucide-react";
import { avatarUrl } from "@/utils/assets";
import Link from "next/link";
import { CustomerDashboardShell } from "@/components/shared/customer";
import { useToast } from "@/contexts";
import {
  BackendBooking,
  BookingStatus,
  PopulatedTrainer,
  cancelClientBooking,
  fetchMyClientBookings,
} from "@/features/bookings";
import { BackendServiceBooking, ServiceBookingStatus, cancelMyServiceBooking, fetchMyServiceBookings } from "@/features/serviceBookings";

const TRAINER_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

const SVC_STATUS_LABELS: Record<ServiceBookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

const formatDate = (d: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

const getTrainer = (booking: BackendBooking): PopulatedTrainer | null => {
  if (typeof booking.trainerId === "string") return null;
  return booking.trainerId as PopulatedTrainer;
};

const getServiceName = (b: BackendServiceBooking) =>
  typeof b.serviceId === "string" ? "Service" : b.serviceId.name;

type MainTab = "trainer" | "service";

export default function UserBookingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<MainTab>("trainer");

  // Trainer bookings
  const [bookings, setBookings] = useState<BackendBooking[]>([]);
  const [trainerFilter, setTrainerFilter] = useState<"all" | BookingStatus>("all");
  const [trainerLoading, setTrainerLoading] = useState(true);
  const [trainerProcessingId, setTrainerProcessingId] = useState("");

  // Service bookings
  const [svcBookings, setSvcBookings] = useState<BackendServiceBooking[]>([]);
  const [svcFilter, setSvcFilter] = useState<"all" | ServiceBookingStatus>("all");
  const [svcLoading, setSvcLoading] = useState(true);
  const [svcProcessingId, setSvcProcessingId] = useState("");

  useEffect(() => {
    let active = true;
    setTrainerLoading(true);
    fetchMyClientBookings()
      .then((d) => { if (active) setBookings(d); })
      .catch((e) => { if (active) toast.error(e instanceof Error ? e.message : "Unable to load."); })
      .finally(() => { if (active) setTrainerLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setSvcLoading(true);
    fetchMyServiceBookings()
      .then((d) => { if (active) setSvcBookings(d); })
      .catch(() => {})
      .finally(() => { if (active) setSvcLoading(false); });
    return () => { active = false; };
  }, []);

  const handleCancelTrainer = async (id: string) => {
    if (!window.confirm("Cancel this booking?")) return;
    setTrainerProcessingId(id);
    try {
      const updated = await cancelClientBooking(id);
      if (updated) setBookings((cur) => cur.map((b) => (b._id === id ? updated : b)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to cancel.");
    } finally { setTrainerProcessingId(""); }
  };

  const handleCancelService = async (id: string) => {
    if (!window.confirm("Cancel this service booking?")) return;
    setSvcProcessingId(id);
    try {
      await cancelMyServiceBooking(id);
      setSvcBookings((cur) => cur.map((b) => b._id === id ? { ...b, status: "cancelled" as ServiceBookingStatus } : b));
      toast.success("Booking cancelled.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to cancel.");
    } finally { setSvcProcessingId(""); }
  };

  const filteredTrainer = trainerFilter === "all" ? bookings : bookings.filter((b) => b.status === trainerFilter);
  const filteredSvc = svcFilter === "all" ? svcBookings : svcBookings.filter((b) => b.status === svcFilter);

  return (
    <CustomerDashboardShell>
      <div className="customer-orders-panel">
        <div className="customer-orders-heading">
          <h2>My Bookings</h2>
        </div>

        {/* Main tabs */}
        <div className="bookings-main-tabs">
          <button
            type="button"
            className={`bookings-main-tab${tab === "trainer" ? " active" : ""}`}
            onClick={() => setTab("trainer")}
          >
            Training Sessions
            <span className="bookings-tab-count">{bookings.length}</span>
          </button>
          <button
            type="button"
            className={`bookings-main-tab${tab === "service" ? " active" : ""}`}
            onClick={() => setTab("service")}
          >
            Service Bookings
            <span className="bookings-tab-count">{svcBookings.length}</span>
          </button>
        </div>

        {/* ── Trainer bookings ── */}
        {tab === "trainer" && (
          <>
            <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 14px" }}>
              Your personal training sessions.
            </p>
            <div className="trainer-booking-filters">
              {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((f) => (
                <button key={f} type="button"
                  className={`trainer-booking-filter-btn${trainerFilter === f ? " active" : ""}`}
                  onClick={() => setTrainerFilter(f)}>
                  {f === "all" ? "All" : TRAINER_STATUS_LABELS[f as BookingStatus]}
                </button>
              ))}
            </div>
            {trainerLoading ? (
              <div className="customer-orders-empty">
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: i < 2 ? "1px solid var(--line)" : undefined }}>
                    <div className="skeleton skeleton-avatar" />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                      <div className="skeleton skeleton-text wide" />
                      <div className="skeleton skeleton-text mid" />
                      <div className="skeleton skeleton-text short" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTrainer.length === 0 ? (
              <div className="customer-orders-empty">
                <CalendarDays style={{ width: 38, height: 38, opacity: 0.35, display: "block", margin: "0 auto 10px" }} />
                {trainerFilter === "all" ? "No training bookings yet." : `No ${TRAINER_STATUS_LABELS[trainerFilter as BookingStatus]?.toLowerCase()} bookings.`}
              </div>
            ) : (
              <div className="trainer-booking-list">
                {filteredTrainer.map((booking) => {
                  const trainer = getTrainer(booking);
                  const trainerUser = trainer?.userId;
                  const canCancel = booking.status === "pending" || booking.status === "confirmed";
                  const isProcessing = trainerProcessingId === booking._id;
                  return (
                    <article className="trainer-booking-card" key={booking._id}>
                      <div className="trainer-booking-client">
                        <div className="trainer-booking-avatar">
                          {avatarUrl(trainerUser) ? (
                            <img src={avatarUrl(trainerUser)} alt={trainerUser?.firstName ?? "Trainer"} />
                          ) : <User />}
                        </div>
                        <div>
                          <strong>{trainerUser ? `${trainerUser.firstName} ${trainerUser.lastName}` : "Trainer"}</strong>
                          <span>{trainerUser?.email || ""}</span>
                          {trainer?.location ? <span>{trainer.location}</span> : null}
                        </div>
                      </div>
                      <div className="trainer-booking-details">
                        <div className="trainer-booking-slot">
                          <strong>{formatDate(booking.slotDate)}</strong>
                          <span>{booking.timeLabel}</span>
                        </div>
                        <span className={`trainer-booking-status trainer-booking-status-${booking.status}`}>
                          {booking.status === "pending" && <Clock />}
                          {(booking.status === "confirmed" || booking.status === "completed") && <CheckCircle />}
                          {booking.status === "cancelled" && <XCircle />}
                          {TRAINER_STATUS_LABELS[booking.status]}
                        </span>
                      </div>
                      {booking.notes ? <p className="trainer-booking-notes"><strong>Your note:</strong> {booking.notes}</p> : null}
                      {booking.trainerNotes ? <p className="trainer-booking-notes trainer-booking-trainer-response"><strong>Trainer's note:</strong> {booking.trainerNotes}</p> : null}
                      {canCancel && (
                        <div className="trainer-booking-action-buttons">
                          <button type="button" className="trainer-booking-decline" disabled={isProcessing} onClick={() => handleCancelTrainer(booking._id)}>
                            <X /> {isProcessing ? "…" : "Cancel Booking"}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Service bookings ── */}
        {tab === "service" && (
          <>
            <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 14px" }}>
              Your gym installation and maintenance service bookings.
            </p>
            <div className="trainer-booking-filters">
              {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((f) => (
                <button key={f} type="button"
                  className={`trainer-booking-filter-btn${svcFilter === f ? " active" : ""}`}
                  onClick={() => setSvcFilter(f as "all" | ServiceBookingStatus)}>
                  {f === "all" ? "All" : SVC_STATUS_LABELS[f as ServiceBookingStatus]}
                </button>
              ))}
            </div>
            {svcLoading ? (
              <div className="customer-orders-empty">
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: i < 2 ? "1px solid var(--line)" : undefined }}>
                    <div className="skeleton skeleton-avatar" />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                      <div className="skeleton skeleton-text wide" />
                      <div className="skeleton skeleton-text mid" />
                      <div className="skeleton skeleton-text short" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredSvc.length === 0 ? (
              <div className="customer-orders-empty">
                <CalendarDays style={{ width: 38, height: 38, opacity: 0.35, display: "block", margin: "0 auto 10px" }} />
                {svcFilter === "all"
                  ? <><span>No service bookings yet.</span><br /><Link href="/services" style={{ color: "var(--foreground)", fontWeight: 600 }}>Browse Services</Link></>
                  : `No ${SVC_STATUS_LABELS[svcFilter as ServiceBookingStatus]?.toLowerCase()} bookings.`}
              </div>
            ) : (
              <div className="trainer-booking-list">
                {filteredSvc.map((b) => {
                  const canCancel = b.status === "pending" || b.status === "confirmed";
                  const isProcessing = svcProcessingId === b._id;
                  return (
                    <article className="trainer-booking-card" key={b._id}>
                      <div className="trainer-booking-client">
                        <div className="trainer-booking-avatar svc-booking-avatar">
                          <CalendarDays />
                        </div>
                        <div>
                          <strong>{getServiceName(b)}</strong>
                          <span>Booked for {formatDate(b.scheduledDate)}</span>
                          <span>Npr {b.amount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="trainer-booking-details">
                        <div className="trainer-booking-slot">
                          <strong>Date</strong>
                          <span>{formatDate(b.scheduledDate)}</span>
                        </div>
                        <span className={`trainer-booking-status trainer-booking-status-${b.status}`}>
                          {b.status === "pending" && <Clock />}
                          {(b.status === "confirmed" || b.status === "completed") && <CheckCircle />}
                          {b.status === "cancelled" && <XCircle />}
                          {SVC_STATUS_LABELS[b.status]}
                        </span>
                      </div>
                      {b.notes && <p className="trainer-booking-notes"><strong>Your note:</strong> {b.notes}</p>}
                      {b.adminNotes && <p className="trainer-booking-notes trainer-booking-trainer-response"><strong>Admin note:</strong> {b.adminNotes}</p>}
                      {b.status === "completed" && !b.clientRating && (
                        <div className="trainer-booking-action-buttons">
                          <Link href={`/user/to-review?type=service&id=${b._id}&serviceId=${typeof b.serviceId === "string" ? b.serviceId : b.serviceId._id}`}
                            className="trainer-booking-confirm">
                            Leave a Review
                          </Link>
                        </div>
                      )}
                      {canCancel && (
                        <div className="trainer-booking-action-buttons">
                          <button type="button" className="trainer-booking-decline" disabled={isProcessing} onClick={() => handleCancelService(b._id)}>
                            <X /> {isProcessing ? "…" : "Cancel Booking"}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </CustomerDashboardShell>
  );
}
