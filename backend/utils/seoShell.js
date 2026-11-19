// Server-side first paint for crawlers and slow phones.
//
// The storefront is a client-rendered React app: before this, every page answered
// with the same index.html (one generic title, no canonical, an empty <div id="root">),
// so Google and AI crawlers saw 0 H1 and ~8 words on every URL. Here the same values
// the React page sets after it loads (title, description, canonical, JSON-LD, H1, text,
// links) are written into index.html on the server. Everyone gets the same HTML;
// React's createRoot() then replaces the contents of #root on mount.
//
// Only data from the database is used. Nothing here invents copy.

const SITE_NAME = 'Jaipurio';
const DEFAULT_IMAGE = '/jaipurio_banner.png';

const escapeHtml = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const decodeBasic = (s) =>
  s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

/** Plain text of stored HTML: tags out, entities decoded, spaces collapsed. */
const plainText = (html = '') =>
  decodeBasic(
    String(html || '')
      .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();

/** Paragraphs of stored HTML (block tags become breaks), as plain text. */
const paragraphs = (html = '', maxChars = 6000) => {
  const blocks = decodeBasic(
    String(html || '')
      .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\s*(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/blockquote)\b[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .split(/\n+/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const out = [];
  let used = 0;
  for (const p of blocks) {
    if (used + p.length > maxChars) break;
    out.push(p);
    used += p.length;
  }
  return out;
};

/** Same rule as frontend utils/seo.js toMetaDescription. */
const toMetaDescription = (text = '', max = 160) => {
  const plain = plainText(text);
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length)}…`;
};

/** Same rule as frontend usePageSeo: "| Jaipurio" is added when the title lacks the brand. */
const fullTitle = (title) => {
  const t = plainText(title);
  if (!t) return '';
  return /jaipurio/i.test(t) ? t : `${t} | ${SITE_NAME}`;
};

const absoluteUrl = (origin, pathOrUrl) => {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
};

const setTag = (html, re, tag) => (re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`));

/** JSON for a <script> block: "</" can never close the tag early. */
const safeJson = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');

/**
 * Writes one page's SEO head and first-paint body into the index.html shell.
 * @param {string} shell  the built index.html
 * @param {object} page   { title, description, path, canonical, image, type, jsonLd[], h1, text[], links[{href,text}], noindex }
 * @param {string} origin e.g. https://jaipurio.in
 */
function renderShell(shell, page, origin) {
  if (!shell || !page) return shell;
  let html = shell;
  const title = fullTitle(page.title);
  const description = toMetaDescription(page.description || '');
  const canonical = page.noindex ? '' : page.canonical || absoluteUrl(origin, page.path);
  const image = absoluteUrl(origin, page.image || DEFAULT_IMAGE);

  if (title) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
    html = setTag(html, /<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  }
  if (description) {
    html = setTag(html, /<meta name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(description)}" />`);
    html = setTag(html, /<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  }
  html = setTag(html, /<meta property="og:type"[^>]*>/i, `<meta property="og:type" content="${escapeHtml(page.type || 'website')}" />`);
  html = setTag(html, /<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${escapeHtml(image)}" />`);

  const extra = [];
  if (canonical) {
    extra.push(`<link rel="canonical" href="${escapeHtml(canonical)}" />`);
    extra.push(`<meta property="og:url" content="${escapeHtml(canonical)}" />`);
  }
  if (page.noindex) extra.push('<meta name="robots" content="noindex, follow" />');
  // data-page-schema: the React app removes these and writes its own on mount (no duplicates).
  for (const block of (page.jsonLd || []).filter(Boolean)) {
    extra.push(`<script type="application/ld+json" data-page-schema="true">${safeJson(block)}</script>`);
  }
  if (extra.length) html = html.replace('</head>', `    ${extra.join('\n    ')}\n  </head>`);

  const body = [];
  if (page.h1) body.push(`<h1>${escapeHtml(plainText(page.h1))}</h1>`);
  for (const p of page.text || []) body.push(`<p>${escapeHtml(p)}</p>`);
  const links = (page.links || []).filter((l) => l && l.href && l.text);
  if (links.length) {
    body.push(`<nav><ul>${links.map((l) => `<li><a href="${escapeHtml(l.href)}">${escapeHtml(plainText(l.text))}</a></li>`).join('')}</ul></nav>`);
  }
  if (body.length) {
    html = html.replace(/<div id="root">\s*<\/div>/i, `<div id="root"><main data-ssr="true">${body.join('')}</main></div>`);
  }
  return html;
}

module.exports = { renderShell, plainText, paragraphs, toMetaDescription, fullTitle, escapeHtml, SITE_NAME };
