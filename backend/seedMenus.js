require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Menu = require('./models/menuModel');
const Page = require('./models/pageModel');
const Category = require('./models/categoryModel');
const Brand = require('./models/ecommerceBrandModel');

const seedMenus = async () => {
  try {
    await connectDB();

    // Non-destructive: only seeds if the Menu collection is completely empty
    // (this connects to a shared/production MongoDB Atlas cluster).
    const existing = await Menu.countDocuments();
    if (existing > 0) {
      console.log(`Menu collection already has ${existing} document(s) — skipping seed.`);
      process.exit();
    }

    const [pages, categories, brands] = await Promise.all([
      Page.find({}).limit(2).lean(),
      Category.find({}).limit(3).lean(),
      Brand.find({}).limit(2).lean(),
    ]);

    const mkId = () => new mongoose.Types.ObjectId();

    // "Main menu" — top-level Shop/Categories links + a nested "Shop" submenu (Categories, Brands).
    const shopId = mkId().toString();
    const mainMenuItems = [
      { _id: shopId, parentId: null, title: 'Shop', url: '/products', itemType: 'custom-link', order: 0, status: 'Published' },
      ...categories.map((c, i) => ({
        parentId: shopId,
        title: c.title,
        url: c.url || `/category/${c.slug || ''}`,
        itemType: 'product-category',
        referenceId: c._id,
        order: i,
        status: 'Published',
      })),
      { parentId: null, title: 'About Us', url: '/about-us', itemType: 'custom-link', order: 1, status: 'Published' },
      { parentId: null, title: 'Contact', url: '/contact', itemType: 'custom-link', order: 2, status: 'Published' },
    ];

    const menusToCreate = [
      {
        name: 'Main menu',
        slug: 'main-menu',
        status: 'Published',
        locations: ['Main Navigation'],
        items: mainMenuItems,
      },
      {
        name: 'Header menu',
        slug: 'header-menu',
        status: 'Published',
        locations: ['Header Navigation'],
        items: [
          ...pages.map((p, i) => ({
            parentId: null,
            title: p.name,
            url: `/${p.slug || ''}`,
            itemType: 'page',
            referenceId: p._id,
            order: i,
            status: 'Published',
          })),
          ...brands.map((b, i) => ({
            parentId: null,
            title: b.name,
            url: `/brand/${b.slug || ''}`,
            itemType: 'brand',
            referenceId: b._id,
            order: pages.length + i,
            status: 'Published',
          })),
        ],
      },
      {
        name: 'Footer menu',
        slug: 'footer-menu',
        status: 'Published',
        locations: ['Footer Menu'],
        items: [
          { parentId: null, title: 'Privacy Policy', url: '/privacy-policy', itemType: 'custom-link', order: 0, status: 'Published' },
          { parentId: null, title: 'Terms & Conditions', url: '/terms', itemType: 'custom-link', order: 1, status: 'Published' },
          { parentId: null, title: 'Track Order', url: '/track-order', itemType: 'custom-link', order: 2, status: 'Published' },
        ],
      },
      {
        name: 'Business',
        slug: 'business',
        status: 'Published',
        locations: [],
        items: [
          { parentId: null, title: 'Become a Vendor', url: '/vendor/register', itemType: 'custom-link', order: 0, status: 'Published' },
          { parentId: null, title: 'Affiliate Program', url: '/affiliate', itemType: 'custom-link', order: 1, status: 'Published' },
        ],
      },
    ];

    await Menu.insertMany(menusToCreate);
    console.log(`Seeded ${menusToCreate.length} menu(s).`);
    process.exit();
  } catch (error) {
    console.error('Error seeding menus:', error);
    process.exit(1);
  }
};

seedMenus();
