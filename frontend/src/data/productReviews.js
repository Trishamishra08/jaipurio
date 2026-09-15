export const REVIEW_PRODUCTS = [
  { id: '1001', name: 'Rajasthani Design Matka (5L)' },
  { id: '1002', name: 'Kulhad (Pack of 6)' },
  { id: '1003', name: 'Decorative Diya Set (8 Pcs)' },
  { id: '1004', name: 'Terracotta Planter Set' },
  { id: '164', name: 'Marble Hanuman Murti: Divine Protector Statue for Home & Temple' },
  { id: '174', name: 'Marble Krishna On Lotus (Divine Flute Player) Exquisite Home Decor' },
];

export const REVIEW_CUSTOMERS = [
  { id: 'c1', name: 'Sunita Meena', email: 'sunita@example.com' },
  { id: 'c2', name: 'Kavita Singh', email: 'kavita@example.com' },
  { id: 'c3', name: 'Rahul Agarwal', email: 'rahul@example.com' },
  { id: 'c4', name: 'Admin Final', email: 'admin@gmail.com' },
];

export const PRODUCT_REVIEWS = [
  {
    id: '501',
    productId: '1001',
    product: 'Rajasthani Design Matka (5L)',
    customerId: 'c1',
    customer: 'Sunita Meena',
    customerEmail: 'sunita@example.com',
    rating: 5,
    comment: 'Authentic pure clay taste! Water stays incredibly chilled without electricity.',
    status: 'Approved',
    images: [],
    createdAt: '2026-09-08 10:22:11',
  },
  {
    id: '502',
    productId: '1002',
    product: 'Kulhad (Pack of 6)',
    customerId: 'c2',
    customer: 'Kavita Singh',
    customerEmail: 'kavita@example.com',
    rating: 5,
    comment: 'Brings genuine village tea aroma to our morning breakfast. Superb packing!',
    status: 'Approved',
    images: [],
    createdAt: '2026-09-04 14:05:40',
  },
  {
    id: '503',
    productId: '1003',
    product: 'Decorative Diya Set (8 Pcs)',
    customerId: 'c3',
    customer: 'Rahul Agarwal',
    customerEmail: 'rahul@example.com',
    rating: 4,
    comment: 'Beautiful gold detailing on the terracotta rim. Highly recommended.',
    status: 'Approved',
    images: [],
    createdAt: '2026-09-01 09:18:02',
  },
  {
    id: '504',
    productId: '1004',
    product: 'Terracotta Planter Set',
    customerId: 'c1',
    customer: 'Sunita Meena',
    customerEmail: 'sunita@example.com',
    rating: 5,
    comment: 'Perfect size for balcony herbs. Breathable mitti pots as promised.',
    status: 'Pending',
    images: [],
    createdAt: '2026-09-12 16:41:27',
  },
];

export const getReviewById = (id) =>
  PRODUCT_REVIEWS.find((row) => String(row.id) === String(id)) || null;

export const formatNowForReview = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
