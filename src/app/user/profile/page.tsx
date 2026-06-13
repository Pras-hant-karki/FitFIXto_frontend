"use client";

import { FormEvent, useEffect, useState } from "react";
import { RouteShell } from "@/components/shared";
import { API_ENDPOINTS } from "@/constants/api";
import { useAuth } from "@/contexts";
import { apiClient } from "@/lib";

export default function UserProfilePage() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    bio: "",
  });
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    <RouteShell
      eyebrow="Account"
      title="Profile"
      description="Manage your personal details, saved addresses and account preferences."
      actionHref="/user/orders"
      actionLabel="View Orders"
    >
      <form className="auth-form profile-form" onSubmit={handleSubmit}>
        <div className="route-grid profile-summary">
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
            <span>{user?.role || "customer"}</span>
          </article>
          <article>
            <strong>Status</strong>
            <span>{user?.isActive === false ? "Inactive" : "Active"}</span>
          </article>
        </div>

        <div className="auth-two-col">
          <label>
            First name
            <input
              type="text"
              value={formData.firstName}
              onChange={(event) => setFormData((current) => ({ ...current, firstName: event.target.value }))}
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
              onChange={(event) => setFormData((current) => ({ ...current, lastName: event.target.value }))}
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
            onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
            autoComplete="tel"
            required
            disabled={isSubmitting}
          />
        </label>

        <label>
          Bio
          <textarea
            value={formData.bio}
            onChange={(event) => setFormData((current) => ({ ...current, bio: event.target.value }))}
            maxLength={500}
            disabled={isSubmitting}
          />
        </label>

        {error ? <p className="auth-message error">{error}</p> : null}
        {success ? <p className="auth-message success">{success}</p> : null}

        <button className="button button-primary profile-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </RouteShell>
  );
}
