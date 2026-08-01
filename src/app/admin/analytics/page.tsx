"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { AdminAnalytics, AnalyticsRange, fetchAdminAnalytics } from "@/features/admin-analytics/api";
import { normalizeTrainerPhotoUrl } from "@/features/trainers";
import { AnalyticsChart } from "@/components/admin";

const ranges: Array<{ label: string; value: AnalyticsRange }> = [
  { label: "Today", value: "today" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
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

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>("yearly");
  const [analytics, setAnalytics] = useState<AdminAnalytics>(emptyAnalytics);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchAdminAnalytics(range);
        setAnalytics(data || emptyAnalytics);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load analytics.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [range]);

  const maxProductRevenue = useMemo(() => Math.max(...analytics.topProducts.map((product) => product.revenue), 1), [analytics.topProducts]);
  const chartPoints = useMemo(
    () => ({
      revenue: analytics.series.map((point) => ({ label: point.label, value: point.revenue })),
      orders: analytics.series.map((point) => ({ label: point.label, value: point.orders })),
    }),
    [analytics.series]
  );

  return (
    <section className="admin-analytics-page">
      <header className="admin-analytics-header">
        <div>
          <h1>Analytics</h1>
          <p>Revenue, order volume and top performers.</p>
        </div>
        <div className="admin-analytics-range">
          {ranges.map((item) => (
            <button type="button" className={range === item.value ? "active" : undefined} onClick={() => setRange(item.value)} key={item.value}>
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {error ? <p className="admin-products-message error">{error}</p> : null}

      <div className="admin-analytics-summary">
        <article>
          <span>Revenue</span>
          <strong>Npr {Math.round(analytics.summary.revenue).toLocaleString()}</strong>
        </article>
        <article>
          <span>Orders</span>
          <strong>{analytics.summary.orders.toLocaleString()}</strong>
        </article>
        <article>
          <span>Avg. order</span>
          <strong>Npr {Math.round(analytics.summary.averageOrderValue).toLocaleString()}</strong>
        </article>
        <article>
          <span>Products sold</span>
          <strong>{analytics.summary.productsSold.toLocaleString()}</strong>
        </article>
      </div>

      {isLoading ? (
        <div className="admin-products-empty">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="skeleton skeleton-card" style={{ height: 200 }} />
            <div className="skeleton skeleton-card" style={{ height: 200 }} />
          </div>
        </div>
      ) : (
        <div className="admin-analytics-grid">
          <article className="admin-analytics-card">
            <h2>Revenue (Npr)</h2>
            <AnalyticsChart
              points={chartPoints.revenue}
              variant="bar"
              format="currency"
              label="Revenue per period"
              emptyMessage="No revenue recorded in this period."
            />
          </article>

          <article className="admin-analytics-card">
            <h2>Orders</h2>
            <AnalyticsChart
              points={chartPoints.orders}
              format="number"
              label="Orders per period"
              emptyMessage="No orders recorded in this period."
            />
          </article>

          <article className="admin-analytics-card">
            <h2>
              <TrendingUp aria-hidden="true" />
              Top Products
            </h2>
            <div className="admin-product-revenue-bars">
              {analytics.topProducts.map((product) => (
                <div key={product.name}>
                  <span style={{ height: `${(product.revenue / maxProductRevenue) * 100}%` }} />
                  <small>{product.name}</small>
                </div>
              ))}
            </div>
            <div className="admin-analytics-list">
              {analytics.topProducts.map((product, index) => (
                <div key={product.name}>
                  <em>{index + 1}</em>
                  <span>{product.name}</span>
                  <strong>Npr {Math.round(product.revenue).toLocaleString()}</strong>
                </div>
              ))}
              {analytics.topProducts.length === 0 ? <p>No product sales in this range.</p> : null}
            </div>
          </article>

          <article className="admin-analytics-card">
            <h2>
              <TrendingUp aria-hidden="true" />
              Top Trainers
            </h2>
            <div className="admin-analytics-trainers">
              {analytics.topTrainers.map((trainer, index) => (
                <div key={trainer.id}>
                  <em>{index + 1}</em>
                  {normalizeTrainerPhotoUrl(trainer.profilePicture) ? (
                    <img src={normalizeTrainerPhotoUrl(trainer.profilePicture)} alt="" />
                  ) : (
                    <span>{trainer.name.slice(0, 1)}</span>
                  )}
                  <div>
                    <strong>{trainer.name}</strong>
                    <small>{trainer.specialty}</small>
                  </div>
                  <b>{trainer.experienceYears}y exp</b>
                </div>
              ))}
              {analytics.topTrainers.length === 0 ? <p>No trainer data yet.</p> : null}
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
