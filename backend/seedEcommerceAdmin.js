/**
 * Seed ecommerce admin catalog from frontend mock data into MongoDB.
 * Usage: node seedEcommerceAdmin.js
 * Uses MONGODB_URI from backend/.env
 */
try {
  require('dotenv').config();
} catch {
  /* optional */
}

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { slugify, normalizeSeo } = require('./utils/seoFields');
const { ensureRichCopy } = require('./utils/productCopy');

const Product = require('./models/productModel');
const Inventory = require('./models/inventoryModel');
const User = require('./models/userModel');
const Category = require('./models/categoryModel');
const EcommerceBrand = require('./models/ecommerceBrandModel');
const EcommerceProductTag = require('./models/ecommerceProductTagModel');
const EcommerceProductCollection = require('./models/ecommerceProductCollectionModel');
const EcommerceProductLabel = require('./models/ecommerceProductLabelModel');
const EcommerceProductOption = require('./models/ecommerceProductOptionModel');
const EcommerceAttributeSet = require('./models/ecommerceAttributeSetModel');
const EcommerceFlashSale = require('./models/ecommerceFlashSaleModel');
const EcommerceDiscount = require('./models/ecommerceDiscountModel');
const EcommerceSpecificationGroup = require('./models/ecommerceSpecificationGroupModel');
const Review = require('./models/reviewModel');

const BRANDS = [
  { legacyId: '7', name: 'Jaipurio', description: 'Authentic mitti crafts and handcrafted heritage pieces from Jaipur artisans.', website: 'https://jaipurio.in', order: 0, status: 'Published', isFeatured: true, logo: '/jaipurio_logo.png' },
  { legacyId: '6', name: 'Shyam Terracotta Artisans', description: 'Traditional terracotta pottery from Jaipur pottery lanes.', website: 'https://jaipurio.in', order: 1, status: 'Published', isFeatured: true, logo: '/matka.png' },
  { legacyId: '5', name: 'Meera Mitti Works', description: 'Handmade kulhads, planters and festive clayware.', website: 'https://jaipurio.in', order: 2, status: 'Published', isFeatured: true, logo: '/kulhad.png' },
  { legacyId: '4', name: 'Pushkar Sacred Clay Studio', description: 'Sacred clay diyas and temple essentials.', website: 'https://jaipurio.in', order: 3, status: 'Published', isFeatured: false, logo: '/diya.png' },
];

const TAGS = [
  { legacyId: '3641', name: 'Embroidered Kurta', slug: 'embroidered-kurta', seoTitle: 'Battle Green Chikankaari Kurta Pajama Set - Handmade Elegance', seoDescription: "Elevate your ethnic style with Jaipurio's Handmade Battle Green Chikankaari Embroidered Kurta Pajama Set." },
  { legacyId: '3640', name: 'Indian Traditional Clothing', slug: 'indian-traditional-clothing' },
  { legacyId: '3639', name: 'Ethnic Wear Men', slug: 'ethnic-wear-men' },
  { legacyId: '3638', name: 'Cotton Kurta Pajama', slug: 'cotton-kurta-pajama' },
  { legacyId: '3637', name: 'Religious Garden Decor', slug: 'religious-garden-decor' },
  { legacyId: '3636', name: 'White Marble Tulsi Pot', slug: 'white-marble-tulsi-pot' },
  { legacyId: '3635', name: 'Pure Marble Stand', slug: 'pure-marble-stand' },
  { legacyId: '3634', name: 'Handcrafted Planter', slug: 'handcrafted-planter' },
  { legacyId: '3633', name: 'Matka', slug: 'matka' },
  { legacyId: '3632', name: 'Kulhad', slug: 'kulhad' },
  { legacyId: '3631', name: 'Terracotta', slug: 'terracotta' },
  { legacyId: '3630', name: 'Mitti Craft', slug: 'mitti-craft' },
];

