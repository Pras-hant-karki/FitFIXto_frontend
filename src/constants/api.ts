const normalizeApiBaseUrl = (url: string) => {
  const trimmedUrl = url.replace(/\/$/, '');

  return trimmedUrl.endsWith('/api') ? `${trimmedUrl}/v1` : trimmedUrl;
};

export const API_BASE_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
);

// Base URL for uploaded media files served by the backend at /assets/
export const MEDIA_BASE_URL = (process.env.NEXT_PUBLIC_MEDIA_URL || API_BASE_URL).replace(/\/api\/v1$/, '').replace(/\/api$/, '');

// Resolves any stored asset path to a full backend URL.
// Handles new format ("products/img.jpg"), old /uploads/ format, and absolute URLs.
export const resolveAssetUrl = (storedPath?: string | null): string => {
  if (!storedPath) return '';
  if (storedPath.startsWith('http://') || storedPath.startsWith('https://')) return storedPath;
  const clean = storedPath.startsWith('/uploads/')
    ? storedPath.slice('/uploads/'.length)
    : storedPath.startsWith('/assets/')
    ? storedPath.slice('/assets/'.length)
    : storedPath.startsWith('/')
    ? storedPath.slice(1)
    : storedPath;
  return `${MEDIA_BASE_URL}/assets/${clean}`;
};

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
    compare: '/products/compare',
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

  // Reviews
  reviews: {
    list: '/reviews',
    featured: '/reviews/featured',
    my: '/reviews/my',
    admin: '/reviews/admin',
    create: '/reviews',
    detail: (id: string) => `/reviews/${id}`,
    moderate: (id: string) => `/reviews/admin/${id}/moderation`,
    feature: (id: string) => `/reviews/admin/${id}/feature`,
  },

  // Orders
  orders: {
    myOrders: '/orders/my-orders',
    adminAll: '/orders/admin/all',
    create: '/orders',
    detail: (id: string) => `/orders/${id}`,
    track: (id: string) => `/orders/${id}/track`,
    cancel: (id: string) => `/orders/${id}/cancel`,
    updateStatus: (id: string) => `/orders/${id}/status`,
  },

  // User
  user: {
    addresses: '/delivery-addresses',
  },

  // Trainers
  trainers: {
    list: '/trainers',
    publicList: '/trainers/public',
    publicDetail: (id: string) => `/trainers/public/${id}`,
    publicPrograms: (id: string) => `/trainers/public/${id}/programs`,
    publicAvailability: (id: string) => `/trainers/public/${id}/availability`,
    publicReviews: (id: string) => `/trainers/public/${id}/reviews`,
    detail: (id: string) => `/trainers/${id}`,
    myPrograms: '/trainers/programs/me',
    programs: '/trainers/programs',
    uploadProgramImage: '/trainers/programs/upload-image',
    programDetail: (id: string) => `/trainers/programs/${id}`,
    myAvailability: '/trainers/availability/me',
    myAvailableDates: '/trainers/availability/dates',
    availability: '/trainers/availability',
    availabilityDetail: (id: string) => `/trainers/availability/${id}`,
    applications: '/trainers/applications',
    uploadApplicationFiles: '/trainers/applications/upload-files',
    approveApplication: (id: string) => `/trainers/applications/${id}/approve`,
    rejectApplication: (id: string) => `/trainers/applications/${id}/reject`,
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

  partnerGyms: {
    list: '/partner-gyms',
    publicList: '/partner-gyms/public',
    detail: (id: string) => `/partner-gyms/${id}`,
    uploadImages: '/partner-gyms/upload-images',
  },

  // Discounts & Promotions
  discounts: {
    public: '/discounts/public',
    admin: '/discounts',
    flashSale: '/discounts/flash-sale',
    bestPrice: '/discounts/best-price',
    refundGuarantee: '/discounts/refund-guarantee',
    bundles: '/discounts/bundles',
    bundleDetail: (id: string) => `/discounts/bundles/${id}`,
  },

  // Services
  services: {
    list: '/services',
    publicList: '/services/public',
    create: '/services',
    detail: (id: string) => `/services/${id}`,
    uploadImage: '/services/upload-image',
  },

  // Service bookings
  serviceBookings: {
    create: '/service-bookings',
    my: '/service-bookings/my',
    adminAll: '/service-bookings',
    updateStatus: (id: string) => `/service-bookings/${id}/status`,
    cancel: (id: string) => `/service-bookings/${id}/cancel`,
    review: (id: string) => `/service-bookings/${id}/review`,
  },

  // Payments
  payments: {
    stripeIntent: '/payments/stripe/intent',
  },

  // Bookings (trainer-client sessions)
  bookings: {
    create: '/bookings',
    adminAll: '/bookings/admin/all',
    myClient: '/bookings/my',
    myTrainer: '/bookings/trainer',
    myClients: '/bookings/trainer/clients',
    updateStatus: (id: string) => `/bookings/${id}/status`,
    cancel: (id: string) => `/bookings/${id}/cancel`,
    review: (id: string) => `/bookings/${id}/review`,
  },

} as const;

export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
} as const;
