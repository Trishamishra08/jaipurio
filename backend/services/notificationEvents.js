/**
 * Every notification the platform sends, in one place: wording, link, category
 * and (for admins) which permission should receive it.
 *
 * notify({ event: 'order.shipped', to: { userId }, data: { orderNumber: 'JP-1042', awb: '…' } })
 *
 * Templates receive `data` and must never show Mongo ids — use orderRef().
 * Categories in ALWAYS_ON cannot be muted by the recipient.
 */

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const ref = (d) => `#${d.orderNumber || d.orderRef || ''}`.replace(/#$/, '');
const cut = (s, n = 120) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

const CATEGORIES = ['order', 'payment', 'return', 'product', 'payout', 'account', 'support', 'review', 'chat', 'promotion', 'affiliate', 'stock', 'system', 'general'];
const ALWAYS_ON = new Set(['order', 'payment', 'return', 'account', 'payout', 'support', 'system']);

const EVENTS = {
  // ─── Customer ──────────────────────────────────────────────────────────
  'order.placed': {
    category: 'order', type: 'success', tag: (d) => `order-${d.orderNumber}`,
    title: () => 'Order placed',
    body: (d) => `Thank you! Order ${ref(d)} of ${inr(d.total)} is confirmed${d.cod ? ' (Cash on Delivery)' : ''}.`,
    link: () => '/orders',
  },
  'order.paid': {
    category: 'payment', type: 'success', tag: (d) => `order-${d.orderNumber}`,
    title: () => 'Payment received',
    body: (d) => `We received ${inr(d.total)}. Order ${ref(d)} is confirmed.`,
    link: () => '/orders',
  },
  'payment.failed': {
    category: 'payment', type: 'warning',
    title: () => 'Payment not completed',
    body: (d) => `Your payment${d.total ? ` of ${inr(d.total)}` : ''} did not go through. No order was placed — you can try again from your bag.`,
    link: () => '/checkout',
  },
  'order.accepted': {
    category: 'order', type: 'info', tag: (d) => `order-${d.orderNumber}`,
    title: () => 'Order being prepared',
    body: (d) => `The seller has accepted order ${ref(d)} and is packing it.`,
    link: () => '/orders',
  },
  'order.status': {
    category: 'order', type: 'info', tag: (d) => `order-${d.orderNumber}`,
    title: (d) => `Order ${d.status || 'update'}`,
    body: (d) => `Order ${ref(d)} is now ${String(d.status || 'updated').toLowerCase()}.`,
    link: () => '/orders',
  },
  'order.shipped': {
    category: 'order', type: 'info', tag: (d) => `order-${d.orderNumber}`,
    title: () => 'Order shipped',
    body: (d) => `Order ${ref(d)} is on its way${d.courier ? ` with ${d.courier}` : ''}${d.awb ? ` (AWB ${d.awb})` : ''}.`,
    link: () => '/orders',
  },
  'order.out_for_delivery': {
    category: 'order', type: 'info', tag: (d) => `order-${d.orderNumber}`,
    title: () => 'Out for delivery',
    body: (d) => `Order ${ref(d)} will reach you today.`,
    link: () => '/orders',
  },
  'order.delivered': {
    category: 'order', type: 'success', tag: (d) => `order-${d.orderNumber}`,
    title: () => 'Delivered',
    body: (d) => `Order ${ref(d)} was delivered. Loved it? Leave a review.`,
    link: () => '/orders',
  },
  'order.cancelled': {
    category: 'order', type: 'warning', tag: (d) => `order-${d.orderNumber}`,
    title: () => 'Order cancelled',
    body: (d) => `Order ${ref(d)} was cancelled.${d.paid ? ' Any amount paid will be refunded to the original payment method.' : ''}`,
    link: () => '/orders',
  },
  'order.item_status': {
    category: 'order', type: 'info',
    title: () => 'Order update',
    body: (d) => `"${cut(d.itemName, 60)}" in order ${ref(d)} is now ${String(d.status || '').toLowerCase()}.`,
    link: () => '/orders',
  },
  'return.updated': {
    category: 'return', type: 'info',
    title: () => 'Return update',
    body: (d) => `Your ${d.kind || 'return'} request for order ${ref(d)} is now ${String(d.status || '').toLowerCase()}.`,
    link: () => '/orders',
  },
  'refund.processed': {
    category: 'payment', type: 'success',
    title: () => 'Refund processed',
    body: (d) => `A refund of ${inr(d.amount)} for order ${ref(d)} has been processed.`,
    link: () => '/orders',
  },
  'support.updated': {
    category: 'support', type: 'info',
    title: () => 'Support ticket updated',
    body: (d) => `Your ticket ${d.ticketRef ? `#${d.ticketRef} ` : ''}is now ${String(d.status || '').toLowerCase()}.`,
    link: (d) => (d.role === 'vendor' ? '/vendor/support' : '/profile'),
  },
  'review.replied': {
    category: 'review', type: 'info',
    title: () => 'Jaipurio replied to your review',
    body: (d) => cut(d.reply, 140),
    link: () => '/reviews',
  },
  'chat.message': {
    category: 'chat', type: 'info',
    title: (d) => `New message from ${d.senderName || 'Jaipurio'}`,
    body: (d) => cut(d.message, 140),
    link: (d) => d.link || (d.role === 'vendor' ? '/vendor/support' : d.role === 'admin' ? '/admin/support' : '/profile'),
  },
  'affiliate.status': {
    category: 'affiliate', type: 'info',
    title: (d) => `Affiliate application ${String(d.status || '').toLowerCase()}`,
    body: (d) => (d.status === 'Approved' ? 'You can now share your referral link and earn commission.' : 'Your affiliate application was not approved this time.'),
    link: () => '/affiliate',
  },
  'affiliate.commission': {
    category: 'affiliate', type: 'success',
    title: () => 'Commission earned',
    body: (d) => `You earned ${inr(d.amount)} on a referred order.`,
    link: () => '/affiliate',
  },
  'affiliate.payout': {
    category: 'payout', type: 'info',
    title: () => 'Affiliate payout update',
    body: (d) => `Your payout of ${inr(d.amount)} is now ${String(d.status || '').toLowerCase()}.`,
    link: () => '/affiliate',
  },

  // ─── Vendor ────────────────────────────────────────────────────────────
  'vendor.approved': {
    category: 'account', type: 'success',
    title: () => 'Seller account approved',
    body: () => 'Your store is live. You can now add products and receive orders.',
    link: () => '/vendor',
  },
  'vendor.suspended': {
    category: 'account', type: 'alert',
    title: () => 'Seller account suspended',
    body: () => 'Your seller account has been suspended. Please contact Jaipurio support.',
    link: () => '/vendor/support',
  },
  'vendor.reactivated': {
    category: 'account', type: 'success',
    title: () => 'Seller account reactivated',
    body: () => 'Your seller account is active again.',
    link: () => '/vendor',
  },
  'vendor.order_new': {
    category: 'order', type: 'success', tag: (d) => `vorder-${d.orderNumber}`,
    title: () => 'New order received',
    body: (d) => `Order ${ref(d)}${d.itemCount ? ` · ${d.itemCount} item${d.itemCount > 1 ? 's' : ''}` : ''}${d.amount ? ` · ${inr(d.amount)}` : ''}${d.cod ? ' · COD' : ' · Paid'}. Please accept and pack it.`,
    link: () => '/vendor/orders',
  },
  'vendor.order_cancelled': {
    category: 'order', type: 'warning', tag: (d) => `vorder-${d.orderNumber}`,
    title: () => 'Order cancelled',
    body: (d) => `Order ${ref(d)} was cancelled. Do not ship it.`,
    link: () => '/vendor/orders',
  },
  'vendor.return_requested': {
    category: 'return', type: 'warning',
    title: (d) => `${d.kind || 'Return'} requested`,
    body: (d) => `${d.rma ? `${d.rma} · ` : ''}Order ${ref(d)}${d.reason ? ` · ${cut(d.reason, 80)}` : ''}. Please review it.`,
    link: () => '/vendor/returns',
  },
  'vendor.product_status': {
    category: 'product', type: 'info',
    title: (d) => `Product ${String(d.status || 'updated').toLowerCase()}`,
    body: (d) => `"${cut(d.productName, 70)}" is now ${String(d.status || '').toLowerCase()}.${d.note ? ` ${cut(d.note, 80)}` : ''}`,
    link: () => '/vendor/products',
  },
  'vendor.stock_low': {
    category: 'stock', type: 'warning',
    title: (d) => (Number(d.stock) <= 0 ? 'Out of stock' : 'Low stock'),
    body: (d) => (Number(d.stock) <= 0 ? `"${cut(d.productName, 70)}" is out of stock.` : `"${cut(d.productName, 70)}" has only ${d.stock} left.`),
    link: () => '/vendor/inventory',
  },
  'vendor.payout': {
    category: 'payout', type: 'info',
    title: () => 'Payout update',
    body: (d) => `Payout${d.payoutRef ? ` ${d.payoutRef}` : ''}${d.amount ? ` of ${inr(d.amount)}` : ''} is now ${String(d.status || '').toLowerCase()}.`,
    link: () => '/vendor/payouts',
  },
  'vendor.earnings_released': {
    category: 'payout', type: 'success',
    title: () => 'Earnings available',
    body: (d) => `${d.amount ? inr(d.amount) : 'New earnings'} ${d.amount ? 'is' : 'are'} now available to withdraw.`,
    link: () => '/vendor/earnings',
  },
  'vendor.review_new': {
    category: 'review', type: 'info',
    title: (d) => `New ${d.rating ? `${d.rating}★ ` : ''}review`,
    body: (d) => `On "${cut(d.productName, 60)}"${d.comment ? `: ${cut(d.comment, 80)}` : ''}`,
    link: () => '/vendor/reviews',
  },

  // ─── Admin (permission = which admin role should receive it) ───────────
  'admin.order_new': {
    category: 'order', type: 'success', permission: 'manage_orders',
    title: () => 'New order',
    body: (d) => `Order ${ref(d)} · ${inr(d.total)} · ${d.cod ? 'COD' : 'Paid online'}${d.customer ? ` · ${cut(d.customer, 30)}` : ''}`,
    link: (d) => (d.orderId ? `/admin/ecommerce/orders/edit/${d.orderId}` : '/admin/ecommerce/orders'),
  },
  'admin.payment_issue': {
    category: 'payment', type: 'alert', permission: 'manage_orders',
    title: () => 'Payment verification failed',
    body: (d) => `${d.gateway || 'Gateway'} order ${d.gatewayOrderId || ''}: ${cut(d.reason, 100)}`,
    link: () => '/admin/ecommerce/incomplete-orders',
  },
  'admin.order_cancelled': {
    category: 'order', type: 'warning', permission: 'manage_orders',
    title: () => 'Order cancelled',
    body: (d) => `Order ${ref(d)} was cancelled${d.by ? ` by ${d.by}` : ''}.`,
    link: (d) => (d.orderId ? `/admin/ecommerce/orders/edit/${d.orderId}` : '/admin/ecommerce/orders'),
  },
  'admin.vendor_registered': {
    category: 'account', type: 'info',
    title: () => 'New seller awaiting approval',
    body: (d) => `${cut(d.storeName || d.name || 'A seller', 60)} registered${d.city ? ` from ${d.city}` : ''}.`,
    link: () => '/admin/vendors/pending',
  },
  'admin.product_pending': {
    category: 'product', type: 'info',
    title: () => 'Product awaiting approval',
    body: (d) => `"${cut(d.productName, 70)}"${d.sku ? ` (${d.sku})` : ''}${d.vendorName ? ` by ${cut(d.vendorName, 40)}` : ''}`,
    link: (d) => (d.productId ? `/admin/ecommerce/products/edit/${d.productId}` : '/admin/ecommerce/products'),
  },
  'admin.return_requested': {
    category: 'return', type: 'warning', permission: 'manage_orders',
    title: (d) => `${d.kind || 'Return'} requested`,
    body: (d) => `Order ${ref(d)}${d.reason ? ` · ${cut(d.reason, 80)}` : ''}`,
    link: () => '/admin/returns',
  },
  'admin.payout_requested': {
    category: 'payout', type: 'info',
    title: () => 'Payout requested',
    body: (d) => `${cut(d.vendorName || 'A seller', 40)} requested ${inr(d.amount)}.`,
    link: () => '/admin/marketplaces/withdrawals',
  },
  'admin.affiliate_applied': {
    category: 'affiliate', type: 'info', permission: 'manage_affiliates',
    title: () => 'New affiliate application',
    body: (d) => `${cut(d.name || 'A customer', 50)} applied to the affiliate program.`,
    link: () => '/admin/affiliates',
  },
  'admin.affiliate_payout_requested': {
    category: 'payout', type: 'info', permission: 'manage_affiliates',
    title: () => 'Affiliate payout requested',
    body: (d) => `${cut(d.name || 'An affiliate', 50)} requested ${inr(d.amount)}.`,
    link: () => '/admin/affiliates',
  },
  'admin.ticket_new': {
    category: 'support', type: 'info', permission: 'manage_support',
    title: () => 'New support ticket',
    body: (d) => `${d.subject ? cut(d.subject, 80) : 'A new ticket'}${d.from ? ` · ${cut(d.from, 40)}` : ''}`,
    link: () => '/admin/support',
  },
  'admin.contact_new': {
    category: 'support', type: 'info', permission: 'manage_support',
    title: () => 'New contact message',
    body: (d) => `${cut(d.name || 'Someone', 40)}: ${cut(d.subject || d.message, 90)}`,
    link: (d) => (d.contactId ? `/admin/contacts/edit/${d.contactId}` : '/admin/contacts'),
  },
  'admin.consultation_new': {
    category: 'support', type: 'info', permission: 'manage_support',
    title: () => 'New consultation request',
    body: (d) => `${cut(d.name || 'A customer', 40)}${d.phone ? ` · ${d.phone}` : ''}`,
    link: () => '/admin/support',
  },
  'admin.review_new': {
    category: 'review', type: 'info',
    title: (d) => `New ${d.rating ? `${d.rating}★ ` : ''}review`,
    body: (d) => `On "${cut(d.productName, 60)}"${d.comment ? `: ${cut(d.comment, 80)}` : ''}`,
    link: () => '/admin/ecommerce/reviews',
  },
  'admin.system_alert': {
    category: 'system', type: 'alert',
    title: (d) => d.title || 'System alert',
    body: (d) => cut(d.message, 140),
    link: (d) => d.link || '/admin',
  },

  // ─── Manual / broadcast ────────────────────────────────────────────────
  broadcast: {
    category: 'general', type: 'info',
    title: (d) => d.title,
    body: (d) => d.message,
    link: (d) => d.link || '',
  },
};

module.exports = { EVENTS, ALWAYS_ON, CATEGORIES, inr };
