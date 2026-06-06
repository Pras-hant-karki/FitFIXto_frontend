import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <>
      <style>{`.site-navbar,.site-footer{display:none}.site-main{padding-top:0}`}</style>
      <section className="forgot-page">
        <div className="forgot-card">
          <Link className="forgot-back" href="/login">
            <span aria-hidden="true">&lt;-</span> Back to login
          </Link>
          <div className="auth-title">
            <h1>Forgot password?</h1>
            <p>Enter your email and we&apos;ll send you a reset link.</p>
          </div>

          <form className="auth-clean-form">
            <label className="icon-input">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16v12H4z" />
                <path d="m4 7 8 6 8-6" />
              </svg>
              <input type="email" placeholder="Email" aria-label="Email" />
            </label>
            <button type="button">Send reset link</button>
          </form>
        </div>
      </section>
    </>
  );
}
