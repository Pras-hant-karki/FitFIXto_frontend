/* User & Authentication Types */
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin' | 'trainer';
  avatar?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

/* Product Types */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  rating: number;
  reviewCount: number;
  image: string;
  images?: string[];
  stock: number;
  discount?: number;
  createdAt: string;
}

/* Cart Types */
export interface CartItem {
  productId: string;
  quantity: number;
  product?: Product;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  createdAt: string;
  updatedAt: string;
}

/* Order Types */
export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  shippingAddress: DeliveryAddress;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

/* Delivery Address Types */
export interface DeliveryAddress {
  id: string;
  userId: string;
  label: string; // Home, Office, etc.
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

/* Review Types */
export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName?: string;
  rating: number;
  comment: string;
  verified: boolean;
  createdAt: string;
}

/* Voucher Types */
export interface Voucher {
  id: string;
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  active: boolean;
  minAmount?: number;
  createdAt: string;
}

/* Trainer/Coach Types */
export interface Trainer {
  id: string;
  name: string;
  email: string;
  bio: string;
  specialization: string[];
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  image: string;
  certifications: string[];
  available: boolean;
  createdAt: string;
}

/* API Response Types */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: Record<string, string>;
  statusCode: number;
}

/* Pagination Types */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

/* Category Types */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount: number;
}

/* Filter & Search Types */
export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest';
  search?: string;
  page?: number;
  limit?: number;
}

/* Theme Types */
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}
