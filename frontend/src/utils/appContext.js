const APP_FLAG = 'jp_in_app';

// Social-media in-app browsers look like WebViews but are not our app.
const SOCIAL_BROWSER = /FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|LinkedInApp/i;

/**
 * True only inside the Jaipurio native app wrapper (user agent "JaipurioApp" or
 * the ?source=app flag) — NOT for an installed web app/PWA or a generic WebView.
 * The native app registers its own push token, so the website must not.
 */
export const isNativeApp = () => {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('source') || params.get('app');
    if (v === 'app' || v === '1') sessionStorage.setItem(APP_FLAG, '1');
    if (sessionStorage.getItem(APP_FLAG)) return true;
  } catch {
    /* storage blocked */
  }
  return /JaipurioApp/i.test(navigator.userAgent || '');
};

/**
 * True when the storefront is running inside the Jaipurio mobile app rather
 * than a normal browser. Most reliable: the app opens the site with
 * `?source=app` (remembered for the visit) or adds "JaipurioApp" to its user
 * agent. Falls back to spotting an Android/iOS WebView or an installed PWA.
 */
export const isInApp = () => {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('source') || params.get('app');
    if (v === 'app' || v === '1') sessionStorage.setItem(APP_FLAG, '1');
    if (sessionStorage.getItem(APP_FLAG)) return true;
  } catch {
    /* storage blocked — rely on the checks below */
  }
  const ua = navigator.userAgent || '';
  if (/JaipurioApp/i.test(ua)) return true;
  if (SOCIAL_BROWSER.test(ua)) return false;
  if (/; wv\)/.test(ua)) return true; // Android WebView
  if (/(iPhone|iPad|iPod)/.test(ua) && !/Safari/i.test(ua)) return true; // iOS WKWebView
  return !!(window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone);
};

/**
 * Inside the Jaipurio app the screen must not zoom (pinch or double-tap).
 * The normal website stays zoomable for accessibility, so this runs only when
 * isInApp() is true. Android WebView obeys the viewport tag; iOS WKWebView
 * ignores it for pinch, so the gesture events are cancelled as well.
 */
export const lockAppZoom = () => {
  if (typeof document === 'undefined' || !isInApp()) return;
  try {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover',
      );
    }
    document.documentElement.style.touchAction = 'pan-x pan-y'; // no pinch, no double-tap zoom
    const stop = (e) => e.preventDefault();
    ['gesturestart', 'gesturechange', 'gestureend'].forEach((t) =>
      document.addEventListener(t, stop, { passive: false }),
    );
    document.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches && e.touches.length > 1) e.preventDefault();
      },
      { passive: false },
    );
  } catch {
    /* never block the app because of this */
  }
};
