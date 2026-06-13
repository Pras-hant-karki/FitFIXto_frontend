"use client";

import { useEffect, useState } from "react";
import { RouteShell } from "@/components/shared";
import { BackendOrder, fetchMyOrders } from "@/features/orders";

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      setError("");

      try {
        const nextOrders = await fetchMyOrders();
        setOrders(nextOrders);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load orders.");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  return (
    <RouteShell
      eyebrow="Account"
      title="Orders"
      description="Track equipment orders, service bookings and delivery updates."
      actionHref="/shop"
      actionLabel="Continue Shopping"
    >
      {isLoading ? (
        <div className="empty-state">
          <strong>Loading orders...</strong>
          <span>Please wait while we fetch your order history.</span>
        </div>
      ) : error ? (
        <div className="empty-state">
          <strong>Unable to load orders.</strong>
          <span>{error}</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <strong>No orders yet.</strong>
          <span>Your order history will appear here.</span>
        </div>
      ) : (
        <div className="connected-list">
          {orders.map((order) => (
            <article className="connected-list-item order-list-item" key={order._id}>
              <div>
                <strong>Order #{order._id.slice(-8).toUpperCase()}</strong>
                <span>
                  {order.items.length} item{order.items.length === 1 ? "" : "s"} - {order.status}
                </span>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <strong>${order.totalAmount.toFixed(2)}</strong>
                <span>{order.paymentStatus}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </RouteShell>
  );
}
