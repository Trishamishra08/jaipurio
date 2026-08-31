const PRODUCT_LIFECYCLE = ['Draft', 'Pending Approval', 'Published', 'Rejected'];

const ORDER_STATUS = [
  'Order Placed',
  'Payment Confirmed',
  'Vendor Accepts',
  'Processing',
  'Completed',
];

const SHIPMENT_STATUS = ['Not created', 'Processing', 'Dispatched', 'Delivered'];

const PAYMENT_STATUS = ['Unpaid', 'Paid', 'Refunded', 'Incomplete'];

const RETURN_STATUS = [
  'Return Request created',
  'Vendor Review',
  'Vendor accepts',
  'Customer ships item back',
  'Vendor inspects',
  'Vendor initiates refund',
  'Payment status: Refunded',
  'Commission reversed',
  'Rejected — admin dispute available',
];

const PAYOUT_STATUS = [
  'Pending approval',
  'Approved',
  'Sent to bank',
  'Settled',
  'Rejected',
];

const EARNING_STATUS = ['Pending', 'Available', 'Cleared', 'Refunded', 'Reversed'];

const VENDOR_PLANS = {
  Starter: { commissionRate: 15, listingLimit: 50 },
  Growth: { commissionRate: 12, listingLimit: 200 },
  Premium: { commissionRate: 8, listingLimit: 1000 },
};

const KYC_STATUS = ['Pending', 'Verified', 'Rejected'];

const INCOMPLETE_STATUS = ['Abandoned', 'Awaiting payment', 'Pending'];

const LOW_STOCK_THRESHOLD = 8;
const RETURN_WINDOW_DAYS = 7;

const lifecycleToLegacyStatus = (lifecycle) => {
  if (lifecycle === 'Published') return 'approved';
  if (lifecycle === 'Rejected') return 'rejected';
  return 'pending';
};

const legacyStatusToLifecycle = (status, published) => {
  if (status === 'approved' || published) return 'Published';
  if (status === 'rejected') return 'Rejected';
  return 'Pending Approval';
};

const stockStatusFromQty = (stock, trackQuantity = true) => {
  if (trackQuantity && Number(stock) <= 0) return 'Out of Stock';
  return 'In Stock';
};

module.exports = {
  PRODUCT_LIFECYCLE,
  ORDER_STATUS,
  SHIPMENT_STATUS,
  PAYMENT_STATUS,
  RETURN_STATUS,
  PAYOUT_STATUS,
  EARNING_STATUS,
  VENDOR_PLANS,
  KYC_STATUS,
  INCOMPLETE_STATUS,
  LOW_STOCK_THRESHOLD,
  RETURN_WINDOW_DAYS,
  lifecycleToLegacyStatus,
  legacyStatusToLifecycle,
  stockStatusFromQty,
};
