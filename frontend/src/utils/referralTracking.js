/**
 * Affiliate click attribution — reads ?ref=<code> from the URL once at app
 * root and stores it with a 30-day expiry, matching the SOP's C.7 workflow.
 * Checkout reads this (same integration point as couponCode) to attach
 * referralCode to the order.
 */
const STORAGE_KEY = 'jaipurio_referral';
const WINDOW_DAYS = 30;

export const captureReferralFromUrl = () => {
  try {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    let code = params.get('ref') || params.get('referral') || params.get('affiliate') || params.get('refCode');
    if (!code && window.location.hash) {
      const hashQuery = window.location.hash.split('?')[1];
      if (hashQuery) {
        const hashParams = new URLSearchParams(hashQuery);
        code = hashParams.get('ref') || hashParams.get('referral') || hashParams.get('affiliate') || hashParams.get('refCode');
      }
    }
    if (!code) return;
    const cleanCode = String(code).trim();
    if (!cleanCode) return;
    const expiresAt = Date.now() + WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const payload = JSON.stringify({ code: cleanCode, expiresAt });
    try {
      localStorage.setItem(STORAGE_KEY, payload);
    } catch {}
    try {
      sessionStorage.setItem(STORAGE_KEY, payload);
    } catch {}
  } catch {
    /* ignore error */
  }
};

/** Returns the stored referral code if present and not expired, else null. Expired entries are cleared. */
export const getActiveReferralCode = () => {
  try {
    let raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {}
    if (!raw) {
      try {
        raw = sessionStorage.getItem(STORAGE_KEY);
      } catch {}
    }
    if (!raw) return null;
    const { code, expiresAt } = JSON.parse(raw);
    if (!code || !expiresAt || expiresAt < Date.now()) {
      clearReferralCode();
      return null;
    }
    return String(code).trim();
  } catch {
    return null;
  }
};

export const clearReferralCode = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
};
