"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RouteShell } from "@/components/shared";
import { BackendCart, calculateCartTotals, fetchCart } from "@/features/cart";
import { DeliveryAddress, fetchDeliveryAddresses, placeOrder } from "@/features/orders";

type PaymentMethod = "cash_on_delivery" | "esewa" | "khalti";

const formatMoney = (value: number) =>
  `Npr ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<BackendCart>({ items: [] });
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash_on_delivery");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadCheckout = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [nextCart, nextAddresses] = await Promise.all([fetchCart(), fetchDeliveryAddresses()]);
        setCart(nextCart);
        setAddresses(nextAddresses);
        setSelectedAddressId(nextAddresses.find((address) => address.isDefault)?._id || nextAddresses[0]?._id || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load checkout.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCheckout();
  }, []);

  const totals = calculateCartTotals(cart);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (cart.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!selectedAddressId) {
      setError("Please add a delivery address before placing an order.");
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await placeOrder({
        deliveryAddressId: selectedAddressId,
        paymentMethod,
        notes: notes || undefined,
      });

      setSuccess("Order placed successfully.");
      router.push(order?._id ? `/user/orders` : "/user/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RouteShell eyebrow="Checkout" title="Checkout" description="Confirm shipping, payment and order details.">
      {isLoading ? (
        <div className="empty-state">
          <strong>Loading checkout...</strong>
          <span>Please wait while we prepare your order.</span>
        </div>
      ) : (
        <form className="checkout-layout checkout-form" onSubmit={handleSubmit}>
          <div>
            <strong>Shipping Details</strong>
            {addresses.length > 0 ? (
              <label className="checkout-field">
                Delivery address
                <select
                  value={selectedAddressId}
                  onChange={(event) => setSelectedAddressId(event.target.value)}
                  disabled={isSubmitting}
                  required
                >
                  {addresses.map((address) => (
                    <option value={address._id} key={address._id}>
                      {address.recipientName} - {address.street}, {address.city}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span>No saved delivery addresses found. Add an address from your account before checkout.</span>
            )}

            <label className="checkout-field">
              Payment method
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                disabled={isSubmitting}
              >
                <option value="cash_on_delivery">Cash on Delivery</option>
                <option value="esewa">eSewa</option>
                <option value="khalti">Khalti</option>
              </select>
            </label>

            <label className="checkout-field">
              Notes
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} disabled={isSubmitting} />
            </label>
          </div>

          <div>
            <strong>Order Summary</strong>
            {cart.items.length > 0 ? (
              <>
                <div className="checkout-lines">
                  {cart.items.map((item) => (
                    <span key={item.productId._id}>
                      {item.productId.name} x {item.quantity}
                    </span>
                  ))}
                </div>
                <div className="connected-total">
                  <span>Subtotal</span>
                  <strong>{formatMoney(totals.subtotal)}</strong>
                </div>
                <div className="connected-total">
                  <span>Discount</span>
                  <strong>{totals.discount > 0 ? `- ${formatMoney(totals.discount)}` : formatMoney(0)}</strong>
                </div>
                <div className="connected-total">
                  <span>Shipping</span>
                  <strong>{totals.shipping > 0 ? formatMoney(totals.shipping) : "FREE"}</strong>
                </div>
                <div className="connected-total">
                  <span>Tax (2% MRP)</span>
                  <strong>{formatMoney(totals.tax)}</strong>
                </div>
                <div className="connected-total">
                  <span>Grand Total</span>
                  <strong>{formatMoney(totals.grandTotal)}</strong>
                </div>
              </>
            ) : (
              <span>Your cart is empty.</span>
            )}

            {error ? <p className="auth-message error">{error}</p> : null}
            {success ? <p className="auth-message success">{success}</p> : null}

            <button className="button button-primary profile-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </form>
      )}
    </RouteShell>
  );
}
