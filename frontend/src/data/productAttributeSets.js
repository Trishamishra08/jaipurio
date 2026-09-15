export const PRODUCT_ATTRIBUTE_SETS = [
  {
    id: '10',
    title: 'Color',
    slug: 'color',
    displayLayout: 'visual',
    status: 'Published',
    order: 0,
    isSearchable: true,
    isComparable: true,
    isUseInProductListing: true,
    useImageFromProductVariation: false,
    attributes: [
      { id: '101', title: 'Red', slug: 'red', color: '#FF0000', image: '', isDefault: true },
      { id: '102', title: 'Blue', slug: 'blue', color: '#2563EB', image: '', isDefault: false },
      { id: '103', title: 'Green', slug: 'green', color: '#16A34A', image: '', isDefault: false },
      { id: '104', title: 'Black', slug: 'black', color: '#111827', image: '', isDefault: false },
      { id: '105', title: 'White', slug: 'white', color: '#FFFFFF', image: '', isDefault: false },
    ],
  },
  {
    id: '9',
    title: 'Size',
    slug: 'size',
    displayLayout: 'dropdown',
    status: 'Published',
    order: 1,
    isSearchable: true,
    isComparable: true,
    isUseInProductListing: true,
    useImageFromProductVariation: false,
    attributes: [
      { id: '91', title: 'S', slug: 's', color: '', image: '', isDefault: true },
      { id: '92', title: 'M', slug: 'm', color: '', image: '', isDefault: false },
      { id: '93', title: 'L', slug: 'l', color: '', image: '', isDefault: false },
      { id: '94', title: 'XL', slug: 'xl', color: '', image: '', isDefault: false },
    ],
  },
  {
    id: '8',
    title: 'Material',
    slug: 'material',
    displayLayout: 'text',
    status: 'Published',
    order: 2,
    isSearchable: true,
    isComparable: false,
    isUseInProductListing: true,
    useImageFromProductVariation: false,
    attributes: [
      { id: '81', title: 'Terracotta', slug: 'terracotta', color: '', image: '', isDefault: true },
      { id: '82', title: 'Clay', slug: 'clay', color: '', image: '', isDefault: false },
      { id: '83', title: 'Marble', slug: 'marble', color: '', image: '', isDefault: false },
    ],
  },
  {
    id: '7',
    title: 'Finish',
    slug: 'finish',
    displayLayout: 'dropdown',
    status: 'Published',
    order: 3,
    isSearchable: true,
    isComparable: true,
    isUseInProductListing: false,
    useImageFromProductVariation: false,
    attributes: [
      { id: '71', title: 'Matte', slug: 'matte', color: '', image: '', isDefault: true },
      { id: '72', title: 'Glossy', slug: 'glossy', color: '', image: '', isDefault: false },
    ],
  },
];

export const DISPLAY_LAYOUT_OPTIONS = [
  { value: 'dropdown', label: 'Dropdown Swatch' },
  { value: 'visual', label: 'Visual Swatch' },
  { value: 'text', label: 'Text Swatch' },
];

export const getAttributeSetById = (id) =>
  PRODUCT_ATTRIBUTE_SETS.find((row) => String(row.id) === String(id)) || null;

export const slugifyAttribute = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

export const displayLayoutLabel = (value) =>
  DISPLAY_LAYOUT_OPTIONS.find((opt) => opt.value === value)?.label || value;
