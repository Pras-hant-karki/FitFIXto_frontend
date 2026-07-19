"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthField } from "@/components/shared";
import { useAuth } from "@/contexts";

export default function LoginPage() {
  const router = useRouter();
  const { login, logout } = useAuth();
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
      const loggedInUser = await login(formData, rememberMe);

      if (loggedInUser.role === "trainer") {
        logout();
        setError("Trainer accounts have a dedicated sign-in page. Please visit /trainer/login");
        return;
      }

      const rawRedirect =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("redirect")
          : null;
      const redirectTo = rawRedirect?.startsWith("/") ? rawRedirect : null;
      router.push(redirectTo || "/user/dashboard");
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
        <aside className="auth-visual auth-login-visual">
          <div className="auth-visual-copy">
            <span className="auth-dumbbell-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5 8 3 10l3 3-2 2 5 5 2-2 3 3 2-2-3-3 3-3-5-5-3 3-3-3Z" />
                <path d="m11 13 2-2" />
              </svg>
            </span>
            <h2>Welcome back, athlete.</h2>
            <p>Pick up where you left off - your cart, wishlist and bookings are waiting.</p>
          </div>
        </aside>

        <div className="auth-panel">
          <div className="auth-form-wrap">
            <div className="auth-title">
              <h1>Sign in</h1>
              <p>Welcome back. Let&apos;s go.</p>
            </div>

            <form className="auth-clean-form" onSubmit={handleSubmit}>
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
              <div className="auth-row">
                <label className="auth-check">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    disabled={isSubmitting}
                  />
                  Remember me
                </label>
                <Link className="auth-red-link" href="/forgot-password">
                  Forgot password ?
                </Link>
              </div>
              {error ? <p className="auth-message error">{error}</p> : null}
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="auth-switch">
              New here? <Link href="/signup">Create an account</Link>
            </p>
            <p className="auth-switch" style={{ marginTop: "10px", fontSize: "13px" }}>
              Are you a trainer? <Link href="/trainer/login">Trainer sign-in</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