const COLLECTIONS = [
  { legacyId: '3', name: 'Special Offer', slug: 'special-offer', status: 'Published', isFeatured: true, image: '/jaipurio_banner_art.png', productIds: ['164', '167', '174', '186', '193', '200', '7869', '7875'] },
  { legacyId: '2', name: 'Best Sellers', slug: 'best-sellers', description: 'Top-selling handcrafted pieces from Jaipur artisans.', status: 'Published', isFeatured: true, image: '/matka.png', productIds: ['1001', '1002', '1003'] },
  { legacyId: '1', name: 'New Arrival', slug: 'new-arrival', description: 'Fresh mitti crafts just arrived from the kiln.', status: 'Published', isFeatured: true, image: '/kulhad.png', productIds: ['1002', '1004'] },
];

const LABELS = [
  { legacyId: '3', name: 'Sale', color: '#ed1b24', status: 'Published' },
  { legacyId: '2', name: 'New', color: '#0d9488', status: 'Published' },
  { legacyId: '1', name: 'Hot', color: '#ea580c', status: 'Published' },
  { legacyId: '4', name: 'Bestseller', color: '#c2410c', status: 'Published' },
];

const OPTIONS = [
  {
    legacyId: '4',
    name: 'HDD',
    optionType: 'dropdown',
    values: [
      { label: '128GB', price: 0, priceType: 'fixed', legacyId: '41' },
      { label: '256GB', price: 10, priceType: 'fixed', legacyId: '42' },
      { label: '512GB', price: 20, priceType: 'fixed', legacyId: '43' },
    ],
  },
  {
    legacyId: '3',
    name: 'Gift Wrapping & Box',
    optionType: 'checkbox',
    values: [
      { label: 'Eco Jute Box', price: 49, priceType: 'fixed', legacyId: '31' },
      { label: 'Royal Velvet Box', price: 99, priceType: 'fixed', legacyId: '32' },
    ],
  },
  {
    legacyId: '2',
    name: 'Custom Heritage Engraving',
    optionType: 'field',
    values: [{ label: 'Engraving text', price: 149, priceType: 'fixed', legacyId: '21' }],
  },
  {
    legacyId: '1',
    name: 'Capacity',
    optionType: 'radio',
    values: [
      { label: '3L', price: 0, priceType: 'fixed', legacyId: '11' },
      { label: '5L', price: 50, priceType: 'fixed', legacyId: '12' },
      { label: '10L', price: 120, priceType: 'fixed', legacyId: '13' },
    ],
  },
];

const ATTRIBUTE_SETS = [
  {
    legacyId: '10',
    title: 'Color',
    slug: 'color',
    status: 'Published',
    attributes: [
      { title: 'Red', slug: 'red' },
      { title: 'Blue', slug: 'blue' },
      { title: 'Green', slug: 'green' },
      { title: 'Black', slug: 'black' },
      { title: 'White', slug: 'white' },
    ],
  },
  {
    legacyId: '9',
    title: 'Size',
    slug: 'size',
    status: 'Published',
    attributes: [
      { title: 'S', slug: 's' },
      { title: 'M', slug: 'm' },
      { title: 'L', slug: 'l' },
      { title: 'XL', slug: 'xl' },
    ],
  },
  {
    legacyId: '8',
    title: 'Material',
    slug: 'material',
    status: 'Published',
    attributes: [
      { title: 'Terracotta', slug: 'terracotta' },
      { title: 'Marble', slug: 'marble' },
      { title: 'Brass', slug: 'brass' },
      { title: 'Wood', slug: 'wood' },
    ],
  },
];

const FLASH_SALES = [
  {
    legacyId: '1',
    name: 'Winter Sale',
    endDate: new Date('2024-12-30'),
    status: 'Published',
    products: [
      { productId: '207', price: 40000, quantity: 1 },
      { productId: '1302', price: 8000, quantity: 1 },
      { productId: '1003', price: 9400, quantity: 1 },
      { productId: '221', price: 40000, quantity: 1 },
      { productId: '228', price: 40000, quantity: 1 },
    ],
  },
  {
    legacyId: '2',
    name: 'Diwali Flash',
    endDate: new Date('2026-11-15'),
    status: 'Published',
    products: [
      { productId: '1001', price: 349, quantity: 50 },
      { productId: '1002', price: 199, quantity: 100 },
      { productId: '1004', price: 299, quantity: 40 },
    ],
  },
];

