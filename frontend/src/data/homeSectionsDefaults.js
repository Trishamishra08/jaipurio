// Home page sections the admin can manage (Appearance → Home Page).
// Saved as `settings.homePage = { pageOrder: [...], order: [...], sections: { [key]: {...} } }`.
// Anything not saved falls back to these defaults — the page's original copy
// and "automatic" product/category selection — so nothing breaks if unsaved.
//
// kind:
//   rail / deals / scroll – product cards (auto | category | picked products)
//   offers   – "Up to X% off <category>" tiles (auto | chosen categories)
//   cats     – category cards / chips (auto | chosen categories)
//   content  – fixed layout, editable text / items / image
//   simple   – on/off + headings only
//
// `scope: 'block'` sections live inside the "Main sections" block and are
// ordered by `order`; `scope: 'page'` sections are ordered by `pageOrder`
// together with the block itself (key MAIN_BLOCK). The hero banner is always
// first and can only be switched on/off (its slides are edited under Banners).

export const MAIN_BLOCK = 'mainBlock';

export const ICON_CHOICES = {
  features: ['matka', 'leaves', 'heart', 'truck', 'palace'],
  trust: ['lock', 'returns', 'package', 'truck', 'shield', 'star'],
  why: ['leaf', 'heart', 'flower', 'shield', 'package', 'truck'],
};

