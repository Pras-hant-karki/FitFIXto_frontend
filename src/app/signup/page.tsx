import Link from "next/link";

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
                <input type="text" placeholder="First name" aria-label="First name" />
                <input type="text" placeholder="Last name" aria-label="Last name" />
              </div>
              <input type="email" placeholder="Email" aria-label="Email" />
              <input type="tel" placeholder="Phone" aria-label="Phone" />
              <input type="password" placeholder="Password (8+ chars)" aria-label="Password" />
              <input type="password" placeholder="Confirm password" aria-label="Confirm password" />
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
