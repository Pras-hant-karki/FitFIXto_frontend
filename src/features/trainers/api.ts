import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";

export type BackendTrainerUser = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio?: string;
  profilePicture?: string | null;
  isActive: boolean;
};

export type BackendTrainer = {
  _id: string;
  userId: BackendTrainerUser;
  location?: string;
  sessionRate: number;
  experienceYears: number;
  specialties: string[];
  certifications: string[];
  isFeatured: boolean;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TrainerPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
  bio?: string;
  profilePicture?: string;
  location?: string;
  sessionRate: number;
  experienceYears: number;
  specialties: string[];
  certifications: string[];
  isFeatured?: boolean;
  isSuspended?: boolean;
  applicationId?: string;
};

export type TrainerApplicationStatus = "pending" | "approved" | "rejected";

export type BackendTrainerApplication = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  profilePicture?: string | null;
  location?: string;
  sessionRate: number;
  experienceYears: number;
  specialties: string[];
  certifications: string[];
  status: TrainerApplicationStatus;
  createdTrainerId?: string;
  createdAt: string;
  updatedAt: string;
};

export const fetchAdminTrainers = async () => {
  const response = await apiClient.get<{ trainers: BackendTrainer[] }>(API_ENDPOINTS.trainers.list);
  return response.data?.trainers || [];
};

export const fetchTrainerApplications = async () => {
  const response = await apiClient.get<{ applications: BackendTrainerApplication[] }>(API_ENDPOINTS.trainers.applications);
  return response.data?.applications || [];
};

export const createTrainer = async (payload: TrainerPayload & { password: string }) => {
  const response = await apiClient.post<{ trainer: BackendTrainer }>(API_ENDPOINTS.trainers.list, payload);
  return response.data?.trainer;
};

export const updateTrainer = async (trainerId: string, payload: Partial<TrainerPayload>) => {
  const response = await apiClient.put<{ trainer: BackendTrainer }>(API_ENDPOINTS.trainers.detail(trainerId), payload);
  return response.data?.trainer;
};

export const deleteTrainer = async (trainerId: string) => {
  const response = await apiClient.delete<{ trainerId: string }>(API_ENDPOINTS.trainers.detail(trainerId));
  return response.data;
};

export const approveTrainerApplication = async (applicationId: string) => {
  const response = await apiClient.patch<{ application: BackendTrainerApplication }>(API_ENDPOINTS.trainers.approveApplication(applicationId));
  return response.data?.application;
};

export const rejectTrainerApplication = async (applicationId: string) => {
  const response = await apiClient.patch<{ application: BackendTrainerApplication }>(API_ENDPOINTS.trainers.rejectApplication(applicationId));
  return response.data?.application;
};

export const normalizeTrainerPhotoUrl = (url?: string | null) => {
  if (!url) return "";

  const uploadsIndex = url.indexOf("/uploads/");
  if (uploadsIndex >= 0) {
    return `/assets/${url.slice(uploadsIndex + "/uploads/".length)}`;
  }

  return url;
};

const toFrontendAssetUrl = (filename?: string, path?: string) => {
  if (filename) {
    return `/assets/${filename}`;
  }

  return normalizeTrainerPhotoUrl(path);
};

export const uploadTrainerPhoto = async (file: File) => {
  const formData = new FormData();
  formData.append("photo", file);

  const token = apiClient.getAuthToken();
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.trainers.uploadPhoto}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to upload trainer photo.");
  }

  return toFrontendAssetUrl(result.data?.photo?.filename, result.data?.photo?.path);
};
