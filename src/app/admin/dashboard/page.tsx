import Link from "next/link";
import { ArrowRight, Package, TrendingUp, UserCog, Users, type LucideIcon } from "lucide-react";

const statCards: Array<{
  label: string;
  value: string;
  change: string;
  Icon?: LucideIcon;
  iconText?: string;
}> = [
  { label: "Revenue", value: "Npr 84,210", change: "12.4%", iconText: "Npr" },
  { label: "Orders", value: "1,284", change: "8.1%", Icon: Package },
  { label: "Customers", value: "5", change: "14.7%", Icon: Users },
  { label: "Trainers", value: "4", change: "5.2%", Icon: UserCog },
];

const monthlyRevenue = [
  { month: "Jan", value: 31 },
  { month: "Feb", value: 40 },
  { month: "Mar", value: 37 },
  { month: "Apr", value: 52 },
  { month: "May", value: 64 },
  { month: "Jun", value: 72 },
];

const weeklyOrders = [
  { day: "Mon", value: 18 },
  { day: "Tue", value: 24 },
  { day: "Wed", value: 31 },
  { day: "Thu", value: 28 },
  { day: "Fri", value: 42 },
  { day: "Sat", value: 51 },
  { day: "Sun", value: 38 },
];

const recentOrders = [
  { id: "ORD-3201", customer: "Bishal R.", status: "processing", total: "Npr 599" },
  { id: "ORD-3200", customer: "Priya M.", status: "delivered", total: "Npr 1299" },
  { id: "ORD-3199", customer: "Kiran T.", status: "pending", total: "Npr 79" },
  { id: "ORD-3198", customer: "Sneha K.", status: "delivered", total: "Npr 2499" },
  { id: "ORD-3197", customer: "Aarav S.", status: "cancelled", total: "Npr 349" },
];

const topProducts = [
  { name: "Pro Hex Dumbbell Set 5-50lbs", meta: "312 sold · Npr 599" },
  { name: "Olympic Power Rack PRO-X", meta: "187 sold · Npr 1299" },
  { name: "Premium Whey Isolate 5lb", meta: "1204 sold · Npr 79" },
  { name: "Commercial Treadmill T-9000", meta: "89 sold · Npr 2499" },
  { name: "Adjustable Bench AB-Pro", meta: "423 sold · Npr 349" },
];

const yAxisLabels = [80, 60, 40, 20, 0];
const weeklyPoints = weeklyOrders
  .map((item, index) => {
    const x = 24 + index * 80;
    const y = 260 - (item.value / 60) * 220;
    return `${x},${y}`;
  })
  .join(" ");

export default function AdminDashboardPage() {
  return (
    <section className="admin-overview">
      <header className="admin-overview-heading">
        <h1>Overview</h1>
        <p>Snapshot of marketplace performance.</p>
      </header>

      <div className="admin-stat-grid">
        {statCards.map((card) => {
          const Icon = card.Icon;

          return (
            <article className="admin-stat-card" key={card.label}>
              <div className="admin-stat-top">
                <span className="admin-stat-icon">
                  {Icon ? <Icon aria-hidden="true" /> : <span>{card.iconText}</span>}
                </span>
                <span className="admin-stat-change">
                  <TrendingUp aria-hidden="true" />
                  {card.change}
                </span>
              </div>
              <strong>{card.value}</strong>
              <p>{card.label}</p>
            </article>
          );
        })}
      </div>

      <div className="admin-chart-grid">
        <article className="admin-dashboard-card">
          <h2>Monthly Revenue</h2>
          <div className="admin-bar-chart" aria-label="Monthly revenue chart">
            <div className="admin-chart-y-axis">
              {yAxisLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="admin-bar-plot">
              {monthlyRevenue.map((item) => (
                <div className="admin-bar-item" key={item.month}>
                  <span style={{ height: `${(item.value / 80) * 100}%` }} />
                  <small>{item.month}</small>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="admin-dashboard-card">
          <h2>Weekly Orders</h2>
          <div className="admin-line-chart" aria-label="Weekly orders chart">
            <div className="admin-line-y-axis">
              {[60, 45, 30, 15, 0].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <svg viewBox="0 0 540 300" role="img" aria-hidden="true">
              {[40, 95, 150, 205, 260].map((y) => (
                <line x1="24" x2="520" y1={y} y2={y} key={`h-${y}`} />
              ))}
              {[24, 104, 184, 264, 344, 424, 504].map((x) => (
                <line x1={x} x2={x} y1="40" y2="260" key={`v-${x}`} />
              ))}
              <polyline points={weeklyPoints} />
              {weeklyPoints.split(" ").map((point) => {
                const [cx, cy] = point.split(",");
                return <circle cx={cx} cy={cy} r="7" key={point} />;
              })}
            </svg>
            <div className="admin-line-x-axis">
              {weeklyOrders.map((item) => (
                <span key={item.day}>{item.day}</span>
              ))}
            </div>
          </div>
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
          <div className="admin-orders-table">
            <div className="admin-orders-head">
              <span>Order</span>
              <span>Customer</span>
              <span>Status</span>
              <span>Total</span>
            </div>
            {recentOrders.map((order) => (
              <div className="admin-orders-row" key={order.id}>
                <strong>{order.id}</strong>
                <span>{order.customer}</span>
                <span className={`admin-status admin-status-${order.status}`}>{order.status}</span>
                <strong>{order.total}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-dashboard-card admin-top-products-card">
          <div className="admin-card-header">
            <h2>Top Products</h2>
            <Link href="/admin/products">
              Manage <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <div className="admin-top-product-list">
            {topProducts.map((product, index) => (
              <div className="admin-top-product" key={product.name}>
                <span className="admin-product-thumb">{index + 1}</span>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.meta}</span>
                </div>
                <em>{index + 1}</em>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
