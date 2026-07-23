"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { TrainerDashboardShell } from "@/components/shared/trainer";
import { BackendOrder, BackendOrderItem, cancelOrder, fetchMyOrders } from "@/features/orders";
import { useToast } from "@/contexts";
import type { BackendProduct } from "@/features/products";

const RETURN_REASONS = [
  "Damaged or defective product",
  "Wrong item received",
  "Item not as described",
  "Changed my mind",
  "Size or fit issue",
  "Better price found elsewhere",
  "Arrived too late",
];

const formatOrderId = (id: string) => `ORD-${id.slice(-4).toUpperCase()}`;

const getItemImage = (item: BackendOrderItem): string | null => {
  if (typeof item.productId === "object" && item.productId !== null) {
    const prod = item.productId as BackendProduct;
    return prod.images?.[0] ?? null;
  }
  return null;
};

type ItemKey = string; // `${orderId}-${itemIndex}`

interface ItemForm {
  reason: string;
  details: string;
  submitting: boolean;
  error: string;
}

const defaultForm = (): ItemForm => ({ reason: "", details: "", submitting: false, error: "" });

export default function TrainerReturnsPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [forms, setForms] = useState<Record<ItemKey, ItemForm>>({});

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchMyOrders();
        if (active) setOrders(data);
      } catch (err) {
        if (active) toast.error(err instanceof Error ? err.message : "Unable to load orders.");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const returnedOrders = orders.filter((o) => o.status === "returned");

  const getForm = (key: ItemKey): ItemForm => forms[key] ?? defaultForm();

  const patchForm = (key: ItemKey, patch: Partial<ItemForm>) =>
    setForms((prev) => ({ ...prev, [key]: { ...getForm(key), ...patch } }));

  const handleSubmit = async (order: BackendOrder, item: BackendOrderItem, key: ItemKey) => {
    const form = getForm(key);
    if (!form.reason) {
      patchForm(key, { error: "Please select a reason for return." });
      return;
    }
    patchForm(key, { submitting: true, error: "" });
    try {
      const reason = `RETURN REQUEST: ${form.reason}${form.details.trim() ? ` — ${form.details.trim()}` : ""} | Item: ${item.productName}`;
      const updated = await cancelOrder(order._id, reason);
      if (updated) setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      toast.success("Return request submitted. Our team will contact you shortly.");
    } catch (err) {
      patchForm(key, {
        submitting: false,
        error: err instanceof Error ? err.message : "Unable to submit return request.",
      });
    }
  };

  return (
    <TrainerDashboardShell>
      <div className="customer-orders-panel">
        <div className="customer-orders-heading">
          <h2>Returns</h2>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0, marginBottom: 24 }}>
          Not satisfied? Request a return for any delivered product.
        </p>

        {isLoading ? (
          <div className="customer-orders-empty">
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: i < 2 ? "1px solid var(--line)" : undefined }}>
                <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                  <div className="skeleton skeleton-text wide" />
                  <div className="skeleton skeleton-text mid" />
                  <div className="skeleton skeleton-text short" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {deliveredOrders.length === 0 ? (
              <div className="customer-orders-empty">No delivered orders eligible for return.</div>
            ) : (
              <div className="returns-item-list">
                {deliveredOrders.flatMap((order) =>
                  order.items.map((item, idx) => {
                    const key = `${order._id}-${idx}`;
                    const form = getForm(key);
                    const img = getItemImage(item);
                    return (
                      <div className="returns-item-card" key={key}>
                        <div className="returns-item-top">
                          <div className="returns-item-img">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={img} alt={item.productName} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8 }} />
                            ) : (
                              <div className="returns-item-img-placeholder"><Package size={28} /></div>
                            )}
                          </div>
                          <div className="returns-item-info">
                            <span className="returns-item-order-id">Order #{formatOrderId(order._id)}</span>
                            <strong className="returns-item-name">{item.productName}</strong>
                            <span className="returns-item-price">Npr {item.unitPrice}</span>
                          </div>
                        </div>

                        <div className="returns-item-form">
                          <label className="returns-form-label">
                            Reason *
                            <select
                              value={form.reason}
                              onChange={(e) => patchForm(key, { reason: e.target.value, error: "" })}
                              disabled={form.submitting}
                              className="returns-reason-select"
                            >
                              <option value="">Select a reason...</option>
                              {RETURN_REASONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </label>

                          <label className="returns-form-label">
                            Additional details (optional)
                            <textarea
                              value={form.details}
                              onChange={(e) => patchForm(key, { details: e.target.value })}
                              disabled={form.submitting}
                              placeholder="Tell us more so we can help faster..."
                              className="returns-details-textarea"
                            />
                          </label>

                          {form.error ? <p className="returns-form-error">{form.error}</p> : null}

                          <div className="returns-form-action">
                            <button
                              type="button"
                              className="returns-submit-btn"
                              onClick={() => handleSubmit(order, item, key)}
                              disabled={form.submitting}
                            >
                              {form.submitting ? "Submitting..." : "Request Return"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {returnedOrders.length > 0 ? (
              <div style={{ marginTop: 36 }}>
                <h3 className="trainer-settings-heading" style={{ marginBottom: 14 }}>Returned Orders</h3>
                <div className="customer-orders-list">
                  {returnedOrders.map((order) => (
                    <article className="customer-order-card" key={order._id}>
                      <div>
                        <strong>Order #{formatOrderId(order._id)}</strong>
                        <span>{order.items.length} item{order.items.length === 1 ? "" : "s"}</span>
                        <time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleDateString()}</time>
                      </div>
                      <div className="customer-order-total">
                        <span className={`customer-order-status customer-order-status-${order.paymentStatus === "refunded" ? "delivered" : order.status}`}>
                          {order.paymentStatus === "refunded" ? "Refunded" : "Returned"}
                        </span>
                        <strong>Npr {order.totalAmount}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </TrainerDashboardShell>
  );
}
