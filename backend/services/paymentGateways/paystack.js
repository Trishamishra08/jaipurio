const axios = require('axios');

const BASE = 'https://api.paystack.co';

module.exports = {
  code: 'paystack',
  name: 'Paystack',
  logo: '',
  configFields: [
    { key: 'publicKey', label: 'Public Key', type: 'text', secret: false },
    { key: 'secretKey', label: 'Secret Key', type: 'password', secret: true },
  ],
  defaultInstructions: 'Pay directly using your Visa, Mastercard, or bank account via Paystack.',

  resolveCredentials(config = {}) {
    return {
      publicKey: config.publicKey || process.env.PAYSTACK_PUBLIC_KEY || '',
      secretKey: config.secretKey || process.env.PAYSTACK_SECRET_KEY || '',
    };
  },

  /** Initializes a Paystack transaction; the storefront redirects the customer to the returned authorization_url. */
  async createOrder(config, { amount, receipt, email }) {
    const { secretKey, publicKey } = this.resolveCredentials(config);
    if (!secretKey) {
      return { mock: true, order: { id: 'mock_paystack_' + Date.now(), amount: Math.round(amount * 100) }, keyId: '' };
    }
    const res = await axios.post(
      `${BASE}/transaction/initialize`,
      { amount: Math.round(amount * 100), email: email || 'guest@jaipurio.in', reference: receipt },
      { headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' } }
    );
    return {
      mock: false,
      order: { id: res.data.data.reference, authorizationUrl: res.data.data.authorization_url },
      keyId: publicKey,
    };
  },

  /** Verifies a transaction actually succeeded server-side before we mark the order paid. */
  async verifyTransaction(config, { reference }) {
    const { secretKey } = this.resolveCredentials(config);
    if (!secretKey) return true; // demo mode
    const res = await axios.get(`${BASE}/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    return res.data.data.status === 'success';
  },
};
