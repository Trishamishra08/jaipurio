/**
 * Maps backend product records to the storefront shape used by ShopContext / ProductDetail.
 */
import { mediaUrl } from '../data/cloudinaryMedia';

const isStubHtml = (html) => {
  const plain = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return !plain || plain.length < 180;
};

const buildDescriptionHtml = (productName = 'Jaipurio handmade piece') =>
  `<p><strong>Ready to bring authentic Jaipur craftsmanship home?</strong> Our ${productName} is handcrafted for everyday beauty and lasting heritage.</p>
<p><strong>What You'll Receive:</strong></p>
<ul>
<li>Genuine artisan-made piece from Jaipur</li>
<li>Premium mitti / marble craftsmanship</li>
<li>Thoughtful design for home and ritual use</li>
<li>Secure packaging with care guidance</li>
<li>Trusted by families who choose handmade over factory ware</li>
</ul>`;

const buildContentHtml = (productName = 'Jaipurio handmade piece') =>
  `<p>Elevate your space with our ${productName}. Each piece is finished by hand so small variations in tone and texture are a mark of authenticity — not factory moulds.</p>
<h3>Why families choose Jaipurio</h3>
<p><strong>Mass-produced décor fades fast.</strong> Our artisans work with traditional methods so your piece stays beautiful for years of daily use, gifting, and festive rituals.</p>
<figure class="table">
<table>
<thead><tr><th>Detail</th><th>What you get</th><th>Why it matters</th></tr></thead>
<tbody>
<tr><td>Origin</td><td>Jaipur artisan workshops</td><td>Real heritage craft</td></tr>
<tr><td>Make</td><td>Handmade finish</td><td>Unique character in every piece</td></tr>
<tr><td>Use</td><td>Home, puja and gifting</td><td>Beauty with purpose</td></tr>
<tr><td>Care</td><td>Simple dry / soft-cloth clean</td><td>Easy everyday maintenance</td></tr>
</tbody>
</table>
</figure>
<h3>A note from the workshop</h3>
<p><strong>Result:</strong> When you choose ${productName} from Jaipurio, you support living craft traditions and bring a piece of Rajasthan into your home.</p>`;

const ensureRichCopy = (name, description, content) => {
  const productName = name || 'Jaipurio handmade piece';
  let nextDescription = isStubHtml(description)
    ? buildDescriptionHtml(productName)
    : description;
  let nextContent = isStubHtml(content)
    ? isStubHtml(description)
      ? buildContentHtml(productName)
      : String(description)
    : content;
  if (nextDescription && nextContent && nextDescription === nextContent) {
    nextDescription = buildDescriptionHtml(productName);
    nextContent = buildContentHtml(productName);
  }
  return { description: nextDescription, content: nextContent };
};
export function parseProductFaqs(faqs) {
  if (!faqs) return [];
  if (Array.isArray(faqs)) {
    return faqs
      .map((item) => ({
        q: item.q || item.question || '',
        a: item.a || item.answer || '',
      }))
      .filter((row) => row.q);
  }
  try {
    const parsed = JSON.parse(faqs);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => ({
          q: item.q || item.question || '',
          a: item.a || item.answer || '',
        }))
        .filter((row) => row.q);
    }
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

export function formatProductWeight(rawWeight) {
  if (rawWeight == null || rawWeight === '') return '';
  const str = String(rawWeight).trim();
  if (!str) return '';
  // If unit is already specified (e.g. "3.2 kg", "900 g", "1.5kg", "500 gm")
  if (/[a-zA-Z]/.test(str)) {
    return str;
  }
  const num = parseFloat(str.replace(/,/g, ''));
  if (isNaN(num) || num <= 0) return '';
  // If >= 1000, value is in grams -> convert to kg (e.g. 1700g -> 1.7 kg, 2500g -> 2.5 kg)
  if (num >= 1000) {
    const kg = num / 1000;
    return `${Number(kg.toFixed(2))} kg`;
  }
  // If between 100 and 999 (e.g. 250g, 500g, 750g), show in grams
  if (num >= 100) {
    return `${Number(num.toFixed(0))} g`;
  }
  // If between 1 and 99, it is already kg (e.g. 1.2 -> 1.2 kg, 3.5 -> 3.5 kg, 45 -> 45 kg)
  if (num >= 1) {
    return `${Number(num.toFixed(2))} kg`;
  }
  // If fractional kg < 1 (e.g. 0.5 -> 500 g)
  return `${Number((num * 1000).toFixed(0))} g (${Number(num.toFixed(2))} kg)`;
}

export function formatInr(n) {
  const num = typeof n === 'number' ? n : parseFloat(String(n || 0).replace(/,/g, ''));
  if (isNaN(num) || num === 0) return '₹0';
  if (Number.isInteger(num)) {
    return `₹${num.toLocaleString('en-IN')}`;
  }
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const parseCleanPrice = (val) => {
  if (val == null || val === '') return 0;
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, '').replace(/[^\d.]/g, ''));
  if (isNaN(num) || num <= 0) return 0;
  return Math.round(num * 100) / 100;
};

export function mapApiProductToStorefront(raw) {
  if (!raw) return null;
  const listPrice = parseCleanPrice(raw.price);
  const salePrice = parseCleanPrice(raw.salePrice);
  const markedOld = parseCleanPrice(raw.oldPrice);
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

  const name = raw.title || raw.name || '';
  const copy = ensureRichCopy(name, raw.description, raw.content);

  const formattedWeight = formatProductWeight(raw.weight);
  const weightKgNumber = typeof raw.weight === 'number'
    ? (raw.weight >= 100 ? raw.weight / 1000 : raw.weight)
    : parseFloat(String(raw.weight || '').replace(/,/g, '')) || null;

  return {
    _id: String(raw._id || raw.id),
    name,
    title: name,
    slug: raw.slug || raw.seo?.general?.slug || '',
    seo: raw.seo || null,
    description: copy.description,
    content: copy.content || copy.description,
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
    weight: formattedWeight,
    weightKg: weightKgNumber,
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
