/**
 * Maps backend product records to the storefront shape used by ShopContext / ProductDetail.
 */
import { mediaUrl } from '../data/cloudinaryMedia';

export function parseProductFaqs(faqs) {
  if (!faqs) return [];
  if (Array.isArray(faqs)) return faqs;
  try {
    const parsed = JSON.parse(faqs);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* plain text format */
  }
  const rows = [];
  String(faqs)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      if (/^Q:/i.test(line)) {
        rows.push({ q: line.replace(/^Q:\s*/i, ''), a: '' });
      } else if (/^A:/i.test(line) && rows.length) {
        rows[rows.length - 1].a = line.replace(/^A:\s*/i, '');
      } else if (rows.length && !rows[rows.length - 1].a) {
        rows[rows.length - 1].a = line;
      } else {
        rows.push({ q: line, a: '' });
      }
    });
  return rows.filter((row) => row.q);
}

export function mapApiProductToStorefront(raw) {
  if (!raw) return null;
  const listPrice = Number(raw.price) || 0;
  const salePrice = Number(raw.salePrice) || 0;
  const markedOld = Number(raw.oldPrice) || 0;
  const sellingPrice = salePrice > 0 ? salePrice : listPrice;
  const comparePrice =
    markedOld > sellingPrice
      ? markedOld
      : listPrice > sellingPrice
        ? listPrice
        : 0;
  const materialAttr = (raw.attributes || []).find((a) => a?.name === 'Material');
  const gallery = [...new Set([...(raw.images || []), raw.image, raw.featuredImage].filter(Boolean))]
    .map((src) => mediaUrl(src));
  const vendorName =
    raw.store ||
    raw.storeName ||
    raw.vendor?.storeName ||
    (typeof raw.vendor === 'string' ? raw.vendor : '') ||
    '';

  return {
    _id: String(raw._id || raw.id),
    name: raw.title || raw.name || '',
    title: raw.title || raw.name || '',
    description: raw.content || raw.description || '',
    content: raw.content || raw.description || '',
    price: sellingPrice,
    oldPrice: comparePrice || undefined,
    mrp: comparePrice || listPrice,
    salePrice: salePrice || undefined,
    image: gallery[0] || '',
    iconImage: mediaUrl(raw.iconImage) || gallery[0] || '',
    images: gallery.slice(1),
    category: raw.category || '',
    brand: raw.brand || '',
    sku: raw.sku || '',
    tags: raw.tags || '',
    weight: raw.weight != null && raw.weight !== '' ? `${raw.weight} kg` : '',
    weightKg: raw.weight,
    length: raw.length,
    width: raw.width,
    height: raw.height,
    material: materialAttr?.value || '',
    packSize: raw.packSize || 'Standard',
    size: raw.packSize || raw.size || 'Standard',
    careInstructions: raw.careInstructions || '',
    shippingNotes: raw.shippingNotes || '',
    returnNotes: raw.returnNotes || '',
    vendor: vendorName,
    vendorId: raw.vendor?._id || raw.vendor,
    stock: raw.stock,
    stockStatus: raw.stockStatus,
    warehouse: raw.warehouse,
    trackQuantity: raw.trackQuantity,
    faqs: parseProductFaqs(raw.faqs),
    attributes: raw.attributes || [],
    options: raw.options || [],
    isFeatured: Boolean(raw.isFeatured),
    bestseller: Boolean(raw.isFeatured || raw.bestseller),
    badge: raw.isFeatured || raw.bestseller ? 'bestseller' : raw.badge,
    rating: raw.rating || 4.8,
    reviews: raw.reviews || 0,
    location: 'Jaipur, Rajasthan',
    lifecycle: raw.lifecycle,
    published: raw.published,
  };
}
