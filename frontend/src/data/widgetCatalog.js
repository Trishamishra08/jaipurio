// Mirrors backend WIDGET_TYPES / SIDEBAR_KEYS (models/widgetInstanceModel.js).
export const SIDEBARS = [
  { key: 'primary', label: 'Primary sidebar', hint: 'Primary sidebar section' },
  { key: 'top-footer', label: 'Top footer sidebar', hint: 'Widgets in the blog page' },
  { key: 'footer', label: 'Footer sidebar', hint: 'Widgets in footer sidebar' },
  { key: 'bottom-footer', label: 'Bottom footer sidebar', hint: 'Widgets in bottom footer sidebar' },
  { key: 'products-list', label: 'Products list sidebar', hint: 'Widgets on header products list page' },
  { key: 'product-detail', label: 'Product detail sidebar', hint: 'Widgets in the product detail page' },
];

const NAME_FIELD = { key: 'name', label: 'Name', type: 'text' };

export const WIDGET_TYPES = [
  { key: 'simple-menu', title: 'Simple Menu', description: 'Add a simple menu to your widget area.', fields: [NAME_FIELD, { key: 'menuId', label: 'Menu', type: 'menu' }] },
  { key: 'text', title: 'Text', description: 'Arbitrary text or HTML.', fields: [NAME_FIELD, { key: 'content', label: 'Content', type: 'textarea' }] },
  {
    key: 'ads', title: 'Ads', description: 'Display Ads on sidebar',
    fields: [
      NAME_FIELD,
      { key: 'adId', label: 'Select Ads', type: 'ads' },
      { key: 'background', label: 'Background', type: 'image' },
      { key: 'size', label: 'Size', type: 'text' },
    ],
  },
  { key: 'become-a-vendor', title: 'Become a Vendor?', description: 'Display Become a vendor on product detail sidebar', fields: [NAME_FIELD] },
  {
    key: 'blog-categories', title: 'Blog Categories', description: 'Widget display blog categories',
    fields: [
      NAME_FIELD,
      { key: 'categoryIds', label: 'Choose categories', type: 'multiselect-categories' },
      { key: 'showPostsCount', label: 'Display posts count?', type: 'yesno' },
    ],
  },
  { key: 'blog-search', title: 'Blog Search', description: 'Search blog posts', fields: [NAME_FIELD] },
  {
    key: 'tags', title: 'Tags', description: 'Popular tags',
    fields: [NAME_FIELD, { key: 'limit', label: 'Number tags to display', type: 'number' }],
  },
  { key: 'custom-menu', title: 'Custom Menu', description: 'Add a custom menu to your widget area.', fields: [NAME_FIELD, { key: 'menuId', label: 'Menu', type: 'menu' }] },
  { key: 'newsletter-form', title: 'Newsletter form', description: 'Display Newsletter form on sidebar', fields: [{ key: 'title', label: 'Title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' }] },
  { key: 'product-categories', title: 'Product Categories', description: 'List of product categories', fields: [NAME_FIELD] },
  {
    key: 'recent-posts', title: 'Recent Posts', description: 'Display recent blog posts',
    fields: [
      NAME_FIELD,
      { key: 'sortType', label: 'Type', type: 'select', options: [{ value: 'recent', label: 'Recent' }, { value: 'popular', label: 'Popular' }] },
      { key: 'limit', label: 'Limit', type: 'number' },
    ],
  },
  {
    key: 'site-features', title: 'Site features', description: 'Display Site features on sidebar',
    fields: [NAME_FIELD, { key: 'features', label: 'Features', type: 'repeater' }],
  },
  {
    key: 'site-information', title: 'Site information', description: 'Widget display site information',
    fields: [
      NAME_FIELD,
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
    ],
  },
];

export const widgetTypeByKey = (key) => WIDGET_TYPES.find((w) => w.key === key);
export const sidebarByKey = (key) => SIDEBARS.find((s) => s.key === key);

// Default "Name" field value when a widget is first activated (matches the reference site's defaults).
const DEFAULT_NAMES = {
  tags: 'Popular Tags',
  'blog-search': 'Search',
  'blog-categories': 'Categories',
};

export const defaultSettingsForType = (widgetType) => {
  const type = widgetTypeByKey(widgetType);
  const hasName = type?.fields?.some((f) => f.key === 'name');
  if (!hasName) return {};
  return { name: DEFAULT_NAMES[widgetType] || type.title };
};
