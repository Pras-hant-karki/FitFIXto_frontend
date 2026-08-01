"use client";

import Link from "next/link";

export default function PaymentCancelPage() {
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
          background: "#fee2e2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          fontSize: 36,
        }}
        aria-hidden="true"
      >
        ✕
      </div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: 12 }}>
        Payment cancelled
      </h1>
      <p style={{ color: "var(--muted, #6b7280)", maxWidth: 420, lineHeight: 1.6, marginBottom: 32 }}>
        You cancelled the payment. Your cart has been saved — you can complete your purchase whenever you&apos;re ready.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/cart"
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
          Return to cart
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
