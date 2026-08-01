import { API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface PopulatedTrainer {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string | null;
  };
  location?: string;
  sessionRate?: number;
}

export interface PopulatedClient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profilePicture?: string | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface BackendBooking {
  _id: string;
  clientId: string | PopulatedClient;
  trainerId: string | PopulatedTrainer;
  slotDate: string;
  timeLabel: string;
  sessionType: "single" | "five_pack" | "ten_pack";
  sessionCount: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  paymentMethod: "esewa" | "khalti" | "card" | "cash";
  subtotal: number;
  serviceFee: number;
  totalAmount: number;
  status: BookingStatus;
  notes?: string;
  trainerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainerClient {
  user: PopulatedClient;
  bookingCount: number;
  lastBooking: string;
}

export const createBooking = async (payload: {
  trainerId: string;
  slotDate: string;
  timeLabel: string;
  sessionType: "single" | "five_pack" | "ten_pack";
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  paymentMethod: "esewa" | "khalti" | "card" | "cash";
  notes?: string;
}) => {
  const response = await apiClient.post<{ booking: BackendBooking }>(
    API_ENDPOINTS.bookings.create,
    payload
  );
  return response.data?.booking;
};

export const fetchMyClientBookings = async (): Promise<BackendBooking[]> => {
  const response = await apiClient.get<{ bookings: BackendBooking[] }>(
    API_ENDPOINTS.bookings.myClient
  );
  return response.data?.bookings || [];
};

export const fetchMyTrainerBookings = async (): Promise<BackendBooking[]> => {
  const response = await apiClient.get<{ bookings: BackendBooking[] }>(
    API_ENDPOINTS.bookings.myTrainer
  );
  return response.data?.bookings || [];
};

export const fetchMyTrainerClients = async (): Promise<TrainerClient[]> => {
  const response = await apiClient.get<{ clients: TrainerClient[] }>(
    API_ENDPOINTS.bookings.myClients
  );
  return response.data?.clients || [];
};

export const updateBookingStatus = async (
  bookingId: string,
  status: "confirmed" | "cancelled" | "completed",
  trainerNotes?: string
) => {
  const response = await apiClient.patch<{ booking: BackendBooking }>(
    API_ENDPOINTS.bookings.updateStatus(bookingId),
    { status, ...(trainerNotes !== undefined && { trainerNotes }) }
  );
  return response.data?.booking;
};

export const cancelClientBooking = async (bookingId: string) => {
  const response = await apiClient.patch<{ booking: BackendBooking }>(
    API_ENDPOINTS.bookings.cancel(bookingId),
    {}
  );
  return response.data?.booking;
};
