"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthField } from "@/components/shared";
import { useAuth, useToast } from "@/contexts";

export default function TrainerLoginPage() {
  const router = useRouter();
  const { trainerLogin } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const loggedInTrainer = await trainerLogin(formData, rememberMe);

      if (loggedInTrainer.passwordIsWeak) {
        toast.warning("Your password is weak. Please change it to improve your account security.", {
          duration: 7000,
        });
      }

      const rawRedirect =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("redirect")
          : null;
      const redirectTo = rawRedirect?.startsWith("/") ? rawRedirect : null;
      router.push(redirectTo || "/trainer/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`.site-navbar,.site-footer{display:none}.site-main{padding-top:0}`}</style>
      <section className="auth-split-page">
        <aside
          className="auth-visual"
          style={{
            background: "linear-gradient(145deg, #052e16 0%, #14532d 55%, #166534 100%)",
          }}
        >
          <div className="auth-visual-copy">
            <span
              className="auth-dumbbell-icon"
              aria-hidden="true"
              style={{ color: "#86efac" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 4v4" />
                <path d="M18 4v4" />
                <path d="M6 16v4" />
                <path d="M18 16v4" />
                <path d="M3 8h3" />
                <path d="M18 8h3" />
                <path d="M3 16h3" />
                <path d="M18 16h3" />
                <rect x="6" y="8" width="12" height="8" rx="1" />
              </svg>
            </span>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(134,239,172,0.12)",
                border: "1px solid rgba(134,239,172,0.3)",
                borderRadius: "100px",
                padding: "4px 12px",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "#86efac",
                marginBottom: "18px",
              }}
            >
              <span>⚡</span> TRAINER PORTAL
            </div>
            <h2 style={{ color: "#f0fdf4" }}>Train. Inspire.<br />Transform.</h2>
            <p style={{ color: "#bbf7d0" }}>
              Your dedicated workspace for managing clients, schedules, programs and session bookings.
            </p>
          </div>
        </aside>

        <div className="auth-panel">
          <div className="auth-form-wrap">
            <div className="auth-title">
              <h1>Trainer sign in</h1>
              <p>Access your trainer dashboard.</p>
            </div>

            <form className="auth-clean-form" onSubmit={handleSubmit}>
              <AuthField
                icon="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData((c) => ({ ...c, email: e.target.value }))}
                placeholder="Trainer email"
                ariaLabel="Trainer email"
                autoComplete="email"
                required
                disabled={isSubmitting}
              />
              <AuthField
                icon="lock"
                type="password"
                name="password"
                value={formData.password}
                onChange={(e) => setFormData((c) => ({ ...c, password: e.target.value }))}
                placeholder="Password"
                ariaLabel="Password"
                autoComplete="current-password"
                required
                disabled={isSubmitting}
              />
              <div className="auth-row">
                <label className="auth-check">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  Remember me
                </label>
                <Link className="auth-red-link" href="/forgot-password">
                  Forgot password?
                </Link>
              </div>
              {error && <p className="auth-message error">{error}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ background: "#15803d", borderColor: "#15803d" }}
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="auth-switch" style={{ marginTop: "24px" }}>
              Not a trainer?{" "}
              <Link href="/login" style={{ color: "#15803d" }}>
                Customer sign-in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
