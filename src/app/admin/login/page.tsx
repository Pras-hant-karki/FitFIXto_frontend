"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthField } from "@/components/shared";
import { useAuth } from "@/contexts";

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await adminLogin(formData, rememberMe);
      const rawRedirect =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("redirect")
          : null;
      const redirectTo = rawRedirect?.startsWith("/") ? rawRedirect : null;
      router.push(redirectTo || "/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in as admin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`.site-navbar,.site-footer{display:none}.site-main{padding-top:0}`}</style>
      <section className="auth-split-page">
        <aside className="auth-visual auth-login-visual">
          <div className="auth-visual-copy">
            <span className="auth-dumbbell-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                <path d="m9 12 2 2 4-5" />
              </svg>
            </span>
            <h2>Admin access.</h2>
            <p>Manage products, orders, users, trainers, and FitFIXto operations from one protected workspace.</p>
          </div>
        </aside>

        <div className="auth-panel">
          <div className="auth-form-wrap">
            <Link className="auth-logo-link" href="/" aria-label="FitFIXto home">
              <Image src="/logo.png" alt="FitFIXto" width={190} height={77} className="auth-logo logo-light" priority style={{ width: "100%", height: "auto" }} />
              <Image src="/fitfixto_logo.png" alt="FitFIXto" width={190} height={77} className="auth-logo logo-dark" priority style={{ width: "100%", height: "auto" }} />
            </Link>
            <div className="auth-title">
              <h1>Admin sign in</h1>
              <p>Restricted access for FitFIXto admins.</p>
            </div>

            <form className="auth-clean-form" onSubmit={handleSubmit}>
              <AuthField
                icon="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                placeholder="Admin email"
                ariaLabel="Admin email"
                autoComplete="email"
                required
                disabled={isSubmitting}
              />
              <AuthField
                icon="lock"
                type="password"
                name="password"
                value={formData.password}
                onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                placeholder="Password"
                ariaLabel="Password"
                autoComplete="current-password"
                required
                disabled={isSubmitting}
              />
              <label className="auth-check">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  disabled={isSubmitting}
                />
                Remember me
              </label>
              {error ? <p className="auth-message error">{error}</p> : null}
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
