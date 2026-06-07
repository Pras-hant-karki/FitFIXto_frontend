import Image from "next/image";
import Link from "next/link";
import { AuthField } from "@/components/shared";

export default function LoginPage() {
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
            <Link className="auth-logo-link" href="/" aria-label="FitFIXto home">
              <Image src="/fitfixto_logo.png" alt="FitFIXto" width={190} height={77} className="auth-logo" priority />
            </Link>
            <div className="auth-title">
              <h1>Sign in</h1>
              <p>Welcome back. Let&apos;s go.</p>
            </div>

            <form className="auth-clean-form">
              <AuthField icon="email" type="email" placeholder="Email" ariaLabel="Email" />
              <AuthField icon="lock" type="password" placeholder="Password" ariaLabel="Password" />
              <div className="auth-row">
                <label className="auth-check">
                  <input type="checkbox" />
                  Remember me
                </label>
                <Link className="auth-red-link" href="/forgot-password">
                  Forgot password ?
                </Link>
              </div>
              <button type="button">Sign In</button>
            </form>

            <p className="auth-switch">
              New here? <Link href="/signup">Create an account</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
