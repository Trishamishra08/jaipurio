export const catalogTaxonomy = [
  {
    id: 'matkas',
    name: 'Matkas',
    children: [
      { id: 'water-pots', name: 'Water Pots', count: 18 },
      { id: 'surahis', name: 'Surahis', count: 12 },
      { id: 'ghadas', name: 'Ghadas', count: 8 },
    ],
  },
  {
    id: 'kulhads',
    name: 'Kulhads',
    children: [
      { id: 'chai-cups', name: 'Chai Cups', count: 24 },
      { id: 'painted-kulhads', name: 'Painted Kulhads', count: 16 },
      { id: 'bulk-packs', name: 'Bulk Packs', count: 10 },
    ],
  },
  {
    id: 'planters',
    name: 'Planters',
    children: [
      { id: 'garden-pots', name: 'Garden Pots', count: 14 },
      { id: 'mini-planters', name: 'Mini Planters', count: 20 },
      { id: 'hanging-pots', name: 'Hanging Pots', count: 8 },
    ],
  },
  {
    id: 'home-decor',
    name: 'Home Decor',
    children: [
      { id: 'figurines', name: 'Folk Figurines', count: 22 },
      { id: 'wall-decor', name: 'Wall Decor', count: 12 },
      { id: 'wind-chimes', name: 'Wind Chimes', count: 9 },
    ],
  },
  {
    id: 'puja-essentials',
    name: 'Puja Essentials',
    children: [
      { id: 'diyas', name: 'Diyas', count: 30 },
      { id: 'kalash', name: 'Kalash', count: 8 },
      { id: 'incense-holders', name: 'Incense Holders', count: 11 },
    ],
  },
];

export const flattenTaxonomy = (nodes = catalogTaxonomy, prefix = '') => {
  const rows = [];
  nodes.forEach((node) => {
    const path = prefix ? `${prefix} → ${node.name}` : node.name;
    rows.push({ ...node, path });
    if (node.children) rows.push(...flattenTaxonomy(node.children, path));
  });
  return rows;
};

export const GLOBAL_ATTRIBUTES = [
  { name: 'Material', values: 'Pure Clay, Terracotta, Red Clay, Mixed Mitti' },
  { name: 'Capacity', values: '150 ml, 500 ml, 1L, 2L, 3L, 5L' },
  { name: 'Size', values: 'Small, Medium, Large, Pack of 4, Pack of 6, Pack of 8' },
  { name: 'Finish', values: 'Natural, Handpainted, Mandana, Matte' },
  { name: 'Origin', values: 'Jaipur, Jodhpur, Pushkar, Bikaner, Sanganer' },
];

export const GLOBAL_OPTIONS = [
  { name: 'Gift wrap', type: 'Checkbox' },
  { name: 'Fragile packing', type: 'Checkbox' },
  { name: 'Size', type: 'Dropdown' },
];

export const flattenCategoryOptions = (nodes = catalogTaxonomy, prefix = '') => {
  const options = [];
  nodes.forEach((node) => {
    const label = prefix ? `${prefix} / ${node.name}` : node.name;
    options.push({ id: node.id, label });
    if (node.children) options.push(...flattenCategoryOptions(node.children, label));
  });
  return options;
};

export default catalogTaxonomy;
