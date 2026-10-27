const axios = require('axios');

const BASE = {
  sandbox: 'https://sandbox.cashfree.com/pg',
  production: 'https://api.cashfree.com/pg',
};
const API_VERSION = '2023-08-01';

module.exports = {
  code: 'cashfree',
  name: 'Cashfree (UPI / Cards / Netbanking / Wallets)',
  logo: '',
  configFields: [
    { key: 'appId', label: 'App ID (Client ID)', type: 'text', secret: false },
    { key: 'secretKey', label: 'Secret Key', type: 'password', secret: true },
    { key: 'mode', label: 'Mode (sandbox / production)', type: 'text', secret: false },
  ],
  defaultInstructions: 'Pay securely via UPI, card, netbanking or wallet through Cashfree.',

  /** DB config first, then env fallback. Test App IDs start with "TEST", so mode defaults from that. */
  resolveCredentials(config = {}) {
    const appId = config.appId || process.env.CASHFREE_APP_ID || '';
    const secretKey = config.secretKey || process.env.CASHFREE_SECRET_KEY || '';
    const rawMode = String(config.mode || process.env.CASHFREE_MODE || '').trim().toLowerCase();
    const mode = rawMode === 'production' || rawMode === 'live' ? 'production'
      : rawMode === 'sandbox' || rawMode === 'test' ? 'sandbox'
      : appId.startsWith('TEST') ? 'sandbox' : 'production';
    return { appId, secretKey, mode };
  },

  headers({ appId, secretKey }) {
    return {
      'x-client-id': appId,
      'x-client-secret': secretKey,
      'x-api-version': API_VERSION,
      'Content-Type': 'application/json',
    };
  },

  /** Creates a Cashfree order; the storefront opens Cashfree's checkout with the returned payment session id. */
  async createOrder(config, { amount, receipt, customer = {}, returnUrl }) {
    const creds = this.resolveCredentials(config);
    if (!creds.appId || !creds.secretKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Cashfree is enabled but its App ID / Secret Key are not configured. Add them in Admin → Payments.');
      }
      return { mock: true, order: { id: 'mock_cf_' + Date.now(), amount, currency: 'INR' }, mode: 'sandbox' };
    }
    try {
      const res = await axios.post(
        `${BASE[creds.mode]}/orders`,
        {
          order_id: receipt,
          order_amount: Number(Number(amount).toFixed(2)),
          order_currency: 'INR',
          customer_details: {
            customer_id: customer.id,
            customer_name: customer.name || undefined,
            customer_email: customer.email || undefined,
            customer_phone: customer.phone,
          },
          order_meta: returnUrl ? { return_url: returnUrl } : undefined,
        },
        { headers: this.headers(creds) }
      );
      return {
        mock: false,
        order: {
          id: res.data.order_id,
          amount: res.data.order_amount,
          currency: res.data.order_currency,
          paymentSessionId: res.data.payment_session_id,
        },
        mode: creds.mode,
      };
    } catch (err) {
      throw new Error(err.response?.data?.message || `Cashfree order could not be created: ${err.message}`);
    }
  },

  /**
   * Asks Cashfree (server-side) whether the order is actually paid — never trust the browser.
   * Returns { paid, amount, paymentId, method }.
   */
  async verifyPayment(config, { orderId }) {
    const creds = this.resolveCredentials(config);
    if (!creds.appId || !creds.secretKey) {
      // Demo mode is only ever allowed outside production.
      return { paid: process.env.NODE_ENV !== 'production', amount: null, paymentId: `mock_cfpay_${Date.now()}`, method: '' };
    }
    const base = BASE[creds.mode];
    const { data: order } = await axios.get(`${base}/orders/${encodeURIComponent(orderId)}`, { headers: this.headers(creds) });
    if (order.order_status !== 'PAID') {
      return { paid: false, amount: Number(order.order_amount), paymentId: '', method: '', status: order.order_status };
    }
    let payment = null;
    try {
      const { data: payments } = await axios.get(`${base}/orders/${encodeURIComponent(orderId)}/payments`, { headers: this.headers(creds) });
      payment = (payments || []).find((p) => p.payment_status === 'SUCCESS') || null;
    } catch {
      // The order itself is PAID; payment details are only for the record.
    }
    return {
      paid: true,
      amount: Number(order.order_amount),
      paymentId: payment ? String(payment.cf_payment_id) : '',
      method: payment?.payment_group || '',
      status: order.order_status,
    };
  },
};
