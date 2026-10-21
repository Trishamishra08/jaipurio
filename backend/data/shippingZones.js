/**
 * Real operational shipping facts per zone. City pages take their transit time,
 * customs note, currency and return window from here — they are never typed per
 * city, so two cities in different zones always differ in substance.
 * `countries` is used to suggest a zone when the admin types a country.
 */
const SHIPPING_ZONES = {
  UK_EU: {
    label: 'United Kingdom & European Union',
    currency: 'GBP',
    paymentNote: 'Cards and PayPal, converted automatically at checkout.',
    transitDaysMin: 7,
    transitDaysMax: 14,
    customsNote:
      'Import VAT and duty may apply depending on item value and category, set by local customs authorities (HMRC in the UK), not by Jaipurio. Confirm the applicable rate before ordering high-value pieces.',
    returnWindowDays: 7,
    countries: ['United Kingdom', 'UK', 'England', 'Scotland', 'Wales', 'Ireland', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Portugal', 'Austria', 'Sweden', 'Denmark', 'Finland', 'Poland', 'Greece', 'Switzerland', 'Norway'],
  },
  NORTH_AMERICA: {
    label: 'United States & Canada',
    currency: 'USD',
    paymentNote: 'Cards and PayPal, converted automatically at checkout.',
    transitDaysMin: 9,
    transitDaysMax: 16,
    customsNote:
      'US and Canadian customs may apply duty above the de minimis threshold — confirm whether it is collected on delivery before ordering high-value pieces.',
    returnWindowDays: 10,
    countries: ['United States', 'USA', 'US', 'America', 'Canada'],
  },
  GCC: {
    label: 'UAE & GCC',
    currency: 'AED',
    paymentNote: 'Cards accepted; cash-on-delivery available in select cities.',
    transitDaysMin: 5,
    transitDaysMax: 10,
    customsNote:
      'Most personal shipments clear without additional duty under GCC personal-import allowances, but this varies by item value — confirm for high-value marble or jewellery orders.',
    returnWindowDays: 7,
    countries: ['United Arab Emirates', 'UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Oman', 'Bahrain'],
  },
  AUS_NZ: {
    label: 'Australia & New Zealand',
    currency: 'AUD',
    paymentNote: 'Cards and PayPal, converted automatically at checkout.',
    transitDaysMin: 10,
    transitDaysMax: 18,
    customsNote:
      'GST applies on most imports into Australia and New Zealand regardless of value — expect a separate customs or courier invoice.',
    returnWindowDays: 10,
    countries: ['Australia', 'New Zealand'],
  },
  SOUTHEAST_ASIA: {
    label: 'Southeast Asia',
    currency: 'SGD',
    paymentNote: 'Cards accepted at checkout.',
    transitDaysMin: 6,
    transitDaysMax: 12,
    customsNote: 'Import tax thresholds vary by country — confirm the rule for your country before ordering.',
    returnWindowDays: 7,
    countries: ['Singapore', 'Malaysia', 'Thailand', 'Indonesia', 'Philippines', 'Vietnam', 'Hong Kong'],
  },
  INDIA_DOMESTIC: {
    label: 'Domestic India',
    currency: 'INR',
    paymentNote: 'Cards, UPI, net banking and cash-on-delivery.',
    transitDaysMin: 2,
    transitDaysMax: 6,
    customsNote: 'No customs or import duty — this is a domestic shipment within India.',
    returnWindowDays: 7,
    countries: ['India'],
  },
};

/** Best-guess zone for a country name (null when unknown). */
const zoneForCountry = (country = '') => {
  const c = String(country).trim().toLowerCase();
  if (!c) return null;
  return Object.keys(SHIPPING_ZONES).find((k) => SHIPPING_ZONES[k].countries.some((n) => n.toLowerCase() === c)) || null;
};

module.exports = { SHIPPING_ZONES, zoneForCountry };
