const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const EcommerceBrand = require('../models/ecommerceBrandModel');
const Blog = require('../models/blogModel');
const { categoriesForSitemap } = require('../utils/sitemapCategories');

const SITE_URL = (process.env.SITE_URL || 'https://jaipurio.in').replace(/\/$/, '');

// Google's limit is 50,000 URLs / 50 MB per sitemap file.
const MAX_URLS = 45000;

// Same visibility rule the shop uses (getProducts / getProductById), so the sitemap
// never lists a product the storefront would 404.
const LIVE_PRODUCT = { $or: [{ lifecycle: 'Published' }, { status: 'approved' }] };

// A slug is only listed when it can sit in a URL path as-is (no spaces, slashes, ? or #).
const usableSlug = (s) => typeof s === 'string' && s.length > 0 && !/[\s/?#]/.test(s);

function escapeXml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const day = (d) => {
  const t = d ? new Date(d) : null;
  return t && !Number.isNaN(t.getTime()) ? t.toISOString().split('T')[0] : '';
};

// Google ignores <changefreq> and <priority>, and only trusts <lastmod> when it is the
// real last change. So each URL carries its loc and, when known, its true lastmod.
function urlEntry({ loc, lastmod }) {
  const d = day(lastmod);
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>${d ? `\n    <lastmod>${d}</lastmod>` : ''}\n  </url>`;
}

function urlset(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
}

function sendXml(res, xml) {
  res
    .status(200)
    .set('Cache-Control', 'public, max-age=3600')
    .type('application/xml')
    .send(xml);
}

/** Each section returns [{ loc, lastmod }] straight from the database. */
const SECTIONS = {
  // Fixed pages. No lastmod: these have no real "last changed" date, and a fake
  // "today" on every fetch makes Google distrust lastmod for the whole site.
  'sitemap-static.xml': async () =>
    ['/home', '/shop', '/blog', '/about-us', '/contact'].map((p) => ({ loc: `${SITE_URL}${p}` })),

  'sitemap-products.xml': async () => {
    const rows = await Product.find(LIVE_PRODUCT).select('slug updatedAt').limit(MAX_URLS).lean();
    return rows
      .filter((p) => usableSlug(p.slug))
      .map((p) => ({ loc: `${SITE_URL}/products/${p.slug}`, lastmod: p.updatedAt }));
  },

  // Only categories that have live products: the others redirect to a parent or /shop.
  'sitemap-categories.xml': async () => {
    const [all, ids, names] = await Promise.all([
      Category.find({ isActive: { $ne: false } }).select('title slug isActive updatedAt').lean(),
      Product.distinct('categoryIds', LIVE_PRODUCT),
      Product.distinct('category', {
        $and: [
          LIVE_PRODUCT,
          { category: { $nin: ['', null] } },
          { $or: [{ categoryIds: { $exists: false } }, { categoryIds: { $size: 0 } }] },
        ],
      }),
    ]);
    return categoriesForSitemap(all, ids, names)
      .filter((c) => usableSlug(c.slug))
      .map((c) => ({ loc: `${SITE_URL}/product-categories/${c.slug}`, lastmod: c.updatedAt }));
  },

  'sitemap-brands.xml': async () => {
    const rows = await EcommerceBrand.find({ status: 'Published' }).select('slug updatedAt').lean();
    return rows
      .filter((b) => usableSlug(b.slug))
      .map((b) => ({ loc: `${SITE_URL}/brands/${b.slug}`, lastmod: b.updatedAt }));
  },

  'sitemap-blog.xml': async () => {
    const rows = await Blog.find({ status: 'Published' }).select('slug updatedAt').limit(MAX_URLS).lean();
    return rows
      .filter((b) => usableSlug(b.slug))
      .map((b) => ({ loc: `${SITE_URL}/blog/${b.slug}`, lastmod: b.updatedAt }));
  },

  // Published, indexable city / country pages (/shop/<slug>)
  'sitemap-cities.xml': async () => {
    const CityPage = require('../models/cityPageModel');
    const rows = await CityPage.find({ status: 'Published', indexable: true }).select('slug updatedAt').lean();
    return rows
      .filter((c) => usableSlug(c.slug))
      .map((c) => ({ loc: `${SITE_URL}/shop/${c.slug}`, lastmod: c.updatedAt }));
  },
};

Object.entries(SECTIONS).forEach(([file, build]) => {
  router.get(`/${file}`, async (req, res) => {
    try {
      sendXml(res, urlset((await build()).map(urlEntry)));
    } catch (err) {
      res.status(500).type('text/plain').send(`Error generating ${file}`);
    }
  });
});

// Index: lists only sitemaps that actually contain URLs (an empty one shows up in
// Search Console as "No URLs"), each with the date of its newest entry.
router.get('/sitemap.xml', async (req, res) => {
  try {
    const parts = await Promise.all(
      Object.entries(SECTIONS).map(async ([file, build]) => {
        try {
          const rows = await build();
          const newest = rows.map((r) => day(r.lastmod)).filter(Boolean).sort().pop() || '';
          return { file, count: rows.length, newest };
        } catch {
          return { file, count: 0, newest: '' };
        }
      })
    );
    const items = parts
      .filter((p) => p.count > 0)
      .map(
        (p) =>
          `  <sitemap>\n    <loc>${SITE_URL}/${p.file}</loc>${p.newest ? `\n    <lastmod>${p.newest}</lastmod>` : ''}\n  </sitemap>`
      );
    sendXml(
      res,
      `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join('\n')}\n</sitemapindex>\n`
    );
  } catch (err) {
    res.status(500).type('text/plain').send('Error generating sitemap index');
  }
});

module.exports = router;