export const HOME_SECTIONS = [
  { key: 'hero', label: 'Hero banner slider', kind: 'simple', scope: 'top', note: 'The slides themselves are managed under Appearance → Banners.', defaults: {} },

  // ── Page-level sections (reorder with the block) ──────────────────
  {
    key: 'featuresBar', label: 'Features bar (100% Handmade, Eco Friendly…)', kind: 'content', scope: 'page',
    defaults: {
      items: [
        { icon: 'matka', label: '100% Handmade' },
        { icon: 'leaves', label: 'Eco Friendly' },
        { icon: 'heart', label: 'Support Local Artisans' },
        { icon: 'truck', label: 'Pan India Delivery' },
        { icon: 'palace', label: 'Made in Rajasthan' },
      ],
    },
    list: { name: 'items', title: 'Features', icons: 'features', fields: [['label', 'Text']], max: 6 },
  },
  { key: 'shopByCategory', label: 'Shop by Category (round icons)', kind: 'cats', scope: 'page', defaults: { title: 'Shop by Category', limit: 40 } },
  {
    key: 'newArrival', label: 'New Arrival banner', kind: 'content', scope: 'page',
    defaults: {
      eyebrow: 'New Arrival', title: 'Handcrafted Matkas.', copy: 'Bringing tradition to your home.',
      buttonText: 'Explore Now', link: '/shop', image: '/jaipurio_banner_art.png',
    },
    fields: [['eyebrow', 'Small label'], ['title', 'Heading'], ['copy', 'Text'], ['buttonText', 'Button text'], ['link', 'Button link (e.g. /shop?category=Jewellery)'], ['image', 'Background image', 'image']],
  },
  { key: 'popular', label: 'Popular Picks', kind: 'rail', scope: 'page', defaults: { title: 'Popular Picks', limit: 8 } },
  { key: 'categoryRails', label: 'One product row per category', kind: 'cats', scope: 'page', defaults: { limit: 4 } },
  {
    key: 'coupons', label: 'Coupon strip (offers & codes)', kind: 'content', scope: 'page',
    defaults: {
      // auto = the live coupons created in Marketing → Coupons; manual = the cards typed below
      source: 'auto',
      limit: 4,
      items: [
        { title: 'Flat 20% Off', text: 'On mitti crafts above ₹999', link: '/shop' },
        { title: 'Use code JAIPURIO10', text: 'On orders above ₹999', link: '/shop' },
      ],
    },
    sourceChoices: [
      ['auto', 'Live coupons from Coupons in the admin (hidden when there are none)'],
      ['manual', 'Custom cards that I type myself'],
    ],
    listWhen: 'manual',
    list: { name: 'items', title: 'Coupon cards', fields: [['title', 'Title'], ['text', 'Text'], ['link', 'Link']], max: 4 },
  },
  {
    key: 'trustStrip', label: 'Trust strip (Secure Payments, Easy Returns…)', kind: 'content', scope: 'page',
    defaults: {
      items: [
        { icon: 'lock', title: 'Secure', text: 'Payments' },
        { icon: 'returns', title: 'Easy', text: 'Returns' },
        { icon: 'package', title: 'Premium', text: 'Packaging' },
        { icon: 'truck', title: 'Pan India', text: 'Delivery' },
      ],
    },
    list: { name: 'items', title: 'Items', icons: 'trust', fields: [['title', 'Title'], ['text', 'Subtitle']], max: 5 },
  },
  {
    key: 'whyChoose', label: 'Why Choose Jaipurio?', kind: 'content', scope: 'page',
    defaults: {
      title: 'Why Choose Jaipurio?',
      items: [
        { icon: 'leaf', label: '100% Natural & Eco Friendly' },
        { icon: 'heart', label: 'Handmade with Love' },
        { icon: 'flower', label: 'Authentic Rajasthani Craft' },
        { icon: 'shield', label: 'Secure Payments' },
        { icon: 'package', label: 'Easy Returns' },
        { icon: 'truck', label: 'Pan India Delivery' },
      ],
    },
    fields: [['title', 'Heading']],
    list: { name: 'items', title: 'Reasons', icons: 'why', fields: [['label', 'Text']], max: 8 },
  },
  {
    key: 'testimonials', label: 'Testimonials / blog strip (scrolling cards)', kind: 'content', scope: 'page',
    defaults: { title: 'Words from our Patrons', source: 'blogs', limit: 8 },
    fields: [['title', 'Heading']],
    sourceChoices: [['blogs', 'Latest blog posts (falls back to customer reviews if none)'], ['reviews', 'Customer reviews']],
  },

  // ── Inside the "Main sections" block ──────────────────────────────
  { key: 'offers', label: "Today's Offers (discount tiles)", kind: 'offers', scope: 'block', defaults: { title: "Today's Offers", copy: 'Real deals across our catalog, updated live.', limit: 12 } },
  { key: 'explore', label: 'Explore Jaipurio (category cards)', kind: 'cats', scope: 'block', defaults: { eyebrow: 'Shop the Look', title: 'Explore Jaipurio', limit: 8 } },
  { key: 'original', label: 'Explore original items from local shops', kind: 'rail', scope: 'block', defaults: { eyebrow: 'Straight From the Workshop', title: 'Explore original items from local shops', copy: 'Hand-carved marble & brass murtis, listed exactly as our artisan partners photograph and price them.', limit: 8 } },
  { key: 'festival', label: 'Great Indian Festival Sale products', kind: 'rail', scope: 'block', defaults: { eyebrow: 'Festival Season', title: 'Great Indian Festival Sale products', copy: 'Home mandirs, marble Tulsi pots, and puja essentials — festival pricing while stock lasts.', limit: 8 } },
  { key: 'deals', label: "Today's Deals", kind: 'deals', scope: 'block', defaults: { eyebrow: 'Ends Tonight', title: "Today's Deals", linkText: 'See all deals →', limit: 12 } },
  { key: 'flash', label: 'Festive Flash Sale banner', kind: 'simple', scope: 'block', defaults: {} },
  { key: 'trending', label: 'Trending right now', kind: 'rail', scope: 'block', defaults: { eyebrow: "This Week's Workshop", title: 'Trending right now', limit: 8 } },
  { key: 'recent', label: 'Recently viewed', kind: 'scroll', scope: 'block', defaults: { eyebrow: 'Pick Up Where You Left Off', title: 'Recently viewed', limit: 6 } },
  { key: 'recommended', label: 'Recommended for you', kind: 'scroll', scope: 'block', defaults: { eyebrow: 'Because You Browsed Marble Idols', title: 'Recommended for you', limit: 6 } },
  { key: 'styled', label: 'Styled edits', kind: 'simple', scope: 'block', defaults: { eyebrow: 'Curated, Not Just Categorised', title: 'Styled edits', copy: 'Complete looks and room sets, put together from our live catalogue — shop the whole edit in one tap.' } },
  { key: 'collections', label: 'Shop our curated collections', kind: 'simple', scope: 'block', defaults: { eyebrow: 'Product Collections', title: 'Shop our curated collections' } },
  {
    key: 'occasion', label: 'Shop by occasion', kind: 'content', scope: 'block',
    defaults: {
      eyebrow: 'Gifting, Sorted', title: 'Shop by occasion',
      // Each tile's photo is a real product: the most popular one in the chosen
      // category, or one specific product the admin picks.
      items: [
        { label: 'Wedding & Bridal', mode: 'category', category: 'Rajputi Poshak', productId: '' },
        { label: 'Housewarming', mode: 'category', category: 'Home Decor', productId: '' },
        { label: 'Festive Gifting', mode: 'category', category: 'Bangles', productId: '' },
        { label: 'Corporate Gifting', mode: 'category', category: 'Cufflinks', productId: '' },
        { label: 'Just for You', mode: 'category', category: 'Necklaces', productId: '' },
      ],
    },
    fields: [['eyebrow', 'Small label above heading'], ['title', 'Heading']],
    custom: 'occasions',
  },
  { key: 'bestsellers', label: 'Bestsellers across Jaipurio', kind: 'rail', scope: 'block', defaults: { eyebrow: 'Top Rated This Month', title: 'Bestsellers across Jaipurio', limit: 8 } },
  { key: 'more', label: 'More to explore', kind: 'rail', scope: 'block', defaults: { eyebrow: 'Keep Browsing', title: 'More to explore', limit: 8 } },
];

