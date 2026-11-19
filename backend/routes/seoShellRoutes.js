// GET /api/seo-shell?path=/products/<slug>
// nginx sends storefront page requests here and serves the answer as the page HTML
// (with plain index.html as the fallback if this fails). See utils/seoShell.js.

const express = require('express');
const mongoose = require('mongoose');
const { renderShell, paragraphs, plainText } = require('../utils/seoShell');
const { categoriesForSitemap } = require('../utils/sitemapCategories');

const router = express.Router();

const SITE_URL = (process.env.SITE_URL || 'https://jaipurio.in').replace(/\/$/, '');
const SHELL_URL = process.env.WEB_SHELL_URL || 'http://jaipurio-web/index.html';
const LIVE_PRODUCT = { $or: [{ lifecycle: 'Published' }, { status: 'approved' }] };
const SLUG = /^[A-Za-z0-9_-]{1,200}$/;

// Same fixed slugs as frontend App.jsx (/about -> CmsPage slug="about-us" ...).
const FIXED_CMS = { '/about': 'about-us', '/about-us': 'about-us', '/privacy-policy': 'privacy-policy', '/return-policy': 'refund-policy' };
// First path segments that are app screens, never CMS pages.
const APP_SEGMENTS = new Set(['login', 'register', 'signup', 'checkout', 'orders', 'wishlist', 'affiliate', 'reviews', 'profile', 'location', 'contact', 'cart', 'compare', 'notifications', 'vendor', 'vendors', 'admin', 'customer', 'products', 'product', 'shop', 'blog', 'blogs', 'journal', 'home', 'ships-to', 'store', 'brands', 'brand', 'category', 'product-categories']);

let shellCache = { html: '', at: 0 };
async function getShell(fetchImpl = fetch) {
  if (shellCache.html && Date.now() - shellCache.at < 60_000) return shellCache.html;
  const res = await fetchImpl(SHELL_URL, { headers: { Accept: 'text/html' } });
  if (!res.ok) throw new Error(`shell ${res.status}`);
  const html = await res.text();
  if (!/<div id="root">/i.test(html)) throw new Error('shell without #root');
  shellCache = { html, at: Date.now() };
  return html;
}

const productLink = (p) => ({ href: `/products/${p.slug}`, text: p.name || p.title });
const usable = (s) => typeof s === 'string' && SLUG.test(s);

// Home and /shop list the same categories on every request: keep them 5 minutes.
let catCache = { rows: null, at: 0, models: null };
async function liveCategories(m) {
  if (catCache.rows && catCache.models === m && Date.now() - catCache.at < 300_000) return catCache.rows;
  const rows = await loadCategories(m);
  catCache = { rows, at: Date.now(), models: m };
  return rows;
}

async function loadCategories(m) {
  const [all, ids, names] = await Promise.all([
    m.Category.find({ isActive: { $ne: false } }).select('title slug isActive parent sortOrder').lean(),
    m.Product.distinct('categoryIds', LIVE_PRODUCT),
    m.Product.distinct('category', LIVE_PRODUCT),
  ]);
  return categoriesForSitemap(all, ids, names).filter((c) => usable(c.slug));
}

