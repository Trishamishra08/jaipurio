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
  menus: [{ name: String, location: String, items: String }],
  widgets: [{ name: String, sidebar: String }],
  customCss: { type: String, default: '' },
  customJs: { type: String, default: '' },
  customHtml: { type: String, default: '' },
  robotsTxt: {
    type: String,
    default: `# SEARCH ENGINES — WELCOME
User-agent: Googlebot
Allow: /
User-agent: Bingbot
Allow: /
User-agent: Applebot
Allow: /

# AI SEARCH BOTS — WELCOME (they recommend you to shoppers)
User-agent: OAI-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: ChatGPT-User
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

# BLOCK PRIVATE AREAS
User-agent: *
Disallow: /cart
Disallow: /checkout
Disallow: /customer/
Disallow: /login
Disallow: /register
Disallow: /*?*sort=
Disallow: /*?*filter=

Sitemap: https://jaipurio.in/sitemap.xml`,
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
