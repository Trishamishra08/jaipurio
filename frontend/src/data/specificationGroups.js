export const SPECIFICATION_GROUPS = [
  {
    id: '1',
    name: 'General',
    description: 'Core product information',
    createdAt: '2025-07-14',
  },
  {
    id: '2',
    name: 'Dimensions',
    description: 'Size, capacity and weight',
    createdAt: '2025-07-14',
  },
  {
    id: '3',
    name: 'Care',
    description: 'Usage and maintenance',
    createdAt: '2025-08-01',
  },
  {
    id: '4',
    name: 'Material & Finish',
    description: 'Clay type, glaze and surface finish',
    createdAt: '2026-01-12',
  },
];

export const getSpecificationGroupById = (id) =>
  SPECIFICATION_GROUPS.find((row) => String(row.id) === String(id)) || null;