const DISCOUNTS = [
  {
    legacyId: '1',
    type: 'coupon',
    code: 'TQIME3JIV7SC',
    couponType: 'percentage',
    value: 10,
    applyFor: 'all_orders',
    unlimited: true,
    canUseWithPromotion: true,
    displayAtCheckout: false,
    startDate: new Date('2024-11-13'),
    endDate: new Date('2024-12-31'),
    expired: true,
    isActive: false,
    description: 'Discount 10% for all orders',
  },
  {
    legacyId: '2',
    type: 'coupon',
    code: 'JAIPURIO10',
    couponType: 'percentage',
    value: 10,
    applyFor: 'all_orders',
    unlimited: true,
    displayAtCheckout: true,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    used: 142,
    isActive: true,
    description: 'Jaipurio 10% off storewide',
  },
  {
    legacyId: '3',
    type: 'coupon',
    code: 'MITTI50',
    couponType: 'fixed',
    value: 50,
    applyFor: 'all_orders',
    minOrderAmount: 499,
    unlimited: true,
    displayAtCheckout: true,
    startDate: new Date('2026-01-01'),
    neverExpired: true,
    isActive: true,
    description: '₹50 off on mitti crafts',
  },
];

const SPEC_GROUPS = [
  { legacyId: '1', name: 'General', description: 'Core product information' },
  { legacyId: '2', name: 'Dimensions', description: 'Size, capacity and weight' },
  { legacyId: '3', name: 'Care', description: 'Usage and maintenance' },
  { legacyId: '4', name: 'Material & Finish', description: 'Clay type, glaze and surface finish' },
];

const CUSTOMERS = [
  { name: 'Aarav Sharma', email: 'aarav.sharma@gmail.com', mobile: '9829012345' },
  { name: 'Priya Mehta', email: 'priya.mehta@gmail.com', mobile: '9811122233' },
  { name: 'Rohan Verma', email: 'rohan.verma@gmail.com', mobile: '9876543210' },
  { name: 'Ananya Singh', email: 'ananya.singh@gmail.com', mobile: '9765432109' },
];

