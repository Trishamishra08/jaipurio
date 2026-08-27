export const catalogTaxonomy = [
  {
    id: 'jewellery',
    name: 'Jewellery',
    children: [
      { id: 'bangles', name: 'Bangles', count: 27 },
      { id: 'bracelets', name: 'Bracelets', count: 27 },
      { id: 'rings', name: 'Rings', count: 10 },
      { id: 'necklaces', name: 'Necklaces', count: 34 },
      {
        id: 'gemstone',
        name: 'Gemstone',
        children: [{ id: 'moissanite', name: 'Moissanite Stones', count: 10 }],
      },
      { id: 'earrings', name: 'Earrings', count: 14 },
    ],
  },
  {
    id: 'home-living',
    name: 'Home & Living',
    children: [
      {
        id: 'spirituality',
        name: 'Spirituality & Religion',
        count: 150,
        children: [
          {
            id: 'religious-decor',
            name: 'Religious Home & Decor',
            children: [
              { id: 'chowki', name: 'Chowki', count: 0 },
              { id: 'trail-test', name: 'Trail & Test Sets', count: 0 },
            ],
          },
        ],
      },
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
  { name: 'Material', values: 'Kundan, Silver, Brass, Terracotta, Marble' },
  { name: 'Height', values: '3 inch, 6 inch, 9 inch, 12 inch' },
  { name: 'Deity', values: 'Ganesh, Lakshmi, Krishna, Shiva' },
  { name: 'Finish', values: 'Antique, Polished, Meenakari, Matte' },
  { name: 'Gemstone Type', values: 'Moissanite, Kundan, Polki, Pearl' },
  { name: 'Bangle Size', values: '2.2, 2.4, 2.6, 2.8' },
];

export const GLOBAL_OPTIONS = [
  { name: 'Gift wrap', type: 'Checkbox' },
  { name: 'Custom engraving', type: 'Field' },
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
