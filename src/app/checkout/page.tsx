import { RouteShell } from "@/components/shared";

export default function CheckoutPage() {
  return (
    <RouteShell
      eyebrow="Checkout"
      title="Checkout"
      description="Confirm shipping, payment and order details."
    >
      <div className="checkout-layout">
        <div>
          <strong>Shipping Details</strong>
          <span>Address form placeholder</span>
        </div>
        <div>
          <strong>Order Summary</strong>
          <span>Cart totals placeholder</span>
        </div>
      </div>
    </RouteShell>
  );
}
