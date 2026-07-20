"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Search, X } from "lucide-react";
import { BackendOrder, fetchAdminOrders, processAdminReturn } from "@/features/orders";
import { useToast } from "@/contexts";

const getCustomer = (order: BackendOrder) => {
  if (!order.userId || typeof order.userId === "string") {
    return { name: "Customer", email: "No email" };
  }
  return {
    name: `${order.userId.firstName} ${order.userId.lastName}`.trim() || "Customer",
    email: order.userId.email,
  };
};

const formatOrderId = (id: string) => `ORD-${id.slice(-4).toUpperCase()}`;

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(date));

const formatEmail = (email: string) => {
  if (email.length <= 22) return email;
  const [local] = email.split("@");
  return `${(local ?? "").slice(0, 20)}@...`;
};

const extractReturnReason = (order: BackendOrder): string => {
  const raw = order.cancellationReason ?? order.notes ?? "";
  if (raw.startsWith("RETURN REQUEST:")) {
    const withoutPrefix = raw.replace("RETURN REQUEST:", "").trim();
    const pipeIdx = withoutPrefix.indexOf("| Item:");
    return pipeIdx !== -1 ? withoutPrefix.slice(0, pipeIdx).trim() : withoutPrefix;
  }
  return raw || "No reason provided";
};

const extractReturnItem = (order: BackendOrder): string => {
  const raw = order.cancellationReason ?? order.notes ?? "";
  const match = raw.match(/\| Item: (.+)/);
  return match?.[1] ?? "";
};

export default function AdminReturnsPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<BackendOrder | null>(null);
  const [processingId, setProcessingId] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const all = await fetchAdminOrders({ status: "returned" });
        setOrders(all.orders.filter((o) => o.status === "returned" || o.status === "refunded"));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unable to load returns.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((order) => {
      const customer = getCustomer(order);
      return (
        formatOrderId(order._id).toLowerCase().includes(q) ||
        customer.name.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        order.items.some((i) => i.productName.toLowerCase().includes(q))
      );
    });
  }, [orders, searchQuery]);

  const handleMarkRefunded = async (order: BackendOrder) => {
    if (order.status === "refunded") return;
    setProcessingId(order._id);
    try {
      const updated = await processAdminReturn(order._id);
      if (updated) {
        setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
        if (selectedOrder?._id === updated._id) setSelectedOrder(updated);
      }
      toast.success(`${formatOrderId(order._id)} marked as refunded.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to process refund.");
    } finally {
      setProcessingId("");
    }
  };

  return (
    <section className="admin-orders-page">
      <header className="admin-orders-header">
        <h1>Returns</h1>
        <p>{orders.length} return request{orders.length === 1 ? "" : "s"}</p>
      </header>

      <div className="admin-order-toolbar">
        <div className="admin-order-tabs" role="tablist">
          <button type="button" className="active">
            All Returns <span>{orders.length}</span>
          </button>
          <button type="button" disabled={true}>
            Pending <span>{orders.filter((o) => o.status === "returned").length}</span>
          </button>
          <button type="button" disabled={true}>
            Refunded <span>{orders.filter((o) => o.status === "refunded").length}</span>
          </button>
        </div>

        <label className="admin-order-search">
          <Search aria-hidden="true" />
          <input
            type="search"
            placeholder="Search returns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
      </div>

      <div className="admin-orders-table-card">
        <div className="admin-orders-admin-table admin-returns-table">
          <div className="admin-orders-admin-head">
            <span>Order</span>
            <span>Customer</span>
            <span>Date</span>
            <span>Item</span>
            <span>Total</span>
            <span>Reason</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {isLoading ? (
            <div className="admin-orders-empty">Loading returns...</div>
          ) : filtered.length === 0 ? (
            <div className="admin-orders-empty">No return requests found.</div>
          ) : (
            filtered.map((order) => {
              const customer = getCustomer(order);
              const returnItem = extractReturnItem(order);
              const reason = extractReturnReason(order);
              const isRefunded = order.status === "refunded";

              return (
                <div className="admin-orders-admin-row" key={order._id}>
                  <strong>{formatOrderId(order._id)}</strong>
                  <div className="admin-order-customer">
                    <strong>{customer.name}</strong>
                    <span title={customer.email}>{formatEmail(customer.email)}</span>
                  </div>
                  <span>{formatDate(order.createdAt)}</span>
                  <span className="admin-return-item-name">{returnItem || `${order.items.length} item${order.items.length === 1 ? "" : "s"}`}</span>
                  <strong>Npr {order.totalAmount}</strong>
                  <span className="admin-return-reason" title={reason}>{reason.length > 28 ? `${reason.slice(0, 28)}…` : reason}</span>
                  <span className={`admin-status admin-status-${isRefunded ? "delivered" : "returned"}`}>
                    {isRefunded ? "Refunded" : "Pending"}
                  </span>
                  <div className="admin-order-actions">
                    <button type="button" className="admin-order-view-button" onClick={() => setSelectedOrder(order)}>
                      <Eye aria-hidden="true" />
                      View
                    </button>
                    <button
                      type="button"
                      className="admin-return-refund-btn"
                      onClick={() => handleMarkRefunded(order)}
                      disabled={isRefunded || processingId === order._id}
                    >
                      {processingId === order._id ? "Processing..." : isRefunded ? "Refunded" : "Mark Refunded"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedOrder ? (
        <div className="admin-order-detail-backdrop" role="presentation" onClick={() => setSelectedOrder(null)}>
          <aside className="admin-order-detail" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="admin-form-close" onClick={() => setSelectedOrder(null)} aria-label="Close">
              <X aria-hidden="true" />
            </button>
            <h2>{formatOrderId(selectedOrder._id)}</h2>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 6 }}>
              {getCustomer(selectedOrder).name} — {getCustomer(selectedOrder).email}
            </p>

            <div className="admin-order-detail-lines">
              {selectedOrder.items.map((item) => (
                <div key={`${item.productId}-${item.productName}`}>
                  <span>{item.productName} × {item.quantity}</span>
                  <strong>Npr {item.lineTotal}</strong>
                </div>
              ))}
            </div>
            <div className="admin-order-detail-total">
              <span>Total</span>
              <strong>Npr {selectedOrder.totalAmount}</strong>
            </div>

            <div className="admin-return-detail-reason">
              <strong>Return reason</strong>
              <p>{extractReturnReason(selectedOrder)}</p>
              {extractReturnItem(selectedOrder) ? (
                <p style={{ color: "var(--muted)", fontSize: 12 }}>Item: {extractReturnItem(selectedOrder)}</p>
              ) : null}
            </div>

            <div style={{ marginTop: 18 }}>
              <button
                type="button"
                className="returns-submit-btn"
                style={{ width: "100%" }}
                onClick={() => handleMarkRefunded(selectedOrder)}
                disabled={selectedOrder.status === "refunded" || processingId === selectedOrder._id}
              >
                {processingId === selectedOrder._id
                  ? "Processing..."
                  : selectedOrder.status === "refunded"
                  ? "Already Refunded"
                  : "Mark as Refunded"}
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
