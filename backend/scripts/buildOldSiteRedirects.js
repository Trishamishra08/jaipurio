/**
 * Builds the nginx 301 map for EVERY URL of the previous site (the Botble shop that
 * lived at jaipurio.sapython.me), straight from that site's own sitemaps.
 *
 *   node scripts/buildOldSiteRedirects.js
 *   node scripts/buildOldSiteRedirects.js --old https://jaipurio.sapython.me --new https://jaipurio.in
 *
 * What each old sitemap becomes:
 *   blog-posts-*.xml      /blog/<old-slug>        -> /blog/<new-slug>  (matched by the article's TITLE:
 *                         the old page is fetched and its heading looked up among today's articles,
 *                         because the migration changed most slugs)
 *   blog-categories.xml   /blog/<category>        -> /blog
 *   blog-tags.xml         /tag/<tag>              -> a live article only when the tag clearly names
 *                         one (strict word match); otherwise left to the 410 rule
 *   product-categories    /product-categories/<x> -> same path if it still exists, else the nearest
 *                         live parent category (the same answer the storefront gives), else /shop
 *   product-brands        /brands/<x>             -> /shop?brand=<x> (brands that are not live brand pages)
 *   pages.xml             a few old page paths   -> their closest live page
 *   stores.xml            /stores, /stores/<x>    -> /shop
 *   products-*.xml        already covered by legacy-redirects.conf (buildLegacyRedirects.js); the few
 *                         left over are listed in PRODUCT_MANUAL below
 *   product-tags.xml      handled by buildLegacyTagRedirects.js
 *
 * Nothing is guessed loosely: anything without a clear match gets NO rule here and falls through
 * to the normal 404/410 behaviour. Re-run it when slugs change; commit the generated file.
 */
const fs = require('fs');
const path = require('path');
const { suggestBlogSlug } = require('../utils/blogSuggest');

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const OLD = opt('old', 'https://jaipurio.sapython.me').replace(/\/$/, '');
const NEW = opt('new', 'https://jaipurio.in').replace(/\/$/, '');
const OUT = path.resolve(opt('out', path.join(__dirname, '..', '..', 'frontend', 'legacy-site-redirects.conf')));
const LEGACY_PRODUCTS = path.join(__dirname, '..', '..', 'frontend', 'legacy-redirects.conf');

// Old products that were removed or renamed in a way the SKU/name matcher could not follow.
const PRODUCT_MANUAL = {
  'pure-brass-large-shiva-parvati-standing-statue':
    '/products/pure-brass-shiva-parvati-standing-statue-divine-couple-sacred-sculpture-jaipurio',
  // discontinued products -> the closest category
  'onyx-marble-sculpture-luxury-art-object-premium-stone-masterpiece-authentic-indian-craftsmanship-distinguished-collection':
    '/product-categories/art-collectibles',
  'stunning-black-chikankari-open-sherwani-for-men': '/product-categories/mens-clothing',
};

// Old posts whose title could not be matched automatically (e.g. a Hindi translation of an
// article that exists in English today).
const BLOG_MANUAL = {
  'rashi-anusar-ratna-chayan-guide-visheshagya-salah-jaipurio':
    'zodiac-gemstone-guide-find-your-perfect-rashi-ratna-expert-recommendations-by-jaipurio-authentic-stones-for-each-sign',
};

// Old CMS/utility pages whose path is not a live page of the same name.
const PAGE_MANUAL = {
  '/faqs': '/customer-service',
  '/coming-soon': '/home',
  '/stores': '/shop',
};

const SAFE = /^[a-z0-9][a-z0-9_-]*$/;
const last = (u) => u.replace(/\/+$/, '').split('/').pop();
const decode = (s) =>
  String(s || '')
    .replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
