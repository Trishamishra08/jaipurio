export const PRODUCT_LABELS = [
  {
    id: '3',
    name: 'Sale',
    color: '#ed1b24',
    status: 'Published',
    createdAt: '2025-07-14',
  },
  {
    id: '2',
    name: 'New',
    color: '#0d9488',
    status: 'Published',
    createdAt: '2025-07-10',
  },
  {
    id: '1',
    name: 'Hot',
    color: '#ea580c',
    status: 'Published',
    createdAt: '2025-07-01',
  },
  {
    id: '4',
    name: 'Bestseller',
    color: '#c2410c',
    status: 'Published',
    createdAt: '2026-08-01',
  },
];

export const getProductLabelById = (id) =>
  PRODUCT_LABELS.find((row) => String(row.id) === String(id)) || null;
