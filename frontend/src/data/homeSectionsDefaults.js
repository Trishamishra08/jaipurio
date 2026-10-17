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
  // rails (source 'rows'): [{ id, title, category, productIds }] — rows the admin adds, renames, deletes and adds products to
  { key: 'categoryRails', label: 'One product row per category', kind: 'cats', scope: 'page', defaults: { limit: 4, rails: [] } },
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
  {
    key: 'styled', label: 'Styled edits', kind: 'simple', scope: 'block',
    defaults: {
      eyebrow: 'Curated, Not Just Categorised', title: 'Styled edits',
      copy: 'Complete looks and room sets, put together from our live catalogue — shop the whole edit in one tap.',
      // Each edit: a heading + up to 4 pictures — the top product of each chosen category, or products picked by hand.
      items: [
        { title: 'The Wedding Trousseau Edit', mode: 'category', categories: ['Rajputi Poshak', 'Jodhpuri Bandhgala Suits', 'Necklaces', 'Bangles'], productIds: [] },
        { title: 'The Pooja Room Edit', mode: 'category', categories: ['Marble Idols', 'Brass Idols', 'Thali & Thali Sets', 'Torans'], productIds: [] },
        { title: "The Groom's Edit", mode: 'category', categories: ['Jodhpuri Achkans', 'Safa / Head Turban', 'Cufflinks', 'Pocket Squares'], productIds: [] },
      ],
    },
    custom: 'edits',
  },
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
  { key: 'bestsellers', label: 'Bestsellers across Jaipurio', kind: 'rail', scope: 'block', defaults: { eyebrow: 'Top Rated This Month', title: 'Bestsellers across Jaipurio', limit: 8, source: 'rating' } },
  { key: 'more', label: 'More to explore', kind: 'rail', scope: 'block', defaults: { eyebrow: 'Keep Browsing', title: 'More to explore', limit: 8 } },
];

// rankBy / minReviews / fillWithPopular only apply when source is 'rating' (top rated from customer reviews)
const BASE = {
  enabled: true, source: 'auto', categories: [], productIds: [], eyebrow: '', title: '', copy: '', linkText: '', limit: 8,
  rankBy: 'seller', minReviews: 1, fillWithPopular: true,
};

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

// ── Custom sections ──────────────────────────────────────────────
// Sections the admin adds themselves (Appearance → Home Page → Add section).
// Saved as  homePage.custom = [{ id, type, label }]  with their content in
// homePage.sections['custom:<id>'], and placed in pageOrder / order like any
// other section.
export const MAX_CUSTOM = 20;
export const customKey = (id) => 'custom:' + id;
export const isCustomKey = (key) => typeof key === 'string' && key.startsWith('custom:');

export const CUSTOM_TYPES = [
  { type: 'products', title: 'Product row', hint: 'A row of product cards — automatic, top rated, from categories, or hand-picked.' },
  { type: 'banner', title: 'Banner', hint: 'A wide picture with a heading, short text and a button.' },
  { type: 'text', title: 'Text block', hint: 'A heading with a few paragraphs (e.g. a short story or announcement).' },
  { type: 'categories', title: 'Category cards', hint: 'Cards for the categories you choose.' },
  { type: 'tiles', title: 'Image tiles', hint: 'A grid of pictures with captions, each linking anywhere.' },
];

/** Content a new custom section of this type starts with. */
export const customDefaults = (type, label = '') => {
  switch (type) {
    case 'products':
      return { ...BASE, title: label };
    case 'categories':
      return { ...BASE, title: label };
    case 'banner':
      return { ...BASE, title: label, buttonText: 'Shop now', link: '/shop', image: '' };
    case 'text':
      return { ...BASE, title: label, copy: '' };
    case 'tiles':
      return { ...BASE, title: label, items: [] };
    default:
      return { ...BASE, title: label };
  }
};

