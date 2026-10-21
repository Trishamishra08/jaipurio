import { CATEGORIES_TOKEN } from '../utils/menuUrl';

// Mobile slide-out menu used until an admin assigns a menu to the
// "Mobile Menu" location (Admin → Appearance → Menus). Same structure as the
// previous jaipurio.in menu, but every entry points at a page that exists.
// `@categories` expands to the live category tree.
export const DEFAULT_MOBILE_MENU = [
  { id: 'home', title: 'Home', url: '/home' },
  { id: 'categories', title: 'Shop by Category', url: CATEGORIES_TOKEN },
  { id: 'journal', title: 'Journal', url: '/blog' },
  { id: 'story', title: 'Our Story', url: '/our-story' },
  { id: 'artisans', title: 'Artisan Spotlight', url: '/artisan-spotlight' },
  { id: 'crafts', title: 'Craft of India', url: '/crafts-of-india' },
  { id: 'contact', title: 'Contact', url: '/contact' },
  { id: 'wishlist', title: 'Wishlist', url: '/wishlist' },
  { id: 'orders', title: 'Order Tracking', url: '/orders/tracking' },
  { id: 'profile', title: 'My Profile', url: '/profile' },
  { id: 'affiliate', title: 'Affiliate Program', url: '/affiliate' },
  { id: 'sell', title: 'Sell on Jaipurio', url: '/vendor/register' },
];
