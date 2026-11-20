/** Read the SEO facts of one rendered HTML page (no browser, plain regex over the HTML). */

const decode = (s) =>
  String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const strip = (html) => decode(String(html || '').replace(/<[^>]+>/g, ' '));

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? decode(m[2] ?? m[3] ?? m[4] ?? '') : null;
};

const metaContent = (html, key, value) => {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if ((attr(tag, key) || '').toLowerCase() === value) return attr(tag, 'content');
  }
  return null;
};

/** Facts + issues for a page. `url` is the final URL (used for internal/external link split). */
const auditHtml = (html, url, { status = 200, headers = {} } = {}) => {
  const host = new URL(url).host;
  const body = String(html || '');
  const noScript = body.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ');
  const title = decode((body.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const description = metaContent(body, 'name', 'description') || '';
  const robots = metaContent(body, 'name', 'robots') || '';
  const xRobots = headers['x-robots-tag'] || '';
  const canonicalTag = (body.match(/<link\b[^>]*rel\s*=\s*["']?canonical["']?[^>]*>/i) || [])[0];
  const canonical = canonicalTag ? attr(canonicalTag, 'href') : null;
  const h1s = [...noScript.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => strip(m[1]));
  const h2s = [...noScript.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => strip(m[1]));
  const imgs = (noScript.match(/<img\b[^>]*>/gi) || []).map((t) => ({ src: attr(t, 'src'), alt: attr(t, 'alt') }));
  const links = (noScript.match(/<a\b[^>]*>/gi) || []).map((t) => attr(t, 'href')).filter(Boolean);
  let internal = 0;
  let external = 0;
  for (const l of links) {
    if (/^(mailto:|tel:|#|javascript:)/i.test(l)) continue;
    try {
      new URL(l, url).host === host ? internal++ : external++;
    } catch {
      /* skip */
    }
  }
  const jsonLd = [];
  for (const m of body.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const j = JSON.parse(m[1]);
      const items = Array.isArray(j) ? j : j['@graph'] || [j];
      for (const it of items) jsonLd.push({ type: it['@type'] || null, valid: true, hasRating: Boolean(it.aggregateRating) });
    } catch (e) {
      jsonLd.push({ type: null, valid: false, error: e.message.slice(0, 120) });
    }
  }
  const text = strip(noScript.replace(/<(header|nav|footer)\b[\s\S]*?<\/\1>/gi, ' '));
  const words = text ? text.split(' ').length : 0;
  const lang = attr((body.match(/<html\b[^>]*>/i) || [''])[0], 'lang');

  const issues = [];
  const add = (severity, code, msg) => issues.push({ severity, code, msg });
  if (status >= 400) add('high', 'status', `HTTP ${status}`);
  if (!title) add('high', 'title_missing', 'No <title>.');
  else if (title.length > 60) add('low', 'title_long', `Title is ${title.length} chars (keep under 60).`);
  else if (title.length < 30) add('low', 'title_short', `Title is ${title.length} chars.`);
  if (!description) add('medium', 'description_missing', 'No meta description.');
  else if (description.length > 160 || description.length < 70) add('low', 'description_length', `Meta description is ${description.length} chars (aim 140-160).`);
  if (h1s.length === 0) add('high', 'h1_missing', 'No H1 in the server HTML.');
  if (h1s.length > 1) add('medium', 'h1_multiple', `${h1s.length} H1 tags.`);
  if (!canonical) add('medium', 'canonical_missing', 'No canonical link.');
  const noindex = /noindex/i.test(robots) || /noindex/i.test(xRobots);
  if (noindex) add('info', 'noindex', 'Page is noindex.');
  const noAlt = imgs.filter((i) => i.alt === null || i.alt === '').length;
  if (noAlt) add('medium', 'img_alt', `${noAlt} of ${imgs.length} images have no alt text.`);
  if (words < 150) add('medium', 'thin', `Only ${words} words of main text in the server HTML.`);
  if (jsonLd.some((j) => !j.valid)) add('high', 'schema_invalid', 'A JSON-LD block does not parse.');
  if (!lang) add('low', 'lang_missing', '<html> has no lang.');

  return {
    url,
    status,
    title,
    titleLength: title.length,
    description,
    descriptionLength: description.length,
    robots: robots || null,
    xRobotsTag: xRobots || null,
    noindex,
    canonical,
    h1: h1s,
    h2: h2s.slice(0, 20),
    words,
    images: imgs.length,
    imagesWithoutAlt: noAlt,
    internalLinks: internal,
    externalLinks: external,
    schema: jsonLd,
    lang,
    issues,
  };
};

module.exports = { auditHtml, decode, strip };
