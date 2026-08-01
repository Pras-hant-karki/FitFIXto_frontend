import { API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";

export type AdminUser = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "admin" | "customer" | "trainer" | string;
  isActive: boolean;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type AdminUsersResponse = {
  users: AdminUser[];
  pagination: PaginationMeta;
};

const DEFAULT_PAGINATION: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

export const fetchAdminUsers = async (
  params?: { page?: number; limit?: number; search?: string }
): Promise<AdminUsersResponse> => {
  const response = await apiClient.get<{ users: AdminUser[]; pagination?: PaginationMeta }>(
    API_ENDPOINTS.admin.users,
    { params }
  );
  return {
    users: response.data?.users || [],
    pagination: response.data?.pagination || DEFAULT_PAGINATION,
  };
};

export const updateAdminUserStatus = async (userId: string, isActive: boolean) => {
  const response = await apiClient.patch<{ user: AdminUser }>(API_ENDPOINTS.admin.userStatus(userId), { isActive });
  return response.data?.user;
};

export const deleteAdminUser = async (userId: string) => {
  const response = await apiClient.delete<{ userId: string }>(API_ENDPOINTS.admin.deleteUser(userId));
  return response.data;
};
