// Which domain(s) search engines may index. Everything else (Vercel/Render
// previews, demo domains, staging) is served with noindex and a robots.txt
// that blocks crawling, so it never competes with the real site as duplicate
// content.
//
//   SITE_URL         the production site, e.g. https://jaipurio.in (default)
//   INDEXABLE_HOSTS  optional extra comma-separated hosts, e.g. "shop.jaipurio.in"

const SITE_URL = (process.env.SITE_URL || 'https://jaipurio.in').replace(/\/$/, '');

const hostOf = (url) => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
};

const indexableHosts = () => {
  const base = hostOf(SITE_URL).replace(/^www\./, '');
  const extra = String(process.env.INDEXABLE_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return new Set([base, `www.${base}`, ...extra]);
};

/** The host the visitor actually typed (behind Traefik/nginx/Vercel rewrites). */
const requestHost = (req) =>
  String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '');

const isIndexableRequest = (req) => indexableHosts().has(requestHost(req));

module.exports = { SITE_URL, requestHost, isIndexableRequest };
