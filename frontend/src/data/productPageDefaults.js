// Product page content that admins can change in Appearance → Product Page.
// Stored as `settings.productPage`; anything not saved falls back to these
// defaults (the page's original copy), so the page never renders empty.
export const TRUST_ICONS = ['truck', 'returns', 'shield', 'store', 'package', 'card', 'star', 'globe'];

export const PRODUCT_PAGE_DEFAULTS = {
  zoomEnabled: true,
  showRating: true,
  highlights: {
    enabled: true,
    title: '🌿 Pure handcrafted craftsmanship from Jaipur, Rajasthan.',
    points: [
      '100% Genuine Makrana Marble / Terracotta Clay',
      'Carefully packaged in heavy-duty break-proof carton',
      'Ships within 24–48 hours direct from master artisans',
    ],
  },
  stock: {
    enabled: true,
    // {count} is replaced with the product's stock
    label: 'Availability: {count} products available',
  },
  actions: {
    wishlist: true,
    share: true,
    whatsapp: true,
    call: true,
    whatsappNumber: '919772777736',
    callNumber: '919772777736',
    // {product} is replaced with the product name
    whatsappMessage: "Hi, I'm interested in {product}",
  },
  delivery: {
    enabled: true,
    title: 'Check Delivery & Estimated Arrival',
    placeholder: 'Enter 6-digit pincode',
    successMessage: '✓ Available: Estimated delivery in 4–7 business days. Cash on Delivery supported.',
  },
  vendorCard: {
    enabled: true,
    text: 'Become a Vendor?',
    linkText: 'Register now →',
    link: '/vendor/register',
  },
  trust: {
    enabled: true,
    items: [
      { icon: 'truck', title: 'Free Shipping', text: 'For all orders over ₹499' },
      { icon: 'returns', title: '7-Day Returns', text: 'Transit damage guarantee' },
      { icon: 'shield', title: 'Secure Payment', text: '100% encrypted checkout' },
      { icon: 'store', title: 'Artisan Certified', text: 'Direct from Jaipur workshops' },
    ],
  },
};

const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

/** Deep-merge saved settings over the defaults (arrays are replaced, not merged). */
export const mergeProductPage = (saved, base = PRODUCT_PAGE_DEFAULTS) => {
  if (!isPlainObject(saved)) return base;
  const out = { ...base };
  Object.keys(base).forEach((key) => {
    if (!(key in saved) || saved[key] === null || saved[key] === undefined) return;
    out[key] = isPlainObject(base[key]) ? mergeProductPage(saved[key], base[key]) : saved[key];
  });
  return out;
};
