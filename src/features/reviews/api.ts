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
  moderationStatus?: "approved" | "removed";
  isFeatured?: boolean;
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

/**
 * A featured review as shown on the homepage. Product, trainer-session and service reviews are
 * stored differently but the backend normalises them into this one shape.
 */
export interface FeaturedReview {
  id: string;
  kind: "product" | "trainer" | "service";
  rating: number;
  comment: string;
  /** The product, trainer or service the review is about. */
  subject: string;
  authorName: string;
  authorPicture?: string | null;
  updatedAt: string;
}

export const fetchFeaturedReviews = async (): Promise<FeaturedReview[]> => {
  const response = await apiClient.get<{ reviews: FeaturedReview[] }>(API_ENDPOINTS.reviews.featured);
  return response.data?.reviews || [];
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

export const fetchAdminReviews = async (params?: Record<string, string | number>) => {
  const response = await apiClient.get<ReviewListResponse>(API_ENDPOINTS.reviews.admin, { params });
  return response.data;
};

export const moderateReview = async (reviewId: string, status: "approved" | "removed") => {
  const response = await apiClient.patch<{ review: BackendReview }>(API_ENDPOINTS.reviews.moderate(reviewId), {
    status,
  });
  return response.data?.review;
};

export const featureReview = async (reviewId: string, isFeatured: boolean) => {
  const response = await apiClient.patch<{ review: BackendReview }>(
    API_ENDPOINTS.reviews.feature(reviewId),
    { isFeatured }
  );
  return response.data?.review;
};

/** Trainer-session and service reviews are stored on their booking documents. */
export type BookingReviewKind = "trainer" | "service";

export interface BookingReviewState {
  id: string;
  kind: BookingReviewKind;
  isFeatured: boolean;
  moderationStatus?: "approved" | "removed";
}

export const featureBookingReview = async (
  kind: BookingReviewKind,
  bookingId: string,
  isFeatured: boolean
) => {
  const response = await apiClient.patch<BookingReviewState>(
    API_ENDPOINTS.reviews.featureBooking(kind, bookingId),
    { isFeatured }
  );
  return response.data;
};

export const moderateBookingReview = async (
  kind: BookingReviewKind,
  bookingId: string,
  status: "approved" | "removed"
) => {
  const response = await apiClient.patch<BookingReviewState>(
    API_ENDPOINTS.reviews.moderateBooking(kind, bookingId),
    { status }
  );
  return response.data;
};
