const Razorpay = require('razorpay');
const crypto = require('crypto');

module.exports = {
  code: 'razorpay',
  name: 'Razorpay (UPI / Cards / Netbanking)',
  logo: '',
  configFields: [
    { key: 'keyId', label: 'Key ID', type: 'text', secret: false },
    { key: 'keySecret', label: 'Key Secret', type: 'password', secret: true },
    { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', secret: true },
  ],
  defaultInstructions: 'Pay securely via UPI, card, or netbanking.',

  /** Resolves effective credentials: DB config first, then env fallback. */
  resolveCredentials(config = {}) {
    return {
      keyId: config.keyId || process.env.RAZORPAY_KEY_ID || '',
      keySecret: config.keySecret || process.env.RAZORPAY_KEY_SECRET || '',
      webhookSecret: config.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || '',
    };
  },

  async createOrder(config, { amount, receipt }) {
    const { keyId, keySecret } = this.resolveCredentials(config);
    if (!keyId || !keySecret) {
      return { mock: true, order: { id: 'mock_order_' + Date.now(), amount: Math.round(amount * 100), currency: 'INR' }, keyId: '' };
    }
    const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await instance.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt,
    });
    return { mock: false, order, keyId };
  },

  verifySignature(config, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    const { keySecret } = this.resolveCredentials(config);
    if (!keySecret) return true; // demo mode, no secret configured
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac('sha256', keySecret).update(sign).digest('hex');
    return razorpay_signature === expected;
  },
};
