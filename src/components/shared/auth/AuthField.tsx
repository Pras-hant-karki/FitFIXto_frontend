"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type AuthIcon = "email" | "lock" | "person" | "phone";

interface AuthFieldProps {
  icon: AuthIcon;
  type?: "email" | "password" | "tel" | "text";
  placeholder: string;
  ariaLabel: string;
}

const iconPaths: Record<AuthIcon, ReactNode> = {
  email: (
    <>
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v3" />
    </>
  ),
  person: (
    <>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.2a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" />
  ),
};

export function AuthField({ icon, type = "text", placeholder, ariaLabel }: AuthFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && isPasswordVisible ? "text" : type;

  return (
    <label className="auth-field">
      <svg className="auth-field-icon" viewBox="0 0 24 24" aria-hidden="true">
        {iconPaths[icon]}
      </svg>
      <input type={inputType} placeholder={placeholder} aria-label={ariaLabel} />
      {isPassword ? (
        <button
          className="auth-password-toggle"
          type="button"
          aria-label={isPasswordVisible ? "Hide password" : "Show password"}
          onClick={() => setIsPasswordVisible((visible) => !visible)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {isPasswordVisible ? (
              <>
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </>
            ) : (
              <>
                <path d="m3 3 18 18" />
                <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4" />
                <path d="M9.9 4.4A10.3 10.3 0 0 1 12 4c6.5 0 10 8 10 8a18.2 18.2 0 0 1-3.2 4.3" />
                <path d="M6.6 6.6C3.8 8.5 2 12 2 12s3.5 8 10 8a9.8 9.8 0 0 0 4.1-.9" />
              </>
            )}
          </svg>
        </button>
      ) : null}
    </label>
  );
}
