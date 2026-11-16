/**
 * Builds the nginx 301 map for OLD product URLs of the previous site.
 *
 * Why: the old shop used /products/<slug>. At migration most products got new,
 * different slugs (only ~200 of 1647 kept theirs), so old URLs that Google still
 * lists show "not found". The old export knows each product's id, SKU and slug,
 * and the SKU survived the migration, so old slug -> new slug can be matched.
 *
 *   node scripts/buildLegacyRedirects.js                 # writes ../frontend/legacy-redirects.conf
 *   node scripts/buildLegacyRedirects.js --site https://jaipurio.in --old "../old db" --out ../frontend/legacy-redirects.conf
 *
 * Matching order: SKU, then identical product name, then the part of the name before
 * " | " (only when exactly one live product has it). Anything else is left alone.
 * Re-run it when product slugs change; commit the generated file.
 */
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const SITE = opt('site', 'https://jaipurio.in').replace(/\/$/, '');
const OLD_DIR = path.resolve(opt('old', path.join(__dirname, '..', '..', 'old db')));
const OUT = path.resolve(opt('out', path.join(__dirname, '..', '..', 'frontend', 'legacy-redirects.conf')));

const norm = (s) => String(s || '').toLowerCase().replace(/&amp;/g, '&').replace(/[^a-z0-9]+/g, ' ').trim();
const firstPart = (s) => norm(String(s || '').split(/\s\|\s/)[0]);
const SAFE_SLUG = /^[a-z0-9][a-z0-9-]*$/; // nginx $uri is decoded; anything odd is skipped

/** Streams the (huge) legacy export and returns { oldProductId: slug }. */
function readOldSlugs(file) {
  const fd = fs.openSync(file, 'r');
  const size = fs.fstatSync(fd).size;
  const CHUNK = 32 * 1024 * 1024;
  const OVERLAP = 3000; // a record never straddles more than this
  const buf = Buffer.alloc(CHUNK);
  const idToSlug = {};
  const re = /"key":"([a-z0-9\-_%]+)","reference_id":(\d+),"reference_type":"Botble\\\\+Ecommerce\\\\+Models\\\\+Product"/g;
  let pos = 0;
  let carry = '';
  while (pos < size) {
    const n = fs.readSync(fd, buf, 0, CHUNK, pos);
    pos += n;
    const text = carry + buf.toString('utf8', 0, n);
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) idToSlug[m[2]] = m[1];
    carry = text.slice(-OVERLAP);
  }
  fs.closeSync(fd);
  return idToSlug;
}

/** Minimal CSV reader (quoted fields, doubled quotes, newlines inside quotes). */
function readCsv(file) {
  const t = fs.readFileSync(file, 'utf8');
  const out = [];
  let head = null;
  let row = [];
  let f = '';
  let q = false;
  // Only id/name/sku are kept per row: descriptions are huge HTML and would exhaust memory.
  const endRow = () => {
    row.push(f.replace(/\r$/, ''));
    if (!head) head = row;
    else if (row.length > 10) out.push({ id: row[head.indexOf('id')], name: row[head.indexOf('name')], sku: row[head.indexOf('sku')] });
    row = [];
    f = '';
  };
  for (let i = 0; i < t.length; i += 1) {
    const c = t[i];
    if (q) {
      if (c === '"') {
        if (t[i + 1] === '"') { f += '"'; i += 1; } else q = false;
      } else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f.length > 200 ? '' : f); f = ''; } // long cells are never id/name/sku
    else if (c === '\n') endRow();
    else f += c;
  }
  return out;
}

async function liveProducts() {
  const xml = await (await fetch(`${SITE}/sitemap-products.xml`)).text();
  const slugs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decodeURIComponent(m[1].split('/').pop()));
  const out = [];
  let i = 0;
  const worker = async () => {
    while (i < slugs.length) {
      const slug = slugs[i];
      i += 1;
      try {
        const j = await (await fetch(`${SITE}/api/products/${encodeURIComponent(slug)}`)).json();
        const p = j.data?.product || j.data || j;
        out.push({ slug, name: p.name, sku: p.sku });
      } catch {
        out.push({ slug, name: '', sku: '' });
      }
    }
  };
  await Promise.all(Array.from({ length: 12 }, worker));
  return out;
}

(async () => {
  console.log(`Reading old export from ${OLD_DIR} ...`);
  const idToSlug = readOldSlugs(path.join(OLD_DIR, 'legacy-export.json'));
  const oldProducts = readCsv(path.join(OLD_DIR, 'ec_products.csv'));
  console.log(`Fetching live products from ${SITE} ...`);
  const live = await liveProducts();

  const liveSlugs = new Set(live.map((p) => p.slug));
  const bySku = new Map();
  const byName = new Map();
  const byFirst = new Map();
  live.forEach((p) => {
    if (p.sku) bySku.set(String(p.sku).trim().toLowerCase(), p.slug);
    byName.set(norm(p.name), p.slug);
    const k = firstPart(p.name);
    byFirst.set(k, byFirst.has(k) ? null : p.slug); // null = ambiguous, never used
  });

  const map = new Map();
  const stats = { oldProducts: 0, sameSlugLive: 0, sku: 0, name: 0, firstPart: 0, unmatched: 0, unsafe: 0 };
  oldProducts.forEach((o) => {
    const oldSlug = idToSlug[o.id];
    if (!oldSlug) return;
    stats.oldProducts += 1;
    if (liveSlugs.has(oldSlug)) { stats.sameSlugLive += 1; return; }
    if (!SAFE_SLUG.test(oldSlug)) { stats.unsafe += 1; return; }
    let target = bySku.get(String(o.sku).trim().toLowerCase());
    let how = 'sku';
    if (!target) { target = byName.get(norm(o.name)); how = 'name'; }
    if (!target) { target = byFirst.get(firstPart(o.name)); how = 'firstPart'; }
    if (target && target !== oldSlug && !map.has(oldSlug)) { map.set(oldSlug, target); stats[how] += 1; } else stats.unmatched += 1;
  });

  const lines = [
    '# GENERATED by backend/scripts/buildLegacyRedirects.js — do not edit by hand.',
    '# Old product URLs of the previous site -> the same product at its current URL (301).',
    `# ${map.size} redirects. Keys are long slugs, so the map hash needs a bigger bucket.`,
    'map_hash_max_size 8192;',
    'map_hash_bucket_size 512;',
    '',
    'map $uri $legacy_redirect_target {',
    '    default "";',
    ...[...map].map(([from, to]) => `    "/products/${from}" "/products/${to}";`),
    '}',
    '',
  ];
  fs.writeFileSync(OUT, lines.join('\n'));
  console.log(stats);
  console.log(`Wrote ${map.size} redirects to ${OUT}`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
