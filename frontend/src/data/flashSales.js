import { COLLECTION_PRODUCT_CATALOG } from './productCollections';

export const FLASH_SALE_PRODUCT_CATALOG = [
  { id: '207', name: 'Radha Krishna Statue: Divine Couple Marble Murti', price: 30000 },
  { id: '1302', name: 'Korean Traditional Gemstone Hair Pin', price: 4200 },
  { id: '1003', name: 'Stone Work Brass Ganesha Idol', price: 4600 },
  { id: '221', name: 'Gautama Buddha Statue: Serene Marble Sculpture', price: 30000 },
  { id: '228', name: 'Buddha Statue: Serene Marble Sculpture', price: 29000 },
  { id: '872', name: 'Natural Amethyst & Multi-Tourmaline Silver Ring', price: 27285 },
  { id: '193', name: 'Bani Thani Statue: Rajasthani Beauty Marble Sculpture', price: 12000 },
  { id: '831', name: 'Personalized 16" Leather Briefcase', price: 9000 },
  { id: '186', name: 'Radha Krishna Statue: Divine Couple Marble Murti (Large)', price: 45000 },
  { id: '849', name: 'Daily Wear Bur Bangles', price: 800 },
  { id: '860', name: 'Shakha with Blue Chudiyan', price: 900 },
  { id: '828', name: 'Personalized Vintage Leather Backpack', price: 13056 },
  { id: '167', name: 'Marble Hanuman Murti: Divine Protector for Home & Temple', price: 27000 },
  { id: '843', name: 'Green Seep Bangles', price: 500 },
  { id: '827', name: 'Handmade Personalized Genuine Leather Satchel Bag', price: 2394 },
  { id: '861', name: 'Shakha with Glass Bangles', price: 850 },
  { id: '1001', name: 'Rajasthani Design Matka (5L)', price: 599 },
  { id: '1002', name: 'Kulhad (Pack of 6)', price: 349 },
  { id: '1004', name: 'Handpainted Diya Set', price: 450 },
  ...COLLECTION_PRODUCT_CATALOG.filter(
    (p) => !['207', '1302', '1003', '221', '228', '872', '193', '831', '186', '849', '860', '828', '167', '843', '827', '861', '1001', '1002', '1004'].includes(String(p.id))
  ).map((p) => ({ ...p, price: 999 })),
];

export const FLASH_SALES = [
  {
    id: '1',
    name: 'Winter Sale',
    endDate: '2024-12-30',
    createdAt: '2024-08-21',
    status: 'Published',
    products: [
      { productId: '207', price: 40000, quantity: 1 },
      { productId: '1302', price: 8000, quantity: 1 },
      { productId: '1003', price: 9400, quantity: 1 },
      { productId: '221', price: 40000, quantity: 1 },
      { productId: '228', price: 40000, quantity: 1 },
      { productId: '872', price: 38000, quantity: 1 },
      { productId: '193', price: 18000, quantity: 1 },
      { productId: '831', price: 13000, quantity: 1 },
      { productId: '186', price: 60000, quantity: 1 },
      { productId: '849', price: 1200, quantity: 1 },
      { productId: '860', price: 1500, quantity: 1 },
      { productId: '828', price: 19000, quantity: 1 },
      { productId: '167', price: 45000, quantity: 1 },
      { productId: '843', price: 700, quantity: 1 },
      { productId: '827', price: 3500, quantity: 1 },
      { productId: '861', price: 1500, quantity: 1 },
    ],
  },
  {
    id: '2',
    name: 'Summer Mitti Utsav 2026',
    endDate: '2026-09-20',
    createdAt: '2026-08-15',
    status: 'Published',
    products: [
      { productId: '1001', price: 399, quantity: 20 },
      { productId: '1002', price: 249, quantity: 40 },
      { productId: '1004', price: 299, quantity: 30 },
    ],
  },
];

export const getFlashSaleById = (id) =>
  FLASH_SALES.find((row) => String(row.id) === String(id)) || null;

export const getFlashSaleProduct = (productId) =>
  FLASH_SALE_PRODUCT_CATALOG.find((p) => String(p.id) === String(productId)) || null;

export const formatFlashPrice = (value) => {
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: num % 1 ? 1 : 0, maximumFractionDigits: 1 })}`;
};
