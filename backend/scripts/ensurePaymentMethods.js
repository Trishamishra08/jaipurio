const PaymentMethod = require('../models/paymentMethodModel');
const { getGateway } = require('../services/paymentGateways');

/** Seeds COD and Razorpay as enabled payment methods on first boot, if none exist yet. */
async function ensurePaymentMethods() {
  const count = await PaymentMethod.countDocuments();
  if (count > 0) return;

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

module.exports = ensurePaymentMethods;
