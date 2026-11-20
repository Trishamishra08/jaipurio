/**
 * Google Analytics 4 for the storefront. The Measurement ID comes from
 * Admin → Settings → Website Tracking (settings.googleAnalyticsId).
 * Loads only on the live domain, never on admin/vendor pages, and starts with
 * Consent Mode: analytics on, all advertising storage off.
 */

const LIVE_HOSTS = ['jaipurio.in', 'www.jaipurio.in'];
const PRIVATE_PATH = /^\/(admin|vendor|seller)(\/|$)/;

export const validGaId = (id) => {
  const v = String(id || '').trim().toUpperCase();
  return /^G-[A-Z0-9]{6,12}$/.test(v) && !/^G-X+$/.test(v) ? v : null;
};

export const gaAllowedHere = (loc = window.location) =>
  LIVE_HOSTS.includes(String(loc.hostname).toLowerCase()) && !PRIVATE_PATH.test(loc.pathname);

let loadedId = null;

export const loadGa4 = (rawId) => {
  const id = validGaId(rawId);
  if (!id || loadedId || !gaAllowedHere()) return false;
  loadedId = id;
  window.dataLayer = window.dataLayer || [];
  // gtag must push the arguments object itself.
  // eslint-disable-next-line prefer-rest-params
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag('js', new Date());
  window.gtag('config', id, { send_page_view: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
  return true;
};

/** SPA page view (React Router does not reload the page). */
export const trackGaPageView = (loc = window.location) => {
  if (!loadedId || !window.gtag || PRIVATE_PATH.test(loc.pathname)) return;
  window.gtag('event', 'page_view', {
    page_location: `${loc.origin}${loc.pathname}${loc.search}`,
    page_path: loc.pathname,
    page_title: document.title,
  });
};