const PRODUCTS = [
  {
    legacySku: 'JAI-HD-MTP-001',
    name: 'White Marble Tulsi Pot 33 Inch - Buy Premium Handcrafted Sacred Kyara | Jaipurio',
    slug: 'white-marble-tulsi-pot-33-inch-handcrafted-sacred-plant-container-traditional-kyara',
    price: 9500,
    oldPrice: 14000,
    salePrice: 9500,
    costPerItem: 4100,
    category: 'Planters',
    brand: 'Jaipurio',
    image: '/planter.png',
    images: ['/planter.png'],
    stock: 9,
    sku: 'JAI-HD-MTP-001',
    weight: 1700,
    length: 60.96,
    width: 0,
    height: 76.2,
    description: 'Authentic White Marble Tulsi Pot — 33-inch handcrafted kyara with intricate carvings.',
    tagList: ['Religious Garden Decor', 'White Marble Tulsi Pot', 'Pure Marble Stand', 'Handcrafted Planter'],
    collections: { newArrival: true, bestSellers: false, specialOffer: false },
    labels: { hot: true, new: false, sale: false },
    isFeatured: true,
    lifecycle: 'Published',
    status: 'approved',
    published: true,
    seo: normalizeSeo(
      {
        seo: {
          general: {
            slug: 'white-marble-tulsi-pot-33-inch-handcrafted-sacred-plant-container-traditional-kyara',
            metaTitle: 'White Marble Tulsi Pot | 33" Handcrafted Planter | Holy Basil Stand | Jaipurio',
            metaDescription:
              'Looking for authentic White Marble Tulsi Pot? Get 33-inch handcrafted kyara with intricate carvings. Transform your courtyard into sacred space. Order now!',
            metaKeywords: 'tulsi pot, marble planter, kyara, jaipurio',
            robots: 'index,follow',
          },
          social: {
            ogTitle: 'White Marble Tulsi Pot 33 Inch | Jaipurio',
            ogDescription: 'Handcrafted sacred marble tulsi pot for home temples and courtyards.',
            ogImage: '/planter.png',
            twitterTitle: 'White Marble Tulsi Pot | Jaipurio',
            twitterDescription: '33-inch handcrafted marble tulsi pot from Jaipur artisans.',
            twitterImage: '/planter.png',
          },
          advanced: {
            schemaMarkup: '',
            customHead: '',
            noIndex: false,
            noFollow: false,
          },
        },
      },
      'White Marble Tulsi Pot',
      ''
    ),
  },
  {
    legacySku: 'JAI-HD-MTP-002',
    name: 'Marble Tulsi Pot White Inlay - Buy Premium Handcrafted Sacred Planter | Jaipurio',
    slug: 'marble-tulsi-pot-white-inlay',
    price: 12500,
    oldPrice: 19000,
    category: 'Planters',
    brand: 'Jaipurio',
    image: '/planter.png',
    images: ['/planter.png'],
    stock: 9,
    sku: 'JAI-HD-MTP-002',
    description: 'Premium marble tulsi pot with white inlay work.',
    lifecycle: 'Published',
    status: 'approved',
    published: true,
  },
  {
    legacySku: 'JAI-MIT-001',
    name: 'Rajasthani Design Matka (5L)',
    slug: 'rajasthani-design-matka-5l',
    price: 399,
    oldPrice: 599,
    category: 'Matkas',
    brand: 'Shyam Terracotta Artisans',
    image: '/matka.png',
    images: ['/matka.png'],
    stock: 24,
    sku: 'JAI-MIT-001',
    description: 'Authentic Jaipur hand-painted terracotta water matka.',
    tagList: ['matka', 'water pot', 'mitti'],
    isFeatured: true,
    bestseller: true,
    lifecycle: 'Published',
    status: 'approved',
    published: true,
  },
  {
    legacySku: 'JAI-MIT-002',
    name: 'Kulhad (Pack of 6)',
    slug: 'kulhad-pack-of-6',
    price: 249,
    oldPrice: 349,
    category: 'Kulhads',
    brand: 'Meera Mitti Works',
    image: '/kulhad.png',
    images: ['/kulhad.png'],
    stock: 50,
    sku: 'JAI-MIT-002',
    description: 'Traditional earthen chai kulhads crafted from fine clay.',
    bestseller: true,
    lifecycle: 'Published',
    status: 'approved',
    published: true,
  },
  {
    legacySku: 'JAI-MIT-003',
    name: 'Handmade Mitti Planter',
    slug: 'handmade-mitti-planter',
    price: 349,
    oldPrice: 499,
    category: 'Planters',
    brand: 'Jaipurio',
    image: '/planter.png',
    images: ['/planter.png'],
    stock: 30,
    sku: 'JAI-MIT-003',
    description: 'Handmade terracotta planter for indoor and outdoor plants.',
    lifecycle: 'Published',
    status: 'approved',
    published: true,
  },
  {
    legacySku: 'JAI-MIT-004',
    name: 'Handpainted Diya Set',
    slug: 'handpainted-diya-set',
    price: 299,
    oldPrice: 450,
    category: 'Diyas',
    brand: 'Pushkar Sacred Clay Studio',
    image: '/diya.png',
    images: ['/diya.png'],
    stock: 40,
    sku: 'JAI-MIT-004',
    description: 'Festive handpainted clay diya set.',
    lifecycle: 'Published',
    status: 'approved',
    published: true,
  },
];

const CATEGORIES = [
  { name: 'Matkas', slug: 'matkas' },
  { name: 'Kulhads', slug: 'kulhads' },
  { name: 'Planters', slug: 'planters' },
  { name: 'Diyas', slug: 'diyas' },
  { name: 'Idols', slug: 'idols' },
];

