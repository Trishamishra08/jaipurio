export const OPTION_TYPE_CHOICES = [
  { value: '', label: 'Please select option' },
  { value: 'field', label: 'Field' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
  { value: 'button', label: 'Button' },
];

export const PRICE_TYPE_CHOICES = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'percent', label: 'Percent' },
];

export const PRODUCT_OPTIONS = [
  {
    id: '4',
    name: 'HDD',
    optionType: 'dropdown',
    required: false,
    values: [
      { id: '41', label: '128GB', price: 0, priceType: 'fixed' },
      { id: '42', label: '256GB', price: 10, priceType: 'fixed' },
      { id: '43', label: '512GB', price: 20, priceType: 'fixed' },
    ],
  },
  {
    id: '3',
    name: 'Gift Wrapping & Box',
    optionType: 'checkbox',
    required: false,
    values: [
      { id: '31', label: 'Eco Jute Box', price: 49, priceType: 'fixed' },
      { id: '32', label: 'Royal Velvet Box', price: 99, priceType: 'fixed' },
    ],
  },
  {
    id: '2',
    name: 'Custom Heritage Engraving',
    optionType: 'field',
    required: false,
    values: [{ id: '21', label: 'Custom Text (Max 30 chars)', price: 0, priceType: 'fixed' }],
  },
  {
    id: '1',
    name: 'Clay Pot Lid Type',
    optionType: 'dropdown',
    required: true,
    values: [
      { id: '11', label: 'Clay Lid', price: 0, priceType: 'fixed' },
      { id: '12', label: 'Brass Lid', price: 150, priceType: 'fixed' },
      { id: '13', label: 'Wooden Lid', price: 80, priceType: 'fixed' },
    ],
  },
];

export const getProductOptionById = (id) =>
  PRODUCT_OPTIONS.find((row) => String(row.id) === String(id)) || null;

export const optionTypeLabel = (value) =>
  OPTION_TYPE_CHOICES.find((opt) => opt.value === value)?.label || value || '—';
