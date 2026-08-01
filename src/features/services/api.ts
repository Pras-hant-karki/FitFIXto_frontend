import { API_BASE_URL, API_ENDPOINTS, resolveAssetUrl } from "@/constants/api";
import { apiClient } from "@/lib";

export interface BackendService {
  _id: string;
  name: string;
  description: string;
  priceLabel: string;
  charge: number;
  features: string[];
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServicePayload {
  name: string;
  description: string;
  priceLabel?: string;
  charge?: number;
  features?: string[];
  image?: string;
  isActive?: boolean;
}

export const fetchAdminServices = async (): Promise<BackendService[]> => {
  const res = await apiClient.get<{ services: BackendService[] }>(API_ENDPOINTS.services.list);
  return res.data?.services || [];
};

export const fetchPublicServices = async (): Promise<BackendService[]> => {
  const res = await apiClient.get<{ services: BackendService[] }>(API_ENDPOINTS.services.publicList);
  return res.data?.services || [];
};

export const createService = async (payload: ServicePayload): Promise<BackendService | undefined> => {
  const res = await apiClient.post<{ service: BackendService }>(API_ENDPOINTS.services.create, payload);
  return res.data?.service;
};

export const updateService = async (id: string, payload: Partial<ServicePayload>): Promise<BackendService | undefined> => {
  const res = await apiClient.put<{ service: BackendService }>(API_ENDPOINTS.services.detail(id), payload);
  return res.data?.service;
};

export const deleteService = async (id: string): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.services.detail(id));
};

export const uploadServiceImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);

  const token = apiClient.getAuthToken();
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.services.uploadImage}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Unable to upload image.");

  return resolveAssetUrl(result.data?.image?.path || "");
};