/** Page values for a storefront path, from the database. null = leave the shell as it is. */
async function pageFor(path, m) {
  const clean = String(path || '/').split('?')[0].replace(/\/+$/, '') || '/';
  const parts = clean.split('/').filter(Boolean);

  if (clean === '/home') {
    const cats = await liveCategories(m);
    return {
      // Same values as components/user/Home.jsx
      title: 'Jaipurio | Handcrafted Marble Idols, Mitti Pottery & Rajasthani Handicrafts',
      description: 'Shop authentic handcrafted marble idols and temples, terracotta and mitti pottery, home decor, jewellery and gifts from Jaipur artisans. Pan-India delivery, secure payments.',
      path: '/home',
      h1: 'Jaipurio: Handcrafted Marble Idols, Mitti Pottery and Rajasthani Handicrafts',
      jsonLd: [{ '@context': 'https://schema.org', '@type': 'Organization', name: 'Jaipurio', url: SITE_URL, logo: `${SITE_URL}/jaipurio_logo.png` }],
      links: [...cats.map((c) => ({ href: `/product-categories/${c.slug}`, text: c.title })), { href: '/shop', text: 'Shop all products' }, { href: '/blog', text: 'Blog' }],
    };
  }

  if (clean === '/shop') {
    const cats = await liveCategories(m);
    return {
      // Same values as components/user/Shop.jsx with no filter
      title: 'Shop Handcrafted Rajasthani Products Online',
      description: 'Browse the full Jaipurio catalogue: marble idols, terracotta and mitti pottery, home decor, jewellery and gifts handcrafted by Rajasthani artisans.',
      path: '/shop',
      h1: 'Authentic Rajasthani Pottery & Crafts',
      links: cats.map((c) => ({ href: `/product-categories/${c.slug}`, text: c.title })),
    };
  }

  if ((parts[0] === 'products' || parts[0] === 'product') && parts.length === 2) {
    const key = decodeURIComponent(parts[1]);
    const or = [{ slug: key }];
    if (mongoose.Types.ObjectId.isValid(key)) or.push({ _id: key });
    const p = await m.Product.findOne({ $and: [LIVE_PRODUCT, { $or: or }] })
      .select('name title slug description image category seo')
      .lean();
    if (!p) return null;
    const g = p.seo?.general || {};
    const name = p.name || p.title;
    const path = `/products/${encodeURIComponent(p.slug || p._id)}`;
    return {
      // Same values as components/user/ProductDetail.jsx
      title: g.metaTitle || p.seo?.social?.ogTitle || name,
      description: g.metaDescription || p.seo?.social?.ogDescription || p.description || '',
      path,
      canonical: g.canonicalUrl || undefined,
      image: p.image,
      type: 'product',
      h1: name,
      text: paragraphs(p.description, 4000),
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { name: 'Home', path: '/home' },
            { name: 'Shop', path: '/shop' },
            { name, path },
          ].map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })),
        },
      ],
      links: [{ href: '/shop', text: 'Shop' }],
    };
  }

  if (parts[0] === 'product-categories' && parts.length === 2 && usable(parts[1])) {
    const c = await m.Category.findOne({ slug: parts[1], isActive: { $ne: false } }).select('title slug description').lean();
    if (!c) return null;
    const products = await m.Product.find({ $and: [LIVE_PRODUCT, { $or: [{ categoryIds: c._id }, { category: c.title }] }] })
      .select('name title slug')
      .sort({ updatedAt: -1 })
      .limit(60)
      .lean();
    return {
      // Same values as components/user/Shop.jsx for a category
      title: `Buy Handcrafted ${c.title} Online`,
      description: `Shop authentic handcrafted ${String(c.title).toLowerCase()} from Jaipur artisans on Jaipurio. Genuine products, secure payments and pan-India delivery.`,
      path: `/product-categories/${c.slug}`,
      h1: `${c.title} Collection`,
      text: paragraphs(c.description, 2000),
      links: products.filter((p) => usable(p.slug)).map(productLink),
    };
  }

  if (clean === '/blog') {
    const posts = await m.Blog.find({ status: 'Published' }).select('title slug').sort({ createdAt: -1 }).limit(60).lean();
    return {
      // Same values as components/user/BlogSection.jsx
      title: 'Jaipurio Blog: Rajasthani Craft Guides, Care Tips & Gifting Ideas',
      description: 'Read guides on marble idols, terracotta and mitti pottery, Rajasthani jewellery and home decor: how they are made, how to care for them and what to gift.',
      path: '/blog',
      h1: 'Craft stories & buying guides',
      links: posts.filter((b) => usable(b.slug)).map((b) => ({ href: `/blog/${b.slug}`, text: b.title })),
    };
  }

  if ((parts[0] === 'blog' || parts[0] === 'journal') && parts.length === 2 && usable(parts[1])) {
    const b = await m.Blog.findOne({ slug: parts[1], status: 'Published' })
      .select('title slug excerpt description content image seo seoTitle seoDescription author createdAt updatedAt')
      .lean();
    if (!b) return null;
    const path = `/blog/${b.slug}`;
    const excerpt = b.excerpt || b.description || '';
    return {
      // Same values as components/user/BlogDetail.jsx
      title: b.seo?.general?.metaTitle || b.seoTitle || b.title,
      description: b.seo?.general?.metaDescription || b.seoDescription || excerpt || b.content,
      path,
      image: b.image,
      type: 'article',
      h1: b.title,
      text: paragraphs(b.content, 12000),
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: plainText(b.title),
          image: b.image ? [/^https?:/i.test(b.image) ? b.image : `${SITE_URL}${b.image.startsWith('/') ? '' : '/'}${b.image}`] : undefined,
          datePublished: b.createdAt || undefined,
          dateModified: b.updatedAt || b.createdAt || undefined,
          author: { '@type': 'Organization', name: b.author || 'Jaipurio' },
          publisher: { '@type': 'Organization', name: 'Jaipurio', logo: { '@type': 'ImageObject', url: `${SITE_URL}/jaipurio_logo.png` } },
          mainEntityOfPage: `${SITE_URL}${path}`,
        },
      ],
      links: [{ href: '/blog', text: 'All articles' }],
    };
  }

  const cmsSlug = FIXED_CMS[clean] || (parts.length === 1 && usable(parts[0]) && !APP_SEGMENTS.has(parts[0]) ? parts[0] : null);
  if (cmsSlug) {
    const pg = await m.Page.findOne({ slug: cmsSlug, status: 'Published' }).select('name slug description content seoTitle seoDescription').lean();
    if (!pg) return null;
    return {
      // Same values as components/user/CmsPage.jsx
      title: pg.seoTitle || pg.name,
      description: pg.seoDescription || pg.description || pg.content,
      path: clean,
      h1: pg.name,
      text: paragraphs(pg.content, 12000),
    };
  }

  return null;
}

let models = null;
const MODELS = () =>
  models ||
  (models = {
    Product: require('../models/productModel'),
    Category: require('../models/categoryModel'),
    Blog: require('../models/blogModel'),
    Page: require('../models/pageModel'),
  });

router.get('/api/seo-shell', async (req, res) => {
  let shell = '';
  try {
    shell = await getShell();
  } catch {
    // nginx falls back to index.html on a 5xx
    return res.status(502).type('text/plain').send('shell unavailable');
  }
  let html = shell;
  try {
    const models = MODELS();
    const page = await pageFor(String(req.get('x-shell-path') || req.query.path || '/'), models);
    if (page) html = renderShell(shell, page, SITE_URL);
  } catch {
    html = shell;
  }
  res.status(200).set('Cache-Control', 'no-cache').type('text/html').send(html);
});

module.exports = router;
module.exports.pageFor = pageFor;
module.exports.getShell = getShell;
