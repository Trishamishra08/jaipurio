const KEYS = {
  products: 'jaipurio_flow_products_v3',
  orders: 'jaipurio_flow_orders_v3',
  returns: 'jaipurio_flow_returns_v3',
  payouts: 'jaipurio_flow_payouts_v3',
  affiliates: 'jaipurio_flow_affiliates',
  redirects: 'jaipurio_flow_redirects',
};

const now = () => new Date().toISOString();

const seedProducts = [
  {
    id: 'prd-001',
    title: 'Kundan Bangle Set',
    sku: 'JP-BAN-001',
    store: 'Shyam Pottery',
    category: 'Jewellery / Bangles',
    brand: 'Jaipurio Heritage',
    price: 2499,
    salePrice: 1999,
    discountProductPrice: 200,
    costPerItem: 1100,
    barcode: '890123456001',
    stock: 12,
    warehouse: 'Jaipur WH-1',
    stockStatus: 'In Stock',
    trackQuantity: true,
    published: false,
    lifecycle: 'Pending Approval',
    isFeatured: false,
    weight: 0.35,
    length: 8,
    width: 8,
    height: 3,
    tags: 'kundan, bridal',
    seoTitle: 'Kundan Bangle Set | Jaipurio',
    seoDescription: 'Handcrafted Kundan bangles from Jaipur artisans.',
  },
  {
    id: 'prd-002',
    title: 'Marble Ganesh Chowki',
    sku: 'JP-CHW-014',
    store: 'Shyam Pottery',
    category: 'Home & Living / Spirituality & Religion / Religious Home & Decor / Chowki',
    brand: 'Jaipurio Heritage',
    price: 4599,
    salePrice: '',
    discountProductPrice: '',
    costPerItem: 2100,
    barcode: '890123456014',
    stock: 0,
    warehouse: 'Jaipur WH-1',
    stockStatus: 'Out of Stock',
    trackQuantity: true,
    published: true,
    lifecycle: 'Published',
    isFeatured: true,
    weight: 2.4,
    length: 20,
    width: 20,
    height: 8,
    tags: 'ganesh, marble',
    seoTitle: 'Marble Ganesh Chowki',
    seoDescription: 'Carved marble chowki for home puja.',
  },
  {
    id: 'prd-003',
    title: 'Silver Jhumka Earrings',
    sku: 'JP-EAR-009',
    store: 'Shyam Pottery',
    category: 'Jewellery / Earrings',
    brand: 'Jaipurio Heritage',
    price: 1299,
    salePrice: '',
    discountProductPrice: '',
    costPerItem: 480,
    barcode: '890123456009',
    stock: 6,
    warehouse: 'Jaipur WH-1',
    stockStatus: 'In Stock',
    trackQuantity: true,
    published: false,
    lifecycle: 'Draft',
    isFeatured: false,
    weight: 0.08,
    length: 4,
    width: 2,
    height: 6,
    tags: 'silver, jhumka',
    seoTitle: '',
    seoDescription: '',
  },
];

const seedOrders = [
  {
    id: '00000373',
    customer: 'Aditi Sharma',
    phone: '98111 22334',
    town: 'Amer, Jaipur',
    guest: false,
    paymentStatus: 'Paid',
    orderStatus: 'Processing',
    subTotal: 2499,
    discount: 200,
    shippingFee: 80,
    tax: 115,
    total: 2494,
    paidAmount: 2494,
    note: '',
    items: [{ name: 'Kundan Bangle Set', qty: 1, amount: 2499 }],
    shipment: {
      number: 'SHP-000373',
      method: 'Default',
      status: 'Processing',
      note: '',
    },
    createdAt: '2026-08-20',
  },
  {
    id: '00000374',
    customer: 'Rahul Verma',
    phone: '98290 44521',
    town: 'Sanganer',
    guest: true,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    subTotal: 4599,
    discount: 0,
    shippingFee: 120,
    tax: 230,
    total: 4949,
    paidAmount: 4949,
    note: 'Leave at gate',
    items: [{ name: 'Marble Ganesh Chowki', qty: 1, amount: 4599 }],
    shipment: {
      number: 'SHP-000374',
      method: 'Dispatched',
      status: 'Delivered',
      note: 'Delivered to customer',
    },
    createdAt: '2026-08-12',
  },
  {
    id: '00000375',
    customer: 'Priya Singh',
    phone: '97654 11220',
    town: 'Jaipur',
    guest: false,
    paymentStatus: 'Paid',
    orderStatus: 'Payment Confirmed',
    subTotal: 1299,
    discount: 0,
    shippingFee: 60,
    tax: 65,
    total: 1424,
    paidAmount: 1424,
    note: '',
    items: [{ name: 'Silver Jhumka Earrings', qty: 1, amount: 1299 }],
    shipment: null,
    createdAt: '2026-08-26',
  },
];

const seedReturns = [
  {
    id: 'RMA-1001',
    orderId: '00000374',
    customer: 'Rahul Verma',
    reason: 'Chip on the corner of the chowki',
    photos: 2,
    status: 'Vendor Review',
    createdAt: '2026-08-22',
  },
];

const seedPayouts = [
  {
    id: 'PO-18',
    vendor: 'Shyam Pottery',
    amount: 1840,
    status: 'Pending approval',
    createdAt: '2026-08-25',
  },
];

function load(key, seed) {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export const platformStore = {
  products: () => load(KEYS.products, seedProducts),
  saveProducts: (items) => save(KEYS.products, items),
  orders: () => load(KEYS.orders, seedOrders),
  saveOrders: (items) => save(KEYS.orders, items),
  returns: () => load(KEYS.returns, seedReturns),
  saveReturns: (items) => save(KEYS.returns, items),
  payouts: () => load(KEYS.payouts, seedPayouts),
  savePayouts: (items) => save(KEYS.payouts, items),
  affiliates: () =>
    load(KEYS.affiliates, [
      { id: 1, name: 'Kavita Rao', email: 'kavita@gmail.com', status: 'Pending', pending: 0, available: 0 },
      { id: 2, name: 'Aman Joshi', email: 'aman.j@gmail.com', status: 'Approved', pending: 420, available: 1800 },
    ]),
  saveAffiliates: (items) => save(KEYS.affiliates, items),
  redirects: () =>
    load(KEYS.redirects, [
      { id: 1, from: '/old-bangles', to: '/shop?cat=bangles', type: '301' },
    ]),
  saveRedirects: (items) => save(KEYS.redirects, items),
  now,
};
