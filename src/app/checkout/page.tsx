"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, WalletCards } from "lucide-react";
import { useCart } from "@/contexts";
import { BackendCart, calculateCartTotals, fetchCart } from "@/features/cart";
import {
  createDeliveryAddress,
  DeliveryAddress,
  fetchDeliveryAddresses,
  OrderSummary,
  placeOrder,
} from "@/features/orders";

type CheckoutStep = 1 | 2 | 3;
type PaymentMethod = "cash_on_delivery" | "esewa" | "khalti";
type ShippingMethod = "standard" | "express" | "overnight";

const shippingOptions: Array<{ id: ShippingMethod; label: string; price: number }> = [
  { id: "standard", label: "Standard (5-7 days)", price: 0 },
  { id: "express", label: "Express (2-3 days)", price: 29 },
  { id: "overnight", label: "Overnight", price: 79 },
];

const paymentOptions: Array<{ id: PaymentMethod | "card"; label: string; badge?: string; icon?: "card" | "wallet"; disabled?: boolean }> = [
  { id: "esewa", label: "eSewa", badge: "eSewa" },
  { id: "khalti", label: "Khalti", badge: "Khalti" },
  { id: "card", label: "Credit / Debit Card", icon: "card", disabled: true },
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

export default function CheckoutPage() {
  const router = useRouter();
  const { refreshCart } = useCart();
  const [step, setStep] = useState<CheckoutStep>(1);
  const [cart, setCart] = useState<BackendCart>({ items: [] });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [shippingForm, setShippingForm] = useState(emptyShippingForm);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("esewa");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCheckout = async () => {
      setIsLoading(true);
      setError("");

      try {
        const selectedIds = new URLSearchParams(window.location.search)
          .get("items")
          ?.split(",")
          .map((id) => id.trim())
          .filter(Boolean) ?? [];
        const [nextCart, addresses] = await Promise.all([fetchCart(), fetchDeliveryAddresses()]);
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
        setError(err instanceof Error ? err.message : "Unable to load checkout.");
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
  const checkoutCart = { ...cart, items: checkoutItems };
  const totals = calculateCartTotals(checkoutCart, selectedShipping.price);
  const summaryItems = checkoutItems.map((item) => ({
    id: item.productId._id,
    name: item.productId.name,
    quantity: item.quantity,
    amount: item.priceAtAdded * item.quantity,
  }));

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
    setError("");
    setIsSubmitting(true);

    try {
      await ensureAddress();
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save delivery address.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlaceOrder = async () => {
    setError("");

    if (checkoutItems.length === 0) {
      setError("No selected cart items found. Please return to cart and choose items.");
      return;
    }

    setIsSubmitting(true);

    try {
      const deliveryAddressId = await ensureAddress();
      await placeOrder({
        deliveryAddressId,
        paymentMethod,
        shippingMethod,
        selectedProductIds: checkoutItems.map((item) => item.productId._id),
      });
      await refreshCart();
      router.push("/user/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to place order.");
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
    <OrderSummary
      className="checkout-summary"
      items={summaryItems}
      totals={{
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        tax: totals.tax,
        total: totals.grandTotal,
      }}
      formatMoney={formatMoney}
    />
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

      {error ? <p className="checkout-error">{error}</p> : null}

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
                  disabled={option.disabled}
                  onClick={() => {
                    if (!option.disabled) setPaymentMethod(option.id as PaymentMethod);
                  }}
                  key={option.id}
                >
                  {option.badge ? <em className={option.id === "khalti" ? "khalti" : "esewa"}>{option.badge}</em> : null}
                  {option.icon === "card" ? <CreditCard aria-hidden="true" /> : null}
                  {option.icon === "wallet" ? <WalletCards aria-hidden="true" /> : null}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
            <div className="checkout-panel-actions">
              <button type="button" onClick={() => setStep(2)}>
                Back
              </button>
              <button type="button" onClick={handlePlaceOrder} disabled={isSubmitting || checkoutItems.length === 0}>
                {isSubmitting ? "Placing..." : "Place Order"}
              </button>
            </div>
          </section>
        ) : null}

        {orderSummary}
      </div>
    </main>
  );
}
