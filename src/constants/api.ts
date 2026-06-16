const normalizeApiBaseUrl = (url: string) => {
  const trimmedUrl = url.replace(/\/$/, '');

  return trimmedUrl.endsWith('/api') ? `${trimmedUrl}/v1` : trimmedUrl;
};

export const API_BASE_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
);

export const API_ENDPOINTS = {
  // Admin
  admin: {
    login: '/admin/login',
  },

  // Auth
  auth: {
    login: '/auth/login',
    signup: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
    profile: '/auth/profile',
    verify: '/auth/verify-email',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    refresh: '/auth/refresh',
  },

  // Products
  products: {
    list: '/products',
    detail: (id: string) => `/products/${id}`,
    search: '/products/search',
    trending: '/products/trending',
    featured: '/products/featured',
    uploadImages: '/products/upload-images',
  },

  // Cart
  cart: {
    get: '/cart',
    add: '/cart/add',
    update: '/cart/update',
    remove: '/cart/remove',
    clear: '/cart/clear',
  },

  // Orders
  orders: {
    list: '/orders/my-orders',
    myOrders: '/orders/my-orders',
    adminAll: '/orders/admin/all',
    detail: (id: string) => `/orders/${id}`,
    create: '/orders',
    cancel: (id: string) => `/orders/${id}/cancel`,
    track: (id: string) => `/orders/${id}/track`,
  },

  // User
  user: {
    profile: '/auth/me',
    update: '/auth/profile',
    addresses: '/delivery-addresses',
    preferences: '/user/preferences',
  },

  // Reviews
  reviews: {
    list: (productId: string) => `/products/${productId}/reviews`,
    create: (productId: string) => `/products/${productId}/reviews`,
    update: (reviewId: string) => `/reviews/${reviewId}`,
    delete: (reviewId: string) => `/reviews/${reviewId}`,
  },

  // Trainers
  trainers: {
    list: '/trainers',
    detail: (id: string) => `/trainers/${id}`,
    search: '/trainers/search',
  },

  // Vouchers
  vouchers: {
    validate: '/vouchers/validate',
    apply: '/cart/voucher',
  },
} as const;

export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
} as const;
