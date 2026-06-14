import { API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";

export interface BackendProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  brand?: string;
  images: string[];
  tags?: string[];
  sku?: string;
  discountPercentage?: number;
  isFeatured: boolean;
  isActive: boolean;
  verifiedBadge: boolean;
  averageRating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  products: BackendProduct[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const categoryLabels: Record<string, string> = {
  gym_equipment: "Gym Equipment",
  supplements: "Supplements",
  accessories: "Accessories",
};

export const formatCategory = (category: string) => categoryLabels[category] || category;

export const getProductImage = (product: BackendProduct) => product.images[0] || "/home-hero-gym.png";

export const getOriginalPrice = (product: BackendProduct) => {
  const discount = product.discountPercentage || 0;

  if (discount <= 0 || discount >= 100) {
    return null;
  }

  return Math.round((product.price / (1 - discount / 100)) * 100) / 100;
};

export const fetchProducts = async (params?: Record<string, string | number | boolean>) => {
  const response = await apiClient.get<ProductListResponse>(API_ENDPOINTS.products.list, { params });
  return response.data;
};

export type ProductPayload = {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: "gym_equipment" | "supplements" | "accessories";
  brand?: string;
  images: string[];
  tags?: string[];
  sku?: string;
  discountPercentage?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  verifiedBadge?: boolean;
};

export const createProduct = async (payload: ProductPayload) => {
  const response = await apiClient.post<{ product: BackendProduct }>(API_ENDPOINTS.products.list, payload);
  return response.data?.product;
};

export const updateProduct = async (productId: string, payload: Partial<ProductPayload>) => {
  const response = await apiClient.put<{ product: BackendProduct }>(API_ENDPOINTS.products.detail(productId), payload);
  return response.data?.product;
};

export const deleteProduct = async (productId: string) => {
  const response = await apiClient.delete<{ productId: string }>(API_ENDPOINTS.products.detail(productId));
  return response.data;
};
