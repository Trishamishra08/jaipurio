export const COLLECTION_PRODUCT_CATALOG = [
  { id: '164', name: 'Marble Hanuman Murti: Divine Protector Statue for Home & Temple' },
  { id: '167', name: 'Marble Hanuman Murti: Divine Protector for Home & Temple' },
  { id: '174', name: 'Marble Krishna On Lotus (Divine Flute Player) Exquisite Home Decor' },
  { id: '186', name: 'Radha Krishna Statue: Divine Couple Marble Murti' },
  { id: '193', name: 'Bani Thani Statue: Rajasthani Beauty Marble Sculpture' },
  { id: '200', name: 'Marble Lakshmi Ganesha Statue: Divine Prosperity Duo' },
  { id: '7875', name: 'Modern Wooden Prayer Cabinet 36x32 Inch - Buy Space-Saving Corner Temple | Jaipurio' },
  { id: '7869', name: 'Chakra Mandir Design 2 Wooden Temple - Buy Starter Chakra Temple Online | Jaipurio' },
  { id: '1001', name: 'Rajasthani Design Matka (5L)' },
  { id: '1002', name: 'Kulhad (Pack of 6)' },
  { id: '1003', name: 'Terracotta Planter Set' },
  { id: '1004', name: 'Handpainted Diya Set' },
];

export const PRODUCT_COLLECTIONS = [
  {
    id: '3',
    name: 'Special Offer',
    slug: 'special-offer',
    description: '',
    status: 'Published',
    isFeatured: true,
    image: '/jaipurio_banner_art.png',
    productIds: ['164', '167', '174', '186', '193', '200', '7869', '7875'],
    createdAt: '2025-07-14',
  },
  {
    id: '2',
    name: 'Best Sellers',
    slug: 'best-sellers',
    description: 'Top-selling handcrafted pieces from Jaipur artisans.',
    status: 'Published',
    isFeatured: true,
    image: '/matka.png',
    productIds: ['1001', '1002', '1003'],
    createdAt: '2025-07-10',
  },
  {
    id: '1',
    name: 'New Arrival',
    slug: 'new-arrival',
    description: 'Fresh mitti crafts just arrived from the kiln.',
    status: 'Published',
    isFeatured: true,
    image: '/kulhad.png',
    productIds: ['1002', '1004'],
    createdAt: '2025-07-01',
  },
  {
    id: '4',
    name: 'Jaipur Blue Pottery Masterpieces',
    slug: 'jaipur-blue-pottery-masterpieces',
    description: 'Blue pottery collection from Jaipur workshops.',
    status: 'Published',
    isFeatured: false,
    image: '/planter.png',
    productIds: ['1003'],
    createdAt: '2026-08-10',
  },
];

export const getProductCollectionById = (id) =>
  PRODUCT_COLLECTIONS.find((row) => String(row.id) === String(id)) || null;

export const slugifyCollection = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
