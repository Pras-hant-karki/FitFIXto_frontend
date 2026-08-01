"use client";

import { forwardRef, useImperativeHandle } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

export interface StripeCardInputHandle {
  confirmPayment: (clientSecret: string) => Promise<{ paymentIntentId: string } | { error: string }>;
}

export const StripeCardInput = forwardRef<StripeCardInputHandle>(function StripeCardInput(_, ref) {
  const stripe = useStripe();
  const elements = useElements();

  useImperativeHandle(ref, () => ({
    async confirmPayment(clientSecret: string) {
      if (!stripe || !elements) return { error: "Stripe is not initialized. Please refresh and try again." };
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return { error: "Card element not found. Please refresh and try again." };

      const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) return { error: error.message || "Card payment failed. Please try again." };
      return { paymentIntentId: paymentIntent!.id };
    },
  }), [stripe, elements]);

  return (
    <div className="stripe-card-element">
      <CardElement
        options={{
          style: {
            base: {
              fontSize: "15px",
              fontFamily: "inherit",
              color: "var(--foreground)",
              "::placeholder": { color: "var(--muted)" },
            },
            invalid: { color: "#dc2626" },
          },
        }}
      />
    </div>
  );
});
