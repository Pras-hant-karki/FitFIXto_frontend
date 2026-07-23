"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { RouteShell } from "@/components/shared";
import { BackendOrder, cancelOrder, fetchMyOrders } from "@/features/orders";
import { useToast } from "@/contexts";

const cancellableStatuses = new Set(["pending", "confirmed"]);

const canCancelOrder = (status: string) => cancellableStatuses.has(status);

export default function UserOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<BackendOrder | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState("");
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);

      try {
        const nextOrders = await fetchMyOrders();
        setOrders(nextOrders);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unable to load orders.");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  const openCancelModal = (order: BackendOrder) => {
    setSelectedOrder(order);
    setCancelReason("");
    setCancelError("");
  };

  const closeCancelModal = () => {
    if (cancellingOrderId) return;

    setSelectedOrder(null);
    setCancelReason("");
    setCancelError("");
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    const reason = cancelReason.trim();
    if (!reason) {
      setCancelError("Please add a cancellation reason.");
      return;
    }

    setCancellingOrderId(selectedOrder._id);
    setCancelError("");

    try {
      const cancelledOrder = await cancelOrder(selectedOrder._id, reason);
      if (cancelledOrder) {
        setOrders((current) => current.map((order) => (order._id === cancelledOrder._id ? cancelledOrder : order)));
      }
      toast.success("Order cancelled successfully.");
      setSelectedOrder(null);
      setCancelReason("");
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Unable to cancel order.");
    } finally {
      setCancellingOrderId("");
    }
  };

  return (
    <RouteShell
      eyebrow="Account"
      title="Orders"
      description="Track equipment orders, service bookings and delivery updates."
      actionHref="/shop"
      actionLabel="Continue Shopping"
    >
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid var(--line)" }}>
              <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                <div className="skeleton skeleton-text wide" />
                <div className="skeleton skeleton-text mid" />
                <div className="skeleton skeleton-text short" />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <strong>No orders yet.</strong>
          <span>Your order history will appear here.</span>
        </div>
      ) : (
        <div className="connected-list">
          {orders.map((order) => {
            const isCancellable = canCancelOrder(order.status);
            const isCancelling = cancellingOrderId === order._id;

            return (
              <article className="connected-list-item order-list-item user-order-row" key={order._id}>
                <div>
                  <strong>Order #{order._id.slice(-8).toUpperCase()}</strong>
                  <span>
                    {order.items.length} item{order.items.length === 1 ? "" : "s"} - {order.status}
                  </span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="user-order-summary">
                  <strong>Npr {order.totalAmount.toFixed(2)}</strong>
                  <span>{order.paymentStatus}</span>
                </div>
                <button
                  type="button"
                  className="user-order-cancel-button"
                  disabled={!isCancellable || isCancelling}
                  onClick={() => openCancelModal(order)}
                  title={isCancellable ? "Cancel this order" : "Only pending or confirmed orders can be cancelled"}
                >
                  {isCancelling ? "Cancelling..." : "Cancel Order"}
                </button>
              </article>
            );
          })}
        </div>
      )}

      {selectedOrder ? (
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
              <textarea
                required
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                disabled={Boolean(cancellingOrderId)}
              />
            </label>
            {cancelError ? <p className="user-order-modal-error">{cancelError}</p> : null}
            <div className="user-order-modal-actions">
              <button type="button" onClick={closeCancelModal} disabled={Boolean(cancellingOrderId)}>
                Keep Order
              </button>
              <button type="button" className="danger" onClick={handleCancelOrder} disabled={Boolean(cancellingOrderId)}>
                {cancellingOrderId ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </RouteShell>
  );
}
