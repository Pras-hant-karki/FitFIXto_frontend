import { API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";
import type { BackendProduct } from "@/features/products";

export interface BackendWishlistItem {
  productId: BackendProduct;
  addedAt: string;
}

export interface BackendWishlist {
  _id?: string;
  userId?: string;
  items: BackendWishlistItem[];
  createdAt?: string;
  updatedAt?: string;
}

const emptyWishlist: BackendWishlist = { items: [] };

export const fetchWishlist = async () => {
  const response = await apiClient.get<{ wishlist: BackendWishlist }>(API_ENDPOINTS.wishlist.get);
  return response.data?.wishlist || emptyWishlist;
};

export const addWishlistItem = async (productId: string) => {
  const response = await apiClient.post<{ wishlist: BackendWishlist }>(API_ENDPOINTS.wishlist.add, { productId });
  return response.data?.wishlist || emptyWishlist;
};

export const removeWishlistItem = async (productId: string) => {
  const response = await apiClient.request<{ wishlist: BackendWishlist }>(API_ENDPOINTS.wishlist.remove, {
    method: "DELETE",
    body: JSON.stringify({ productId }),
  });

  return response.data?.wishlist || emptyWishlist;
};
