/**
 * City / country page content engine.
 *
 * Generates the parts of a city page that are safe to automate — title, meta
 * description, H1, 50-word summary, quick answers and FAQs — from two inputs:
 *   1. the shipping zone (real facts: transit days, customs, currency, returns), and
 *   2. a deterministic hash of the city name, which picks one of 3–4 phrasings per
 *      sentence slot. The same city always gets the same text (Regenerate is
 *      idempotent), while cities in the same zone still read differently.
 * Main content (700+ words) and local proof facts are written by a person; the
 * publish gate in models/cityPageModel.js blocks pages without them.
 */
const { SHIPPING_ZONES } = require('../data/shippingZones');

const H1_TEMPLATES = [
  (c) => `Shop Rajasthani Handicrafts Online in ${c}`,
  (c) => `Jaipur to ${c}: Marble, Brass & Handicrafts Online`,
  (c) => `Authentic Rajasthani Crafts, Delivered to ${c}`,
  (c) => `Buy Marble Idols & Handicrafts Online — Shipped to ${c}`,
];
const SUMMARY_OPENERS = [
  (c, co, cats) => `Jaipurio ships ${cats} directly from our Jaipur artisans to addresses across ${c} and ${co}.`,
  (c, co, cats) => `From our Jaipur workshops to doorsteps in ${c}, Jaipurio delivers ${cats} across ${co}.`,
  (c, co, cats) => `${c} shoppers can order ${cats} straight from Jaipurio's artisan network in Jaipur, shipped across ${co}.`,
];
const SUMMARY_CLOSERS = [
  () => 'Every piece is made to order or hand-verified before dispatch, then packed for safe transit.',
  () => 'Each order is hand-checked before it leaves Jaipur and shipped with tracking.',
  () => 'Pieces are inspected and packed for transit before dispatch, with tracking on every order.',
];
const WHY_TITLES = [
  (c) => `A city that collects — and a craft that travels well to ${c}`,
  (c) => `Why ${c} shoppers are sourcing direct from Jaipur`,
  (c) => `From Jaipur's workshops to ${c}'s homes`,
];
const CLOSE_TITLES = [
  (c) => `Built for ${c}, shipped from Jaipur`,
  (c) => `Made in Jaipur, delivered to ${c}`,
  (c) => `From our artisans in Jaipur to your home in ${c}`,
];

const hashPick = (city, slot, list) => {
  const str = `${String(city).toLowerCase()}::${slot}`;
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return list[h % list.length];
};

const wordLimit = (text, max = 50) => {
  const words = String(text).trim().split(/\s+/);
  return words.length <= max ? text : `${words.slice(0, max).join(' ').replace(/[,;:—-]+$/, '')}.`;
};

const listText = (items) => {
  const list = items.filter(Boolean);
  if (!list.length) return 'handcrafted Rajasthani pieces';
  return list.length === 1 ? list[0] : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
};

/**
 * @param {{ city: string, country: string, zoneKey: string, categories?: string[], customsNote?: string }} input
 * @returns generated content (null when the zone is unknown)
 */
const generateCityContent = (input) => {
  const zone = SHIPPING_ZONES[input.zoneKey];
  if (!zone) return null;
  const city = String(input.city || '').trim() || 'your city';
  const country = String(input.country || '').trim() || zone.label;
  const cats = listText((input.categories || []).slice(0, 4)).toLowerCase();
  const domestic = input.zoneKey === 'INDIA_DOMESTIC';
  const transit = `${zone.transitDaysMin}–${zone.transitDaysMax}`;
  const customsNote = String(input.customsNote || '').trim() || zone.customsNote;
  const summary = wordLimit(
    `${hashPick(city, 'opener', SUMMARY_OPENERS)(city, country, cats)} ${hashPick(city, 'closer', SUMMARY_CLOSERS)()}`
  );
  const returns = `Standard ${zone.returnWindowDays}-day return window from delivery. Buyer covers return shipping unless the item arrived damaged or not as described.`;

  return {
    zone: { key: input.zoneKey, ...zone, countries: undefined },
    title: `Shop Rajasthani Handicrafts Online in ${city} | Jaipurio`.slice(0, 70),
    metaDescription: `Buy ${cats} in ${city}. Ships from Jaipur, ${zone.transitDaysMin}-${zone.transitDaysMax} day delivery, easy returns.`.slice(0, 160),
    eyebrow: `Jaipur to ${city}`,
    h1: hashPick(city, 'h1', H1_TEMPLATES)(city),
    summary,
    whyTitle: hashPick(city, 'why', WHY_TITLES)(city),
    orderingText: domestic
      ? `Browse any category below and add to cart as usual. Orders are packed and dispatched from Jaipur, Rajasthan, and you'll get a tracking link once the courier collects your parcel.`
      : `Browse any category below and add to cart as usual — shipping is calculated at checkout based on item weight and category. Orders are packed and dispatched from Jaipur, Rajasthan; you'll get a tracking link by email once the courier collects it.`,
    quickAnswers: [
      { label: 'Delivery', text: `Yes — all core categories ship to addresses in ${domestic ? city : zone.label}.` },
      { label: 'Estimated transit', text: `Typically ${transit} working days by tracked courier from dispatch in Jaipur${domestic ? '' : ', depending on item and customs clearance'}.` },
      { label: 'Payment', text: `${zone.paymentNote}${domestic ? '' : ` Pricing can be shown in ${zone.currency} at checkout.`}` },
      { label: 'Returns', text: returns },
      { label: 'Customization', text: 'Available on select marble idols and jewellery (size, finish, engraving) — ask before ordering.' },
    ],
    customsNote,
    faqs: [
      {
        question: `Do you ship to ${city}?`,
        answer: `Yes. Orders are packed in Jaipur and shipped by tracked courier to ${domestic ? city : zone.label}, typically arriving in ${transit} working days.`,
      },
      domestic
        ? { question: 'Is there any customs duty?', answer: customsNote }
        : { question: 'Will I be charged customs duty or import tax on arrival?', answer: customsNote },
      {
        question: 'How long does delivery take?',
        answer: `Typically ${transit} working days from dispatch${domestic ? '' : ', depending on the item and customs clearance time'}.`,
      },
      { question: 'Can I return an item?', answer: `Yes, within ${zone.returnWindowDays} days of delivery. Buyer covers return shipping unless the item arrived damaged or not as described.` },
      {
        question: "Can I customize a marble idol's size or finish?",
        answer: 'Select idols and jewellery pieces can be customized on size, finish or engraving. Message us before ordering to confirm feasibility and any extra shipping cost.',
      },
    ],
    closeTitle: hashPick(city, 'close', CLOSE_TITLES)(city),
    closeText: `This page answers what a ${city} buyer actually needs — what ships, what it costs to get here, how long it takes, and what happens if something's wrong.`,
  };
};

module.exports = { generateCityContent, hashPick };
