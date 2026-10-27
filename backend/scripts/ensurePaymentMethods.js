const PaymentMethod = require('../models/paymentMethodModel');
const { getGateway } = require('../services/paymentGateways');

/**
 * Seeds COD and Razorpay as enabled payment methods on first boot, if none exist yet.
 * Also adds Cashfree (enabled) once, when the server has CASHFREE_APP_ID / CASHFREE_SECRET_KEY —
 * checkout then sends online payments through Cashfree. Disabling it later in Admin → Payments sticks.
 */
async function ensurePaymentMethods() {
  const count = await PaymentMethod.countDocuments();
  if (count === 0) {
    const defaults = ['cod', 'razorpay'];
    await Promise.all(
      defaults.map((code, index) => {
        const gateway = getGateway(code);
        if (!gateway) return null;
        return PaymentMethod.create({
          name: gateway.name,
          code,
          description: '',
          instructions: gateway.defaultInstructions,
          isEnabled: true,
          sortOrder: index,
        });
      })
    );
    console.log('Seeded default payment methods: cod, razorpay');
  }

  if (process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY && !(await PaymentMethod.exists({ code: 'cashfree' }))) {
    const gateway = getGateway('cashfree');
    await PaymentMethod.create({
      name: gateway.name,
      code: 'cashfree',
      description: '',
      instructions: gateway.defaultInstructions,
      isEnabled: true,
      sortOrder: await PaymentMethod.countDocuments(),
    });
    console.log('Added Cashfree payment method (keys found in environment)');
  }
}

module.exports = ensurePaymentMethods;
