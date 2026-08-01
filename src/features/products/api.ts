import { API_BASE_URL, API_ENDPOINTS, resolveAssetUrl } from "@/constants/api";
import { apiClient } from "@/lib";
import { getCategoryLabel } from "./categories";

export interface BackendProduct {
  _id: string;
  name: string;
  description: string;
  specifications?: string;
  importedFrom?: string;
  warrantyMonths?: number;
  price: number;
  stock: number;
  category: string;
  subcategory?: string;
  brand?: string;
  images: string[];
  tags?: string[];
  sku?: string;
  discountPercentage?: number;
  weight?: number;
  weightUnit?: "gm" | "kg";
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
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

export const formatCategory = (category: string) => getCategoryLabel(category);

export const resolveProductImageUrl = (img: string): string => resolveAssetUrl(img);

export const getProductImage = (product: BackendProduct): string =>
  resolveProductImageUrl(product.images[0] || "");

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

export const fetchProduct = async (productId: string) => {
  const response = await apiClient.get<{ product: BackendProduct }>(API_ENDPOINTS.products.detail(productId));
  return response.data?.product;
};

export const fetchComparedProducts = async (productIds: string[]) => {
  const response = await apiClient.get<{ products: BackendProduct[]; comparedCount: number }>(API_ENDPOINTS.products.compare, {
    params: { ids: productIds.join(",") },
  });
  return response.data?.products || [];
};

export type ProductPayload = {
  name: string;
  description: string;
  specifications?: string;
  importedFrom?: string;
  warrantyMonths?: number;
  price: number;
  stock: number;
  category: string;
  subcategory?: string;
  brand?: string;
  images: string[];
  tags?: string[];
  sku?: string;
  discountPercentage?: number;
  weight?: number;
  weightUnit?: "gm" | "kg";
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
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

type UploadedProductImage = {
  filename: string;
  path: string;
  mimetype: string;
  url?: string;
};

const toFrontendAssetUrl = (image: UploadedProductImage) => {
  if (image.path) return resolveAssetUrl(image.path);
  if (image.filename) return resolveAssetUrl(image.filename);
  return resolveAssetUrl(image.url) || "";
};

export const uploadProductImages = async (files: File[]) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.products.uploadImages}`, {
    method: "POST",
    headers: {
      ...(apiClient.getAuthToken() ? { Authorization: `Bearer ${apiClient.getAuthToken()}` } : {}),
    },
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to upload product images.");
  }

  const images = (result.data?.images || []) as UploadedProductImage[];
  return images.map(toFrontendAssetUrl);
};
