"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { TrainerDashboardShell } from "@/components/shared/trainer";
import { BackendOrder, cancelOrder, fetchMyOrders } from "@/features/orders";
import { useToast } from "@/contexts";

const formatDate = (d: string) => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));

export default function TrainerReturnsPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<BackendOrder | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const all = await fetchMyOrders();
        setOrders(all);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unable to load orders.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const returnedOrders = orders.filter((o) => o.status === "returned");

  const openModal = (order: BackendOrder) => {
    setSelectedOrder(order);
    setReturnReason("");
    setFormError("");
    setMessage("");
  };

  const closeModal = () => {
    if (processingId) return;
    setSelectedOrder(null);
    setReturnReason("");
    setFormError("");
  };

  const handleReturn = async () => {
    if (!selectedOrder) return;
    const reason = returnReason.trim();
    if (!reason) { setFormError("Please describe the reason for return."); return; }
    setProcessingId(selectedOrder._id);
    setFormError("");
    try {
      const updated = await cancelOrder(selectedOrder._id, `RETURN REQUEST: ${reason}`);
      if (updated) setOrders((cur) => cur.map((o) => (o._id === updated._id ? updated : o)));
      setMessage("Return request submitted. Our team will contact you shortly.");
      setSelectedOrder(null);
      setReturnReason("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to submit return request.");
    } finally {
      setProcessingId("");
    }
  };

  return (
    <TrainerDashboardShell>
      <div className="customer-orders-panel">
        <div className="customer-orders-heading">
          <h2>Returns</h2>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0, marginBottom: 20 }}>
          Request a return for delivered orders within 7 days of delivery.
        </p>

        {message ? <p className="customer-review-message">{message}</p> : null}
        {error ? <div className="customer-orders-empty">{error}</div> : null}

        {isLoading ? (
          <div className="customer-orders-empty">Loading orders...</div>
        ) : (
          <>
            <h3 className="trainer-settings-heading" style={{ marginBottom: 12 }}>Eligible for Return</h3>
            {deliveredOrders.length === 0 ? (
              <div className="customer-orders-empty">No delivered orders eligible for return.</div>
            ) : (
              <div className="customer-orders-list" style={{ marginBottom: 28 }}>
                {deliveredOrders.map((order) => (
                  <article className="customer-order-card" key={order._id}>
                    <div>
                      <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time>
                      <strong>Order #{order._id.slice(-4).toUpperCase()}</strong>
                      <span>{order.items.length} item{order.items.length === 1 ? "" : "s"}</span>
                    </div>
                    <div className="customer-order-total">
                      <span className="customer-order-status customer-order-status-delivered">Delivered</span>
                      <strong>Npr {order.totalAmount}</strong>
                      <button
                        type="button"
                        className="user-order-cancel-button"
                        onClick={() => openModal(order)}
                        disabled={Boolean(processingId)}
                      >
                        Request Return
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {returnedOrders.length > 0 ? (
              <>
                <h3 className="trainer-settings-heading" style={{ marginBottom: 12 }}>Returned Orders</h3>
                <div className="customer-orders-list">
                  {returnedOrders.map((order) => (
                    <article className="customer-order-card" key={order._id}>
                      <div>
                        <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time>
                        <strong>Order #{order._id.slice(-4).toUpperCase()}</strong>
                        <span>{order.items.length} item{order.items.length === 1 ? "" : "s"}</span>
                      </div>
                      <div className="customer-order-total">
                        <span className="customer-order-status customer-order-status-returned">Returned</span>
                        <strong>Npr {order.totalAmount}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}

        {selectedOrder ? (
          <div className="user-order-modal-backdrop" role="presentation" onClick={closeModal}>
            <section className="user-order-cancel-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="user-order-modal-close" onClick={closeModal} aria-label="Close modal">
                <X aria-hidden="true" />
              </button>
              <div className="user-order-modal-heading">
                <span><AlertTriangle aria-hidden="true" /></span>
                <div>
                  <h2>Request Return</h2>
                  <p>Order #{selectedOrder._id.slice(-4).toUpperCase()} · Npr {selectedOrder.totalAmount}</p>
                </div>
              </div>
              <label>
                Reason for return *
                <textarea
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  disabled={Boolean(processingId)}
                  placeholder="Describe the issue (damaged, wrong item, etc.)"
                />
              </label>
              {formError ? <p className="user-order-modal-error">{formError}</p> : null}
              <div className="user-order-modal-actions">
                <button type="button" onClick={closeModal} disabled={Boolean(processingId)}>Cancel</button>
                <button type="button" className="danger" onClick={handleReturn} disabled={Boolean(processingId)}>
                  {processingId ? "Submitting..." : "Submit Return"}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </TrainerDashboardShell>
  );
}
