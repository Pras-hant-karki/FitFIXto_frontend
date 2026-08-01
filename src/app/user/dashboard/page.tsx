"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Box, RotateCcw, Settings, Star, CalendarDays, RefreshCw, UserRound } from "lucide-react";
import { useAuth } from "@/contexts";
import { BackendOrder, fetchMyOrders } from "@/features/orders";

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

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
            <Link href="/shop" className="customer-reorder-button">
              <RefreshCw aria-hidden="true" />
              Reorder
            </Link>
          </div>

          {isLoading ? (
            <div className="customer-orders-empty">Loading your orders...</div>
          ) : error ? (
            <div className="customer-orders-empty">{error}</div>
          ) : orders.length === 0 ? (
            <div className="customer-orders-empty">No orders yet. Your real orders will appear here after checkout.</div>
          ) : (
            <div className="customer-orders-list">
              {orders.map((order) => (
                <article className="customer-order-card" key={order._id}>
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
