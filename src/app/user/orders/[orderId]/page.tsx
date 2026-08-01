"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, Check, Home, Package, Truck, X } from "lucide-react";
import {
  BackendOrder,
  BackendOrderItem,
  BackendOrderTracking,
  cancelOrder,
  fetchOrder,
  fetchOrderTracking,
} from "@/features/orders";
import { BackendProduct, formatCategory, getProductImage } from "@/features/products";

const cancellableStatuses = new Set(["pending", "confirmed"]);

const formatOrderId = (id: string) => `ORD-${id.slice(-4).toUpperCase()}`;

const formatDate = (date?: string | null) => {
  if (!date) return "Not available";
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
};

const formatMoney = (value = 0) => `Npr ${Math.round(value).toLocaleString()}`;

const getOrderProduct = (item: BackendOrderItem) =>
  typeof item.productId === "string" ? null : item.productId;

const getFallbackEta = (order: BackendOrder) => {
  const start = new Date(order.createdAt);
  const end = new Date(order.createdAt);
  const shippingDays = order.shippingMethod === "overnight" ? [1, 1] : order.shippingMethod === "express" ? [2, 3] : [5, 7];

  start.setDate(start.getDate() + shippingDays[0]);
  end.setDate(end.getDate() + shippingDays[1]);

  const formatter = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long" });
  return shippingDays[0] === shippingDays[1]
    ? formatter.format(start)
    : `${formatter.format(start)} - ${formatter.format(end)}`;
};

const getEtaText = (order: BackendOrder, tracking: BackendOrderTracking | null) => {
  const eta = tracking?.estimatedDeliveryDate || order.estimatedDeliveryDate;

  if (eta) {
    return formatDate(eta);
  }

  if (order.status === "delivered") {
    return "Delivered";
  }

  if (order.status === "cancelled") {
    return "Cancelled";
  }

  return getFallbackEta(order);
};

const statusSteps = [
  { key: "pending", label: "Order Placed", Icon: Package },
  { key: "confirmed", label: "Processing", Icon: Package },
  { key: "shipped", label: "In Transit", Icon: Truck },
  { key: "delivered", label: "Delivered", Icon: Home },
];

const getStepIndex = (status: string) => {
  if (status === "cancelled" || status === "returned") return 0;
  const index = statusSteps.findIndex((step) => step.key === status);
  return index >= 0 ? index : 0;
};

