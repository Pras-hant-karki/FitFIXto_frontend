"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { TrainerDashboardShell } from "@/components/shared/trainer";
import { TrainerClient, fetchMyTrainerClients } from "@/features/bookings";
import { useToast } from "@/contexts";

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(date));

export default function TrainerClientsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<TrainerClient[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<TrainerClient | null>(null);

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
  }, [toast]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter(({ user }) =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
    );
  }, [clients, search]);

  const upcomingTotal = clients.reduce((total, client) => total + client.upcomingSessions, 0);

  return (
    <TrainerDashboardShell>
      <div className="customer-orders-panel">
        <div className="trainer-clients-heading">
          <h2>Clients</h2>
          <span>{clients.length} client{clients.length === 1 ? "" : "s"} · {upcomingTotal} upcoming session{upcomingTotal === 1 ? "" : "s"}</span>
        </div>

        <label className="trainer-clients-search">
          <input type="search" placeholder="Search clients..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>

        {isLoading ? (
          <div className="customer-orders-empty">Loading clients...</div>
        ) : filtered.length === 0 ? (
          <div className="customer-orders-empty">{search ? "No clients match your search." : "No clients yet. They appear here after booking a session."}</div>
        ) : (
          <div className="trainer-clients-table-card">
            <div className="trainer-clients-table">
              <div className="trainer-clients-head">
                <span>Client</span><span>Last Program</span><span>Sessions</span><span>Upcoming</span><span>Action</span>
              </div>
              {filtered.map((clientSummary) => {
                const { user, bookingCount, lastProgram, upcomingSessions } = clientSummary;
                return (
                  <div className="trainer-clients-row" key={user._id}>
                    <div className="trainer-client-name"><div><strong>{user.firstName} {user.lastName}</strong><span>{user.email}</span></div></div>
                    <span>{lastProgram || "—"}</span>
                    <span>{bookingCount}</span>
                    <strong>{upcomingSessions || "—"}</strong>
                    <button type="button" className="trainer-client-view" onClick={() => setSelectedClient(clientSummary)}>View</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedClient ? (
          <section className="trainer-client-detail-panel" aria-label={`${selectedClient.user.firstName} client details`}>
            <button type="button" className="trainer-client-detail-close" onClick={() => setSelectedClient(null)} aria-label="Close client details"><X /></button>
            <h3>{selectedClient.user.firstName} {selectedClient.user.lastName}</h3>
            <p>{selectedClient.user.email}</p>
            <dl>
              <div><dt>Phone</dt><dd>{selectedClient.user.phone || "Not provided"}</dd></div>
              <div><dt>Last program</dt><dd>{selectedClient.lastProgram}</dd></div>
              <div><dt>Total sessions</dt><dd>{selectedClient.bookingCount}</dd></div>
              <div><dt>Upcoming</dt><dd>{selectedClient.upcomingSessions}</dd></div>
              <div><dt>Last booking</dt><dd>{formatDate(selectedClient.lastBooking)}</dd></div>
            </dl>
          </section>
        ) : null}
      </div>
    </TrainerDashboardShell>
  );
}
