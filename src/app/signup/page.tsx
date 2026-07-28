"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthField } from "@/components/shared";
import { useAuth } from "@/contexts";

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!acceptedTerms) {
      setError("Please agree to the Terms & Privacy Policy.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await register(formData);
      router.push("/user/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="auth-split-page">
        <aside className="auth-visual auth-signup-visual">
          <div className="auth-visual-copy">
            <span className="auth-dumbbell-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5 8 3 10l3 3-2 2 5 5 2-2 3 3 2-2-3-3 3-3-5-5-3 3-3-3Z" />
                <path d="m11 13 2-2" />
              </svg>
            </span>
            <h2>Join the FitFIXto crew.</h2>
            <p>Exclusive deals, faster checkout, and direct access to elite trainers.</p>
          </div>
        </aside>

        <div className="auth-panel">
          <div className="auth-form-wrap signup">
            <div className="auth-title">
              <h1>Create account</h1>
              <p>Start your journey today.</p>
            </div>

            <form className="auth-clean-form" onSubmit={handleSubmit}>
              <div className="auth-two-col">
                <AuthField
                  icon="person"
                  name="firstName"
                  value={formData.firstName}
                  onChange={(event) => setFormData((current) => ({ ...current, firstName: event.target.value }))}
                  placeholder="First name"
                  ariaLabel="First name"
                  autoComplete="given-name"
                  required
                  disabled={isSubmitting}
                />
                <AuthField
                  icon="person"
                  name="lastName"
                  value={formData.lastName}
                  onChange={(event) => setFormData((current) => ({ ...current, lastName: event.target.value }))}
                  placeholder="Last name"
                  ariaLabel="Last name"
                  autoComplete="family-name"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <AuthField
                icon="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                placeholder="Email"
                ariaLabel="Email"
                autoComplete="email"
                required
                disabled={isSubmitting}
              />
              <AuthField
                icon="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
                placeholder="Phone"
                ariaLabel="Phone"
                autoComplete="tel"
                required
                disabled={isSubmitting}
              />
              <AuthField
                icon="lock"
                type="password"
                name="password"
                value={formData.password}
                onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                placeholder="Password (8+ chars)"
                ariaLabel="Password"
                autoComplete="new-password"
                required
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
              <label className="auth-check muted">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  disabled={isSubmitting}
                />
                I agree to the <Link href="#">Terms &amp; Privacy Policy</Link>
              </label>
              {error ? <p className="auth-message error">{error}</p> : null}
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account? <Link href="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