export default function TrackOrderPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const [order, setOrder] = useState<BackendOrder | null>(null);
  const [tracking, setTracking] = useState<BackendOrderTracking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadOrder = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [nextOrder, nextTracking] = await Promise.all([
          fetchOrder(orderId),
          fetchOrderTracking(orderId).catch(() => null),
        ]);

        if (isActive) {
          if (!nextOrder) {
            throw new Error("Order not found.");
          }

          setOrder(nextOrder);
          setTracking(nextTracking || null);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Unable to load order.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    if (orderId) {
      loadOrder();
    }

    return () => {
      isActive = false;
    };
  }, [orderId]);

  const activeStepIndex = useMemo(() => getStepIndex(order?.status || "pending"), [order?.status]);
  const canCancel = Boolean(order && cancellableStatuses.has(order.status));

  const closeCancelModal = () => {
    if (isCancelling) return;
    setShowCancelModal(false);
    setCancelReason("");
    setCancelError("");
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    if (!cancelReason.trim()) {
      setCancelError("Please add a cancellation reason.");
      return;
    }

    setIsCancelling(true);
    setCancelError("");

    try {
      const cancelledOrder = await cancelOrder(order._id, cancelReason.trim());
      if (cancelledOrder) {
        setOrder(cancelledOrder);
      }
      setShowCancelModal(false);
      setCancelReason("");
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Unable to cancel order.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <main className="track-order-page">
        <section className="cart-state-card" aria-busy="true">
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="skeleton skeleton-text wide" style={{ height: 22 }} />
            <div className="skeleton skeleton-text mid" />
            <div className="skeleton skeleton-card" style={{ height: 100 }} />
            <div className="skeleton skeleton-text short" />
            <div className="skeleton skeleton-text mid" />
          </div>
        </section>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="track-order-page">
        <section className="cart-state-card">
          <strong>Unable to load order.</strong>
          <span>{error || "Order not found."}</span>
          <Link href="/user/dashboard">Back to dashboard</Link>
        </section>
      </main>
    );
  }

  const deliveryAddress = order.deliveryAddressId;

  return (
    <main className="track-order-page">
      <header className="track-order-header">
        <div>
          <p>
            Order #{formatOrderId(order._id)} · {formatDate(order.createdAt)}
          </p>
          <h1>Track Your Order</h1>
        </div>
        <button
          type="button"
          className="track-order-cancel"
          disabled={!canCancel}
          onClick={() => setShowCancelModal(true)}
          title={canCancel ? "Cancel this order" : "Only pending or confirmed orders can be cancelled"}
        >
          <X aria-hidden="true" />
          Cancel Order
        </button>
      </header>

      <section className="track-order-steps" aria-label="Order status">
        {statusSteps.map(({ key, label, Icon }, index) => {
          const isActive = index <= activeStepIndex && order.status !== "cancelled";
          return (
            <div className={isActive ? "active" : ""} key={key}>
              <span>{index < activeStepIndex ? <Check aria-hidden="true" /> : <Icon aria-hidden="true" />}</span>
              <strong>{label}</strong>
            </div>
          );
        })}
      </section>

      <div className="track-order-grid">
        <section className="track-order-items">
          <h2>Items</h2>
          {order.items.map((item) => {
            const product = getOrderProduct(item) as BackendProduct | null;
            const image = product ? getProductImage(product) : "";

            return (
              <article className="track-order-item" key={`${item.productName}-${item.lineTotal}`}>
                <div className="track-order-item-image">
                  {image ? <img src={image} alt={item.productName} /> : <span>No image</span>}
                </div>
                <div>
                  <strong>{item.productName}</strong>
                  <span>{product ? formatCategory(product.category) : `${item.quantity} item${item.quantity === 1 ? "" : "s"}`}</span>
                </div>
                <strong>{formatMoney(item.lineTotal)}</strong>
              </article>
            );
          })}
        </section>

        <aside className="track-order-side">
          <section>
            <h2>Delivery Address</h2>
            <p>
              {deliveryAddress.street}, {deliveryAddress.city} {deliveryAddress.postalCode}, {deliveryAddress.country}
            </p>
            <p>{deliveryAddress.phone}</p>
          </section>

          <section>
            <h2>Summary</h2>
            <div>
              <span>Subtotal</span>
              <strong>{formatMoney(order.subtotal)}</strong>
            </div>
            <div>
              <span>Discount</span>
              <strong>{order.discountAmount > 0 ? `- ${formatMoney(order.discountAmount)}` : formatMoney(0)}</strong>
            </div>
            <div>
              <span>Shipping</span>
              <strong>{order.shippingAmount ? formatMoney(order.shippingAmount) : "FREE"}</strong>
            </div>
            <div>
              <span>Tax</span>
              <strong>{formatMoney(order.taxAmount || 0)}</strong>
            </div>
            <div className="track-order-total">
              <span>Total</span>
              <strong>{formatMoney(order.totalAmount)}</strong>
            </div>
          </section>
        </aside>
      </div>

      <section className="track-order-eta">
        <span>Estimated Delivery</span>
        <strong>{getEtaText(order, tracking)}</strong>
      </section>

      {showCancelModal ? (
        <div className="user-order-modal-backdrop" role="presentation" onClick={closeCancelModal}>
          <section className="user-order-cancel-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="user-order-modal-close" onClick={closeCancelModal} aria-label="Close cancel order modal">
              <X aria-hidden="true" />
            </button>
            <div className="user-order-modal-heading">
              <span>
                <AlertTriangle aria-hidden="true" />
              </span>
              <div>
                <h2>Cancel this order?</h2>
                <p>Please tell us why so we can improve. This cannot be undone.</p>
              </div>
            </div>
            <label>
              Reason for cancellation *
              <textarea value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} disabled={isCancelling} />
            </label>
            {cancelError ? <p className="user-order-modal-error">{cancelError}</p> : null}
            <div className="user-order-modal-actions">
              <button type="button" onClick={closeCancelModal} disabled={isCancelling}>
                Keep Order
              </button>
              <button type="button" className="danger" onClick={handleCancelOrder} disabled={isCancelling}>
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
