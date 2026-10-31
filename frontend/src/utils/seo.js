import { useEffect } from 'react';

// Per-page SEO for the storefront (title, description, self-canonical,
// Open Graph / Twitter cards, robots, JSON-LD). Each page calls usePageSeo()
// with its own values; on unmount the site-wide defaults come back.

export const SITE_NAME = 'Jaipurio';
export const DEFAULT_TITLE = 'Jaipurio | Handcrafted Marble, Mitti & Rajasthani Handicrafts';
export const DEFAULT_DESCRIPTION =
  'Shop authentic handcrafted marble idols, terracotta and mitti pottery, home decor, jewellery and gifts from Jaipur artisans. Pan-India delivery.';
export const DEFAULT_IMAGE = '/jaipurio_banner.png';

/** Site origin used in canonical/OG URLs (VITE_SITE_URL wins, else the current domain). */
export const siteOrigin = () => {
  const env = (import.meta.env.VITE_SITE_URL || '').replace(/\/+$/, '');
  if (env) return env;
  return typeof window !== 'undefined' ? window.location.origin : '';
};

export const absoluteUrl = (pathOrUrl = '') => {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${siteOrigin()}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
};

/** Plain-text snippet for meta descriptions (strips HTML, collapses spaces, ~160 chars). */
export const toMetaDescription = (text = '', max = 160) => {
  const plain = String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length)}…`;
};

const upsert = (selector, create) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
};

const setMetaTag = (attr, key, value) => {
  const el = upsert(`meta[${attr}="${key}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute(attr, key);
    return m;
  });
  if (value) el.setAttribute('content', value);
  else el.remove();
};

const applySeo = ({ title, description, canonical, image, type, robots, jsonLd }) => {
  document.title = title;
  setMetaTag('name', 'description', description);
  // A non-production host keeps its index.html "noindex, nofollow" tag no matter what the page says.
  if (!document.head.querySelector('meta[data-host-noindex="true"]')) setMetaTag('name', 'robots', robots);

  const link = upsert('link[rel="canonical"]', () => {
    const l = document.createElement('link');
    l.setAttribute('rel', 'canonical');
    return l;
  });
  if (canonical) link.setAttribute('href', canonical);
  else link.remove();

  setMetaTag('property', 'og:site_name', SITE_NAME);
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:url', canonical);
  setMetaTag('property', 'og:type', type);
  setMetaTag('property', 'og:image', image);
  setMetaTag('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', image);

  document.head.querySelectorAll('script[data-page-schema="true"]').forEach((s) => s.remove());
  const blocks = (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).filter(Boolean);
  blocks.forEach((block) => {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.setAttribute('data-page-schema', 'true');
    s.textContent = typeof block === 'string' ? block : JSON.stringify(block);
    document.head.appendChild(s);
  });
};

/**
 * @param {object} opts
 * @param {string} [opts.title]        full <title>; "| Jaipurio" is added when missing
 * @param {string} [opts.description]
 * @param {string} [opts.path]         canonical path (default: current path, no query)
 * @param {string} [opts.canonical]    full canonical URL (overrides path)
 * @param {string} [opts.image]
 * @param {string} [opts.type]         og:type, default "website"
 * @param {boolean} [opts.noindex]     private/utility pages
 * @param {object|object[]|string} [opts.jsonLd]
 * @param {boolean} [opts.ready=true]  false while data is loading (keeps defaults)
 */
export const usePageSeo = (opts = {}) => {
  const {
    title,
    description,
    path,
    canonical,
    image,
    type = 'website',
    noindex = false,
    jsonLd,
    ready = true,
  } = opts;
  const jsonKey = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    if (!ready || typeof document === 'undefined') return undefined;
    const fullTitle = !title
      ? DEFAULT_TITLE
      : /jaipurio/i.test(title)
        ? title
        : `${title} | ${SITE_NAME}`;
    const canonicalUrl = noindex
      ? ''
      : canonical || absoluteUrl(path || window.location.pathname);
    applySeo({
      title: fullTitle,
      description: toMetaDescription(description || DEFAULT_DESCRIPTION),
      canonical: canonicalUrl,
      image: absoluteUrl(image || DEFAULT_IMAGE),
      type,
      robots: noindex ? 'noindex, follow' : '',
      jsonLd: noindex ? null : jsonLd,
    });
    return () => {
      applySeo({
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        canonical: '',
        image: absoluteUrl(DEFAULT_IMAGE),
        type: 'website',
        robots: '',
        jsonLd: null,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, title, description, path, canonical, image, type, noindex, jsonKey]);
};

/** BreadcrumbList JSON-LD from [{ name, path }] items. */
export const breadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: absoluteUrl(it.path),
  })),
});

export const organizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: siteOrigin(),
  logo: absoluteUrl('/jaipurio_logo.png'),
});
