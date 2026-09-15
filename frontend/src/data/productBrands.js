export const PRODUCT_BRANDS = [
  {
    id: '7',
    name: 'Jaipurio',
    description: 'Authentic mitti crafts and handcrafted heritage pieces from Jaipur artisans.',
    website: 'https://jaipurio.in',
    order: 0,
    status: 'Published',
    isFeatured: true,
    logo: '/jaipurio_logo.png',
  },
  {
    id: '6',
    name: 'Shyam Terracotta Artisans',
    description: 'Traditional terracotta pottery from Jaipur pottery lanes.',
    website: 'https://jaipurio.in',
    order: 1,
    status: 'Published',
    isFeatured: true,
    logo: '/matka.png',
  },
  {
    id: '5',
    name: 'Meera Mitti Works',
    description: 'Handmade kulhads, planters and festive clayware.',
    website: 'https://jaipurio.in',
    order: 2,
    status: 'Published',
    isFeatured: true,
    logo: '/kulhad.png',
  },
  {
    id: '4',
    name: 'Pushkar Sacred Clay Studio',
    description: 'Sacred clay diyas and temple essentials.',
    website: 'https://jaipurio.in',
    order: 3,
    status: 'Published',
    isFeatured: false,
    logo: '/diya.png',
  },
];

export const getBrandById = (id) =>
  PRODUCT_BRANDS.find((row) => String(row.id) === String(id)) || null;
