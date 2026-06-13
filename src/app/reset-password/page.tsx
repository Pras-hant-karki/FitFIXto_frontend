"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AuthField } from "@/components/shared";
import { API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const resetToken = new URLSearchParams(window.location.search).get("token") || "";
    setToken(resetToken);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Reset token is missing. Please request a new reset link.");
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post(API_ENDPOINTS.auth.resetPassword, {
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      setSuccess("Password reset successfully. You can now sign in.");
      setFormData({ password: "", confirmPassword: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`.site-navbar,.site-footer{display:none}.site-main{padding-top:0}`}</style>
      <section className="forgot-page">
        <div className="forgot-card">
          <Link className="forgot-back" href="/login">
            <span aria-hidden="true">&lt;-</span> Back to login
          </Link>
          <div className="auth-title">
            <h1>Reset password</h1>
            <p>Choose a new password for your FitFIXto account.</p>
          </div>

          <form className="auth-clean-form" onSubmit={handleSubmit}>
            <AuthField
              icon="lock"
              type="password"
              name="password"
              value={formData.password}
              onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
              placeholder="New password"
              ariaLabel="New password"
              autoComplete="new-password"
              required
              disabled={isSubmitting || Boolean(success)}
            />
            <AuthField
              icon="lock"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))}
              placeholder="Confirm password"
              ariaLabel="Confirm password"
              autoComplete="new-password"
              required
              disabled={isSubmitting || Boolean(success)}
            />
            {error ? <p className="auth-message error">{error}</p> : null}
            {success ? <p className="auth-message success">{success}</p> : null}
            <button type="submit" disabled={isSubmitting || Boolean(success)}>
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
