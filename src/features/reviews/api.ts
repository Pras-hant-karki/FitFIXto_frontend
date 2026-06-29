import { API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";
import type { BackendProduct } from "@/features/products";

export interface BackendReview {
  _id: string;
  userId:
    | string
    | {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
  productId: string | BackendProduct;
  orderId: string;
  rating: number;
  title?: string;
  comment?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewListResponse {
  reviews: BackendReview[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const fetchReviews = async (params?: Record<string, string | number>) => {
  const response = await apiClient.get<ReviewListResponse>(API_ENDPOINTS.reviews.list, { params });
  return response.data;
};

export const fetchMyReviews = async () => {
  const response = await apiClient.get<ReviewListResponse>(API_ENDPOINTS.reviews.my);
  return response.data?.reviews || [];
};

export const createReview = async (payload: {
  productId: string;
  orderId: string;
  rating: number;
  comment?: string;
  title?: string;
}) => {
  const response = await apiClient.post<{ review: BackendReview }>(API_ENDPOINTS.reviews.create, payload);
  return response.data?.review;
};
