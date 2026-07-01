"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Search, X } from "lucide-react";
import { AdminOrderStatusUpdate, BackendOrder, fetchAdminOrders, updateAdminOrderStatus } from "@/features/orders";
import { useToast } from "@/contexts";

type OrderTab = "all" | "pending" | "processing" | "shipped" | "delivered" | "cancelled";

const tabs: Array<{ key: OrderTab; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Order Placed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const adminStatusOptions: Array<{ value: AdminOrderStatusUpdate; label: string }> = [
  { value: "confirmed", label: "Processing" },
  { value: "shipped", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
];

const getCustomer = (order: BackendOrder) => {
  if (!order.userId || typeof order.userId === "string") {
    return { name: "Customer", email: "No email" };
  }

  return {
    name: `${order.userId.firstName} ${order.userId.lastName}`.trim() || "Customer",
    email: order.userId.email,
  };
};

const getDisplayStatus = (status: string): OrderTab | "returned" => {
  if (status === "confirmed") return "processing";
  if (status === "shipped") return "shipped";
  if (status === "delivered") return "delivered";
  if (status === "cancelled") return "cancelled";
  if (status === "returned") return "returned";
  return "pending";
};

const getStatusLabel = (status: string) => {
  if (status === "pending") return "Order Placed";
  if (status === "confirmed") return "Processing";
  if (status === "shipped") return "In Transit";
  if (status === "delivered") return "Delivered";
  if (status === "cancelled") return "Cancelled";
  if (status === "returned") return "Returned";
  return status.replace(/_/g, " ");
};

const getAvailableStatusUpdates = (status: string): AdminOrderStatusUpdate[] => {
  if (status === "pending") return ["confirmed"];
  if (status === "confirmed") return ["shipped"];
  if (status === "shipped") return ["delivered"];
  return [];
};

const formatOrderId = (id: string, index: number) => {
  const shortId = id.slice(-4).toUpperCase();
  return shortId ? `ORD-${shortId}` : `ORD-${3201 - index}`;
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));

const formatCustomerEmail = (email: string) => {
  if (email.length <= 22) return email;

  const [localPart] = email.split("@");
  if (!localPart) return email;

  return `${localPart.slice(0, 24)}@...........`;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [selectedTab, setSelectedTab] = useState<OrderTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<BackendOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);

      try {
        const nextOrders = await fetchAdminOrders();
        setOrders(nextOrders);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unable to load orders.");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  const tabCounts = useMemo(() => {
    const counts: Record<OrderTab, number> = {
      all: orders.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      const status = getDisplayStatus(order.status);
      if (status in counts) {
        counts[status as OrderTab] += 1;
      }
    });

    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return orders.filter((order, index) => {
      const displayStatus = getDisplayStatus(order.status);
      const customer = getCustomer(order);
      const matchesTab = selectedTab === "all" || displayStatus === selectedTab;
      const matchesSearch =
        !query ||
        formatOrderId(order._id, index).toLowerCase().includes(query) ||
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        order.items.some((item) => item.productName.toLowerCase().includes(query));

      return matchesTab && matchesSearch;
    });
  }, [orders, searchQuery, selectedTab]);

  const handleStatusUpdate = async (order: BackendOrder, status: AdminOrderStatusUpdate) => {
    setUpdatingOrderId(order._id);

    try {
      const updatedOrder = await updateAdminOrderStatus(order._id, status);

      if (updatedOrder) {
        setOrders((current) => current.map((item) => (item._id === updatedOrder._id ? updatedOrder : item)));
        setSelectedOrder((current) => (current?._id === updatedOrder._id ? updatedOrder : current));
      }

      toast.success(`Order ${formatOrderId(order._id, 0)} moved to ${getStatusLabel(status)}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update order status.");
    } finally {
      setUpdatingOrderId("");
    }
  };

  return (
    <section className="admin-orders-page">
      <header className="admin-orders-header">
        <h1>Orders</h1>
        <p>{orders.length} orders total</p>
      </header>

      <div className="admin-order-toolbar">
        <div className="admin-order-tabs" role="tablist" aria-label="Order status filters">
          {tabs.map((tab) => (
            <button
              type="button"
              className={selectedTab === tab.key ? "active" : undefined}
              onClick={() => setSelectedTab(tab.key)}
              key={tab.key}
            >
              {tab.label}
              <span>{tabCounts[tab.key]}</span>
            </button>
          ))}
        </div>

        <label className="admin-order-search">
          <Search aria-hidden="true" />
          <input
            type="search"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
      </div>

      <div className="admin-orders-table-card">
        <div className="admin-orders-admin-table">
          <div className="admin-orders-admin-head">
            <span>Order</span>
            <span>Customer</span>
            <span>Date</span>
            <span>Items</span>
            <span>Total</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {isLoading ? (
            <div className="admin-orders-empty">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="admin-orders-empty">No orders found.</div>
          ) : (
            filteredOrders.map((order, index) => {
              const customer = getCustomer(order);
              const status = getDisplayStatus(order.status);
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <div className="admin-orders-admin-row" key={order._id}>
                  <strong>{formatOrderId(order._id, index)}</strong>
                  <div className="admin-order-customer">
                    <strong>{customer.name}</strong>
                    <span title={customer.email}>{formatCustomerEmail(customer.email)}</span>
                  </div>
                  <span>{formatDate(order.createdAt)}</span>
                  <span>{itemCount}</span>
                  <strong>Npr {order.totalAmount}</strong>
                  <span className={`admin-status admin-status-${status}`}>{getStatusLabel(order.status)}</span>
                  <div className="admin-order-actions">
                    <button type="button" className="admin-order-view-button" onClick={() => setSelectedOrder(order)}>
                      <Eye aria-hidden="true" />
                      View
                    </button>
                    <select
                      value=""
                      onChange={(event) => handleStatusUpdate(order, event.target.value as AdminOrderStatusUpdate)}
                      disabled={updatingOrderId === order._id || getAvailableStatusUpdates(order.status).length === 0}
                      aria-label={`Update status for order ${formatOrderId(order._id, index)}`}
                    >
                      <option value="">
                        {updatingOrderId === order._id ? "Updating..." : getAvailableStatusUpdates(order.status).length ? "Update status" : "No action"}
                      </option>
                      {adminStatusOptions.map((option) => (
                        <option value={option.value} disabled={!getAvailableStatusUpdates(order.status).includes(option.value)} key={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedOrder ? (
        <div className="admin-order-detail-backdrop" role="presentation" onClick={() => setSelectedOrder(null)}>
          <aside className="admin-order-detail" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="admin-form-close" onClick={() => setSelectedOrder(null)} aria-label="Close order details">
              <X aria-hidden="true" />
            </button>
            <h2>{formatOrderId(selectedOrder._id, 0)}</h2>
            <p>{getCustomer(selectedOrder).name}</p>
            <div className="admin-order-detail-lines">
              {selectedOrder.items.map((item) => (
                <div key={`${item.productId}-${item.productName}`}>
                  <span>
                    {item.productName} x {item.quantity}
                  </span>
                  <strong>Npr {item.lineTotal}</strong>
                </div>
              ))}
            </div>
            <div className="admin-order-detail-total">
              <span>Total</span>
              <strong>Npr {selectedOrder.totalAmount}</strong>
            </div>
            <label className="admin-order-detail-status">
              <span>Update status</span>
              <select
                value=""
                onChange={(event) => handleStatusUpdate(selectedOrder, event.target.value as AdminOrderStatusUpdate)}
                disabled={updatingOrderId === selectedOrder._id || getAvailableStatusUpdates(selectedOrder.status).length === 0}
              >
                <option value="">
                  {updatingOrderId === selectedOrder._id ? "Updating..." : getAvailableStatusUpdates(selectedOrder.status).length ? "Choose next status" : "No action available"}
                </option>
                {adminStatusOptions.map((option) => (
                  <option value={option.value} disabled={!getAvailableStatusUpdates(selectedOrder.status).includes(option.value)} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
