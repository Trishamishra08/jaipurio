const DEMO_TOKEN = 'demo-token-jaipurio';
// The old shared demo account every visitor used to be signed into.
const SHARED_DEMO_EMAIL = 'customer@gmail.com';

export function getCustomerToken() {
  const token = localStorage.getItem('customer_token');
  if (!token || token === DEMO_TOKEN) return null;
  return token;
}

export function isDemoToken() {
  return localStorage.getItem('customer_token') === DEMO_TOKEN;
}

/**
 * True for a session left over from the old demo login (fake token, no token,
 * or the shared customer@gmail.com account). Such sessions are signed out so
 * each customer logs in with their own mobile number and sees only their orders.
 */
export function isLegacyDemoSession() {
  try {
    if (localStorage.getItem('jaipurio_auth') !== '1') return false;
    if (!getCustomerToken()) return true;
    const user = JSON.parse(localStorage.getItem('jaipurio_user') || 'null');
    return String(user?.email || '').toLowerCase() === SHARED_DEMO_EMAIL;
  } catch {
    return false;
  }
}

/** The signed-in customer's API token, or null when they need to log in. */
export async function ensureCustomerAuth() {
  return getCustomerToken();
}