/** The "definition" the admin card needs for a custom section (what fields it can edit). */
export const customDef = (meta) => {
  const key = customKey(meta.id);
  const base = { key, label: meta.label, scope: 'custom', custom: false, isCustom: true, customType: meta.type };
  switch (meta.type) {
    case 'products':
      return { ...base, kind: 'rail', defaults: { eyebrow: '', title: '', copy: '', limit: 8 } };
    case 'categories':
      return { ...base, kind: 'cats', defaults: { eyebrow: '', title: '', limit: 8 } };
    case 'banner':
      return {
        ...base, kind: 'content', defaults: {},
        fields: [['eyebrow', 'Small label'], ['title', 'Heading'], ['copy', 'Text'], ['buttonText', 'Button text'], ['link', 'Button link (e.g. /shop?category=Jewellery)'], ['image', 'Background image', 'image']],
      };
    case 'text':
      return { ...base, kind: 'content', defaults: {}, fields: [['title', 'Heading'], ['copy', 'Text (leave a blank line between paragraphs)', 'textarea']] };
    case 'tiles':
      return {
        ...base, kind: 'content', defaults: {}, fields: [['title', 'Heading']],
        list: { name: 'items', title: 'Tiles', fields: [['label', 'Caption'], ['link', 'Link, e.g. /shop?category=Clothing'], ['image', 'Picture', 'image']], max: 12 },
      };
    default:
      return { ...base, kind: 'simple', defaults: {} };
  }
};

const mergeOrder = (saved, allowed, defaults) => {
  const valid = Array.isArray(saved) ? saved.filter((k, i) => allowed.includes(k) && saved.indexOf(k) === i) : [];
  return [...valid, ...defaults.filter((k) => !valid.includes(k))];
};

/** Merge the saved settings over the defaults (unknown keys dropped, new sections appended). */
export const mergeHomeSections = (saved) => {
  const savedSections = saved && typeof saved.sections === 'object' && saved.sections ? saved.sections : {};
  const sections = {};
  const mergeOne = (base, mine) => {
    const merged = { ...base };
    Object.keys(base).forEach((k) => {
      if (mine[k] !== undefined && mine[k] !== null) merged[k] = mine[k];
    });
    if (!Array.isArray(merged.categories)) merged.categories = [];
    if (!Array.isArray(merged.productIds)) merged.productIds = [];
    if (Array.isArray(base.items) && !Array.isArray(merged.items)) merged.items = base.items;
    return merged;
  };
  HOME_SECTIONS.forEach((s) => {
    const mine = savedSections[s.key] && typeof savedSections[s.key] === 'object' ? savedSections[s.key] : {};
    sections[s.key] = mergeOne(HOME_SECTION_DEFAULTS[s.key], mine);
  });

  // custom sections the admin added
  const knownTypes = CUSTOM_TYPES.map((t) => t.type);
  const seen = new Set();
  const custom = (Array.isArray(saved?.custom) ? saved.custom : [])
    .filter((m) => m && typeof m.id === 'string' && /^[a-z0-9]{3,12}$/i.test(m.id) && knownTypes.includes(m.type) && !seen.has(m.id) && seen.add(m.id))
    .slice(0, MAX_CUSTOM)
    .map((m) => ({ id: m.id, type: m.type, label: String(m.label || '').slice(0, 60) || 'Custom section' }));
  const customKeys = custom.map((m) => customKey(m.id));
  custom.forEach((meta) => {
    const key = customKey(meta.id);
    const mine = savedSections[key] && typeof savedSections[key] === 'object' ? savedSections[key] : {};
    sections[key] = mergeOne(customDefaults(meta.type, meta.label), mine);
  });

  const order = mergeOrder(saved?.order, [...DEFAULT_ORDER, ...customKeys], DEFAULT_ORDER);
  const pageOrder = mergeOrder(saved?.pageOrder, [...DEFAULT_PAGE_ORDER, ...customKeys], DEFAULT_PAGE_ORDER);
  // a custom section can live in one list only; any not placed yet goes to the end of the page
  const dupes = new Set(customKeys.filter((k) => order.includes(k) && pageOrder.includes(k)));
  const cleanOrder = order.filter((k) => !dupes.has(k));
  const placed = new Set([...cleanOrder, ...pageOrder]);
  customKeys.filter((k) => !placed.has(k)).forEach((k) => pageOrder.push(k));

  return { sections, order: cleanOrder, pageOrder, custom };
};

export const DEFAULT_HOME = mergeHomeSections(null);
