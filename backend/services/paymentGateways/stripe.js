const Stripe = require('stripe');

module.exports = {
  code: 'stripe',
  name: 'Stripe',
  logo: '',
  configFields: [
    { key: 'publishableKey', label: 'Publishable Key', type: 'text', secret: false },
    { key: 'secretKey', label: 'Secret Key', type: 'password', secret: true },
    { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', secret: true },
  ],
  defaultInstructions: 'Pay securely with your Visa, Mastercard, or other card via Stripe.',

  resolveCredentials(config = {}) {
    return {
      publishableKey: config.publishableKey || process.env.STRIPE_PUBLISHABLE_KEY || '',
      secretKey: config.secretKey || process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: config.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || '',
    };
  },

  /** Creates a PaymentIntent; the storefront confirms it client-side with Stripe.js/Elements. */
  async createOrder(config, { amount, receipt }) {
    const { secretKey, publishableKey } = this.resolveCredentials(config);
    if (!secretKey) {
      return { mock: true, order: { id: 'mock_pi_' + Date.now(), amount: Math.round(amount * 100), currency: 'inr' }, keyId: '' };
    }
    const stripe = new Stripe(secretKey);
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'inr',
      description: receipt,
      automatic_payment_methods: { enabled: true },
    });
    return {
      mock: false,
      order: { id: intent.id, amount: intent.amount, currency: intent.currency, clientSecret: intent.client_secret },
      keyId: publishableKey,
    };
  },

  /** Confirms a PaymentIntent actually succeeded server-side before we mark the order paid. */
  async verifyPayment(config, { paymentIntentId }) {
    const { secretKey } = this.resolveCredentials(config);
    if (!secretKey) return true; // demo mode
    const stripe = new Stripe(secretKey);
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return intent.status === 'succeeded';
  },
};
