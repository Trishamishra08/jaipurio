const test = require('node:test');
const assert = require('node:assert/strict');
const { renderShell, paragraphs } = require('../utils/seoShell');
const { pageFor } = require('../routes/seoShellRoutes');

const SHELL = `<!doctype html>
<html lang="en">
  <head>
    <title>Jaipurio | Handcrafted Marble, Mitti &amp; Rajasthani Handicrafts</title>
    <meta name="description" content="default" />
    <meta property="og:title" content="default" />
    <meta property="og:description" content="default" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="/jaipurio_banner.png" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index.js"></script>
  </body>
</html>`;

// Minimal stand-in for mongoose queries: find/findOne(...).select().sort().limit().lean()
const query = (value) => {
  const q = { select: () => q, sort: () => q, limit: () => q, lean: async () => value };
  return q;
};
const fakeModels = ({ product = null, category = null, products = [], blog = null, blogs = [], page = null, categories = [] } = {}) => ({
  Product: {
    findOne: () => query(product),
    find: () => query(products),
    distinct: async (field) => (field === 'categoryIds' ? categories.map((c) => c._id) : []),
  },
  Category: { findOne: () => query(category), find: () => query(categories) },
  Blog: { findOne: () => query(blog), find: () => query(blogs) },
  Page: { findOne: () => query(page) },
});

test('product page: own title, description, canonical, one H1 with the product name, body text', async () => {
  const m = fakeModels({
    product: { _id: 'p1', name: 'Makrana Marble Ganesh Idol', slug: 'makrana-marble-ganesh', description: '<p>Hand carved in Jaipur.</p><p>12 inch, white marble.</p>', image: '/images/g.jpg', seo: {} },
  });
  const page = await pageFor('/products/makrana-marble-ganesh', m);
  const html = renderShell(SHELL, page, 'https://jaipurio.in');
  assert.match(html, /<title>Makrana Marble Ganesh Idol \| Jaipurio<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/jaipurio\.in\/products\/makrana-marble-ganesh" \/>/);
  assert.match(html, /<meta name="description" content="Hand carved in Jaipur\. 12 inch, white marble\." \/>/);
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  assert.match(html, /<div id="root"><main data-ssr="true"><h1>Makrana Marble Ganesh Idol<\/h1><p>Hand carved in Jaipur\.<\/p><p>12 inch, white marble\.<\/p>/);
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.equal((html.match(/<title>/g) || []).length, 1, 'one title only');
});

test('admin SEO title and description win, like ProductDetail.jsx', async () => {
  const m = fakeModels({ product: { _id: 'p1', name: 'Idol', slug: 'idol', description: 'x', seo: { general: { metaTitle: 'Marble Ganesh Idol for Home Temple', metaDescription: 'Owner text.' } } } });
  const html = renderShell(SHELL, await pageFor('/products/idol', m), 'https://jaipurio.in');
  assert.match(html, /<title>Marble Ganesh Idol for Home Temple \| Jaipurio<\/title>/);
  assert.match(html, /content="Owner text\."/);
});

test('stored text is escaped: no tag or script from the database reaches the page', async () => {
  const m = fakeModels({ product: { _id: 'p1', name: '<img src=x onerror=alert(1)>', slug: 'x', description: '"><script>alert(1)</script>', seo: {} } });
  const html = renderShell(SHELL, await pageFor('/products/x', m), 'https://jaipurio.in');
  assert.ok(!/<img src=x/.test(html));
  assert.ok(!/<script>alert/.test(html));
});

test('JSON-LD cannot close its script tag early', async () => {
  const m = fakeModels({ blog: { title: 'A </script><script>alert(1)</script>', slug: 'a', content: '<p>Text</p>' } });
  const html = renderShell(SHELL, await pageFor('/blog/a', m), 'https://jaipurio.in');
  assert.ok(!html.includes('</script><script>alert(1)'));
});

test('unknown product, unpublished blog and app screens leave the shell untouched', async () => {
  const m = fakeModels();
  assert.equal(await pageFor('/products/nope', m), null);
  assert.equal(await pageFor('/blog/nope', m), null);
  for (const p of ['/checkout', '/login', '/profile', '/orders', '/admin', '/vendor/dashboard']) assert.equal(await pageFor(p, m), null, p);
  assert.equal(renderShell(SHELL, null, 'https://jaipurio.in'), SHELL);
});

test('category page lists its live products as links', async () => {
  const m = fakeModels({
    category: { _id: 'c1', title: 'Terracotta Planters', slug: 'terracotta-planters', description: '' },
    products: [{ name: 'Round Planter', slug: 'round-planter' }, { name: 'Bad slug', slug: 'has space' }],
  });
  const html = renderShell(SHELL, await pageFor('/product-categories/terracotta-planters', m), 'https://jaipurio.in');
  assert.match(html, /<title>Buy Handcrafted Terracotta Planters Online \| Jaipurio<\/title>/);
  assert.match(html, /<h1>Terracotta Planters Collection<\/h1>/);
  assert.match(html, /<a href="\/products\/round-planter">Round Planter<\/a>/);
  assert.ok(!html.includes('has space'));
});

test('CMS page: /about reads the about-us page, canonical is the address asked for', async () => {
  let asked = null;
  const m = fakeModels();
  m.Page.findOne = (q) => {
    asked = q.slug;
    return query({ name: 'About Jaipurio', slug: 'about-us', content: '<p>We work with potters in Jaipur.</p>' });
  };
  const html = renderShell(SHELL, await pageFor('/about', m), 'https://jaipurio.in');
  assert.equal(asked, 'about-us');
  assert.match(html, /<link rel="canonical" href="https:\/\/jaipurio\.in\/about" \/>/);
  assert.match(html, /<h1>About Jaipurio<\/h1><p>We work with potters in Jaipur\.<\/p>/);
});

test('home page has the Organization schema and category links', async () => {
  const m = fakeModels({ categories: [{ _id: 'c1', title: 'Marble Idols', slug: 'marble-idols' }] });
  const html = renderShell(SHELL, await pageFor('/home', m), 'https://jaipurio.in');
  assert.match(html, /"@type":"Organization"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/jaipurio\.in\/home" \/>/);
  assert.match(html, /<a href="\/product-categories\/marble-idols">Marble Idols<\/a>/);
});

test('paragraphs keep block breaks and stop at the size limit', () => {
  assert.deepEqual(paragraphs('<h2>One</h2><p>Two &amp; three</p><ul><li>Four</li></ul>'), ['One', 'Two & three', 'Four']);
  assert.deepEqual(paragraphs('<p>aaaa</p><p>bbbb</p>', 5), ['aaaa']);
});

test('missing records are real 404s; app screens and fixed pages are not', () => {
  const { isRecordPath } = require('../routes/seoShellRoutes');
  for (const p of ['/products/not-a-product', '/product/abc', '/product-categories/old-cat', '/cate-365-375', '/some-old-page/']) {
    assert.equal(isRecordPath(p), true, p);
  }
  for (const p of ['/', '/home', '/shop', '/cart', '/checkout', '/profile', '/about', '/privacy-policy', '/return-policy', '/blog/x', '/shop/dubai', '/vendor/dashboard', '/product-categories']) {
    assert.equal(isRecordPath(p), false, p);
  }
});
