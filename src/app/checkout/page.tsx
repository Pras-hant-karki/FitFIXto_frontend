"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, ShieldCheck, WalletCards } from "lucide-react";
import { useCart, useToast } from "@/contexts";
import { BackendCart, fetchCart } from "@/features/cart";
import { DiscountData, fetchPublicDiscounts } from "@/features/discounts";
import {
  CartOrderSummary,
  createDeliveryAddress,
  DeliveryAddress,
  fetchDeliveryAddresses,
  placeOrder,
} from "@/features/orders";
import { apiClient } from "@/lib";

type CheckoutStep = 1 | 2 | 3;
type PaymentMethod = "cash_on_delivery" | "esewa" | "khalti" | "card";
type ShippingMethod = "standard" | "express" | "overnight";

const shippingOptions: Array<{ id: ShippingMethod; label: string; price: number }> = [
  { id: "standard", label: "Standard (5-7 days)", price: 0 },
  { id: "express", label: "Express (2-3 days)", price: 29 },
  { id: "overnight", label: "Overnight", price: 79 },
];

const paymentOptions: Array<{ id: PaymentMethod; label: string; badge?: string; icon?: "card" | "wallet"; disabled?: boolean; comingSoon?: boolean }> = [
  { id: "esewa", label: "eSewa", badge: "eSewa", disabled: true, comingSoon: true },
  { id: "khalti", label: "Khalti", badge: "Khalti", disabled: true, comingSoon: true },
  { id: "card", label: "Credit / Debit Card", icon: "card" },
  { id: "cash_on_delivery", label: "Cash on Delivery", icon: "wallet" },
];

const emptyShippingForm = {
  recipientName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Nepal",
};

