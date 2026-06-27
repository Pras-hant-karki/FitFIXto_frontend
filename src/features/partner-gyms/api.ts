import { API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";

export type BackendPartnerGym = {
  _id: string;
  name: string;
  address: string;
  phone?: string;
  hours?: string;
  rating?: number;
  pin?: string;
  locationUrl?: string;
  imageUrl?: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PartnerGymPayload = {
  name: string;
  address: string;
  phone?: string;
  hours?: string;
  rating?: number;
  pin?: string;
  locationUrl?: string;
  imageUrl?: string;
  isVisible?: boolean;
};

export const normalizeGymImageUrl = (url?: string | null) => {
  if (!url) return "";

  const uploadsIndex = url.indexOf("/uploads/");
  if (uploadsIndex >= 0) {
    return `/assets/${url.slice(uploadsIndex + "/uploads/".length)}`;
  }

  return url;
};

export const fetchPartnerGyms = async () => {
  const response = await apiClient.get<{ gyms: BackendPartnerGym[] }>(API_ENDPOINTS.partnerGyms.list);
  return response.data?.gyms || [];
};

export const fetchPublicPartnerGyms = async () => {
  const response = await apiClient.get<{ gyms: BackendPartnerGym[] }>(API_ENDPOINTS.partnerGyms.publicList);
  return response.data?.gyms || [];
};

export const createPartnerGym = async (payload: PartnerGymPayload) => {
  const response = await apiClient.post<{ gym: BackendPartnerGym }>(API_ENDPOINTS.partnerGyms.list, payload);
  return response.data?.gym;
};

export const updatePartnerGym = async (gymId: string, payload: Partial<PartnerGymPayload>) => {
  const response = await apiClient.put<{ gym: BackendPartnerGym }>(API_ENDPOINTS.partnerGyms.detail(gymId), payload);
  return response.data?.gym;
};

export const deletePartnerGym = async (gymId: string) => {
  const response = await apiClient.delete<{ gymId: string }>(API_ENDPOINTS.partnerGyms.detail(gymId));
  return response.data;
};
