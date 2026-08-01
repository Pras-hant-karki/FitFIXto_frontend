import { API_BASE_URL, API_ENDPOINTS, resolveAssetUrl } from "@/constants/api";
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
  averageRating?: number;
  ratingCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type BackendTrainerProgram = {
  _id: string;
  trainerId: string;
  title: string;
  description?: string;
  programType: string;
  level: "beginner" | "intermediate" | "advanced";
  image?: string | null;
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
  programType?: string;
  level?: "beginner" | "intermediate" | "advanced";
  image?: string;
  durationWeeks: number;
  sessions: number;
  price: number;
  isActive?: boolean;
};

export type TrainerAvailabilityDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type BackendTrainerAvailability = {
  _id: string;
  trainerId: string;
  dayOfWeek: TrainerAvailabilityDay;
  timeLabel: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TrainerAvailabilityPayload = {
  dayOfWeek: TrainerAvailabilityDay;
  timeLabel: string;
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
  certificationFiles: string[];
  status: TrainerApplicationStatus;
  createdTrainerId?: string;
  createdAt: string;
  updatedAt: string;
};

export const fetchAdminTrainers = async (params?: { page?: number; limit?: number }) => {
  const response = await apiClient.get<{ trainers: BackendTrainer[] }>(API_ENDPOINTS.trainers.list, { params });
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

export const fetchPublicTrainerAvailability = async (trainerId: string) => {
  const response = await apiClient.get<{ availability: BackendTrainerAvailability[]; availableDates: { date: string }[] }>(API_ENDPOINTS.trainers.publicAvailability(trainerId));
  return {
    availability: response.data?.availability || [],
    availableDates: (response.data?.availableDates || []).map((d) => d.date.slice(0, 10)),
  };
};

export interface BackendTrainerReview {
  _id: string;
  clientRating: number;
  clientComment?: string;
  slotDate?: string;
  timeLabel?: string;
  clientId?: { _id: string; firstName?: string; lastName?: string; profilePicture?: string };
}

export const fetchPublicTrainerReviews = async (trainerId: string): Promise<BackendTrainerReview[]> => {
  const response = await apiClient.get<{ reviews: BackendTrainerReview[] }>(API_ENDPOINTS.trainers.publicReviews(trainerId));
  return response.data?.reviews || [];
};

export const fetchMyTrainerAvailableDates = async (): Promise<string[]> => {
  const response = await apiClient.get<{ availableDates: { date: string }[] }>(API_ENDPOINTS.trainers.myAvailableDates);
  return (response.data?.availableDates || []).map((d) => d.date.slice(0, 10));
};

export const saveMyTrainerAvailableDates = async (dates: string[]): Promise<void> => {
  await apiClient.post(API_ENDPOINTS.trainers.myAvailableDates, { dates });
};

export const fetchMyTrainerPrograms = async () => {
  const response = await apiClient.get<{ programs: BackendTrainerProgram[] }>(API_ENDPOINTS.trainers.myPrograms);
  return response.data?.programs || [];
};

export const fetchMyTrainerAvailability = async () => {
  const response = await apiClient.get<{ availability: BackendTrainerAvailability[] }>(API_ENDPOINTS.trainers.myAvailability);
  return response.data?.availability || [];
};

export const createTrainerProgram = async (payload: TrainerProgramPayload) => {
  const response = await apiClient.post<{ program: BackendTrainerProgram }>(API_ENDPOINTS.trainers.programs, payload);
  return response.data?.program;
};

export const uploadTrainerProgramImage = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);
  const token = apiClient.getAuthToken();
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.trainers.uploadProgramImage}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Unable to upload program image.");
  return normalizeTrainerPhotoUrl(result.data?.image);
};

export const updateTrainerProgram = async (programId: string, payload: Partial<TrainerProgramPayload>) => {
  const response = await apiClient.put<{ program: BackendTrainerProgram }>(API_ENDPOINTS.trainers.programDetail(programId), payload);
  return response.data?.program;
};

export const deleteTrainerProgram = async (programId: string) => {
  const response = await apiClient.delete<{ programId: string }>(API_ENDPOINTS.trainers.programDetail(programId));
  return response.data;
};

export const createTrainerAvailability = async (payload: TrainerAvailabilityPayload) => {
  const response = await apiClient.post<{ availability: BackendTrainerAvailability }>(API_ENDPOINTS.trainers.availability, payload);
  return response.data?.availability;
};

export const updateTrainerAvailability = async (slotId: string, payload: Partial<TrainerAvailabilityPayload>) => {
  const response = await apiClient.put<{ availability: BackendTrainerAvailability }>(API_ENDPOINTS.trainers.availabilityDetail(slotId), payload);
  return response.data?.availability;
};

export const deleteTrainerAvailability = async (slotId: string) => {
  const response = await apiClient.delete<{ slotId: string }>(API_ENDPOINTS.trainers.availabilityDetail(slotId));
  return response.data;
};

export type TrainerApplicationPaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type AdminTrainerApplicationsResponse = {
  applications: BackendTrainerApplication[];
  pagination: TrainerApplicationPaginationMeta;
};

const DEFAULT_APP_PAGINATION: TrainerApplicationPaginationMeta = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

export const fetchTrainerApplications = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<AdminTrainerApplicationsResponse> => {
  const response = await apiClient.get<{ applications: BackendTrainerApplication[]; pagination?: TrainerApplicationPaginationMeta }>(
    API_ENDPOINTS.trainers.applications,
    { params }
  );
  return {
    applications: response.data?.applications || [],
    pagination: response.data?.pagination || DEFAULT_APP_PAGINATION,
  };
};

export type TrainerApplicationPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  sessionRate: number;
  experienceYears: number;
  specialties: string[];
  certifications: string[];
  certificationFiles: string[];
  bio: string;
  profilePicture?: string;
};

export const submitTrainerApplication = async (payload: TrainerApplicationPayload) => {
  const response = await apiClient.post<{ application: BackendTrainerApplication }>(API_ENDPOINTS.trainers.applications, payload);
  return response.data?.application;
};

export const uploadTrainerApplicationFiles = async (photo: File | null, certificates: File[]) => {
  const formData = new FormData();
  if (photo) formData.append("photo", photo);
  certificates.forEach((file) => formData.append("certificates", file));

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.trainers.uploadApplicationFiles}`, {
    method: "POST",
    body: formData,
  });
  const result = await response.json();

  if (!response.ok) throw new Error(result.message || "Unable to upload application files.");

  return {
    photo: result.data?.photo as string | null,
    certificates: (result.data?.certificates || []) as string[],
  };
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

export const normalizeTrainerPhotoUrl = (url?: string | null): string => resolveAssetUrl(url);

const toFrontendAssetUrl = (filename?: string, path?: string) =>
  resolveAssetUrl(path || filename);

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
