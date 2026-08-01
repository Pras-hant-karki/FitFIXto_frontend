"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("order_id");
  const sessionId = params.get("session_id");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center",
        background: "var(--bg, #fff)",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "#dcfce7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          fontSize: 36,
        }}
        aria-hidden="true"
      >
        ✓
      </div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: 12 }}>
        Payment successful!
      </h1>
      <p style={{ color: "var(--muted, #6b7280)", maxWidth: 420, lineHeight: 1.6, marginBottom: 8 }}>
        Your order has been placed and payment confirmed. A confirmation email will be sent to you shortly.
      </p>
      {orderId && (
        <p style={{ fontSize: 13, color: "var(--muted, #6b7280)", marginBottom: 4 }}>
          Order ID: <strong style={{ color: "var(--fg, #111)" }}>{orderId.slice(-12).toUpperCase()}</strong>
        </p>
      )}
      {sessionId && !orderId && (
        <p style={{ fontSize: 12, color: "var(--muted, #9ca3af)", marginBottom: 4 }}>
          Reference: {sessionId.slice(0, 20)}…
        </p>
      )}
      <div style={{ marginBottom: 32 }} />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/user/dashboard"
          style={{
            padding: "12px 28px",
            background: "#111",
            color: "#fff",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          View my orders
        </Link>
        <Link
          href="/products"
          style={{
            padding: "12px 28px",
            border: "1px solid #e5e7eb",
            color: "#111",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