const BASE = { enabled: true, source: 'auto', categories: [], productIds: [], eyebrow: '', title: '', copy: '', linkText: '', limit: 8 };

export const HOME_SECTION_DEFAULTS = Object.fromEntries(
  HOME_SECTIONS.map((s) => {
    // content sections keep their own source (e.g. testimonials: blogs/reviews)
    const base = { ...BASE, ...s.defaults };
    return [s.key, base];
  })
);

export const DEFAULT_ORDER = HOME_SECTIONS.filter((s) => s.scope === 'block').map((s) => s.key);
export const DEFAULT_PAGE_ORDER = [
  'featuresBar', 'shopByCategory', MAIN_BLOCK, 'newArrival', 'popular', 'categoryRails',
  'coupons', 'trustStrip', 'whyChoose', 'testimonials',
];

const mergeOrder = (saved, allowed, defaults) => {
  const valid = Array.isArray(saved) ? saved.filter((k, i) => allowed.includes(k) && saved.indexOf(k) === i) : [];
  return [...valid, ...defaults.filter((k) => !valid.includes(k))];
};

/** Merge the saved settings over the defaults (unknown keys dropped, new sections appended). */
export const mergeHomeSections = (saved) => {
  const savedSections = saved && typeof saved.sections === 'object' && saved.sections ? saved.sections : {};
  const sections = {};
  HOME_SECTIONS.forEach((s) => {
    const base = HOME_SECTION_DEFAULTS[s.key];
    const mine = savedSections[s.key] && typeof savedSections[s.key] === 'object' ? savedSections[s.key] : {};
    const merged = { ...base };
    Object.keys(base).forEach((k) => {
      if (mine[k] !== undefined && mine[k] !== null) merged[k] = mine[k];
    });
    if (!Array.isArray(merged.categories)) merged.categories = [];
    if (!Array.isArray(merged.productIds)) merged.productIds = [];
    if (Array.isArray(base.items) && !Array.isArray(merged.items)) merged.items = base.items;
    sections[s.key] = merged;
  });
  return {
    sections,
    order: mergeOrder(saved?.order, DEFAULT_ORDER, DEFAULT_ORDER),
    pageOrder: mergeOrder(saved?.pageOrder, DEFAULT_PAGE_ORDER, DEFAULT_PAGE_ORDER),
  };
};

export const DEFAULT_HOME = mergeHomeSections(null);
