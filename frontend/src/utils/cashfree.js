/** Load Cashfree's JS SDK (v3) once. */
export function loadCashfreeScript() {
  return new Promise((resolve) => {
    if (window.Cashfree) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Order details kept across a redirect-based payment (some UPI / bank flows leave the page).
const PENDING_KEY = 'jaipurio_cf_pending';

export function savePendingCashfree(data) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable — the modal flow still works without it.
  }
}

export function takePendingCashfree() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Opens Cashfree checkout in a popup over the page and resolves once it closes.
 * Whether the payment actually succeeded is always decided by the server (verify call),
 * so this only rejects when the customer clearly cancelled or the SDK reported an error.
 */
export async function payWithCashfree({ cashfreeOrder, mode }) {
  const orderId = cashfreeOrder?.id || '';
  if (String(orderId).startsWith('mock_cf_')) return { orderId };

  if (!cashfreeOrder?.paymentSessionId) {
    throw new Error('Could not start Cashfree payment. Please try again.');
  }
  const loaded = await loadCashfreeScript();
  if (!loaded || !window.Cashfree) {
    throw new Error('Unable to load Cashfree checkout. Please try again.');
  }

  const cashfree = window.Cashfree({ mode: mode === 'production' ? 'production' : 'sandbox' });
  const result = await cashfree.checkout({
    paymentSessionId: cashfreeOrder.paymentSessionId,
    redirectTarget: '_modal',
  });
  if (result?.error) {
    throw new Error(result.error.message || 'Payment cancelled');
  }
  return { orderId };
}
