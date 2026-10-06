const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const EcommerceBrand = require('../models/ecommerceBrandModel');
const Blog = require('../models/blogModel');

const SITE_URL = (process.env.SITE_URL || 'https://jaipurio.in').replace(/\/$/, '');

function escapeXml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry({ loc, lastmod, priority, changefreq }) {
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>` : '',
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : '',
    priority !== undefined ? `    <priority>${priority}</priority>` : '',
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

function urlset(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`;
}

router.get('/sitemap-static.xml', async (req, res) => {
  const now = new Date();
  const pages = [
    { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily', lastmod: now },
    { loc: `${SITE_URL}/about-us`, priority: '0.5', changefreq: 'monthly', lastmod: now },
    { loc: `${SITE_URL}/contact`, priority: '0.5', changefreq: 'monthly', lastmod: now },
    { loc: `${SITE_URL}/register`, priority: '0.4', changefreq: 'monthly', lastmod: now },
  ];
  res.type('application/xml').send(urlset(pages.map(urlEntry)));
});

router.get('/sitemap-products.xml', async (req, res) => {
  try {
    const products = await Product.find({
      $or: [{ lifecycle: 'Published' }, { status: 'approved' }],
    })
      .select('slug updatedAt')
      .limit(45000)
      .lean();

    const entries = products
      .filter((p) => p.slug)
      .map((p) =>
        urlEntry({
          loc: `${SITE_URL}/products/${p.slug}`,
          lastmod: p.updatedAt,
          priority: '0.9',
          changefreq: 'weekly',
        })
      );
    res.type('application/xml').send(urlset(entries));
  } catch (err) {
    res.status(500).type('text/plain').send('Error generating product sitemap');
  }
});

router.get('/sitemap-categories.xml', async (req, res) => {
  try {
    const categories = await Category.find({}).select('slug updatedAt').lean();
    const entries = categories
      .filter((c) => c.slug)
      .map((c) =>
        urlEntry({
          loc: `${SITE_URL}/product-categories/${c.slug}`,
          lastmod: c.updatedAt,
          priority: '0.8',
          changefreq: 'weekly',
        })
      );
    res.type('application/xml').send(urlset(entries));
  } catch (err) {
    res.status(500).type('text/plain').send('Error generating category sitemap');
  }
});

router.get('/sitemap-brands.xml', async (req, res) => {
  try {
    const brands = await EcommerceBrand.find({ status: 'Published' }).select('slug updatedAt').lean();
    const entries = brands
      .filter((b) => b.slug)
      .map((b) =>
        urlEntry({
          loc: `${SITE_URL}/brands/${b.slug}`,
          lastmod: b.updatedAt,
          priority: '0.7',
          changefreq: 'weekly',
        })
      );
    res.type('application/xml').send(urlset(entries));
  } catch (err) {
    res.status(500).type('text/plain').send('Error generating brand sitemap');
  }
});

router.get('/sitemap-blog.xml', async (req, res) => {
  try {
    const posts = await Blog.find({ status: 'Published' }).select('slug updatedAt').lean();
    const entries = posts
      .filter((b) => b.slug)
      .map((b) =>
        urlEntry({
          loc: `${SITE_URL}/blog/${b.slug}`,
          lastmod: b.updatedAt,
          priority: '0.6',
          changefreq: 'monthly',
        })
      );
    res.type('application/xml').send(urlset(entries));
  } catch (err) {
    res.status(500).type('text/plain').send('Error generating blog sitemap');
  }
});

router.get('/sitemap.xml', async (req, res) => {
  const now = new Date().toISOString().split('T')[0];
  const sitemaps = [
    'sitemap-static.xml',
    'sitemap-products.xml',
    'sitemap-categories.xml',
    'sitemap-brands.xml',
    'sitemap-blog.xml',
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps
    .map((s) => `  <sitemap>\n    <loc>${SITE_URL}/${s}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`)
    .join('\n')}\n</sitemapindex>`;
  res.type('application/xml').send(body);
});

module.exports = router;
