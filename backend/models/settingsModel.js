const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  taxRate: { type: Number, default: 18 },
  deliveryCharge: { type: Number, default: 50 },
  freeDeliveryThreshold: { type: Number, default: 1000 },
  estDeliveryDays: { type: String, default: '3-5 Business Days' },
  shippingPartner: { type: String, default: 'Standard Courier' },
  trackingUrl: { type: String, default: 'https://shiprocket.co/tracking/' },
  supportContact: { type: String, default: '+91 74071 75567' },
  isCodEnabled: { type: Boolean, default: true },
  codCharge: { type: Number, default: 0 },
  
  // Security / Admin Preferences
  pushNotifications: { type: Boolean, default: true },
  emailDispatch: { type: Boolean, default: false },
  smsGateway: { type: Boolean, default: true },
  soundAlerts: { type: Boolean, default: true },
  currency: { type: String, default: 'INR (₹)' },
  taxComputation: { type: String, default: 'Automatic (GST)' },
  maintenanceMode: { type: Boolean, default: false },

  // Appearance
  theme: { type: mongoose.Schema.Types.Mixed, default: {} },
  // Product detail page copy and section toggles (Appearance → Product Page).
  // Shape: frontend/src/data/productPageDefaults.js
  productPage: { type: mongoose.Schema.Types.Mixed, default: {} },
  // Home page section manager (Appearance → Home Page): { order: [keys], sections: { key: cfg } }
  // Shape: frontend/src/data/homeSectionsDefaults.js
  homePage: { type: mongoose.Schema.Types.Mixed, default: {} },
  // Affiliate referral link format (Affiliate Program → Referral link): { baseUrl, landingPath, paramName }
  affiliate: { type: mongoose.Schema.Types.Mixed, default: {} },
  // Storefront footer content (Appearance → Footer). Shape: frontend/src/data/footerDefaults.js
  footer: { type: mongoose.Schema.Types.Mixed, default: {} },
  // Storefront popup (Appearance → Popup): separate web and in-app versions. Shape: frontend/src/data/popupDefaults.js
  popup: { type: mongoose.Schema.Types.Mixed, default: {} },
  menus: [{ name: String, location: String, items: String }],
  widgets: [{ name: String, sidebar: String }],
  customCss: { type: String, default: '' },
  customJs: { type: String, default: '' },
  customHtml: { type: String, default: '' },
  robotsTxt: {
    type: String,
    // One shared group: a crawler obeys only the most specific group naming it,
    // so the private-area rules must sit in the same group as Googlebot/Bingbot
    // (separate "User-agent: Googlebot / Allow: /" groups bypassed them).
    // /login and /register are deliberately NOT disallowed: they send
    // "noindex" instead, and Google can only see that if it may crawl them.
    // A blocked URL can still be indexed from links (as "Login" was).
    default: `# SEARCH ENGINES + AI SEARCH BOTS — WELCOME (private areas blocked)
User-agent: Googlebot
User-agent: Bingbot
User-agent: Applebot
User-agent: OAI-SearchBot
User-agent: PerplexityBot
User-agent: ChatGPT-User
User-agent: *
Disallow: /admin
Disallow: /vendor/
Disallow: /cart
Disallow: /checkout
Disallow: /customer/
Disallow: /profile
Disallow: /orders
Disallow: /wishlist
Disallow: /notifications
Disallow: /*?*sort=
Disallow: /*?*filter=
Disallow: /*?*offers=
Disallow: /*?*minPrice=
Disallow: /*?*maxPrice=
Disallow: /*?*q=
Disallow: /*?*ref=
Allow: /

# AI TRAINING BOTS — BLOCKED
User-agent: GPTBot
Disallow: /
User-agent: ClaudeBot
Disallow: /
User-agent: CCBot
Disallow: /
User-agent: Google-Extended
Disallow: /
User-agent: Bytespider
Disallow: /

Sitemap: https://jaipurio.in/sitemap.xml`,
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
