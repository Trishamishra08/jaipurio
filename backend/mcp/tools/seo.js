/** SEO suite: page/site audits, Search Console, Bing, PageSpeed/CrUX, IndexNow, keyword map, links. */
const crypto = require('crypto');
const { COLLECTIONS } = require('../collections');
const { ToolError } = require('../errors');
const { auditHtml, strip } = require('../htmlAudit');
const { gsc, gscQuery, gscProperty, googleToken, pagespeed, crux, bing } = require('../google');
const { storeGet, storeSet, credentialGet, credentialSet } = require('../store');
const { SITE_URL, isIndexableRequest } = require('../../utils/siteHost');

const S = (props, required = []) => ({ type: 'object', properties: props, required, additionalProperties: false });
const UA = 'JaipurioSEO/1.0 (+connector audit)';

/** Turn a path or URL into an absolute URL on this site (staging or live, whichever Claude is on). */
const siteUrl = (ctx, pathOrUrl) => {
  const base = ctx.base;
  const s = String(pathOrUrl || '/').trim();
  if (/^https?:\/\//i.test(s)) {
    const u = new URL(s);
    const allowed = [new URL(base).host, new URL(SITE_URL).host, `www.${new URL(SITE_URL).host}`];
    if (!allowed.includes(u.host)) throw new ToolError(`Only this site can be audited (${allowed.join(', ')}).`);
    return u.toString();
  }
  return new URL(s.startsWith('/') ? s : `/${s}`, base).toString();
};

const fetchPage = async (url) => {
  const res = await fetch(url, {
    redirect: 'manual',
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    signal: AbortSignal.timeout(20_000),
  });
  const headers = Object.fromEntries(res.headers.entries());
  const html = res.status >= 300 && res.status < 400 ? '' : await res.text();
  return { status: res.status, headers, html, location: headers.location || null };
};

const fetchText = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20_000) });
  return { status: res.status, text: await res.text(), type: res.headers.get('content-type') };
};

const sitemapUrls = async (ctx, max = 5000) => {
  const root = siteUrl(ctx, '/sitemap.xml');
  const seen = new Set();
  const urls = [];
  const queue = [root];
  while (queue.length && urls.length < max && seen.size < 30) {
    const u = queue.shift();
    if (seen.has(u)) continue;
    seen.add(u);
    const { status, text } = await fetchText(u);
    if (status !== 200) continue;
    const locs = [...text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, '&'));
    if (/<sitemapindex/i.test(text)) queue.push(...locs.map((l) => siteUrl(ctx, new URL(l).pathname)));
    else urls.push(...locs);
  }
  return { files: [...seen], urls: urls.slice(0, max) };
};