const formatMoney = (value: number) =>
  `Npr ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatCompactMoney = (value: number) => (value > 0 ? `Npr ${Math.round(value)}` : "FREE");

const calcDeliveryDates = (method: ShippingMethod): { from: Date; to: Date } => {
  const today = new Date();
  const addDays = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d;
  };
  if (method === "overnight") return { from: addDays(1), to: addDays(1) };
  if (method === "express") return { from: addDays(2), to: addDays(3) };
  return { from: addDays(5), to: addDays(7) };
};

const formatDeliveryRange = (method: ShippingMethod): string => {
  const { from, to } = calcDeliveryDates(method);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return from.getTime() === to.getTime() ? fmt(from) : `${fmt(from)} - ${fmt(to)}`;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { refreshCart } = useCart();
  const { toast } = useToast();
  const [step, setStep] = useState<CheckoutStep>(1);
  const [cart, setCart] = useState<BackendCart>({ items: [] });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [shippingForm, setShippingForm] = useState(emptyShippingForm);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [refundText, setRefundText] = useState("10-day money-back guarantee. If you're not fully satisfied, return any item within 10 days for a full refund. Refund process might take 3-6 business days");
  const [publicDiscounts, setPublicDiscounts] = useState<DiscountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadCheckout = async () => {
      setIsLoading(true);

      try {
        const selectedIds = new URLSearchParams(window.location.search)
          .get("items")
          ?.split(",")
          .map((id) => id.trim())
          .filter(Boolean) ?? [];
        const [nextCart, addresses] = await Promise.all([fetchCart(), fetchDeliveryAddresses()]);
        fetchPublicDiscounts().then((d) => { if (d.refundGuarantee) setRefundText(d.refundGuarantee); setPublicDiscounts(d); }).catch(() => {});
        const defaultAddress = addresses.find((address) => address.isDefault) || addresses[0];

        setSelectedProductIds(selectedIds);
        setCart(nextCart);

        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
          setShippingForm({
            recipientName: defaultAddress.recipientName,
            phone: defaultAddress.phone,
            street: defaultAddress.street,
            city: defaultAddress.city,
            state: defaultAddress.state,
            postalCode: defaultAddress.postalCode,
            country: defaultAddress.country || "Nepal",
          });
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unable to load checkout.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCheckout();
  }, []);

  const selectedShipping = shippingOptions.find((option) => option.id === shippingMethod) || shippingOptions[0];
  const checkoutItems = selectedProductIds.length
    ? cart.items.filter((item) => selectedProductIds.includes(item.productId._id))
    : cart.items;

  const updateShippingField = (field: keyof typeof shippingForm, value: string) => {
    setSelectedAddressId("");
    setShippingForm((current) => ({ ...current, [field]: value }));
  };

  const ensureAddress = async () => {
    if (selectedAddressId) {
      return selectedAddressId;
    }

    const address = await createDeliveryAddress({
      ...shippingForm,
      isDefault: true,
    });

    if (!address?._id) {
      throw new Error("Unable to save delivery address.");
    }

    setSelectedAddressId(address._id);
    return address._id;
  };

  const handleShippingContinue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await ensureAddress();
      setStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save delivery address.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentOptionClick = (option: typeof paymentOptions[0]) => {
    if (option.comingSoon) {
      toast.info("Coming Soon", { description: `${option.label} payment integration is coming soon. Please use Card or Cash on Delivery.` });
      return;
    }
    if (!option.disabled) setPaymentMethod(option.id);
  };

  const handlePlaceOrder = async () => {
    if (checkoutItems.length === 0) {
      toast.error("No selected cart items found. Please return to cart and choose items.");
      return;
    }

    setIsSubmitting(true);

    try {
      const deliveryAddressId = await ensureAddress();
      const { to: estimatedTo } = calcDeliveryDates(shippingMethod);

      if (paymentMethod === "card") {
        // Stripe Checkout redirect flow — server creates order + session atomically
        const response = await apiClient.post<{ url: string; sessionId: string; orderId: string }>(
          "/payments/stripe/checkout",
          {
            deliveryAddressId,
            shippingMethod,
            selectedProductIds: checkoutItems.map((item) => item.productId._id),
            estimatedDeliveryDate: estimatedTo.toISOString(),
          }
        );

        if (!response.data?.url) {
          throw new Error("Unable to initialize card payment. Please try again.");
        }

        // Refresh cart context before leaving page (cart was cleared server-side)
        await refreshCart();
        window.location.href = response.data.url;
        return;
      }

      // Non-card payment methods (COD)
      await placeOrder({
        deliveryAddressId,
        paymentMethod,
        shippingMethod,
        selectedProductIds: checkoutItems.map((item) => item.productId._id),
        estimatedDeliveryDate: estimatedTo.toISOString(),
      });

      await refreshCart();
      toast.success("Order placed successfully!", { description: "You'll receive a confirmation shortly." });
      router.push("/user/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepMarker = (markerStep: CheckoutStep, label: string) => {
    const isDone = step > markerStep;
    const isActive = step === markerStep;

    return (
      <div className={`checkout-step-marker ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
        <span>{isDone ? <Check aria-hidden="true" /> : markerStep}</span>
        <strong>{label}</strong>
      </div>
    );
  };

  const orderSummary = (
    <div className="checkout-summary-col">
      <CartOrderSummary
        cart={cart}
        className="checkout-summary"
        selectedProductIds={selectedProductIds}
        shipping={selectedShipping.price}
        formatMoney={formatMoney}
        publicDiscounts={publicDiscounts}
      />
      {step === 3 ? (
        <div className="checkout-estimated-delivery">
          <span>Estimated Delivery</span>
          <strong>{formatDeliveryRange(shippingMethod)}</strong>
        </div>
      ) : null}
    </div>
  );

  if (isLoading) {
    return (
      <main className="checkout-page">
        <h1>Checkout</h1>
        <section className="cart-state-card">
          <strong>Loading checkout...</strong>
          <span>Please wait while we prepare your order.</span>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <h1>Checkout</h1>

      <nav className="checkout-steps" aria-label="Checkout steps">
        {renderStepMarker(1, "Shipping")}
        <i />
        {renderStepMarker(2, "Method")}
        <i />
        {renderStepMarker(3, "Payment")}
      </nav>

      <div className="checkout-grid">
          {step === 1 ? (
            <form className="checkout-panel checkout-shipping-form" onSubmit={handleShippingContinue}>
              <div className="checkout-field-row">
                <label>
                  Full name
                  <input value={shippingForm.recipientName} onChange={(event) => updateShippingField("recipientName", event.target.value)} required />
                </label>
                <label>
                  Phone
                  <input value={shippingForm.phone} onChange={(event) => updateShippingField("phone", event.target.value)} required />
                </label>
              </div>
              <label>
                Address
                <input value={shippingForm.street} onChange={(event) => updateShippingField("street", event.target.value)} required />
              </label>
              <div className="checkout-field-row">
                <label>
                  City
                  <input value={shippingForm.city} onChange={(event) => updateShippingField("city", event.target.value)} required />
                </label>
                <label>
                  State / Province
                  <input value={shippingForm.state} onChange={(event) => updateShippingField("state", event.target.value)} required />
                </label>
              </div>
              <label className="checkout-postal-field">
                ZIP / Postal
                <input value={shippingForm.postalCode} onChange={(event) => updateShippingField("postalCode", event.target.value)} required />
              </label>
              <div className="checkout-panel-actions">
                <button type="button" disabled>
                  Back
                </button>
                <button type="submit" disabled={isSubmitting || checkoutItems.length === 0}>
                  {isSubmitting ? "Saving..." : "Continue"}
                </button>
              </div>
            </form>
          ) : null}

          {step === 2 ? (
            <section className="checkout-panel">
              <div className="checkout-choice-list">
                {shippingOptions.map((option) => (
                  <button
                    type="button"
                    className={shippingMethod === option.id ? "selected" : ""}
                    onClick={() => setShippingMethod(option.id)}
                    key={option.id}
                  >
                    <span>{option.label}</span>
                    <strong>{formatCompactMoney(option.price)}</strong>
                  </button>
                ))}
              </div>
              <div className="checkout-panel-actions">
                <button type="button" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="button" onClick={() => setStep(3)}>
                  Continue
                </button>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="checkout-panel">
              <div className="checkout-choice-list payment">
                {paymentOptions.map((option) => (
                  <button
                    type="button"
                    className={paymentMethod === option.id ? "selected" : ""}
                    onClick={() => handlePaymentOptionClick(option)}
                    key={option.id}
                    style={option.comingSoon ? { opacity: 0.55, cursor: "pointer" } : undefined}
                    aria-label={option.comingSoon ? `${option.label} — coming soon` : option.label}
                  >
                    {option.badge ? <em className={option.id === "khalti" ? "khalti" : "esewa"}>{option.badge}</em> : null}
                    {option.icon === "card" ? <CreditCard aria-hidden="true" /> : null}
                    {option.icon === "wallet" ? <WalletCards aria-hidden="true" /> : null}
                    <span>
                      {option.label}
                      {option.comingSoon ? <small style={{ marginLeft: 6, fontSize: "0.7em", color: "#9ca3af" }}>Coming Soon</small> : null}
                    </span>
                  </button>
                ))}
              </div>

              {paymentMethod === "card" ? (
                <div className="stripe-card-wrapper" style={{ padding: "12px 16px", background: "var(--surface-2, #f9fafb)", borderRadius: 8, border: "1px solid var(--border, #e5e7eb)", fontSize: 14, color: "var(--muted, #6b7280)" }}>
                  <CreditCard aria-hidden="true" style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
                  You will be securely redirected to Stripe to complete your payment.
                </div>
              ) : null}

              <div className="checkout-refund-guarantee">
                <ShieldCheck aria-hidden="true" />
                <div>
                  <strong>Refund guarantee</strong>
                  <p>{refundText}</p>
                </div>
              </div>
              <div className="checkout-panel-actions">
                <button type="button" onClick={() => setStep(2)}>
                  Back
                </button>
                <button type="button" onClick={handlePlaceOrder} disabled={isSubmitting || checkoutItems.length === 0}>
                  {isSubmitting ? "Processing..." : "Place Order"}
                </button>
              </div>
            </section>
          ) : null}

          {orderSummary}
        </div>
    </main>
  );
}
