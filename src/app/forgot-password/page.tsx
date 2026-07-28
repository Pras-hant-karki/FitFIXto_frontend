"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";
import { useToast } from "@/contexts";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await apiClient.post(API_ENDPOINTS.auth.forgotPassword, { email });
      toast.success("Password reset link sent. Please check your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="forgot-page">
        <div className="forgot-card">
          <Link className="forgot-back" href="/login">
            <span aria-hidden="true">&lt;-</span> Back to login
          </Link>
          <div className="auth-title">
            <h1>Forgot password?</h1>
            <p>Enter your email and we&apos;ll send you a reset link.</p>
          </div>

          <form className="auth-clean-form" onSubmit={handleSubmit}>
            <label className="icon-input">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16v12H4z" />
                <path d="m4 7 8 6 8-6" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                aria-label="Email"
                autoComplete="email"
                required
                disabled={isSubmitting}
              />
            </label>
            {error ? <p className="auth-message error">{error}</p> : null}
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
