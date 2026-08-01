"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthField } from "@/components/shared";
import { useAuth } from "@/contexts";
import { resolvePostLoginRedirect } from "@/utils/redirect";

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminLogin } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const loggedInAdmin = await adminLogin(formData, rememberMe);
      router.push(resolvePostLoginRedirect(loggedInAdmin.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in as admin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="auth-split-page">
        <aside className="auth-visual auth-admin-visual">
          <div className="auth-visual-copy">
            <span
              className="auth-dumbbell-icon"
              aria-hidden="true"
              style={{ color: "#f59e0b" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                <path d="m9 12 2 2 4-5" />
              </svg>
            </span>
            {/* The shield SVG above already carries the meaning, so the badge is text-only. */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: "100px",
                padding: "4px 12px",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "#f59e0b",
                marginBottom: "18px",
              }}
            >
              RESTRICTED ACCESS
            </div>
            <h2 style={{ color: "#f1f5f9" }}>Admin<br />Command Center.</h2>
            <p style={{ color: "#94a3b8" }}>
              Full control over products, orders, users, trainers and all FitFIXto operations from one protected workspace.
            </p>
          </div>
        </aside>

        <div className="auth-panel">
          <div className="auth-form-wrap">
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
                onChange={(e) => setFormData((c) => ({ ...c, email: e.target.value }))}
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
                onChange={(e) => setFormData((c) => ({ ...c, password: e.target.value }))}
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
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isSubmitting}
                />
                Remember me
              </label>
              {error && <p className="auth-message error">{error}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ background: "#1e2a45", borderColor: "#1e2a45" }}
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="auth-switch" style={{ marginTop: "24px", fontSize: "13px", color: "#94a3b8" }}>
              Not an admin?{" "}
              <Link href="/login">Customer sign-in</Link>
              {" · "}
              <Link href="/trainer/login">Trainer sign-in</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
