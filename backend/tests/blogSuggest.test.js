const test = require('node:test');
const assert = require('node:assert/strict');
const { suggestBlogSlug } = require('../utils/blogSuggest');

const blogs = [
  { slug: 'authentic-bagru-print-sarees-handcrafted-block-printed-elegance-with-natural-dyes-heritage-drapes', title: 'Authentic Bagru Print Sarees' },
  { slug: 'jaipur-blue-pottery', title: 'Jaipur Blue Pottery' },
  { slug: 'marble-murti-for-home', title: 'Marble Murti for Home' },
  { slug: 'stunning-ethnic-wall-decor-from-jaipur-jaipurio-usa', title: 'Stunning Ethnic Wall Decor' },
  { slug: 'stunning-ethnic-wall-decor-from-jaipur-jaipurio-canada', title: 'Stunning Ethnic Wall Decor' },
];

test('redirects an old slug that clearly names an existing article', () => {
  assert.equal(suggestBlogSlug('blue-pottery-jaipur-handmade', blogs), 'jaipur-blue-pottery');
  assert.equal(suggestBlogSlug('marble-murtis-home', blogs), 'marble-murti-for-home');
});

test('keeps the 404 when nothing matches well enough', () => {
  assert.equal(suggestBlogSlug('handmade-wall-pieces', blogs), null);
  assert.equal(suggestBlogSlug('ethnic-material', blogs), null);
});

test('one-word slugs never redirect', () => {
  assert.equal(suggestBlogSlug('pottery', blogs), null);
});

test('a tie is not guessed', () => {
  assert.equal(suggestBlogSlug('ethnic-wall-decor', blogs), null);
});

test('never suggests the missing slug itself or handles empty input', () => {
  assert.equal(suggestBlogSlug('jaipur-blue-pottery', blogs), null);
  assert.equal(suggestBlogSlug('', blogs), null);
  assert.equal(suggestBlogSlug('blue-pottery', []), null);
});
