export const DISCOUNTS = [
  {
    id: '1',
    type: 'coupon',
    code: 'TQIME3JIV7SC',
    title: '',
    expired: true,
    canUseWithPromotion: true,
    unlimited: true,
    applyViaUrl: false,
    displayAtCheckout: false,
    couponType: 'percentage',
    value: 10,
    applyFor: 'all_orders',
    minOrderAmount: '',
    used: 0,
    startDate: '2024-11-13',
    startTime: '0:00',
    endDate: '2024-12-31',
    endTime: '23:59',
    neverExpired: false,
    store: '—',
    description: 'Discount 10% for all orders',
  },
  {
    id: '2',
    type: 'coupon',
    code: 'JAIPURIO10',
    title: '',
    expired: false,
    canUseWithPromotion: false,
    unlimited: true,
    applyViaUrl: false,
    displayAtCheckout: true,
    couponType: 'percentage',
    value: 10,
    applyFor: 'all_orders',
    minOrderAmount: '',
    used: 142,
    startDate: '2026-01-01',
    startTime: '0:00',
    endDate: '2026-12-31',
    endTime: '23:59',
    neverExpired: false,
    store: '—',
    description: 'Discount 10% for all orders',
  },
  {
    id: '3',
    type: 'coupon',
    code: 'FESTIVE50',
    title: '',
    expired: false,
    canUseWithPromotion: true,
    unlimited: false,
    applyViaUrl: false,
    displayAtCheckout: false,
    couponType: 'amount',
    value: 50,
    applyFor: 'order_amount_from',
    minOrderAmount: '399',
    used: 88,
    startDate: '2026-09-01',
    startTime: '0:00',
    endDate: '2026-11-15',
    endTime: '23:59',
    neverExpired: false,
    store: '—',
    description: 'Discount ₹50.0 for order amount from ₹399.0',
  },
];

export const getDiscountById = (id) =>
  DISCOUNTS.find((row) => String(row.id) === String(id)) || null;

export const generateCouponCode = (length = 12) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

export const buildDiscountDetail = (row) => {
  if (row.type === 'promotion') {
    return row.title || row.description || 'Promotion';
  }
  const valueLabel =
    row.couponType === 'percentage'
      ? `${row.value}%`
      : row.couponType === 'free_shipping'
        ? 'free shipping'
        : row.couponType === 'same_price'
          ? `same price ₹${row.value}`
          : `₹${row.value}`;
  return row.description || `Discount ${valueLabel} for all orders`;
};
