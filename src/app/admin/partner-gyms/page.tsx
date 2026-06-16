"use client";

import { MapPin } from "lucide-react";

export default function AdminPartnerGymsPage() {
  return (
    <section className="admin-partner-gyms-page">
      <header className="admin-partner-gyms-header">
        <div>
          <h1>Partner Gyms</h1>
          <p>Pin and manage gyms that appear to users on Find Gyms.</p>
        </div>
      </header>

      <div className="admin-partner-gyms-grid">
        <section className="admin-gym-map-placeholder" aria-label="Partner gyms map placeholder">
          <MapPin aria-hidden="true" />
          <h2>Map unavailable</h2>
          <p>Add a Google Maps API key to enable the interactive map.</p>
        </section>

        <aside className="admin-gym-list-panel">
          <h2>0 gyms</h2>
          <div className="admin-gym-empty-state">
            <MapPin aria-hidden="true" />
            <strong>No partner gyms yet</strong>
            <p>Add Gym will be connected in the next section.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
