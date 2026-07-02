import { API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";

export type AnalyticsRange = "today" | "weekly" | "monthly" | "quarterly" | "half-yearly" | "yearly";

export type AnalyticsSeriesPoint = {
  label: string;
  revenue: number;
  orders: number;
};

export type AnalyticsProduct = {
  name: string;
  sold: number;
  revenue: number;
};

export type AnalyticsTrainer = {
  id: string;
  name: string;
  specialty: string;
  profilePicture?: string | null;
  experienceYears: number;
  sessionRate: number;
};

export type AdminAnalytics = {
  range: AnalyticsRange;
  summary: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
    productsSold: number;
  };
  series: AnalyticsSeriesPoint[];
  topProducts: AnalyticsProduct[];
  topTrainers: AnalyticsTrainer[];
};

export const fetchAdminAnalytics = async (range: AnalyticsRange) => {
  const response = await apiClient.get<AdminAnalytics>(API_ENDPOINTS.admin.analytics, { params: { range } });
  return response.data;
};
