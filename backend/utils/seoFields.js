/**
 * Shared SEO subdocument used by products and ecommerce catalog entities.
 * Mirrors Botble-style General / Social / Advanced tabs.
 */
const seoFields = {
  general: {
    slug: { type: String, default: '', trim: true, index: true },
    metaTitle: { type: String, default: '', maxlength: 70 },
    metaDescription: { type: String, default: '', maxlength: 320 },
    metaKeywords: { type: String, default: '' },
    robots: { type: String, default: 'index,follow' },
    canonicalUrl: { type: String, default: '' },
  },
  social: {
    ogTitle: { type: String, default: '' },
    ogDescription: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    twitterTitle: { type: String, default: '' },
    twitterDescription: { type: String, default: '' },
    twitterImage: { type: String, default: '' },
  },
  advanced: {
    schemaMarkup: { type: String, default: '' },
    customHead: { type: String, default: '' },
    noIndex: { type: Boolean, default: false },
    noFollow: { type: Boolean, default: false },
  },
};

const emptySeo = () => ({
  general: {
    slug: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    robots: 'index,follow',
    canonicalUrl: '',
  },
  social: {
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
  },
  advanced: {
    schemaMarkup: '',
    customHead: '',
    noIndex: false,
    noFollow: false,
  },
});

const slugify = (text = '') =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

/**
 * Normalize incoming SEO payloads (flat seoTitle/seoDescription or nested seo).
 */
const normalizeSeo = (body = {}, fallbackTitle = '', fallbackDescription = '') => {
  const base = emptySeo();
  const incoming = body.seo && typeof body.seo === 'object' ? body.seo : {};
  const general = { ...base.general, ...(incoming.general || {}) };
  const social = { ...base.social, ...(incoming.social || {}) };
  const advanced = { ...base.advanced, ...(incoming.advanced || {}) };

  if (!general.metaTitle) {
    general.metaTitle = body.seoTitle || body.metaTitle || fallbackTitle || '';
  }
  if (!general.metaDescription) {
    general.metaDescription =
      body.seoDescription || body.metaDescription || fallbackDescription || '';
  }
  if (!general.slug) {
    general.slug = body.slug || slugify(fallbackTitle || general.metaTitle);
  }
  if (body.metaKeywords) general.metaKeywords = body.metaKeywords;
  if (body.robots) general.robots = body.robots;
  if (body.canonicalUrl) general.canonicalUrl = body.canonicalUrl;

  if (advanced.noIndex || advanced.noFollow) {
    const parts = [];
    parts.push(advanced.noIndex ? 'noindex' : 'index');
    parts.push(advanced.noFollow ? 'nofollow' : 'follow');
    general.robots = parts.join(',');
  }

  return { general, social, advanced };
};

module.exports = { seoFields, emptySeo, slugify, normalizeSeo };
