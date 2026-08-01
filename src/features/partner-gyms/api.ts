import { API_BASE_URL, API_ENDPOINTS, resolveAssetUrl } from "@/constants/api";
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
  images: string[];
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
  images?: string[];
  isVisible?: boolean;
};

export const normalizeGymImageUrl = (url?: string | null): string => resolveAssetUrl(url);

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

type UploadedPartnerGymImage = {
  filename: string;
  path: string;
  mimetype: string;
  url?: string;
};

const toFrontendAssetUrl = (image: UploadedPartnerGymImage) =>
  resolveAssetUrl(image.path || image.filename) || image.url || "";

export const uploadPartnerGymImages = async (files: File[]) => {
  const formData = new FormData();

  files.slice(0, 5).forEach((file) => {
    formData.append("images", file);
  });

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.partnerGyms.uploadImages}`, {
    method: "POST",
    headers: {
      ...(apiClient.getAuthToken() ? { Authorization: `Bearer ${apiClient.getAuthToken()}` } : {}),
    },
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to upload partner gym images.");
  }

  const images = (result.data?.images || []) as UploadedPartnerGymImage[];
  return images.map(toFrontendAssetUrl);
};