const upsertByLegacy = async (Model, rows, mapRow) => {
  let n = 0;
  for (const row of rows) {
    const payload = mapRow(row);
    await Model.findOneAndUpdate(
      { legacyId: row.legacyId },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    n += 1;
  }
  return n;
};

async function seed() {
  await connectDB();
  console.log('Seeding ecommerce admin data...');

  for (const cat of CATEGORIES) {
    await Category.findOneAndUpdate(
      { slug: cat.slug },
      { $set: { title: cat.name, slug: cat.slug, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).catch(async () => {
      try {
        await Category.create({ title: cat.name, slug: cat.slug });
      } catch {
        /* ignore schema variance */
      }
    });
  }

  const brands = await upsertByLegacy(EcommerceBrand, BRANDS, (r) => ({
    ...r,
    slug: slugify(r.name),
    seo: normalizeSeo(r, r.name, r.description),
  }));

  const tags = await upsertByLegacy(EcommerceProductTag, TAGS, (r) => ({
    ...r,
    status: 'Published',
    seo: normalizeSeo(r, r.name, ''),
    seoTitle: r.seoTitle || '',
    seoDescription: r.seoDescription || '',
  }));

  const collections = await upsertByLegacy(EcommerceProductCollection, COLLECTIONS, (r) => ({
    ...r,
    seo: normalizeSeo(r, r.name, r.description || ''),
  }));

  const labels = await upsertByLegacy(EcommerceProductLabel, LABELS, (r) => ({
    ...r,
    slug: slugify(r.name),
    seo: normalizeSeo(r, r.name, ''),
  }));

  const options = await upsertByLegacy(EcommerceProductOption, OPTIONS, (r) => ({
    ...r,
    slug: slugify(r.name),
    status: 'Published',
    seo: normalizeSeo(r, r.name, ''),
  }));

  const attrs = await upsertByLegacy(EcommerceAttributeSet, ATTRIBUTE_SETS, (r) => ({
    ...r,
    name: r.title,
    seo: normalizeSeo(r, r.title, ''),
  }));

  const flash = await upsertByLegacy(EcommerceFlashSale, FLASH_SALES, (r) => ({ ...r }));
  const discounts = await upsertByLegacy(EcommerceDiscount, DISCOUNTS, (r) => ({ ...r }));
  const specs = await upsertByLegacy(EcommerceSpecificationGroup, SPEC_GROUPS, (r) => ({
    ...r,
    slug: slugify(r.name),
    status: 'Published',
  }));

  let productsUpserted = 0;
  let adminUser = await User.findOne({ role: 'admin' });
  for (const p of PRODUCTS) {
    const seo =
      p.seo ||
      normalizeSeo(
        {
          seo: {
            general: {
              slug: p.slug,
              metaTitle: p.name,
              metaDescription: (p.description || '').slice(0, 160),
            },
          },
        },
        p.name,
        p.description || ''
      );
    const rich = ensureRichCopy(p.name, p.description, p.content);
    const doc = await Product.findOneAndUpdate(
      { sku: p.sku },
      {
        $set: {
          name: p.name,
          title: p.name,
          slug: p.slug,
          price: p.price,
          oldPrice: p.oldPrice,
          salePrice: p.salePrice || p.price,
          costPerItem: p.costPerItem,
          category: p.category,
          brand: p.brand,
          image: p.image,
          images: p.images,
          description: rich.description,
          content: rich.content,
          tagList: p.tagList || [],
          tags: Array.isArray(p.tagList) ? p.tagList.join(', ') : '',
          collections: p.collections,
          labels: p.labels,
          isFeatured: Boolean(p.isFeatured),
          bestseller: Boolean(p.bestseller),
          weight: p.weight,
          length: p.length,
          width: p.width,
          height: p.height,
          lifecycle: 'Published',
          status: 'approved',
          published: true,
          sku: p.sku,
          seo,
          seoTitle: seo.general.metaTitle,
          seoDescription: seo.general.metaDescription,
          admin: adminUser?._id,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await Inventory.findOneAndUpdate(
      { product: doc._id },
      {
        product: doc._id,
        admin: adminUser?._id,
        stock: p.stock ?? 10,
        trackQuantity: true,
        stockStatus: (p.stock ?? 10) > 0 ? 'In Stock' : 'Out of Stock',
        warehouse: 'Jaipur WH-1',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    productsUpserted += 1;
  }

  let customers = 0;
  for (const c of CUSTOMERS) {
    const existing = await User.findOne({ email: c.email });
    if (!existing) {
      await User.create({
        name: c.name,
        email: c.email,
        mobile: c.mobile,
        password: 'Customer123!',
        role: 'user',
      });
      customers += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        brands,
        tags,
        collections,
        labels,
        options,
        attributeSets: attrs,
        flashSales: flash,
        discounts,
        specificationGroups: specs,
        products: productsUpserted,
        customersCreated: customers,
      },
      null,
      2
    )
  );
  console.log('Ecommerce seed complete.');
  try {
    const { invalidateCatalog } = require('./utils/cache');
    await invalidateCatalog('products');
  } catch {
    /* cache optional */
  }
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.connection.close();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
