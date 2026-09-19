/**
 * Public storefront origin for admin permalinks / SEO previews.
 * Prefer VITE_SITE_URL (set on Vercel). Falls back to the current browser origin
 * so local and Vercel deployments both open the live app, not jaipurio.in.
 */
export function getSiteOrigin() {
  const fromEnv = (
    import.meta.env.VITE_SITE_URL ||
    import.meta.env.VITE_FRONTEND_URL ||
    ''
  )
    .toString()
    .trim()
    .replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost:5175';
}

/** Pretty product URL used in admin preview + SEO (slug-based). */
export function productPublicUrl(slugOrId) {
  const key = String(slugOrId || '')
    .trim()
    .replace(/^\/+/, '');
  return `${getSiteOrigin()}/products/${key}`;
}

export function productPublicBase() {
  return `${getSiteOrigin()}/products/`;
}
