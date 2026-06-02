export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    logout: '/auth/logout',
    verify: '/auth/verify',
    refresh: '/auth/refresh',
  },

  // Products
  products: {
    list: '/products',
    detail: (id: string) => `/products/${id}`,
    search: '/products/search',
    trending: '/products/trending',
    featured: '/products/featured',
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
    list: '/orders',
    detail: (id: string) => `/orders/${id}`,
    create: '/orders',
    cancel: (id: string) => `/orders/${id}/cancel`,
    track: (id: string) => `/orders/${id}/track`,
  },

  // User
  user: {
    profile: '/user/profile',
    update: '/user/profile',
    addresses: '/user/addresses',
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
