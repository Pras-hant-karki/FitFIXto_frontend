"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, DollarSign, Package, ShoppingBag, UserCog, Users, type LucideIcon } from "lucide-react";
import { AdminAnalytics, fetchAdminAnalytics } from "@/features/admin-analytics/api";
import { fetchAdminUsers } from "@/features/admin-users/api";
import { BackendOrder, fetchAdminOrders } from "@/features/orders/api";

const emptyAnalytics: AdminAnalytics = {
  range: "yearly",
  summary: {
    revenue: 0,
    orders: 0,
    averageOrderValue: 0,
    productsSold: 0,
  },
  series: [],
  topProducts: [],
  topTrainers: [],
};

const formatMoney = (value: number) => `Npr ${Math.round(value).toLocaleString()}`;

const getOrderCustomer = (order: BackendOrder) => {
  if (!order.userId || typeof order.userId === "string") {
    return "Unknown customer";
  }

  return `${order.userId.firstName || ""} ${order.userId.lastName || ""}`.trim() || order.userId.email;
};

const buildLinePoints = (values: number[], maxValue: number) =>
  values
    .map((value, index) => {
      const x = values.length <= 1 ? 260 : 24 + index * (496 / (values.length - 1));
      const y = 260 - (value / Math.max(maxValue, 1)) * 220;
      return `${x},${y}`;
    })
    .join(" ");

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<AdminAnalytics>(emptyAnalytics);
  const [recentOrders, setRecentOrders] = useState<BackendOrder[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [trainerCount, setTrainerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [analyticsData, users, orders] = await Promise.all([
          fetchAdminAnalytics("yearly"),
          fetchAdminUsers(),
          fetchAdminOrders(),
        ]);

        setAnalytics(analyticsData || emptyAnalytics);
        setCustomerCount(users.filter((user) => user.role === "customer").length);
        setTrainerCount(users.filter((user) => user.role === "trainer").length);
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const statCards: Array<{
    label: string;
    value: string;
    note: string;
    Icon: LucideIcon;
  }> = [
    { label: "Revenue", value: formatMoney(analytics.summary.revenue), note: "From completed order records", Icon: DollarSign },
    { label: "Orders", value: String(analytics.summary.orders), note: "Total orders in selected period", Icon: Package },
    { label: "Sales", value: String(analytics.summary.productsSold), note: "Products sold from order items", Icon: ShoppingBag },
    { label: "Customers", value: String(customerCount), note: "Registered customer accounts", Icon: Users },
    { label: "Trainers", value: String(trainerCount), note: "Registered trainer accounts", Icon: UserCog },
  ];

  const revenueSeries = analytics.series.map((point) => point.revenue);
  const orderSeries = analytics.series.map((point) => point.orders);
  const hasRevenueData = revenueSeries.some((value) => value > 0);
  const hasOrderData = orderSeries.some((value) => value > 0);
  const maxRevenue = useMemo(() => Math.max(...revenueSeries, 1), [revenueSeries]);
  const maxOrders = useMemo(() => Math.max(...orderSeries, 1), [orderSeries]);
  const revenuePoints = buildLinePoints(revenueSeries, maxRevenue);
  const orderPoints = buildLinePoints(orderSeries, maxOrders);

  return (
    <section className="admin-overview">
      <header className="admin-overview-heading">
        <h1>Overview</h1>
        <p>Snapshot of marketplace performance from real backend data.</p>
      </header>

      {error ? <p className="admin-products-message error">{error}</p> : null}

      <div className="admin-stat-grid">
        {statCards.map(({ Icon, ...card }) => (
          <article className="admin-stat-card" key={card.label}>
            <div className="admin-stat-top">
              <span className="admin-stat-icon">
                <Icon aria-hidden="true" />
              </span>
              <span className="admin-stat-note">{isLoading ? "Loading" : "Live"}</span>
            </div>
            <strong>{isLoading ? "..." : card.value}</strong>
            <p>{card.label}</p>
            <small>{card.note}</small>
          </article>
        ))}
      </div>

      <div className="admin-chart-grid">
        <article className="admin-dashboard-card">
          <h2>Revenue Trend</h2>
          {hasRevenueData ? (
            <div className="admin-line-chart" aria-label="Revenue trend chart">
              <div className="admin-line-y-axis">
                {[maxRevenue, maxRevenue * 0.75, maxRevenue * 0.5, maxRevenue * 0.25, 0].map((label) => (
                  <span key={label}>{Math.round(label)}</span>
                ))}
              </div>
              <svg viewBox="0 0 540 300" role="img" aria-hidden="true">
                {[40, 95, 150, 205, 260].map((y) => (
                  <line x1="24" x2="520" y1={y} y2={y} key={`rh-${y}`} />
                ))}
                <polyline points={revenuePoints} />
              </svg>
              <div className="admin-line-x-axis">
                {analytics.series.map((item) => (
                  <span key={item.label}>{item.label}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="admin-dashboard-empty">Waiting for revenue data from orders.</div>
          )}
        </article>

        <article className="admin-dashboard-card">
          <h2>Order Volume</h2>
          {hasOrderData ? (
            <div className="admin-line-chart" aria-label="Order volume chart">
              <div className="admin-line-y-axis">
                {[maxOrders, maxOrders * 0.75, maxOrders * 0.5, maxOrders * 0.25, 0].map((label) => (
                  <span key={label}>{Math.round(label)}</span>
                ))}
              </div>
              <svg viewBox="0 0 540 300" role="img" aria-hidden="true">
                {[40, 95, 150, 205, 260].map((y) => (
                  <line x1="24" x2="520" y1={y} y2={y} key={`oh-${y}`} />
                ))}
                <polyline points={orderPoints} />
                {orderPoints
                  ? orderPoints.split(" ").map((point) => {
                      const [cx, cy] = point.split(",");
                      return <circle cx={cx} cy={cy} r="7" key={point} />;
                    })
                  : null}
              </svg>
              <div className="admin-line-x-axis">
                {analytics.series.map((item) => (
                  <span key={item.label}>{item.label}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="admin-dashboard-empty">Waiting for order data.</div>
          )}
        </article>
      </div>

      <div className="admin-bottom-grid">
        <article className="admin-dashboard-card admin-orders-card">
          <div className="admin-card-header">
            <h2>Recent Orders</h2>
            <Link href="/admin/orders">
              View all <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          {recentOrders.length ? (
            <div className="admin-orders-table">
              <div className="admin-orders-head">
                <span>Order</span>
                <span>Customer</span>
                <span>Status</span>
                <span>Total</span>
              </div>
              {recentOrders.map((order) => (
                <div className="admin-orders-row" key={order._id}>
                  <strong>{order._id.slice(-8).toUpperCase()}</strong>
                  <span>{getOrderCustomer(order)}</span>
                  <span className={`admin-status admin-status-${order.status}`}>{order.status}</span>
                  <strong>{formatMoney(order.totalAmount)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-dashboard-empty">No orders yet.</div>
          )}
        </article>

        <article className="admin-dashboard-card admin-top-products-card">
          <div className="admin-card-header">
            <h2>Top Products</h2>
            <Link href="/admin/products">
              Manage <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          {analytics.topProducts.length ? (
            <div className="admin-top-product-list">
              {analytics.topProducts.map((product, index) => (
                <div className="admin-top-product" key={product.name}>
                  <span className="admin-product-thumb">{index + 1}</span>
                  <div>
                    <strong>{product.name}</strong>
                    <span>
                      {product.sold} sold - {formatMoney(product.revenue)}
                    </span>
                  </div>
                  <em>{index + 1}</em>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-dashboard-empty">No product sales yet.</div>
          )}
        </article>
      </div>
    </section>
  );
}
