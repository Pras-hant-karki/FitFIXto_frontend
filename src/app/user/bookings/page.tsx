"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle, Clock, User, X, XCircle } from "lucide-react";
import { CustomerDashboardShell } from "@/components/shared/customer";
import {
  BackendBooking,
  BookingStatus,
  PopulatedTrainer,
  cancelClientBooking,
  fetchMyClientBookings,
} from "@/features/bookings";

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

const formatDate = (d: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(d)
  );

const getTrainer = (booking: BackendBooking): PopulatedTrainer | null => {
  if (typeof booking.trainerId === "string") return null;
  return booking.trainerId as PopulatedTrainer;
};

type FilterType = "all" | BookingStatus;

export default function UserBookingsPage() {
  const [bookings, setBookings] = useState<BackendBooking[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await fetchMyClientBookings();
        if (isActive) setBookings(data);
      } catch (err) {
        if (isActive) setError(err instanceof Error ? err.message : "Unable to load bookings.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    load();
    return () => { isActive = false; };
  }, []);

  const handleCancel = async (bookingId: string) => {
    if (!window.confirm("Cancel this booking?")) return;
    setProcessingId(bookingId);
    setError("");
    setMessage("");
    try {
      const updated = await cancelClientBooking(bookingId);
      if (updated) {
        setBookings((cur) => cur.map((b) => (b._id === bookingId ? updated : b)));
      }
      setMessage("Booking cancelled.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel booking.");
    } finally {
      setProcessingId("");
    }
  };

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const counts = bookings.reduce(
    (acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <CustomerDashboardShell>
      <div className="customer-orders-panel">
        <div className="customer-orders-heading">
          <h2>Bookings</h2>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>
            {bookings.length} booking{bookings.length === 1 ? "" : "s"}
          </span>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0, marginBottom: 18 }}>
          Your personal training sessions with our trainers.
        </p>

        {/* Filter tabs */}
        <div className="trainer-booking-filters">
          {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((f) => (
            <button
              type="button"
              key={f}
              className={`trainer-booking-filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : STATUS_LABELS[f]}
              {f !== "all" && counts[f] ? (
                <span className="trainer-booking-filter-count">{counts[f]}</span>
              ) : null}
            </button>
          ))}
        </div>

        {message ? <p className="customer-review-message" style={{ marginBottom: 12 }}>{message}</p> : null}
        {error ? <p className="auth-message error" style={{ marginBottom: 12 }}>{error}</p> : null}

        {isLoading ? (
          <div className="customer-orders-empty">Loading your bookings...</div>
        ) : filtered.length === 0 ? (
          <div className="customer-orders-empty">
            {filter === "all" ? (
              <>
                <CalendarDays aria-hidden="true" style={{ width: 38, height: 38, opacity: 0.35, display: "block", margin: "0 auto 10px" }} />
                No bookings yet. Visit a trainer's profile to book a session.
              </>
            ) : (
              `No ${STATUS_LABELS[filter as BookingStatus]?.toLowerCase()} bookings.`
            )}
          </div>
        ) : (
          <div className="trainer-booking-list">
            {filtered.map((booking) => {
              const trainer = getTrainer(booking);
              const trainerUser = trainer?.userId;
              const canCancel = booking.status === "pending" || booking.status === "confirmed";
              const isProcessing = processingId === booking._id;

              return (
                <article className="trainer-booking-card" key={booking._id}>
                  <div className="trainer-booking-client">
                    <div className="trainer-booking-avatar">
                      {trainerUser?.profilePicture ? (
                        <img src={trainerUser.profilePicture} alt={trainerUser.firstName} />
                      ) : (
                        <User aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <strong>
                        {trainerUser
                          ? `${trainerUser.firstName} ${trainerUser.lastName}`
                          : "Trainer"}
                      </strong>
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
                      {booking.status === "pending" ? <Clock aria-hidden="true" /> : null}
                      {booking.status === "confirmed" ? <CheckCircle aria-hidden="true" /> : null}
                      {booking.status === "completed" ? <CheckCircle aria-hidden="true" /> : null}
                      {booking.status === "cancelled" ? <XCircle aria-hidden="true" /> : null}
                      {STATUS_LABELS[booking.status]}
                    </span>
                  </div>

                  {booking.notes ? (
                    <p className="trainer-booking-notes">
                      <strong>Your note:</strong> {booking.notes}
                    </p>
                  ) : null}

                  {booking.trainerNotes ? (
                    <p className="trainer-booking-notes trainer-booking-trainer-response">
                      <strong>Trainer's note:</strong> {booking.trainerNotes}
                    </p>
                  ) : null}

                  {canCancel ? (
                    <div className="trainer-booking-action-buttons">
                      <button
                        type="button"
                        className="trainer-booking-decline"
                        disabled={isProcessing}
                        onClick={() => handleCancel(booking._id)}
                      >
                        <X aria-hidden="true" />
                        {isProcessing ? "..." : "Cancel Booking"}
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </CustomerDashboardShell>
  );
}
