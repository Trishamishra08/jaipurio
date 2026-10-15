// Footer content the admin can change (Appearance → Footer), saved as
// `settings.footer`. Anything not saved falls back to these defaults — the
// footer's original copy — so it never renders empty.
// The "Shop by Category" directory is NOT stored here: it is built live from
// the category tree (each top-level category + its sub-categories).

export const FOOTER_ICONS = ['search', 'cart', 'bag'];

export const FOOTER_DEFAULTS = {
  backToTop: { enabled: true, text: '▲ Back to top' },
  heritage: {
    enabled: true,
    eyebrow: '— Rajasthani Heritage —',
    title: 'Painted like a Pichwai, packed like an heirloom',
    text: 'The same devotion Nathdwara artists bring to a temple hanging goes into every parcel that leaves our Jaipur workshops.',
  },
  cta: {
    enabled: true,
    text: 'Commission a bespoke piece, or open your own boutique on Jaipurio.',
    buttonText: 'Sell on Jaipurio',
    buttonLink: '/vendor/register',
    linkText: 'Contact Us',
    link: '/contact',
  },
  social: { instagram: 'https://instagram.com', facebook: 'https://facebook.com', pinterest: 'https://pinterest.com' },
  app: { enabled: true, title: 'Get the Jaipurio App', text: 'Shop mitti crafts on the go.', showBadges: true },
  stats: {
    enabled: true,
    // {categories} is replaced with the live number of categories
    items: [
      { value: '6', label: 'Artisan houses' },
      { value: '{categories}', label: 'Product categories' },
      { value: '6', label: 'Languages supported' },
      { value: 'Global', label: 'Wholesale & retail shipping' },
      { value: '24/7', label: 'Customer support' },
    ],
  },
  actions: {
    enabled: true,
    items: [
      { icon: 'search', title: 'Discover', text: 'Browse jewellery, clothing, accessories, idols & home décor.', to: '/shop', linkText: 'Shop all products →' },
      { icon: 'cart', title: 'Shop & Track', text: 'Secure checkout, order tracking, easy returns — pan India.', to: '/orders', linkText: 'Track your order →' },
      { icon: 'bag', title: 'Sell & Earn', text: 'Open a storefront as an artisan house, or join as a partner.', to: '/vendor/register', linkText: 'Start selling →' },
    ],
  },
  directory: {
    enabled: true,
    title: 'Complete site directory',
    subtitle: 'Every category, artisan house, and customer page — tap a heading to open.',
    categoriesEnabled: true,
    categoriesTitle: 'Shop by Category',
    columns: [
      {
        title: 'Customer Care',
        links: [
          { label: 'Order Tracking', to: '/orders' },
          { label: 'Returns & Refunds', to: '/return-policy' },
          { label: 'FAQs', to: '/contact' },
          { label: 'Contact Us', to: '/contact' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About Us', to: '/about' },
          { label: 'Journal', to: '/blog' },
          { label: 'Our Story', to: '/about' },
          { label: 'Privacy Policy', to: '/privacy-policy' },
          { label: 'Terms & Conditions', to: '/terms-conditions' },
        ],
      },
      {
        title: 'Sell & Partner',
        links: [
          { label: 'Sell on Jaipurio', to: '/vendor/register' },
          { label: 'Vendor Login', to: '/vendor/login' },
          { label: 'Terms of Use', to: '/terms-conditions' },
          { label: 'Cookie Policy', to: '/privacy-policy' },
        ],
      },
    ],
  },
  // Any number of shipping regions, each a heading plus a list of places (shown as pills).
  shipping: {
    enabled: true,
    regions: [
      {
        title: 'Ships across India',
        places: ['Jaipur', 'Delhi NCR', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'],
      },
      {
        title: 'International',
        places: ['USA & Canada', 'United Kingdom', 'Europe (EU)', 'UAE & GCC', 'Australia', 'Singapore'],
      },
    ],
  },
  // Any number of offices / stores. Each can show a map built from its address, or a Google Maps embed link.
  offices: {
    enabled: true,
    items: [
      {
        title: 'Jaipurio Head Office',
        address: '133-134, Flat No. F1, Jandu 4 Apartment, Ashok Nagar, Niwaru Road, Jaipur, Rajasthan 302012',
        phone: '',
        email: '',
        hours: '',
        showMap: true,
        mapMode: 'address', // 'address' | 'embed'
        mapEmbedUrl: '',
        mapLink: '',
      },
    ],
  },
  copyright: '© 2026 Jaipurio. All Rights Reserved.',
};
