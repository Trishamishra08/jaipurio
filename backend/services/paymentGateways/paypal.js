const axios = require('axios');

const BASE = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  live: 'https://api-m.paypal.com',
};

module.exports = {
  code: 'paypal',
  name: 'PayPal',
  logo: '',
  configFields: [
    { key: 'clientId', label: 'Client ID', type: 'text', secret: false },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', secret: true },
    { key: 'mode', label: 'Mode (sandbox / live)', type: 'text', secret: false },
  ],
  defaultInstructions: 'Pay directly using your PayPal balance, bank account, or linked card.',

  resolveCredentials(config = {}) {
    return {
      clientId: config.clientId || process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: config.clientSecret || process.env.PAYPAL_CLIENT_SECRET || '',
      mode: config.mode || process.env.PAYPAL_MODE || 'sandbox',
    };
  },

  async getAccessToken(clientId, clientSecret, mode) {
    const base = BASE[mode] || BASE.sandbox;
    const res = await axios.post(
      `${base}/v1/oauth2/token`,
      'grant_type=client_credentials',
      { auth: { username: clientId, password: clientSecret }, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return res.data.access_token;
  },

  /** Creates a PayPal Order; the storefront renders PayPal's own buttons and captures on approval. */
  async createOrder(config, { amount, receipt }) {
    const { clientId, clientSecret, mode } = this.resolveCredentials(config);
    if (!clientId || !clientSecret) {
      return { mock: true, order: { id: 'mock_paypal_' + Date.now(), amount: amount.toFixed(2), currency: 'USD' }, keyId: '' };
    }
    const base = BASE[mode] || BASE.sandbox;
    const token = await this.getAccessToken(clientId, clientSecret, mode);
    const res = await axios.post(
      `${base}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [{ reference_id: receipt, amount: { currency_code: 'USD', value: amount.toFixed(2) } }],
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    return { mock: false, order: { id: res.data.id, amount: amount.toFixed(2), currency: 'USD' }, keyId: clientId };
  },

  /** Captures an approved PayPal order — call after the customer approves via PayPal's buttons. */
  async capturePayment(config, { orderId }) {
    const { clientId, clientSecret, mode } = this.resolveCredentials(config);
    const base = BASE[mode] || BASE.sandbox;
    const token = await this.getAccessToken(clientId, clientSecret, mode);
    const res = await axios.post(
      `${base}/v2/checkout/orders/${orderId}/capture`,
      {},
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    return res.data.status === 'COMPLETED';
  },
};
