"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Banknote, Package, Radio, ShoppingBag, Users, type LucideIcon } from "lucide-react";
import { AdminAnalytics, AnalyticsRange, fetchAdminAnalytics } from "@/features/admin-analytics/api";
import { usePreferences } from "@/contexts";
import { AnalyticsChart } from "@/components/admin";
import { BackendOrder, fetchAdminOrders } from "@/features/orders/api";

const RANGE_OPTIONS: Array<{ label: string; value: AnalyticsRange }> = [
  { label: "Today", value: "today" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Half Yearly", value: "half-yearly" },
  { label: "Yearly", value: "yearly" },
];

const emptyAnalytics: AdminAnalytics = {
  range: "yearly",
  summary: {
    revenue: 0,
    orders: 0,
    averageOrderValue: 0,
    productsSold: 0,
    customerCount: 0,
  },
  series: [],
  topProducts: [],
  topTrainers: [],
};

const getOrderCustomer = (order: BackendOrder) => {
  if (!order.userId || typeof order.userId === "string") {
    return "Unknown customer";
  }

  return `${order.userId.firstName || ""} ${order.userId.lastName || ""}`.trim() || order.userId.email;
};

export default function AdminDashboardPage() {
  const { formatPrice } = usePreferences();
  const [range, setRange] = useState<AnalyticsRange>("yearly");
  const [analytics, setAnalytics] = useState<AdminAnalytics>(emptyAnalytics);
  const [recentOrders, setRecentOrders] = useState<BackendOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [analyticsResult, ordersResult] = await Promise.allSettled([
          fetchAdminAnalytics(range),
          fetchAdminOrders(),
        ]);

        if (analyticsResult.status === "fulfilled") {
          setAnalytics(analyticsResult.value || emptyAnalytics);
        } else {
          setError(analyticsResult.reason instanceof Error ? analyticsResult.reason.message : "Unable to load analytics.");
        }

        if (ordersResult.status === "fulfilled") {
          setRecentOrders(ordersResult.value.orders.slice(0, 5));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [range]);

  const statCards: Array<{
    label: string;
    value: string;
    note: string;
    Icon: LucideIcon;
  }> = [
    { label: "Revenue", value: formatPrice(analytics.summary.revenue), note: "From completed order records", Icon: Banknote },
    { label: "Orders", value: String(analytics.summary.orders), note: "Total orders in selected period", Icon: Package },
    { label: "Sales", value: String(analytics.summary.productsSold), note: "Products sold from order items", Icon: ShoppingBag },
    { label: "Customers", value: String(analytics.summary.customerCount ?? 0), note: "Registered customer accounts", Icon: Users },
  ];

  const chartPoints = useMemo(
    () => ({
      revenue: analytics.series.map((point) => ({ label: point.label, value: point.revenue })),
      orders: analytics.series.map((point) => ({ label: point.label, value: point.orders })),
    }),
    [analytics.series]
  );

  return (
    <section className="admin-overview">
      <header className="admin-overview-heading">
        <div>
          <h1>Overview</h1>
          <p>Snapshot of marketplace performance from real backend data.</p>
        </div>
        <div className="admin-analytics-range">
          {RANGE_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              className={range === opt.value ? "active" : undefined}
              onClick={() => setRange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      {error ? <p className="admin-products-message error">{error}</p> : null}

      <div className="admin-stat-grid">
        {statCards.map(({ Icon, ...card }) => (
          <article className="admin-stat-card" key={card.label}>
            <div className="admin-stat-top">
              <span className="admin-stat-icon">
                <Icon aria-hidden="true" />
              </span>
              <span className={isLoading ? "admin-live-pill loading" : "admin-live-pill"} aria-label={isLoading ? "Loading live data" : "Live backend data"}>
                <Radio aria-hidden="true" />
                {isLoading ? "Loading" : "Live"}
              </span>
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
          <AnalyticsChart
            points={chartPoints.revenue}
            format="currency"
            label="Revenue trend"
            emptyMessage="Waiting for revenue data from orders."
          />
        </article>

        <article className="admin-dashboard-card">
          <h2>Order Volume</h2>
          <AnalyticsChart
            points={chartPoints.orders}
            format="number"
            label="Order volume"
            emptyMessage="Waiting for order data."
          />
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
                  <strong>{formatPrice(order.totalAmount)}</strong>
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
                      {product.sold} sold - {formatPrice(product.revenue)}
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
