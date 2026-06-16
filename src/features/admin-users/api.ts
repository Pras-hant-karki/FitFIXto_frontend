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

export const fetchAdminUsers = async () => {
  const response = await apiClient.get<{ users: AdminUser[] }>(API_ENDPOINTS.admin.users);
  return response.data?.users || [];
};

export const updateAdminUserStatus = async (userId: string, isActive: boolean) => {
  const response = await apiClient.patch<{ user: AdminUser }>(API_ENDPOINTS.admin.userStatus(userId), { isActive });
  return response.data?.user;
};

export const deleteAdminUser = async (userId: string) => {
  const response = await apiClient.delete<{ userId: string }>(API_ENDPOINTS.admin.deleteUser(userId));
  return response.data;
};
