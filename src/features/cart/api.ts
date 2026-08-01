import { API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";
import type { BackendProduct } from "@/features/products";

export interface BackendCartItem {
  productId: BackendProduct;
  quantity: number;
  priceAtAdded: number;
}

export interface BackendCart {
  _id?: string;
  userId?: string;
  items: BackendCartItem[];
  createdAt?: string;
  updatedAt?: string;
}

export const getCartLineTotal = (item: BackendCartItem) => item.quantity * item.priceAtAdded;

export const getCartSubtotal = (cart: BackendCart) =>
  cart.items.reduce((total, item) => total + getCartLineTotal(item), 0);

export const fetchCart = async () => {
  const response = await apiClient.get<{ cart: BackendCart }>(API_ENDPOINTS.cart.get);
  return response.data?.cart || { items: [] };
};

export const addCartItem = async (productId: string, quantity = 1) => {
  const response = await apiClient.post<{ cart: BackendCart }>(API_ENDPOINTS.cart.add, { productId, quantity });
  return response.data?.cart || { items: [] };
};

export const updateCartItemQuantity = async (productId: string, quantity: number) => {
  const response = await apiClient.patch<{ cart: BackendCart }>(API_ENDPOINTS.cart.update, { productId, quantity });
  return response.data?.cart || { items: [] };
};

export const removeCartItem = async (productId: string) => {
  const response = await apiClient.delete<{ cart: BackendCart }>(API_ENDPOINTS.cart.remove, {
    body: JSON.stringify({ productId }),
  });
  return response.data?.cart || { items: [] };
};

export const clearCart = async () => {
  const response = await apiClient.delete<{ cart: BackendCart }>(API_ENDPOINTS.cart.clear);
  return response.data?.cart || { items: [] };
};
