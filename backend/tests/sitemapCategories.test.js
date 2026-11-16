const test = require('node:test');
const assert = require('node:assert/strict');
const { categoriesForSitemap } = require('../utils/sitemapCategories');

const cats = [
  { _id: 'a1', title: 'Kulhads', slug: 'kulhads' },
  { _id: 'a2', title: 'Matkas', slug: 'matkas' }, // empty: page would only redirect
  { _id: 'a3', title: 'Diyas', slug: 'diyas' }, // products know it by name only
  { _id: 'a4', title: 'Hidden', slug: 'hidden', isActive: false },
  { _id: 'a5', title: 'No slug' },
  { _id: 'a6', title: 'Ecommerce', slug: 'ecommerce' }, // blog category, no products
];

test('only categories with live products are listed', () => {
  const out = categoriesForSitemap(cats, ['a1'], []).map((c) => c.slug);
  assert.deepEqual(out, ['kulhads']);
});

test('a category counts when products reference it by name only (no ids yet)', () => {
  const out = categoriesForSitemap(cats, ['a1'], ['DIYAS']).map((c) => c.slug);
  assert.deepEqual(out.sort(), ['diyas', 'kulhads']);
});

test('inactive and slug-less categories never appear, even with products', () => {
  const out = categoriesForSitemap(cats, ['a1', 'a4', 'a5'], []).map((c) => c._id);
  assert.deepEqual(out, ['a1']);
});

test('ObjectId-like ids compare by string', () => {
  const oid = { toString: () => 'a2' };
  assert.deepEqual(categoriesForSitemap(cats, [oid], []).map((c) => c.slug), ['matkas']);
});
