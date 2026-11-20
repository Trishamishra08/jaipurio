/**
 * Meta Pixel (Facebook / Instagram ads). The Pixel ID comes from
 * Admin → Theme Options → Facebook → "Facebook Pixel ID" (settings.theme.facebookPixelId).
 * Loads only on the live domain, never on admin/vendor/seller pages, and only
 * after the visitor accepts cookies (when the cookie banner is switched on).
 */

const LIVE_HOSTS = ['jaipurio.in', 'www.jaipurio.in'];
const PRIVATE_PATH = /^\/(admin|vendor|seller)(\/|$)/;

const isStorefrontPath = (pathname = '') => !PRIVATE_PATH.test(pathname);

export const validPixelId = (id) => {
  const v = String(id || '').trim();
  return /^\d{10,20}$/.test(v) ? v : null;
};

export const pixelAllowedHere = (loc = window.location) =>
  LIVE_HOSTS.includes(String(loc.hostname).toLowerCase()) && isStorefrontPath(loc.pathname);

export const isMetaPixelReady = () => typeof window !== 'undefined' && typeof window.fbq === 'function';

let loadedId = null;

/** Standard Meta base code, with the ID from settings. Sends the first PageView. */
export const loadMetaPixel = (rawId) => {
  const id = validPixelId(rawId);
  if (!id || loadedId || !pixelAllowedHere()) return false;
  loadedId = id;
  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', id);
  window.fbq('track', 'PageView');
  return true;
};

/** Track a standard Meta event (PageView, ViewContent, AddToCart, Purchase, …) */
export const trackMeta = (event, params) => {
  if (!isMetaPixelReady()) return;
  if (params) window.fbq('track', event, params);
  else window.fbq('track', event);
};

/** Fire PageView for storefront routes only (skip admin/vendor panels) */
export const trackMetaPageView = (pathname) => {
  if (!isStorefrontPath(pathname)) return;
  trackMeta('PageView');
};