// Keeps non-Latin letters (Hindi titles) so those posts can be matched too.
const norm = (s) => decode(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const slugifyName = (s) =>
  decode(s).toLowerCase().replace(/['’]/g, '').replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function get(url, tries = 3) {
  for (let i = 1; i <= tries; i += 1) {
    try {
      const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(60000) });
      if (!r.ok) throw new Error(`${r.status}`);
      return await r.text();
    } catch (e) {
      if (i === tries) throw new Error(`${url}: ${e.message}`);
      await new Promise((ok) => setTimeout(ok, 800 * i));
    }
  }
  return '';
}
const locs = (xml) => [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1].trim());

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next;
        next += 1;
        out[i] = await fn(items[i], i);
      }
    })
  );
  return out;
}

(async () => {
  // ---- old site: every URL, grouped by the sitemap it came from
  const index = locs(await get(`${OLD}/sitemap.xml`));
  const groups = {};
  for (const sm of index) {
    const name = last(sm).replace(/\.xml$/, '');
    groups[name] = locs(await get(sm));
  }
  const gather = (re) => Object.entries(groups).filter(([n]) => re.test(n)).flatMap(([, urls]) => urls);
  console.log('old sitemaps:', Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])));

  // ---- new site: what exists today
  const newSlugs = async (file, seg) => new Set(locs(await get(`${NEW}/${file}`)).map((u) => u.split(`/${seg}/`)[1]).filter(Boolean));
  const newProducts = await newSlugs('sitemap-products.xml', 'products');
  const newCats = await newSlugs('sitemap-categories.xml', 'product-categories');
  const newBlogSlugs = await newSlugs('sitemap-blog.xml', 'blog');
  const newBrands = await newSlugs('sitemap-brands.xml', 'brands');

  // every live article with its title (API pages at 50)
  const blogs = new Map();
  for (let page = 1; page <= 20; page += 1) {
    const j = JSON.parse(await get(`${NEW}/api/blogs?limit=50&page=${page}`));
    const rows = j.data?.blogs || [];
    const before = blogs.size;
    rows.forEach((b) => b.slug && blogs.set(b.slug, { slug: b.slug, title: b.title || b.name, name: b.name }));
    if (blogs.size === before) break;
  }
  const byTitle = new Map();
  blogs.forEach((b) => {
    byTitle.set(norm(b.name), b);
    byTitle.set(norm(b.title), b);
  });
  console.log(`new site: ${newProducts.size} products, ${newCats.size} categories, ${blogs.size} blogs, ${newBrands.size} brands`);

  const map = new Map(); // "/old/path" -> "/new/path"
  const stats = {};
  const add = (kind, from, to) => {
    if (!from || !to || from === to) return false;
    map.set(from, to);
    stats[kind] = (stats[kind] || 0) + 1;
    return true;
  };

  // ---- blog posts: match by title
  const posts = gather(/^blog-posts-/).map(last).filter((s) => SAFE.test(s));
  const noMatch = [];
  const conflicts = [];
  await pool(posts, 6, async (slug) => {
    let target = null;
    try {
      const html = await get(`${OLD}/blog/${slug}`);
      const titles = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, ''));
      titles.push((html.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] || '');
      for (const t of titles) {
        const hit = byTitle.get(norm(t));
        if (hit) { target = hit.slug; break; }
      }
    } catch { /* old page gone: fall back to the slug words */ }
    if (!target) target = BLOG_MANUAL[slug] || suggestBlogSlug(slug, [...blogs.values()]);
    if (!target) { noMatch.push(slug); return; }
    // The old slug is also a live URL of a DIFFERENT article today: never hijack it.
    if (newBlogSlugs.has(slug) && target !== slug) { conflicts.push(`${slug} -> ${target}`); return; }
    add('blog posts', `/blog/${slug}`, `/blog/${target}`);
  });

  // ---- blog categories
  gather(/^blog-categories/).map(last).filter((s) => SAFE.test(s)).forEach((s) => add('blog categories', `/blog/${s}`, '/blog'));

  // ---- blog tags: only when the tag clearly names one article
  const blogList = [...blogs.values()];
  gather(/^blog-tags/).map(last).filter((s) => SAFE.test(s)).forEach((s) => {
    // A tag is a topic hub: redirect only when the article contains EVERY word of the tag.
    const t = suggestBlogSlug(s, blogList, { minCoverage: 1 });
    if (t) add('blog tags', `/tag/${s}`, `/blog/${t}`);
  });

  // ---- product categories that no longer exist as such
  const missingCats = gather(/^product-categories/).map(last).filter((s) => SAFE.test(s) && !newCats.has(s));
  await pool(missingCats, 4, async (slug) => {
    let to = '/shop';
    try {
      const j = JSON.parse(await get(`${NEW}/api/products/categories/resolve/${slug}`));
      const parent = slugifyName(j.data?.name);
      if (parent && newCats.has(parent)) to = `/product-categories/${parent}`;
    } catch { /* keep /shop */ }
    add('product categories', `/product-categories/${slug}`, to);
  });

  // ---- brands that are not a live brand page
  gather(/^product-brands/).map(last).filter((s) => SAFE.test(s) && !newBrands.has(s))
    .forEach((s) => add('brands', `/brands/${s}`, `/shop?brand=${s}`));

  // ---- pages and stores
  Object.entries(PAGE_MANUAL).forEach(([from, to]) => add('pages', from, to));
  gather(/^stores/).map(last).filter((s) => SAFE.test(s) && s !== 'stores').forEach((s) => add('stores', `/stores/${s}`, '/shop'));

  // ---- the few products the SKU/name matcher left over
  const legacy = new Set([...fs.readFileSync(LEGACY_PRODUCTS, 'utf8').matchAll(/^\s+"\/products\/([^"]+)"/gm)].map((m) => m[1]));
  const leftovers = gather(/^products-/).map(last).filter((s) => !newProducts.has(s) && !legacy.has(s));
  const unresolved = [];
  leftovers.forEach((s) => {
    if (PRODUCT_MANUAL[s]) add('products (leftover)', `/products/${s}`, PRODUCT_MANUAL[s]);
    else unresolved.push(s);
  });

  // ---- sanity: every target must exist, and nothing may redirect into another redirect
  const bad = [];
  for (const [from, to] of map) {
    const p = to.split('?')[0];
    const ok =
      (p.startsWith('/blog/') && newBlogSlugs.has(p.slice(6))) ||
      (p.startsWith('/product-categories/') && newCats.has(p.slice(20))) ||
      (p.startsWith('/products/') && (newProducts.has(p.slice(10)))) ||
      ['/blog', '/shop', '/home', '/customer-service'].includes(p);
    if (!ok || map.has(p)) bad.push(`${from} -> ${to}`);
  }
  if (bad.length) throw new Error(`Refusing to write: ${bad.length} bad targets, e.g. ${bad.slice(0, 5).join(' | ')}`);

  const lines = [
    '# GENERATED by backend/scripts/buildOldSiteRedirects.js — do not edit by hand.',
    `# Old site (${OLD}) URLs -> the same content on the current site (301). ${map.size} rules.`,
    `# ${JSON.stringify(stats)}`,
    '',
    '# Trailing slash is ignored: /blog/x/ is looked up as /blog/x.',
    'map $uri $legacy_site_key {',
    '    default $uri;',
    '    ~^(?<legacy_site_path>.+?)/+$ $legacy_site_path;',
    '}',
    '',
    'map $legacy_site_key $legacy_site_target {',
    '    default "";',
    ...[...map].sort(([a], [b]) => a.localeCompare(b)).map(([from, to]) => `    "${from}" "${to}";`),
    '}',
    '',
  ];
  fs.writeFileSync(OUT, lines.join('\n'));
  console.log('rules per group:', stats);
  console.log(`blog posts with no match (left to 404): ${noMatch.length}`, noMatch.slice(0, 5));
  console.log(`blog posts skipped because the old slug is a different live article: ${conflicts.length}`, conflicts.slice(0, 5));
  console.log(`products still unresolved: ${unresolved.length}`, unresolved.slice(0, 5));
  console.log(`Wrote ${map.size} rules to ${OUT}`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
