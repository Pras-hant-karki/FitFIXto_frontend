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

export const fetchAllServiceBookings = async (): Promise<BackendServiceBooking[]> => {
  const res = await apiClient.get<{ bookings: BackendServiceBooking[] }>(API_ENDPOINTS.serviceBookings.adminAll);
  return (res as any).data?.bookings ?? [];
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
