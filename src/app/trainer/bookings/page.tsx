"use client";

import { useEffect, useState } from "react";
import { Check, X, CheckCircle, Clock, XCircle, User } from "lucide-react";
import { TrainerDashboardShell } from "@/components/shared/trainer";
import { useToast } from "@/contexts";
import {
  BackendBooking,
  BookingStatus,
  PopulatedClient,
  fetchMyTrainerBookings,
  updateBookingStatus,
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

const getClient = (booking: BackendBooking): PopulatedClient | null => {
  if (typeof booking.clientId === "string") return null;
  return booking.clientId as PopulatedClient;
};

type FilterType = "all" | BookingStatus;

export default function TrainerBookingsPage() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BackendBooking[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchMyTrainerBookings();
        if (isActive) setBookings(data);
      } catch (err) {
        if (isActive) toast.error(err instanceof Error ? err.message : "Unable to load bookings.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    load();
    return () => { isActive = false; };
  }, []);

  const handleStatus = async (
    bookingId: string,
    status: "confirmed" | "cancelled" | "completed"
  ) => {
    setProcessingId(bookingId);
    setError("");
    setMessage("");
    try {
      const updated = await updateBookingStatus(bookingId, status, notesMap[bookingId]);
      if (updated) {
        setBookings((cur) => cur.map((b) => (b._id === bookingId ? updated : b)));
      }
      setMessage(`Booking ${status} successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update booking.");
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
    <TrainerDashboardShell>
      <div className="customer-orders-panel">
        <div className="customer-orders-heading">
          <h2>Bookings</h2>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>
            {bookings.length} total · {counts.pending || 0} pending
          </span>
        </div>

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
          <div className="customer-orders-empty">Loading bookings...</div>
        ) : filtered.length === 0 ? (
          <div className="customer-orders-empty">
            {filter === "all" ? "No bookings yet. Clients will appear here once they book your slots." : `No ${filter} bookings.`}
          </div>
        ) : (
          <div className="trainer-booking-list">
            {filtered.map((booking) => {
              const client = getClient(booking);
              const isPending = booking.status === "pending";
              const isProcessing = processingId === booking._id;

              return (
                <article className="trainer-booking-card" key={booking._id}>
                  <div className="trainer-booking-client">
                    <div className="trainer-booking-avatar">
                      {client?.profilePicture ? (
                        <img src={client.profilePicture} alt={client.firstName} />
                      ) : (
                        <User aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <strong>{client ? `${client.firstName} ${client.lastName}` : "Client"}</strong>
                      <span>{client?.email || ""}</span>
                      {client?.phone ? <span>{client.phone}</span> : null}
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
                      <strong>Client note:</strong> {booking.notes}
                    </p>
                  ) : null}

                  {isPending ? (
                    <div className="trainer-booking-actions">
                      <label className="trainer-booking-trainer-note">
                        <span>Add a note (optional)</span>
                        <input
                          type="text"
                          placeholder="Message to client..."
                          value={notesMap[booking._id] || ""}
                          onChange={(e) =>
                            setNotesMap((c) => ({ ...c, [booking._id]: e.target.value }))
                          }
                          disabled={isProcessing}
                        />
                      </label>
                      <div className="trainer-booking-action-buttons">
                        <button
                          type="button"
                          className="trainer-booking-confirm"
                          disabled={isProcessing}
                          onClick={() => handleStatus(booking._id, "confirmed")}
                        >
                          <Check aria-hidden="true" />
                          {isProcessing ? "..." : "Confirm"}
                        </button>
                        <button
                          type="button"
                          className="trainer-booking-decline"
                          disabled={isProcessing}
                          onClick={() => handleStatus(booking._id, "cancelled")}
                        >
                          <X aria-hidden="true" />
                          {isProcessing ? "..." : "Decline"}
                        </button>
                      </div>
                    </div>
                  ) : booking.status === "confirmed" ? (
                    <div className="trainer-booking-action-buttons">
                      <button
                        type="button"
                        className="trainer-booking-confirm"
                        disabled={isProcessing}
                        onClick={() => handleStatus(booking._id, "completed")}
                      >
                        <CheckCircle aria-hidden="true" />
                        {isProcessing ? "..." : "Mark Complete"}
                      </button>
                    </div>
                  ) : null}

                  {booking.trainerNotes ? (
                    <p className="trainer-booking-notes trainer-booking-trainer-response">
                      <strong>Your note:</strong> {booking.trainerNotes}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </TrainerDashboardShell>
  );
}
