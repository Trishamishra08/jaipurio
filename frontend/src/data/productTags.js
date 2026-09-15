export const PRODUCT_TAGS = [
  {
    id: '3641',
    name: 'Embroidered Kurta',
    slug: 'embroidered-kurta',
    description: '',
    status: 'Published',
    createdAt: '2025-07-20',
    seoTitle: 'Battle Green Chikankaari Kurta Pajama Set - Handmade Elegance',
    seoDescription:
      "Elevate your ethnic style with Jaipurio's Handmade Battle Green Chikankaari Embroidered Kurta Pajama Set. Exquisite craftsmanship, rich color, elegant design. Order now.",
  },
  {
    id: '3640',
    name: 'Indian Traditional Clothing',
    slug: 'indian-traditional-clothing',
    description: '',
    status: 'Published',
    createdAt: '2025-07-20',
    seoTitle: 'Indian Traditional Clothing | Jaipurio',
    seoDescription: 'Shop Indian traditional clothing and handcrafted ethnic wear from Jaipurio artisans.',
  },
  {
    id: '3639',
    name: 'Ethnic Wear Men',
    slug: 'ethnic-wear-men',
    description: '',
    status: 'Published',
    createdAt: '2025-07-20',
    seoTitle: 'Ethnic Wear for Men | Jaipurio',
    seoDescription: 'Discover ethnic wear for men — kurtas, sets and festive looks from Jaipurio.',
  },
  {
    id: '3638',
    name: 'Cotton Kurta Pajama',
    slug: 'cotton-kurta-pajama',
    description: '',
    status: 'Published',
    createdAt: '2025-07-20',
    seoTitle: 'Cotton Kurta Pajama | Jaipurio',
    seoDescription: 'Soft cotton kurta pajama sets crafted for everyday comfort and festive occasions.',
  },
  {
    id: '3637',
    name: 'Battle Green Kurta',
    slug: 'battle-green-kurta',
    description: '',
    status: 'Published',
    createdAt: '2025-07-20',
    seoTitle: 'Battle Green Kurta | Jaipurio',
    seoDescription: 'Shop the Battle Green Kurta collection with handmade embroidery details.',
  },
  {
    id: '3636',
    name: 'Chikankari Kurta Pajama',
    slug: 'chikankari-kurta-pajama',
    description: '',
    status: 'Published',
    createdAt: '2025-07-20',
    seoTitle: 'Chikankari Kurta Pajama | Jaipurio',
    seoDescription: 'Elegant chikankari kurta pajama sets with traditional Lucknowi craftsmanship.',
  },
  {
    id: '3635',
    name: 'Divine Avatar Set',
    slug: 'divine-avatar-set',
    description: '',
    status: 'Published',
    createdAt: '2025-07-14',
    seoTitle: 'Divine Avatar Set | Jaipurio',
    seoDescription: 'Explore Divine Avatar handcrafted sets from Jaipurio artisans.',
  },
  {
    id: '3634',
    name: 'Sacred Brass Sculptures',
    slug: 'sacred-brass-sculptures',
    description: '',
    status: 'Published',
    createdAt: '2025-07-14',
    seoTitle: 'Sacred Brass Sculptures | Jaipurio',
    seoDescription: 'Handcrafted sacred brass sculptures for home and temple decor.',
  },
  {
    id: '3633',
    name: 'Handcrafted Vishnu Idols',
    slug: 'handcrafted-vishnu-idols',
    description: '',
    status: 'Published',
    createdAt: '2025-07-14',
    seoTitle: 'Handcrafted Vishnu Idols | Jaipurio',
    seoDescription: 'Premium handcrafted Vishnu idols from Jaipur artisans.',
  },
  {
    id: '3632',
    name: 'Premium Dashavatar Collection',
    slug: 'premium-dashavatar-collection',
    description: '',
    status: 'Published',
    createdAt: '2025-07-14',
    seoTitle: 'Premium Dashavatar Collection | Jaipurio',
    seoDescription: 'Explore the Premium Dashavatar Collection of handcrafted idols.',
  },
];

export const getProductTagById = (id) =>
  PRODUCT_TAGS.find((tag) => String(tag.id) === String(id)) || null;

export const slugifyTag = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
