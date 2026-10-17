const APP_FLAG = 'jp_in_app';

// Social-media in-app browsers look like WebViews but are not our app.
const SOCIAL_BROWSER = /FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|LinkedInApp/i;

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
