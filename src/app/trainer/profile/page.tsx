"use client";

import { FormEvent, useEffect, useState } from "react";
import { TrainerDashboardShell } from "@/components/shared/trainer";
import { API_ENDPOINTS } from "@/constants/api";
import { useAuth } from "@/contexts";
import { apiClient } from "@/lib";

export default function TrainerProfilePage() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({ firstName: "", lastName: "", phone: "", bio: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      bio: user.bio || "",
    });
  }, [user]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      await apiClient.put(API_ENDPOINTS.auth.profile, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        bio: formData.bio,
      });
      await refreshUser();
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TrainerDashboardShell>
      <div className="customer-orders-panel">
        <div className="customer-orders-heading">
          <h2>Profile</h2>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0, marginBottom: 20 }}>
          Manage your personal details and account preferences.
        </p>

        <div className="route-grid profile-summary" style={{ marginBottom: 20 }}>
          <article>
            <strong>Email</strong>
            <span>{user?.email || "Not available"}</span>
          </article>
          <article>
            <strong>Verification</strong>
            <span>{user?.isEmailVerified ? "Verified" : "Not verified"}</span>
          </article>
          <article>
            <strong>Role</strong>
            <span style={{ textTransform: "capitalize" }}>{user?.role || "trainer"}</span>
          </article>
          <article>
            <strong>Status</strong>
            <span>{user?.isActive === false ? "Inactive" : "Active"}</span>
          </article>
        </div>

        <form className="auth-form profile-form" onSubmit={handleSubmit}>
          <div className="auth-two-col">
            <label>
              First name
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData((c) => ({ ...c, firstName: e.target.value }))}
                autoComplete="given-name"
                required
                disabled={isSubmitting}
              />
            </label>
            <label>
              Last name
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData((c) => ({ ...c, lastName: e.target.value }))}
                autoComplete="family-name"
                required
                disabled={isSubmitting}
              />
            </label>
          </div>

          <label>
            Phone
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((c) => ({ ...c, phone: e.target.value }))}
              autoComplete="tel"
              required
              disabled={isSubmitting}
            />
          </label>

          <label>
            Bio
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData((c) => ({ ...c, bio: e.target.value }))}
              maxLength={500}
              disabled={isSubmitting}
              placeholder="Tell clients about your training philosophy and experience..."
            />
          </label>

          {error ? <p className="auth-message error">{error}</p> : null}
          {success ? <p className="auth-message success">{success}</p> : null}

          <button className="button button-primary profile-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </TrainerDashboardShell>
  );
}
