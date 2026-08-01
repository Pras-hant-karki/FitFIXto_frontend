"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Box, RotateCcw, Settings, Star, CalendarDays, RefreshCw, UserRound } from "lucide-react";
import { useAuth, useCart } from "@/contexts";
import { BackendOrder, BackendOrderItem, fetchMyOrders } from "@/features/orders";

const dashboardNav = [
  { label: "Orders", Icon: Box, active: true },
  { label: "Bookings", Icon: CalendarDays },
  { label: "To Review", Icon: Star },
  { label: "Returns", Icon: RotateCcw },
  { label: "Profile", Icon: UserRound, href: "/user/profile" },
  { label: "Settings", Icon: Settings },
];

const formatOrderId = (id: string) => `ORD-${id.slice(-4).toUpperCase()}`;

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));

const formatStatus = (status: string) => {
  if (status === "pending") return "Order Placed";
  if (status === "confirmed" || status === "shipped") return "Processing";
  return status.replace(/_/g, " ");
};

const getUserName = (email?: string) => {
  if (!email) return "customer";
  return email.split("@")[0] || "customer";
};

const getOrderProductId = (item: BackendOrderItem) => {
  if (typeof item.productId === "string") return item.productId;
  return item.productId?._id || "";
};

export default function UserDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState("");
  const [reorderError, setReorderError] = useState("");

  const username = useMemo(() => getUserName(user?.email), [user?.email]);

  useEffect(() => {
    let isActive = true;

    const loadOrders = async () => {
      setIsLoading(true);
      setError("");

      try {
        const nextOrders = await fetchMyOrders();
        if (isActive) {
          setOrders(nextOrders);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Unable to load your orders.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      isActive = false;
    };
  }, []);

  const toggleSelectedOrder = (orderId: string) => {
    setReorderError("");
    setSelectedOrderIds((current) =>
      current.includes(orderId) ? current.filter((id) => id !== orderId) : [...current, orderId]
    );
  };

  const handleReorder = async () => {
    setReorderError("");

    if (!isReorderMode) {
      setIsReorderMode(true);
      return;
    }

    if (selectedOrderIds.length === 0) {
      setReorderError("Select at least one order to reorder.");
      return;
    }

    const productQuantities = new Map<string, number>();
    orders
      .filter((order) => selectedOrderIds.includes(order._id))
      .flatMap((order) => order.items)
      .forEach((item) => {
        const productId = getOrderProductId(item);
        if (!productId) return;
        productQuantities.set(productId, (productQuantities.get(productId) || 0) + item.quantity);
      });

    if (productQuantities.size === 0) {
      setReorderError("This order no longer has products available to reorder.");
      return;
    }

    setIsReordering(true);

    try {
      for (const [productId, quantity] of productQuantities) {
        await addToCart(productId, quantity);
      }

      const checkoutItems = Array.from(productQuantities.keys()).join(",");
      router.push(`/checkout?items=${encodeURIComponent(checkoutItems)}`);
    } catch (err) {
      setReorderError(err instanceof Error ? err.message : "Unable to prepare reorder checkout.");
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <section className="customer-dashboard-page">
      <header className="customer-dashboard-header">
        <h1>Welcome back, {username}.</h1>
        <p>Manage orders, bookings and your account.</p>
      </header>

      <div className="customer-dashboard-layout">
        <nav className="customer-dashboard-nav" aria-label="Customer dashboard navigation">
          {dashboardNav.map(({ label, Icon, active, href }) => {
            const content = (
              <>
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </>
            );

            return href ? (
              <Link href={href} className={active ? "active" : undefined} key={label}>
                {content}
              </Link>
            ) : (
              <button type="button" className={active ? "active" : undefined} key={label} disabled={!active}>
                {content}
              </button>
            );
          })}
        </nav>

        <div className="customer-orders-panel">
          <div className="customer-orders-heading">
            <h2>Your Orders</h2>
            <button type="button" className="customer-reorder-button" onClick={handleReorder} disabled={isLoading || isReordering || orders.length === 0}>
              <RefreshCw aria-hidden="true" />
              {isReordering ? "Preparing..." : "Reorder"}
            </button>
          </div>
          {isReorderMode ? (
            <p className="customer-reorder-hint">
              Select the order you want to reorder, then click Reorder again.
              {selectedOrderIds.length > 0 ? ` ${selectedOrderIds.length} selected.` : ""}
            </p>
          ) : null}
          {reorderError ? <p className="customer-reorder-error">{reorderError}</p> : null}

          {isLoading ? (
            <div className="customer-orders-empty">Loading your orders...</div>
          ) : error ? (
            <div className="customer-orders-empty">{error}</div>
          ) : orders.length === 0 ? (
            <div className="customer-orders-empty">No orders yet. Your real orders will appear here after checkout.</div>
          ) : (
            <div className="customer-orders-list">
              {orders.map((order) => (
                <article className={`customer-order-card ${isReorderMode ? "customer-order-card-selectable" : ""}`} key={order._id}>
                  {isReorderMode ? (
                    <label className="customer-order-select" aria-label={`Select order ${formatOrderId(order._id)} to reorder`}>
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order._id)}
                        onChange={() => toggleSelectedOrder(order._id)}
                      />
                      <span />
                    </label>
                  ) : null}
                  <div>
                    <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time>
                    <strong>Order #{formatOrderId(order._id)}</strong>
                    <span>
                      {order.items.length} item{order.items.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="customer-order-total">
                    <span className={`customer-order-status customer-order-status-${order.status}`}>
                      {formatStatus(order.status)}
                    </span>
                    <strong>Npr {order.totalAmount}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
