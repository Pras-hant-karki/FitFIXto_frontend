import { API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";
import type { BackendProduct } from "@/features/products";

export interface DeliveryAddress {
  _id: string;
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface BackendOrderItem {
  productId: string | BackendProduct;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface BackendOrder {
  _id: string;
  userId?: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  items: BackendOrderItem[];
  deliveryAddressId: DeliveryAddress;
  paymentMethod: "cash_on_delivery" | "esewa" | "khalti";
  paymentStatus: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  shippingMethod?: "standard" | "express" | "overnight";
  shippingAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  estimatedDeliveryDate?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendOrderTracking {
  orderId: string;
  status: string;
  paymentStatus: string;
  placedAt: string;
  lastUpdated: string;
  estimatedDeliveryDate: string | null;
  daysUntilDelivery: number | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  timeline: Array<{
    status: string;
    timestamp?: string;
    label: string;
  }>;
}

export const fetchDeliveryAddresses = async () => {
  const response = await apiClient.get<{ addresses: DeliveryAddress[] }>(API_ENDPOINTS.user.addresses);
  return response.data?.addresses || [];
};

export const createDeliveryAddress = async (payload: Omit<DeliveryAddress, "_id">) => {
  const response = await apiClient.post<{ address: DeliveryAddress }>(API_ENDPOINTS.user.addresses, payload);
  return response.data?.address;
};

export const fetchMyOrders = async () => {
  const response = await apiClient.get<{ orders: BackendOrder[] }>(API_ENDPOINTS.orders.myOrders);
  return response.data?.orders || [];
};

export const fetchAdminOrders = async () => {
  const response = await apiClient.get<{ orders: BackendOrder[] }>(API_ENDPOINTS.orders.adminAll);
  return response.data?.orders || [];
};

export const fetchOrder = async (orderId: string) => {
  const response = await apiClient.get<{ order: BackendOrder }>(API_ENDPOINTS.orders.detail(orderId));
  return response.data?.order;
};

export const fetchOrderTracking = async (orderId: string) => {
  const response = await apiClient.get<{ tracking: BackendOrderTracking }>(API_ENDPOINTS.orders.track(orderId));
  return response.data?.tracking;
};

export const placeOrder = async (payload: {
  deliveryAddressId: string;
  paymentMethod: "cash_on_delivery" | "esewa" | "khalti";
  shippingMethod?: "standard" | "express" | "overnight";
  selectedProductIds?: string[];
  notes?: string;
}) => {
  const response = await apiClient.post<{ order: BackendOrder }>(API_ENDPOINTS.orders.create, payload);
  return response.data?.order;
};

export const cancelOrder = async (orderId: string, reason: string) => {
  const response = await apiClient.patch<{ order: BackendOrder }>(API_ENDPOINTS.orders.cancel(orderId), {
    reason,
  });
  return response.data?.order;
};

export type AdminOrderStatusUpdate = "confirmed" | "shipped" | "delivered";

export const updateAdminOrderStatus = async (orderId: string, status: AdminOrderStatusUpdate) => {
  const response = await apiClient.patch<{ order: BackendOrder }>(API_ENDPOINTS.orders.updateStatus(orderId), {
    status,
  });
  return response.data?.order;
};
