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

export type BackendTrainerProgram = {
  _id: string;
  trainerId: string;
  title: string;
  description?: string;
  durationWeeks: number;
  sessions: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TrainerProgramPayload = {
  title: string;
  description?: string;
  durationWeeks: number;
  sessions: number;
  price: number;
  isActive?: boolean;
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

export const fetchPublicTrainers = async () => {
  const response = await apiClient.get<{ trainers: BackendTrainer[] }>(API_ENDPOINTS.trainers.publicList);
  return response.data?.trainers || [];
};

export const fetchPublicTrainer = async (trainerId: string) => {
  const response = await apiClient.get<{ trainer: BackendTrainer }>(API_ENDPOINTS.trainers.publicDetail(trainerId));
  return response.data?.trainer;
};

export const fetchPublicTrainerPrograms = async (trainerId: string) => {
  const response = await apiClient.get<{ programs: BackendTrainerProgram[] }>(API_ENDPOINTS.trainers.publicPrograms(trainerId));
  return response.data?.programs || [];
};

export const fetchMyTrainerPrograms = async () => {
  const response = await apiClient.get<{ programs: BackendTrainerProgram[] }>(API_ENDPOINTS.trainers.myPrograms);
  return response.data?.programs || [];
};

export const createTrainerProgram = async (payload: TrainerProgramPayload) => {
  const response = await apiClient.post<{ program: BackendTrainerProgram }>(API_ENDPOINTS.trainers.programs, payload);
  return response.data?.program;
};

export const updateTrainerProgram = async (programId: string, payload: Partial<TrainerProgramPayload>) => {
  const response = await apiClient.put<{ program: BackendTrainerProgram }>(API_ENDPOINTS.trainers.programDetail(programId), payload);
  return response.data?.program;
};

export const deleteTrainerProgram = async (programId: string) => {
  const response = await apiClient.delete<{ programId: string }>(API_ENDPOINTS.trainers.programDetail(programId));
  return response.data;
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
