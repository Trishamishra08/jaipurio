require('dotenv').config();
const connectDB = require('./config/db');
const WidgetInstance = require('./models/widgetInstanceModel');
const Menu = require('./models/menuModel');

const seedWidgets = async () => {
  try {
    await connectDB();

    // Non-destructive: only seeds if the WidgetInstance collection is completely empty
    // (this connects to a shared/production MongoDB Atlas cluster).
    const existing = await WidgetInstance.countDocuments();
    if (existing > 0) {
      console.log(`WidgetInstance collection already has ${existing} document(s) — skipping seed.`);
      process.exit();
    }

    const mainMenu = await Menu.findOne({ slug: 'main-menu' }).lean();

    const widgets = [
      { sidebarKey: 'primary', widgetType: 'tags', order: 0, settings: { name: 'Popular Tags', limit: 7 } },
      { sidebarKey: 'primary', widgetType: 'blog-search', order: 1, settings: { name: 'Search' } },
      { sidebarKey: 'primary', widgetType: 'blog-categories', order: 2, settings: { name: 'Categories', categoryIds: [], showPostsCount: true } },
      { sidebarKey: 'primary', widgetType: 'recent-posts', order: 3, settings: { name: 'Recent Posts', sortType: 'recent', limit: 3 } },
      { sidebarKey: 'primary', widgetType: 'site-features', order: 4, settings: {
        name: 'Site features',
        features: [
          { title: 'Free Shipping', subtitle: 'For all orders over ₹2000', icon: '' },
          { title: 'Handmade Quality', subtitle: 'Crafted by Rajasthani artisans', icon: '' },
        ],
      } },

      { sidebarKey: 'footer', widgetType: 'site-information', order: 0, settings: {
        name: 'Jaipurio',
        description: 'Authentic Mitti & Handicraft Bazaar — handmade Rajasthani pottery, textiles and decor.',
        address: 'C-14, Malviya Nagar, Jaipur, Rajasthan 302017',
        phone: '+91 98290 12345',
        email: 'support@jaipurio.in',
      } },
      { sidebarKey: 'footer', widgetType: 'custom-menu', order: 1, settings: { name: 'Quick Links', menuId: mainMenu ? String(mainMenu._id) : '' } },
      { sidebarKey: 'footer', widgetType: 'newsletter-form', order: 2, settings: { title: 'Newsletter', subtitle: 'Register now to get updates on promotions and coupons. Don’t worry! We don’t spam.' } },

      { sidebarKey: 'bottom-footer', widgetType: 'product-categories', order: 0, settings: { name: 'Product Categories' } },

      { sidebarKey: 'products-list', widgetType: 'ads', order: 0, settings: { name: 'Ads', size: '300x250' } },

      { sidebarKey: 'product-detail', widgetType: 'site-information', order: 0, settings: {
        name: 'Jaipurio Handicrafts',
        description: 'Every piece is handcrafted by artisan families across Rajasthan, preserving centuries-old techniques.',
        address: 'C-14, Malviya Nagar, Jaipur, Rajasthan 302017',
        phone: '+91 98290 12345',
        email: 'support@jaipurio.in',
      } },
      { sidebarKey: 'product-detail', widgetType: 'become-a-vendor', order: 1, settings: { name: 'Become a Vendor?' } },
    ];

    await WidgetInstance.insertMany(widgets);
    console.log(`Seeded ${widgets.length} widget instance(s) across sidebars.`);
    process.exit();
  } catch (error) {
    console.error('Error seeding widgets:', error);
    process.exit(1);
  }
};

seedWidgets();
