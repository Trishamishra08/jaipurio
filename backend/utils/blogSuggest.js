/**
 * Finds the live blog article closest to a slug that no longer exists, so an old
 * /blog/<old-slug> URL can 301 to a relevant article instead of dead-ending.
 *
 * Deliberately strict: a wrong redirect is worse than a 404 (Google treats an
 * irrelevant redirect as a soft 404). A match needs
 *   - at least 2 meaningful words from the missing slug, and
 *   - at least 60% of the missing slug's words found in the article's slug or title, and
 *   - one clear winner (a tie means "no answer").
 * Anything else returns null and the caller keeps the real 404.
 */

const STOP = new Set([
  'the', 'and', 'for', 'with', 'from', 'your', 'you', 'our', 'are', 'how', 'why', 'what',
  'best', 'buy', 'shop', 'online', 'new', 'top', 'all', 'jaipurio', 'jaipur', 'india', 'indian',
]);

const words = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/&amp;/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    // very light stemming so "sarees"/"saree" and "murtis"/"murti" match
    .map((w) => (w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w));

const MIN_WORDS = 2;
const MIN_COVERAGE = 0.6;

/**
 * @param {string} missingSlug  the slug that was not found
 * @param {{slug:string, title?:string, name?:string}[]} blogs  published articles
 * @returns {string|null} slug of the best match, or null
 */
const suggestBlogSlug = (missingSlug, blogs, { minCoverage = MIN_COVERAGE } = {}) => {
  const q = [...new Set(words(missingSlug))];
  if (q.length < MIN_WORDS) return null;

  let best = null;
  let bestScore = 0;
  let tie = false;

  for (const b of blogs || []) {
    if (!b || !b.slug || b.slug === missingSlug) continue;
    const have = new Set([...words(b.slug), ...words(b.title || b.name)]);
    const hits = q.filter((w) => have.has(w)).length;
    if (hits < MIN_WORDS || hits / q.length < minCoverage) continue;
    // prefer articles whose own slug is short and focused over long keyword-stuffed ones
    const score = hits / q.length + hits * 0.01 - words(b.slug).length * 0.001;
    if (score > bestScore + 1e-9) {
      best = b.slug;
      bestScore = score;
      tie = false;
    } else if (Math.abs(score - bestScore) < 1e-9) {
      tie = true;
    }
  }
  return best && !tie ? best : null;
};

module.exports = { suggestBlogSlug, words };
