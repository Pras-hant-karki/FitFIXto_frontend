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
    users: '/admin/users',
    userStatus: (id: string) => `/admin/users/${id}/status`,
    deleteUser: (id: string) => `/admin/users/${id}`,
    analytics: '/admin/analytics',
  },

  // Auth
  auth: {
    login: '/auth/login',
    signup: '/auth/register',
    me: '/auth/me',
    profile: '/auth/profile',
    uploadProfileImage: '/auth/profile/upload-image',
    verify: '/auth/verify-email',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },

  // Products
  products: {
    list: '/products',
    detail: (id: string) => `/products/${id}`,
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

  // Wishlist
  wishlist: {
    get: '/wishlist',
    add: '/wishlist',
    remove: '/wishlist',
  },

  // Orders
  orders: {
    myOrders: '/orders/my-orders',
    adminAll: '/orders/admin/all',
    create: '/orders',
  },

  // User
  user: {
    addresses: '/delivery-addresses',
  },

  // Trainers
  trainers: {
    list: '/trainers',
    detail: (id: string) => `/trainers/${id}`,
    uploadPhoto: '/trainers/upload-photo',
  },

  // Homepage
  homepage: {
    settings: '/homepage/settings',
    hero: '/homepage/hero',
    promotionalBanner: '/homepage/promotional-banner',
    sectionOrder: '/homepage/section-order',
    uploadImage: '/homepage/upload-image',
  },

} as const;

export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
} as const;
