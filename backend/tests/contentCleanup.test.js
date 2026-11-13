const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanProductHtml, splitProductName, dedupePromoLinks } = require('../utils/contentCleanup');

test('placeholders and SEO notes are removed from product HTML', () => {
  const out = cleanProductHtml(
    '<h1>Blue Seep Kangan</h1><p>Set of [specify number] bangles</p><p>Meta Title (45 characters): Blue Kangan</p><ul><li>Size: [Specify size options]</li></ul>'
  );
  assert.ok(!/\[/.test(out));
  assert.ok(!/Meta Title/i.test(out));
  assert.ok(!/<h1/i.test(out) && /<h2>Blue Seep Kangan<\/h2>/.test(out));
  assert.match(out, /Set of bangles/);
});

test('pipe-stuffed name keeps the first segment and preserves the original as seoTitle', () => {
  const raw = 'Gautama Buddha Statue: Serene Marble Sculpture | Handcrafted Zen Decor | Christmas Gift | Buy Authentic Indian Buddhist Art';
  const { name, seoTitle } = splitProductName(raw);
  assert.equal(name, 'Gautama Buddha Statue: Serene Marble Sculpture');
  assert.equal(seoTitle, raw);
});

test('a clean name is unchanged and gets no seoTitle', () => {
  assert.deepEqual(splitProductName('Green Seep Bangles'), { name: 'Green Seep Bangles', seoTitle: '' });
});

test('"Meta Title (45 characters)" note is cut from a name', () => {
  const { name } = splitProductName('Green Seep Bangles Jewelry Meta Title (45 characters): Green Seep Bangles');
  assert.equal(name, 'Green Seep Bangles Jewelry');
});

const govindam = '<a class="underline" href="https://www.govindam.co.in/"><strong>Govindam Sweets</strong></a>';
const taxi = '<a class="underline" href="https://traveltaxi.in/"><strong>Travel Taxi</strong></a>';
const own = '<a href="https://jaipurio.in/product-categories/sarees"><strong>lehariya saree</strong></a>';

test('first promo mention is kept, later reworded ones are dropped, own links survive', () => {
  const html =
    `<p>Our ${own} range is wide. After shopping, try ${govindam} for sweets. Need a ride? Use ${taxi} to get around.</p>` +
    `<p>Styling tips matter. Complete your visit with treats from ${govindam} offering authentic flavors.</p>` +
    `<p>${taxi} again for transport.</p>` +
    `<p>Wear it with ${own} jewellery.</p>`;
  const out = dedupePromoLinks(html, ['govindam.co.in', 'traveltaxi.in']);
  assert.equal((out.match(/govindam\.co\.in/g) || []).length, 1);
  assert.equal((out.match(/traveltaxi\.in/g) || []).length, 1);
  assert.equal((out.match(/jaipurio\.in/g) || []).length, 2);
  assert.match(out, /Styling tips matter\./); // the non-promo sentence of that paragraph stays
  assert.ok(!/<p[^>]*>\s*<\/p>/.test(out)); // no empty paragraph left behind
});

test('a post with a single promo is untouched', () => {
  const html = `<p>Buy now. Then visit ${govindam} for sweets.</p>`;
  assert.equal(dedupePromoLinks(html, ['govindam.co.in']), html);
});
