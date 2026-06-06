export const NAV_LINKS = [
  { label: 'Shop', href: '/shop' },
  { label: 'Services', href: '/services' },
  { label: 'Trainers', href: '/trainers' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
] as const;

export const CATEGORIES = [
  { name: 'Dumbbells', slug: 'dumbbells', productCount: 42 },
  { name: 'Racks', slug: 'racks', productCount: 18 },
  { name: 'Cardio', slug: 'cardio', productCount: 27 },
  { name: 'Supplements', slug: 'supplements', productCount: 84 },
  { name: 'Benches', slug: 'benches', productCount: 23 },
  { name: 'Barbells', slug: 'barbells', productCount: 19 },
] as const;

export const FOOTER_LINKS = {
  about: [
    { label: 'Our Story', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Sustainability', href: '/sustainability' },
  ],
  shop: [
    { label: 'All Equipment', href: '/shop' },
    { label: 'Supplements', href: '/shop?category=supplements' },
    { label: 'Compare', href: '/compare' },
    { label: 'Wishlist', href: '/wishlist' },
  ],
  services: [
    { label: 'Gym Setup', href: '/services/gym-setup' },
    { label: 'Sauna & Steam', href: '/services/sauna' },
    { label: 'Maintenance', href: '/services/maintenance' },
    { label: 'Hire Trainers', href: '/trainers' },
  ],
  support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Order Tracking', href: '/orders' },
    { label: 'Returns', href: '/returns' },
    { label: 'Contact Us', href: '/contact' },
  ],
} as const;

export const SOCIAL_LINKS = [
  { platform: 'facebook', href: 'https://facebook.com/fitfixto', label: 'Facebook' },
  { platform: 'twitter', href: 'https://twitter.com/fitfixto', label: 'Twitter' },
  { platform: 'instagram', href: 'https://instagram.com/fitfixto', label: 'Instagram' },
  { platform: 'youtube', href: 'https://youtube.com/@fitfixto', label: 'YouTube' },
] as const;
