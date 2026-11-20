/**
 * Visitor's cookie choice for marketing tags (Meta Pixel).
 * 'granted' | 'denied' | null (not asked yet). Kept in localStorage.
 */
const KEY = 'jp_cookie_consent';
const listeners = new Set();

export const getConsent = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
};

export const setConsent = (value) => {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* private mode: choice lasts for this page only */
  }
  listeners.forEach((fn) => fn(value));
};

export const onConsent = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
