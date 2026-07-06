"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { AdminAnalytics, AnalyticsRange, fetchAdminAnalytics } from "@/features/admin-analytics/api";
import { normalizeTrainerPhotoUrl } from "@/features/trainers";

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
  },
  series: [],
  topProducts: [],
  topTrainers: [],
};

const buildLinePoints = (values: number[], maxValue: number) =>
  values
    .map((value, index) => {
      const x = values.length <= 1 ? 260 : 24 + index * (496 / (values.length - 1));
      const y = 250 - (value / Math.max(maxValue, 1)) * 210;
      return `${x},${y}`;
    })
    .join(" ");

const getLabelStep = (range: AnalyticsRange, total: number): number => {
  if (range === "today") return 4;
  if (range === "monthly") return 5;
  return 1;
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

  const maxRevenue = useMemo(() => Math.max(...analytics.series.map((point) => point.revenue), 1), [analytics.series]);
  const maxOrders = useMemo(() => Math.max(...analytics.series.map((point) => point.orders), 1), [analytics.series]);
  const maxProductRevenue = useMemo(() => Math.max(...analytics.topProducts.map((product) => product.revenue), 1), [analytics.topProducts]);
  const orderPoints = buildLinePoints(analytics.series.map((point) => point.orders), maxOrders);

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
        <div className="admin-products-empty">Loading analytics...</div>
      ) : (
        <div className="admin-analytics-grid">
          <article className="admin-analytics-card">
            <h2>Revenue (Npr)</h2>
            <div className="admin-analytics-chart">
              <svg viewBox="0 0 540 300" aria-label="Revenue bar chart">
                {[40, 92, 145, 198, 250].map((y) => (
                  <line x1="24" x2="520" y1={y} y2={y} key={`rh-${y}`} />
                ))}
                {(() => {
                  const count = analytics.series.length;
                  if (count === 0) return null;
                  const totalWidth = 496;
                  const slotWidth = totalWidth / count;
                  const barWidth = Math.max(4, slotWidth * 0.65);
                  const gap = (slotWidth - barWidth) / 2;
                  return analytics.series.map((point, index) => {
                    const barHeight = (point.revenue / Math.max(maxRevenue, 1)) * 210;
                    const x = 24 + index * slotWidth + gap;
                    const y = 250 - barHeight;
                    return (
                      <rect
                        key={`rev-bar-${index}`}
                        x={x}
                        y={barHeight > 0 ? y : 250}
                        width={barWidth}
                        height={Math.max(0, barHeight)}
                        rx={4}
                        ry={4}
                        className="revenue-bar"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="admin-analytics-x-axis">
                {analytics.series
                  .filter((_, i) => i % getLabelStep(range, analytics.series.length) === 0)
                  .map((point, index) => (
                    <span key={`${point.label}-revenue-${index}`}>{point.label}</span>
                  ))}
              </div>
            </div>
          </article>

          <article className="admin-analytics-card">
            <h2>Orders</h2>
            <div className="admin-analytics-chart dark-line">
              <svg viewBox="0 0 540 300" aria-label="Orders chart">
                {[40, 92, 145, 198, 250].map((y) => (
                  <line x1="24" x2="520" y1={y} y2={y} key={`oh-${y}`} />
                ))}
                <polyline points={orderPoints} />
                {orderPoints
                  ? orderPoints.split(" ").map((point) => {
                      const [cx, cy] = point.split(",");
                      return <circle cx={cx} cy={cy} r="5" key={point} />;
                    })
                  : null}
              </svg>
              <div className="admin-analytics-x-axis">
                {analytics.series
                  .filter((_, i) => i % getLabelStep(range, analytics.series.length) === 0)
                  .map((point, index) => (
                    <span key={`${point.label}-orders-${index}`}>{point.label}</span>
                  ))}
              </div>
            </div>
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
