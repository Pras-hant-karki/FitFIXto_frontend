import { API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";

export type ServiceBookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface BackendServiceBooking {
  _id: string;
  clientId: { _id: string; firstName: string; lastName: string; email: string } | string;
  serviceId: { _id: string; name: string; charge: number; priceLabel: string; image?: string };
  scheduledDate: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes?: string;
  amount: number;
  status: ServiceBookingStatus;
  adminNotes?: string;
  clientRating?: number;
  clientComment?: string;
  /** Admin moderation of the service review shown on the homepage. */
  reviewIsFeatured?: boolean;
  reviewModerationStatus?: "approved" | "removed";
  createdAt: string;
  updatedAt: string;
}

export const createServiceBooking = async (payload: {
  serviceId: string;
  scheduledDate: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes?: string;
}): Promise<BackendServiceBooking> => {
  const res = await apiClient.post<{ booking: BackendServiceBooking }>(API_ENDPOINTS.serviceBookings.create, payload);
  return (res as any).data.booking;
};

export const fetchMyServiceBookings = async (): Promise<BackendServiceBooking[]> => {
  const res = await apiClient.get<{ bookings: BackendServiceBooking[] }>(API_ENDPOINTS.serviceBookings.my);
  return (res as any).data?.bookings ?? [];
};

export type ServiceBookingPaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type AdminServiceBookingsResponse = {
  bookings: BackendServiceBooking[];
  pagination: ServiceBookingPaginationMeta;
};

const DEFAULT_SVC_PAGINATION: ServiceBookingPaginationMeta = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

export const fetchAllServiceBookings = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<AdminServiceBookingsResponse> => {
  const res = await apiClient.get<{ bookings: BackendServiceBooking[]; pagination?: ServiceBookingPaginationMeta }>(
    API_ENDPOINTS.serviceBookings.adminAll,
    { params }
  );
  return {
    bookings: (res as any).data?.bookings ?? [],
    pagination: (res as any).data?.pagination ?? DEFAULT_SVC_PAGINATION,
  };
};

export const updateServiceBookingStatus = async (
  id: string,
  status: ServiceBookingStatus,
  adminNotes?: string
): Promise<BackendServiceBooking> => {
  const res = await apiClient.patch<{ booking: BackendServiceBooking }>(
    API_ENDPOINTS.serviceBookings.updateStatus(id),
    { status, adminNotes }
  );
  return (res as any).data.booking;
};

export const cancelMyServiceBooking = async (id: string): Promise<void> => {
  await apiClient.patch(API_ENDPOINTS.serviceBookings.cancel(id), {});
};

export const submitServiceReview = async (bookingId: string, rating: number, comment: string): Promise<BackendServiceBooking> => {
  const res = await apiClient.patch<{ booking: BackendServiceBooking }>(
    API_ENDPOINTS.serviceBookings.review(bookingId),
    { rating, comment }
  );
  return (res as any).data.booking;
};
