"use client";

import { FormEvent, useState } from "react";
import { TrainerDashboardShell } from "@/components/shared/trainer";
import { API_ENDPOINTS } from "@/constants/api";
import { useAuth } from "@/contexts";
import { apiClient } from "@/lib";

export default function TrainerSettingsPage() {
  const { logout } = useAuth();
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwords.next !== passwords.confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (passwords.next.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.put(API_ENDPOINTS.auth.profile, {
        currentPassword: passwords.current,
        password: passwords.next,
      });
      setSuccess("Password changed successfully.");
      setPasswords({ current: "", next: "", confirm: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TrainerDashboardShell>
      <div className="customer-orders-panel">
        <div className="customer-orders-heading">
          <h2>Settings</h2>
        </div>

        <div className="trainer-settings-section">
          <h3 className="trainer-settings-heading">Change Password</h3>
          <form className="auth-form" onSubmit={handlePasswordChange} style={{ maxWidth: 440 }}>
            <label>
              Current password
              <input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords((c) => ({ ...c, current: e.target.value }))}
                required
                disabled={isSubmitting}
                autoComplete="current-password"
              />
            </label>
            <label>
              New password
              <input
                type="password"
                value={passwords.next}
                onChange={(e) => setPasswords((c) => ({ ...c, next: e.target.value }))}
                required
                disabled={isSubmitting}
                autoComplete="new-password"
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords((c) => ({ ...c, confirm: e.target.value }))}
                required
                disabled={isSubmitting}
                autoComplete="new-password"
              />
            </label>
            {error ? <p className="auth-message error">{error}</p> : null}
            {success ? <p className="auth-message success">{success}</p> : null}
            <button className="button button-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Change Password"}
            </button>
          </form>
        </div>

        <div className="trainer-settings-section" style={{ marginTop: 32 }}>
          <h3 className="trainer-settings-heading">Account</h3>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 14 }}>
            Sign out of your trainer account on this device.
          </p>
          <button
            type="button"
            className="trainer-settings-logout"
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </TrainerDashboardShell>
  );
}
