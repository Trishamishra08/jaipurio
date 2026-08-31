/** Load Razorpay checkout script once. */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Opens Razorpay checkout or resolves mock payment when backend returns mock order ids.
 */
export async function payWithRazorpay({
  razorpayOrder,
  quote,
  customer,
  keyId,
  onMockPay,
}) {
  const orderId = razorpayOrder?.id || '';
  const isMock = String(orderId).startsWith('mock_order_');

  if (isMock) {
    return onMockPay({
      razorpay_order_id: orderId,
      razorpay_payment_id: `mock_pay_${Date.now()}`,
      razorpay_signature: 'mock_signature_dev',
    });
  }

  const key = keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!key) {
    throw new Error('Razorpay key is not configured. Use Cash on Delivery or add VITE_RAZORPAY_KEY_ID.');
  }

  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error('Unable to load Razorpay checkout. Please try again.');
  }

  return new Promise((resolve, reject) => {
    const options = {
      key,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || 'INR',
      name: 'Jaipurio',
      description: 'Authentic Rajasthani Mitti Crafts',
      order_id: orderId,
      prefill: {
        name: customer?.name || '',
        email: customer?.email || '',
        contact: customer?.phone || '',
      },
      theme: { color: '#6F241D' },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      reject(new Error(response?.error?.description || 'Payment failed'));
    });
    rzp.open();
  });
}
