"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";

type VerificationState = "checking" | "success" | "error";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<VerificationState>("checking");
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    const verifyEmail = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get("token");
      const email = searchParams.get("email");

      if (!token || !email) {
        setStatus("error");
        setMessage("Verification link is missing required information.");
        return;
      }

      try {
        await apiClient.post(API_ENDPOINTS.auth.verify, { token, email });
        setStatus("success");
        setMessage("Email verified successfully. You can continue using FitFIXto.");
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Unable to verify email. Please request a new link.");
      }
    };

    verifyEmail();
  }, []);

  return (
    <>
      <style>{`.site-navbar,.site-footer{display:none}.site-main{padding-top:0}`}</style>
      <section className="forgot-page">
        <div className="forgot-card">
          <div className="auth-title">
            <h1>Email verification</h1>
            <p>{message}</p>
          </div>

          <p className={`auth-message ${status === "error" ? "error" : "success"}`}>
            {status === "checking" ? "Please wait..." : status === "success" ? "Verified" : "Verification failed"}
          </p>

          <Link className="button button-primary auth-full-button" href={status === "success" ? "/user/profile" : "/login"}>
            {status === "success" ? "Go to Profile" : "Back to Login"}
          </Link>
        </div>
      </section>
    </>
  );
}