const tokens = (s) =>
  strip(s)
    .toLowerCase()
    .replace(/[^a-z0-9ऀ-ॿ\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
const STOP = new Set('the and for with from your you our are this that buy online best shop jaipur jaipurio india'.split(' '));

const KEYMAP = 'keyword_map';
const loadMap = async () => (await storeGet(KEYMAP, [])) || [];

const tools = [
  {
    name: 'seo_audit_page',
    ability: 'read',
    description: 'Fetch one page of this site as Google first sees it (server HTML) and report title, meta, robots, canonical, H1/H2, words, images without alt, links, JSON-LD and issues.',
    inputSchema: S({ path: { type: 'string', description: 'Path like /products/blue-pottery-vase or a full URL on this site.' } }, ['path']),
    run: async ({ path }, ctx) => {
      const url = siteUrl(ctx, path);
      const r = await fetchPage(url);
      if (r.location) return { url, status: r.status, redirectsTo: r.location };
      return auditHtml(r.html, url, r);
    },
  },
  {
    name: 'seo_audit_site',
    ability: 'read',
    description: 'Audit up to 60 URLs from the sitemap (or the paths you give) and summarise issues by type, worst pages first.',
    inputSchema: S({
      paths: { type: 'array', items: { type: 'string' }, maxItems: 60 },
      limit: { type: 'integer', minimum: 1, maximum: 60, default: 25 },
      section: { type: 'string', description: 'Only sitemap URLs containing this text, e.g. /blog/ or /products/.' },
    }),
    run: async ({ paths, limit = 25, section }, ctx) => {
      let list = paths?.length ? paths.map((p) => siteUrl(ctx, p)) : (await sitemapUrls(ctx, 2000)).urls;
      if (!paths?.length) {
        list = list.map((u) => siteUrl(ctx, new URL(u).pathname));
        if (section) list = list.filter((u) => u.includes(section));
      }
      list = list.slice(0, Math.min(limit, 60));
      const pages = [];
      for (let i = 0; i < list.length; i += 6) {
        const chunk = await Promise.all(
          list.slice(i, i + 6).map(async (u) => {
            try {
              const r = await fetchPage(u);
              if (r.location) return { url: u, status: r.status, issues: [{ severity: 'medium', code: 'redirect_in_sitemap', msg: `Redirects to ${r.location}` }] };
              return auditHtml(r.html, u, r);
            } catch (e) {
              return { url: u, status: 0, issues: [{ severity: 'high', code: 'fetch_failed', msg: e.message }] };
            }
          })
        );
        pages.push(...chunk);
      }
      const byCode = {};
      for (const p of pages) {
        for (const is of p.issues) {
          const row = (byCode[is.code] ||= { severity: is.severity, count: 0, pages: [] });
          row.count++;
          row.pages.push(new URL(p.url).pathname);
        }
      }
      const weight = { high: 5, medium: 2, low: 1, info: 0 };
      const worst = pages
        .map((p) => ({ path: new URL(p.url).pathname, status: p.status, score: p.issues.reduce((s, i) => s + weight[i.severity], 0), issues: p.issues.map((i) => i.code) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 15);
      for (const v of Object.values(byCode)) v.pages = v.pages.slice(0, 10);
      return { audited: pages.length, staging: !isIndexableRequest(ctx.req), issues: byCode, worstPages: worst };
    },
  },
  {
    name: 'seo_sitemap',
    ability: 'read',
    description: 'Read the XML sitemap(s): files, URL count per section and a sample.',
    inputSchema: S({}),
    run: async (_a, ctx) => {
      const { files, urls } = await sitemapUrls(ctx);
      const sections = {};
      for (const u of urls) {
        const seg = `/${new URL(u).pathname.split('/')[1] || ''}`;
        sections[seg] = (sections[seg] || 0) + 1;
      }
      return { files, total: urls.length, sections, sample: urls.slice(0, 15) };
    },
  },
  {
    name: 'seo_robots_get',
    ability: 'read',
    description: 'Show robots.txt and llms.txt exactly as this host serves them.',
    inputSchema: S({}),
    run: async (_a, ctx) => {
      const [robots, llms] = await Promise.all([fetchText(siteUrl(ctx, '/robots.txt')), fetchText(siteUrl(ctx, '/llms.txt'))]);
      return { host: ctx.base, robots: { status: robots.status, text: robots.text.slice(0, 5000) }, llms: { status: llms.status, text: llms.text.slice(0, 8000) } };
    },
  },
  {
    name: 'seo_meta_issues',
    ability: 'read',
    description: 'Scan the database for live records with missing, short, long or duplicate meta titles/descriptions.',
    inputSchema: S({ collection: { type: 'string', enum: ['product', 'category', 'blog', 'page', 'city_page'] }, limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 } }),
    run: async ({ collection, limit = 50 }) => {
      const names = collection ? [collection] : ['product', 'category', 'blog', 'page', 'city_page'];
      const out = [];
      const titles = new Map();
      for (const n of names) {
        const c = COLLECTIONS[n];
        const docs = await c.model().find(c.query || {}).select(`${c.title} slug seo seoTitle seoDescription status lifecycle published isActive`).lean();
        for (const d of docs) {
          if (!c.live(d)) continue;
          const t = d.seo?.general?.metaTitle || d.seoTitle || '';
          const ds = d.seo?.general?.metaDescription || d.seoDescription || '';
          const problems = [];
          if (!t) problems.push('no meta title');
          else if (t.length > 60) problems.push(`title ${t.length} chars`);
          if (!ds) problems.push('no meta description');
          else if (ds.length > 160 || ds.length < 70) problems.push(`description ${ds.length} chars`);
          if (t) {
            const k = t.toLowerCase();
            titles.set(k, [...(titles.get(k) || []), `${n}:${d.slug}`]);
          }
          if (problems.length) out.push({ collection: n, id: String(d._id), slug: d.slug, title: d[c.title], problems });
        }
      }
      const duplicates = [...titles.entries()].filter(([, v]) => v.length > 1).map(([title, where]) => ({ title, where }));
      return { total: out.length, items: out.slice(0, limit), duplicateTitles: duplicates.slice(0, 30) };
    },
  },
  {
    name: 'seo_pagespeed',
    ability: 'read',
    description: 'PageSpeed Insights (Lighthouse) scores, lab Core Web Vitals and top fixes for one URL. Free API.',
    inputSchema: S({ path: { type: 'string' }, strategy: { type: 'string', enum: ['mobile', 'desktop'], default: 'mobile' } }, ['path']),
    run: async ({ path, strategy }, ctx) => pagespeed(siteUrl(ctx, path), strategy),
  },
  {
    name: 'seo_crux',
    ability: 'read',
    description: 'Real-user Core Web Vitals (Chrome UX Report, p75) for a URL or the whole origin.',
    inputSchema: S({ path: { type: 'string', description: 'Leave empty for the whole origin.' }, formFactor: { type: 'string', enum: ['PHONE', 'DESKTOP'], default: 'PHONE' } }),
    run: async ({ path, formFactor }) => (path ? crux({ url: new URL(path, SITE_URL).toString(), formFactor }) : crux({ origin: SITE_URL, formFactor })),
  },
  {
    name: 'seo_gsc_status',
    ability: 'read',
    description: 'Is Search Console connected? Shows the property, our permission level and submitted sitemaps.',
    inputSchema: S({}),
    run: async () => {
      const prop = await gscProperty();
      const sites = await gsc('/sites');
      const mine = (sites.siteEntry || []).find((s) => s.siteUrl === prop);
      const maps = mine ? await gsc(`/sites/${encodeURIComponent(prop)}/sitemaps`) : { sitemap: [] };
      return {
        property: prop,
        access: mine?.permissionLevel || 'not added: add the service account email as a user in Search Console',
        otherProperties: (sites.siteEntry || []).map((s) => s.siteUrl),
        sitemaps: (maps.sitemap || []).map((s) => ({ path: s.path, lastSubmitted: s.lastSubmitted, lastDownloaded: s.lastDownloaded, errors: s.errors, warnings: s.warnings })),
      };
    },
  },
  {
    name: 'seo_gsc_performance',
    ability: 'read',
    description: 'Search Console clicks, impressions, CTR and position by query, page, country, device or date.',
    inputSchema: S({
      dimension: { type: 'string', enum: ['query', 'page', 'country', 'device', 'date'], default: 'query' },
      days: { type: 'integer', minimum: 1, maximum: 480, default: 28 },
      limit: { type: 'integer', minimum: 1, maximum: 1000, default: 50 },
      page: { type: 'string', description: 'Only this page (path or URL).' },
      query: { type: 'string', description: 'Only queries containing this text.' },
    }),
    run: async ({ dimension = 'query', days = 28, limit = 50, page, query }) => {
      const filters = [];
      if (page) filters.push({ dimension: 'page', operator: 'equals', expression: new URL(page, SITE_URL).toString() });
      if (query) filters.push({ dimension: 'query', operator: 'contains', expression: query });
      const r = await gscQuery({ dimensions: [dimension], days, rowLimit: limit, filters });
      const totals = r.rows.reduce((t, x) => ({ clicks: t.clicks + x.clicks, impressions: t.impressions + x.impressions }), { clicks: 0, impressions: 0 });
      return { ...r, totals, rows: r.rows.map(({ keys, ...x }) => ({ [dimension]: keys[0], ...x })) };
    },
  },
  {
    name: 'seo_gsc_opportunities',
    ability: 'read',
    description: 'Striking-distance queries (position 4-20, real impressions) and low-CTR top-3 queries, with the page that ranks.',
    inputSchema: S({ days: { type: 'integer', minimum: 7, maximum: 90, default: 28 }, minImpressions: { type: 'integer', default: 20 } }),
    run: async ({ days = 28, minImpressions = 20 }) => {
      const r = await gscQuery({ dimensions: ['query', 'page'], days, rowLimit: 5000 });
      const rows = r.rows.map((x) => ({ query: x.keys[0], page: new URL(x.keys[1]).pathname, clicks: x.clicks, impressions: x.impressions, ctr: x.ctr, position: x.position }));
      const striking = rows.filter((x) => x.position >= 4 && x.position <= 20 && x.impressions >= minImpressions).sort((a, b) => b.impressions - a.impressions).slice(0, 40);
      const lowCtr = rows.filter((x) => x.position < 3.5 && x.impressions >= minImpressions && x.ctr < 5).sort((a, b) => b.impressions - a.impressions).slice(0, 20);
      return { property: r.property, startDate: r.startDate, endDate: r.endDate, striking, lowCtr };
    },
  },
  {
    name: 'seo_cannibalization',
    ability: 'read',
    description: 'Queries where two or more of our pages get impressions, with each page’s share. Pick one winner per query.',
    inputSchema: S({ days: { type: 'integer', minimum: 7, maximum: 90, default: 28 }, minImpressions: { type: 'integer', default: 10 } }),
    run: async ({ days = 28, minImpressions = 10 }) => {
      const r = await gscQuery({ dimensions: ['query', 'page'], days, rowLimit: 10000 });
      const byQ = new Map();
      for (const x of r.rows) {
        if (x.impressions < 2) continue;
        byQ.set(x.keys[0], [...(byQ.get(x.keys[0]) || []), { page: new URL(x.keys[1]).pathname, impressions: x.impressions, clicks: x.clicks, position: x.position }]);
      }
      const out = [];
      for (const [q, pages] of byQ) {
        const total = pages.reduce((s, p) => s + p.impressions, 0);
        if (pages.length < 2 || total < minImpressions) continue;
        pages.sort((a, b) => b.clicks - a.clicks || a.position - b.position);
        const second = pages[1].impressions / total;
        if (second < 0.15) continue;
        out.push({ query: q, impressions: total, likelyWinner: pages[0].page, pages: pages.slice(0, 5).map((p) => ({ ...p, share: Math.round((p.impressions / total) * 100) })) });
      }
      return { property: r.property, startDate: r.startDate, endDate: r.endDate, count: out.length, items: out.sort((a, b) => b.impressions - a.impressions).slice(0, 40) };
    },
  },
  {
    name: 'seo_content_gaps',
    ability: 'read',
    description: 'Queries people search where we show up badly (position over 20) or where no page title covers the words: candidates for new or expanded content.',
    inputSchema: S({ days: { type: 'integer', minimum: 7, maximum: 90, default: 28 }, minImpressions: { type: 'integer', default: 10 } }),
    run: async ({ days = 28, minImpressions = 10 }) => {
      const r = await gscQuery({ dimensions: ['query'], days, rowLimit: 5000 });
      const titles = [];
      for (const n of ['product', 'category', 'blog', 'page', 'city_page']) {
        const c = COLLECTIONS[n];
        const docs = await c.model().find(c.query || {}).select(`${c.title} slug status lifecycle published isActive`).lean();
        for (const d of docs) if (c.live(d)) titles.push(new Set(tokens(`${d[c.title]} ${d.slug || ''}`)));
      }
      const covered = (q) => {
        const t = tokens(q);
        return t.length && titles.some((set) => t.filter((w) => set.has(w)).length >= Math.ceil(t.length * 0.7));
      };
      const gaps = r.rows
        .filter((x) => x.impressions >= minImpressions && (x.position > 20 || !covered(x.keys[0])))
        .map((x) => ({ query: x.keys[0], impressions: x.impressions, clicks: x.clicks, position: x.position, titleCovers: covered(x.keys[0]) }))
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 50);
      return { property: r.property, startDate: r.startDate, endDate: r.endDate, gaps };
    },
  },
  {
    name: 'seo_gsc_inspect',
    ability: 'read',
    description: 'URL Inspection: is this live URL indexed, which canonical Google chose, last crawl, mobile usability.',
    inputSchema: S({ path: { type: 'string' } }, ['path']),
    run: async ({ path }) => {
      const prop = await gscProperty();
      const url = new URL(path, SITE_URL).toString();
      const token = await googleToken('https://www.googleapis.com/auth/webmasters');
      const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionUrl: url, siteUrl: prop }),
        signal: AbortSignal.timeout(30_000),
      });
      const body = await res.json();
      if (!res.ok) throw new ToolError(`URL Inspection answered ${res.status}: ${body?.error?.message || ''}`);
      const i = body.inspectionResult?.indexStatusResult || {};
      return {
        url,
        verdict: i.verdict,
        coverage: i.coverageState,
        indexing: i.indexingState,
        robotsTxt: i.robotsTxtState,
        pageFetch: i.pageFetchState,
        lastCrawl: i.lastCrawlTime,
        googleCanonical: i.googleCanonical,
        userCanonical: i.userCanonical,
        referringUrls: (i.referringUrls || []).slice(0, 5),
        sitemaps: i.sitemap || [],
      };
    },
  },
  {
    name: 'seo_gsc_submit_sitemap',
    ability: 'write',
    description: 'Submit the live sitemap (https://jaipurio.in/sitemap.xml by default) to Search Console. Refused on staging URLs.',
    inputSchema: S({ sitemapUrl: { type: 'string' } }),
    run: async ({ sitemapUrl }) => {
      const prop = await gscProperty();
      const sm = sitemapUrl || `${SITE_URL}/sitemap.xml`;
      if (new URL(sm).host.replace(/^www\./, '') !== new URL(SITE_URL).host.replace(/^www\./, '')) {
        throw new ToolError('Only the production sitemap can be submitted.');
      }
      await gsc(`/sites/${encodeURIComponent(prop)}/sitemaps/${encodeURIComponent(sm)}`, null, 'PUT');
      return { submitted: sm, property: prop };
    },
  },
  {
    name: 'seo_bing_status',
    ability: 'read',
    description: 'Bing Webmaster: is the site verified for our key, and crawl stats.',
    inputSchema: S({}),
    run: async () => {
      const sites = await bing('GetUserSites');
      const mine = (sites || []).find((s) => /jaipurio\.in/.test(s.Url));
      let crawl = null;
      if (mine) crawl = (await bing('GetCrawlStats', mine.Url)).slice?.(-7) || null;
      return { site: mine || null, otherSites: (sites || []).map((s) => s.Url), crawlLast7: crawl };
    },
  },
  {
    name: 'seo_bing_performance',
    ability: 'read',
    description: 'Bing top queries (clicks, impressions, average position) for the site.',
    inputSchema: S({ limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 } }),
    run: async ({ limit = 50 }) => {
      const rows = await bing('GetQueryStats', `${SITE_URL}/`);
      const agg = new Map();
      for (const r of rows || []) {
        const a = agg.get(r.Query) || { query: r.Query, clicks: 0, impressions: 0, posSum: 0, n: 0 };
        a.clicks += r.Clicks;
        a.impressions += r.Impressions;
        a.posSum += r.AvgImpressionPosition;
        a.n++;
        agg.set(r.Query, a);
      }
      return {
        rows: [...agg.values()]
          .map(({ posSum, n, ...a }) => ({ ...a, position: Math.round((posSum / n) * 10) / 10 }))
          .sort((a, b) => b.impressions - a.impressions)
          .slice(0, limit),
      };
    },
  },
  {
    name: 'seo_indexnow_submit',
    ability: 'write',
    description: 'Tell Bing/Yandex (IndexNow) that live jaipurio.in URLs changed. Only works on the production site, max 100 URLs.',
    inputSchema: S({ paths: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 100 } }, ['paths']),
    run: async ({ paths }, ctx) => {
      if (!isIndexableRequest(ctx.req)) throw new ToolError('This is staging (noindex). IndexNow is only sent from the live site.');
      let key = await credentialGet('indexnow_key');
      if (!key) {
        key = crypto.randomBytes(16).toString('hex');
        await credentialSet('indexnow_key', key, ctx.user.email);
      }
      const host = new URL(SITE_URL).host;
      const urlList = paths.map((p) => new URL(p, SITE_URL).toString()).filter((u) => new URL(u).host === host);
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ host, key, keyLocation: `${SITE_URL}/api/indexnow/${key}.txt`, urlList }),
        signal: AbortSignal.timeout(20_000),
      });
      return { status: res.status, accepted: res.status === 200 || res.status === 202, urls: urlList.length };
    },
  },
  {
    name: 'seo_keyword_map_list',
    ability: 'read',
    description: 'The keyword map: each target keyword, its cluster and the one page assigned to rank for it.',
    inputSchema: S({ cluster: { type: 'string' } }),
    run: async ({ cluster }) => {
      const map = await loadMap();
      const rows = cluster ? map.filter((k) => k.cluster === cluster) : map;
      const clusters = [...new Set(map.map((k) => k.cluster).filter(Boolean))];
      const pageCount = {};
      for (const k of map) if (k.page) pageCount[k.page] = (pageCount[k.page] || 0) + 1;
      return { total: map.length, clusters, keywords: rows, pagesWithManyKeywords: Object.entries(pageCount).filter(([, n]) => n > 3).map(([page, n]) => ({ page, n })) };
    },
  },
  {
    name: 'seo_keyword_map_add',
    ability: 'write',
    description: 'Add keywords (from Search Console or the owner) to the keyword map. Duplicates are skipped.',
    inputSchema: S(
      {
        keywords: {
          type: 'array',
          maxItems: 200,
          items: S({ keyword: { type: 'string' }, cluster: { type: 'string' }, page: { type: 'string' }, intent: { type: 'string', enum: ['buy', 'learn', 'local', 'brand', 'gift'] }, source: { type: 'string' } }, ['keyword']),
        },
      },
      ['keywords']
    ),
    run: async ({ keywords }) => {
      const map = await loadMap();
      const have = new Set(map.map((k) => k.keyword.toLowerCase()));
      let added = 0;
      for (const k of keywords || []) {
        const kw = String(k.keyword || '').trim();
        if (!kw || have.has(kw.toLowerCase())) continue;
        have.add(kw.toLowerCase());
        map.push({ keyword: kw, cluster: k.cluster || null, page: k.page ? new URL(k.page, SITE_URL).pathname : null, intent: k.intent || null, source: k.source || 'claude', addedAt: new Date().toISOString() });
        added++;
      }
      await storeSet(KEYMAP, map);
      return { added, total: map.length };
    },
  },
  {
    name: 'seo_keyword_map_assign',
    ability: 'write',
    description: 'Assign a keyword to the one page that should rank for it (and optionally change its cluster).',
    inputSchema: S({ keyword: { type: 'string' }, page: { type: 'string' }, cluster: { type: 'string' } }, ['keyword']),
    run: async ({ keyword, page, cluster }) => {
      const map = await loadMap();
      const k = map.find((x) => x.keyword.toLowerCase() === String(keyword).toLowerCase());
      if (!k) throw new ToolError('Keyword not in the map. Add it first.');
      if (page !== undefined) k.page = page ? new URL(page, SITE_URL).pathname : null;
      if (cluster !== undefined) k.cluster = cluster || null;
      await storeSet(KEYMAP, map);
      return { keyword: k };
    },
  },
  {
    name: 'seo_keyword_map_remove',
    ability: 'write',
    description: 'Remove keywords from the keyword map.',
    inputSchema: S({ keywords: { type: 'array', items: { type: 'string' }, maxItems: 200 } }, ['keywords']),
    run: async ({ keywords }) => {
      const drop = new Set((keywords || []).map((k) => k.toLowerCase()));
      const map = await loadMap();
      const left = map.filter((k) => !drop.has(k.keyword.toLowerCase()));
      await storeSet(KEYMAP, left);
      return { removed: map.length - left.length, total: left.length };
    },
  },
  {
    name: 'seo_internal_links_suggest',
    ability: 'read',
    description: 'For one blog/page/city page, suggest live products, categories and blogs it should link to (shared topic words), skipping links it already has.',
    inputSchema: S({ collection: { type: 'string', enum: ['blog', 'page', 'city_page'] }, id: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 30, default: 10 } }, ['collection', 'id']),
    run: async ({ collection, id, limit = 10 }) => {
      const c = COLLECTIONS[collection];
      const doc = await c.model().findById(id).lean();
      if (!doc) throw new ToolError('Record not found.');
      const body = [doc.content, doc.mainContent, doc.description, doc.excerpt].filter(Boolean).join(' ');
      const words = new Map();
      for (const w of tokens(`${doc[c.title]} ${body}`)) words.set(w, (words.get(w) || 0) + 1);
      const already = new Set([...String(body).matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((m) => {
        try {
          return new URL(m[1], SITE_URL).pathname;
        } catch {
          return m[1];
        }
      }));
      const selfPath = c.path(doc);
      const cands = [];
      for (const n of ['category', 'product', 'blog', 'city_page']) {
        const cc = COLLECTIONS[n];
        const docs = await cc.model().find(cc.query || {}).select(`${cc.title} slug status lifecycle published isActive`).lean();
        for (const d of docs) {
          if (!cc.live(d) || !d.slug) continue;
          const path = cc.path(d);
          if (path === selfPath || already.has(path)) continue;
          const t = tokens(`${d[cc.title]} ${d.slug}`);
          const score = t.reduce((s, w) => s + (words.get(w) || 0), 0) / Math.max(t.length, 1);
          if (score >= 1) cands.push({ type: n, path, anchor: d[cc.title], score: Math.round(score * 10) / 10 });
        }
      }
      return { page: selfPath, existingLinks: already.size, suggestions: cands.sort((a, b) => b.score - a.score).slice(0, limit) };
    },
  },
  {
    name: 'seo_intel_log',
    ability: 'write',
    description: 'Log a skill or tool use for Jaipurio (site 7) in the SEO Intelligence app so its Internal skills/tools tabs show the latest use.',
    inputSchema: S({ kind: { type: 'string', enum: ['skill', 'tool'] }, name: { type: 'string' }, note: { type: 'string' } }, ['kind', 'name']),
    run: async ({ kind, name, note }) => {
      const token = await credentialGet('seo_intel_agent_token');
      if (!token) throw new ToolError('Save seo_intel_agent_token first (credential_set).');
      const res = await fetch(`https://seo.sakha.cloud/agent/${encodeURIComponent(token)}/use`, {
        method: 'POST',
        body: new URLSearchParams({ site: '7', kind, name, note: String(note || '').slice(0, 500) }),
        signal: AbortSignal.timeout(15_000),
      });
      return { status: res.status, logged: res.ok };
    },
  },
];

module.exports = { tools, siteUrl, tokens };
