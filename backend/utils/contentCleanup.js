// Pure text/HTML cleanup rules for imported catalogue and blog content.
// Mirrors the storefront's display-time cleaners (frontend/src/utils/storefrontProduct.js)
// so the stored data can be fixed at the source. Used by scripts/cleanContent.js.

const PLACEHOLDER = /\s*\[(?:specify|insert|add|enter|mention|include|your)\b[^\]]{0,60}\]/gi;
const NOTE_START = /^\s*(meta\s*title|meta\s*description|seo\s*title|seo\s*description|focus\s*keyword)/i;
const NOTE_IN_NAME = /\b(meta\s*title|seo\s*title|meta\s*description)\b\s*(\(\s*\d+\s*characters?\s*\))?\s*:?/i;

/** Description/content HTML: drop AI placeholders and leftover SEO notes; H1 → H2. */
function cleanProductHtml(html) {
  if (!html) return html;
  return String(html)
    .replace(/<h1(\s[^>]*)?>/gi, '<h2$1>')
    .replace(/<\/h1>/gi, '</h2>')
    .replace(/<(p|li|h[2-6])\b[^>]*>([\s\S]*?)<\/\1>/gi, (block, _t, inner) =>
      NOTE_START.test(inner.replace(/<[^>]+>/g, '')) ? '' : block
    )
    .replace(PLACEHOLDER, '')
    .replace(/<td([^>]*)>\s*<\/td>/gi, '<td$1>—</td>')
    .replace(/<li[^>]*>\s*<\/li>/gi, '');
}

/**
 * Product name: the shopper-facing name is the first meaningful segment.
 * The original long name is returned as `seoTitle` so nothing is lost —
 * the caller only stores it when the product has no SEO title yet.
 */
function splitProductName(rawName) {
  const original = String(rawName || '').replace(/\s+/g, ' ').trim();
  if (!original) return { name: '', seoTitle: '' };
  let name = original;
  const note = name.search(NOTE_IN_NAME);
  if (note > 0) name = name.slice(0, note).trim();
  else if (note === 0) name = name.replace(/^(meta\s*title|seo\s*title)\s*(\(\s*\d+\s*characters?\s*\))?\s*:?\s*/i, '');
  const segments = name.split(/\s+\|\s+/).map((s) => s.trim()).filter(Boolean);
  if (segments.length > 1) name = segments[0];
  name = name.replace(/\s*[-–—|:]\s*jaipurio\s*$/i, '').replace(/[\s,:;|–—-]+$/, '').trim() || original;
  return { name, seoTitle: name === original ? '' : original };
}

const hostOf = (href) => {
  try {
    return new URL(href).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};

/**
 * Cross-promo links to other sites repeat inside blog posts (reworded each time,
 * so exact-duplicate matching can't catch them). Keep the first sentence that
 * links to each promo domain and drop the later ones; a paragraph left empty
 * is removed. Links to jaipurio.in and unknown domains are never touched.
 *
 * @param {string} html
 * @param {string[]} domains  e.g. ['govindam.co.in', 'traveltaxi.in']
 */
function dedupePromoLinks(html, domains) {
  if (!html || !domains?.length) return html;
  const promo = new Set(domains.map((d) => d.toLowerCase().replace(/^www\./, '')));
  const seen = new Set();
  return String(html).replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, (block, attrs, inner) => {
    // sentences end at . ! ? followed by space and the start of the next one
    const parts = inner.split(/(?<=[.!?])(?:<\/(?:a|strong|em)>)*\s+(?=[A-Z<])/);
    let changed = false;
    const kept = parts.filter((sentence) => {
      const hosts = [...sentence.matchAll(/href="([^"]+)"/gi)].map((m) => hostOf(m[1])).filter((h) => promo.has(h));
      if (!hosts.length) return true;
      const repeat = hosts.some((h) => seen.has(h));
      hosts.forEach((h) => seen.add(h));
      if (repeat) changed = true;
      return !repeat;
    });
    if (!changed) return block;
    const text = kept.join(' ').trim();
    return text.replace(/<[^>]+>/g, '').trim() ? `<p${attrs}>${text}</p>` : '';
  });
}

module.exports = { cleanProductHtml, splitProductName, dedupePromoLinks };
