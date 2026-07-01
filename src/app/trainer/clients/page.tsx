"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, User } from "lucide-react";
import { TrainerDashboardShell } from "@/components/shared/trainer";
import { TrainerClient, fetchMyTrainerClients } from "@/features/bookings";
import { useToast } from "@/contexts";

const formatDate = (d: string) =>
  new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(d)
  );

export default function TrainerClientsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<TrainerClient[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchMyTrainerClients();
        if (isActive) setClients(data);
      } catch (err) {
        if (isActive) toast.error(err instanceof Error ? err.message : "Unable to load clients.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    load();
    return () => { isActive = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const fullName = `${c.user.firstName} ${c.user.lastName}`.toLowerCase();
      return fullName.includes(q) || c.user.email.toLowerCase().includes(q);
    });
  }, [search, clients]);

  return (
    <TrainerDashboardShell>
      <div className="customer-orders-panel">
        <div className="customer-orders-heading">
          <h2>Clients</h2>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>
            {clients.length} client{clients.length === 1 ? "" : "s"}
          </span>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0, marginBottom: 16 }}>
          Everyone who has booked a session with you.
        </p>

        <label className="trainer-clients-search">
          <Search aria-hidden="true" />
          <input
            type="search"
            placeholder="Search clients by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        {isLoading ? (
          <div className="customer-orders-empty">Loading clients...</div>
        ) : filtered.length === 0 ? (
          <div className="customer-orders-empty">
            {search ? "No clients match your search." : "No clients yet. They appear here after booking a session."}
          </div>
        ) : (
          <div className="trainer-clients-table-card">
            <div className="trainer-clients-table">
              <div className="trainer-clients-head">
                <span>Client</span>
                <span>Phone</span>
                <span>Sessions</span>
                <span>Last Booking</span>
                <span>Status</span>
              </div>

              {filtered.map(({ user: client, bookingCount, lastBooking }) => (
                <div className="trainer-clients-row" key={client._id}>
                  <div className="trainer-client-name">
                    <div className="trainer-client-avatar">
                      {client.profilePicture ? (
                        <img src={client.profilePicture} alt={client.firstName} />
                      ) : (
                        <User aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <strong>{client.firstName} {client.lastName}</strong>
                      <span>{client.email}</span>
                    </div>
                  </div>
                  <span>{client.phone || "—"}</span>
                  <strong>{bookingCount} session{bookingCount === 1 ? "" : "s"}</strong>
                  <span>{formatDate(String(lastBooking))}</span>
                  <span className={`trainer-client-status ${client.isActive !== false ? "active" : "inactive"}`}>
                    {client.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </TrainerDashboardShell>
  );
}
