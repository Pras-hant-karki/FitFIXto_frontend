import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";

export type HomepageHero = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaLink: string;
  imageUrl: string;
  eyebrowFontSize: number;
  titleFontSize: number;
  subtitleFontSize: number;
  ctaFontSize: number;
};

export type HomepagePromotionalBanner = {
  text: string;
  link: string;
  isVisible: boolean;
  fontSize: number;
};

export type HomepageSectionOrderItem = {
  id: string;
  label: string;
};

export type HomepageSettings = {
  _id: string;
  hero: HomepageHero;
  promotionalBanner: HomepagePromotionalBanner;
  sectionOrder: HomepageSectionOrderItem[];
};

const toFrontendAssetUrl = (filename?: string, path?: string) => {
  if (filename) return `/assets/${filename}`;

  const uploadsIndex = path?.indexOf("/uploads/") ?? -1;
  if (path && uploadsIndex >= 0) {
    return `/assets/${path.slice(uploadsIndex + "/uploads/".length)}`;
  }

  return path || "";
};

export const fetchHomepageSettings = async () => {
  const response = await apiClient.get<{ settings: HomepageSettings }>(API_ENDPOINTS.homepage.settings);
  return response.data?.settings;
};

export const updateHomepageHero = async (payload: HomepageHero) => {
  const response = await apiClient.put<{ settings: HomepageSettings }>(API_ENDPOINTS.homepage.hero, payload);
  return response.data?.settings;
};

export const updateHomepagePromotionalBanner = async (payload: HomepagePromotionalBanner) => {
  const response = await apiClient.put<{ settings: HomepageSettings }>(API_ENDPOINTS.homepage.promotionalBanner, payload);
  return response.data?.settings;
};

export const updateHomepageSectionOrder = async (sectionOrder: HomepageSectionOrderItem[]) => {
  const response = await apiClient.put<{ settings: HomepageSettings }>(API_ENDPOINTS.homepage.sectionOrder, { sectionOrder });
  return response.data?.settings;
};

export const uploadHomepageImage = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);

  const token = apiClient.getAuthToken();
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.homepage.uploadImage}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to upload homepage image.");
  }

  return toFrontendAssetUrl(result.data?.image?.filename, result.data?.image?.path);
};
