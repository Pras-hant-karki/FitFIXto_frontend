import { API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";

export interface DiscountProduct {
  _id: string;
  name: string;
  images: string[];
  price: number;
  category?: string;
}

export interface FlashSale {
  title: string;
  discountPercentage: number;
  endsAt?: string | null;
  productIds: DiscountProduct[] | string[];
  isActive: boolean;
}

export interface Bundle {
  _id: string;
  title: string;
  description?: string;
  productIds: DiscountProduct[];
  discountPercentage: number;
  isActive: boolean;
  createdAt: string;
}

export interface DiscountData {
  flashSale: FlashSale | null;
  bestPriceProductIds: DiscountProduct[];
  refundGuarantee: string;
  bundles: Bundle[];
}

export const fetchPublicDiscounts = async (): Promise<DiscountData> => {
  const res = await apiClient.get<{ data: DiscountData }>(API_ENDPOINTS.discounts.public);
  return (res as any).data ?? { flashSale: null, bestPriceProductIds: [], refundGuarantee: '', bundles: [] };
};

export const fetchAdminDiscounts = async (): Promise<DiscountData> => {
  const res = await apiClient.get<DiscountData>(API_ENDPOINTS.discounts.admin);
  return (res as any).data ?? { flashSale: null, bestPriceProductIds: [], refundGuarantee: '', bundles: [] };
};

export const saveFlashSale = async (payload: {
  title?: string;
  discountPercentage?: number;
  endsAt?: string | null;
  productIds?: string[];
  isActive?: boolean;
}): Promise<FlashSale | undefined> => {
  const res = await apiClient.put<{ flashSale: FlashSale }>(API_ENDPOINTS.discounts.flashSale, payload);
  return (res as any).data?.flashSale;
};

export const saveBestPrice = async (productIds: string[]): Promise<void> => {
  await apiClient.put(API_ENDPOINTS.discounts.bestPrice, { productIds });
};

export const saveRefundGuarantee = async (text: string): Promise<void> => {
  await apiClient.put(API_ENDPOINTS.discounts.refundGuarantee, { refundGuarantee: text });
};

export const createBundle = async (payload: {
  title: string;
  description?: string;
  productIds: string[];
  discountPercentage: number;
  isActive?: boolean;
}): Promise<Bundle | undefined> => {
  const res = await apiClient.post<{ bundle: Bundle }>(API_ENDPOINTS.discounts.bundles, payload);
  return (res as any).data?.bundle;
};

export const updateBundle = async (
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    productIds: string[];
    discountPercentage: number;
    isActive: boolean;
  }>
): Promise<Bundle | undefined> => {
  const res = await apiClient.put<{ bundle: Bundle }>(API_ENDPOINTS.discounts.bundleDetail(id), payload);
  return (res as any).data?.bundle;
};

export const deleteBundle = async (id: string): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.discounts.bundleDetail(id));
};
