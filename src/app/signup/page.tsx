import Link from "next/link";
import { AuthField } from "@/components/shared";

export default function SignupPage() {
  return (
    <>
      <style>{`.site-navbar,.site-footer{display:none}.site-main{padding-top:0}`}</style>
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

            <form className="auth-clean-form">
              <div className="auth-two-col">
                <AuthField icon="person" placeholder="First name" ariaLabel="First name" />
                <AuthField icon="person" placeholder="Last name" ariaLabel="Last name" />
              </div>
              <AuthField icon="email" type="email" placeholder="Email" ariaLabel="Email" />
              <AuthField icon="phone" type="tel" placeholder="Phone" ariaLabel="Phone" />
              <AuthField icon="lock" type="password" placeholder="Password (8+ chars)" ariaLabel="Password" />
              <AuthField icon="lock" type="password" placeholder="Confirm password" ariaLabel="Confirm password" />
              <label className="auth-check muted">
                <input type="checkbox" />
                I agree to the <Link href="#">Terms &amp; Privacy Policy</Link>
              </label>
              <button type="button">Create Account</button>
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
