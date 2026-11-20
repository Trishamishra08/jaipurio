/** Read and content-edit tools over the Jaipurio admin collections. */
const mongoose = require('mongoose');
const { COLLECTIONS, NEVER_WRITE } = require('../collections');
const { ToolError } = require('../errors');
const { McpAudit, credentialSet, credentialRemove, credentialStatus } = require('../store');
const { SITE_URL, isIndexableRequest } = require('../../utils/siteHost');

const CREDENTIAL_NAMES = [
  'gsc_service_account_json',
  'gsc_property',
  'bing_webmaster_api_key',
  'pagespeed_api_key',
  'indexnow_key',
  'seo_intel_agent_token',
  'ga4_property_id',
];

const S = (props, required = []) => ({ type: 'object', properties: props, required, additionalProperties: false });
const collectionProp = {
  type: 'string',
  enum: Object.keys(COLLECTIONS),
  description: 'Which admin collection.',
};

const conf = (name) => {
  const c = COLLECTIONS[name];
  if (!c) throw new ToolError(`Unknown collection "${name}". Use one of: ${Object.keys(COLLECTIONS).join(', ')}.`);
  return c;
};

const objectId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ToolError(`"${id}" is not a valid id.`);
  return id;
};

const loadDoc = async (collection, { id, slug }) => {
  const c = conf(collection);
  const M = c.model();
  let doc = null;
  if (id) doc = await M.findById(objectId(id));
  else if (slug) doc = await M.findOne({ slug: String(slug) });
  else throw new ToolError('Send id or slug.');
  if (!doc) throw new ToolError(`No ${collection} found for ${id ? `id ${id}` : `slug "${slug}"`}.`);
  return { c, doc };
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Check every field Claude sent against the collection's rules. */
const checkFields = (c, data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new ToolError('data must be an object of fields.');
  const keys = Object.keys(data);
  if (!keys.length) throw new ToolError('data is empty.');
  const locked = keys.filter((k) => (c.locked || []).includes(k) || NEVER_WRITE.includes(k));
  if (locked.length) throw new ToolError(`These fields are locked and cannot be changed here: ${locked.join(', ')}.`);
  const unknown = keys.filter((k) => !c.write.includes(k));
  if (unknown.length) {
    throw new ToolError(`These fields cannot be set on ${c.label}: ${unknown.join(', ')}.`, { writable: c.write });
  }
};

const summary = (c, d) => {
  const o = typeof d.toObject === 'function' ? d.toObject() : d;
  return { id: String(o._id), title: o[c.title], slug: o.slug, live: Boolean(c.live?.(o)), path: c.path?.(o) || null };
};

const tools = [
  {
    name: 'site_info',
    ability: 'read',
    description: 'Start here: the site URL, whether this copy is staging (noindex), what each collection holds and how many records it has, and your permissions.',
    inputSchema: S({}),
    run: async (_a, ctx) => {
      const counts = {};
      for (const [k, c] of Object.entries(COLLECTIONS)) {
        counts[k] = { label: c.label, count: await c.model().countDocuments(c.query || {}), create: c.create, writable: c.write };
      }
      return {
        site: 'Jaipurio',
        productionUrl: SITE_URL,
        thisHost: ctx.base,
        staging: !isIndexableRequest(ctx.req),
        signedInAs: ctx.user.email,
        permissions: ctx.abilities,
        collections: counts,
        rules: [
          'Prices, stock, variants, orders, payments and customer contact details are locked or hidden.',
          'New pages, blogs, city pages and FAQs start as drafts.',
          'Slugs of live records cannot be changed.',
        ],
      };
    },
  },
  {
    name: 'find',
    ability: 'read',
    description: 'List or search records in a collection (newest first). Returns id, title, slug, status and public path.',
    inputSchema: S(
      {
        collection: collectionProp,
        search: { type: 'string', description: 'Text to look for in titles/slugs.' },
        status: { type: 'string', description: 'Filter by status, e.g. Published or Draft.' },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
        page: { type: 'integer', minimum: 1, default: 1 },
      },
      ['collection']
    ),
    run: async ({ collection, search, status, limit = 25, page = 1 }) => {
      const c = conf(collection);
      const q = { ...(c.query || {}) };
      if (search) q.$or = c.search.map((f) => ({ [f]: { $regex: escapeRegex(search), $options: 'i' } }));
      if (status) q.status = status;
      const lim = Math.min(Math.max(Number(limit) || 25, 1), 100);
      const M = c.model();
      const [total, docs] = await Promise.all([
        M.countDocuments(q),
        M.find(q).select(c.list).sort({ updatedAt: -1 }).skip((Math.max(page, 1) - 1) * lim).limit(lim).lean(),
      ]);
      return {
        collection,
        total,
        page,
        items: docs.map((d) => ({ ...summary(c, d), ...d, _id: undefined })),
      };
    },
  },
  {
    name: 'get',
    ability: 'read',
    description: 'Get one full record by id or slug.',
    inputSchema: S({ collection: collectionProp, id: { type: 'string' }, slug: { type: 'string' } }, ['collection']),
    run: async (a) => {
      const { c, doc } = await loadDoc(a.collection, a);
      return { ...summary(c, doc), writable: c.write, record: doc.toObject() };
    },
  },
  {
    name: 'create',
    ability: 'write',
    description: 'Create a record. Blogs, pages, city pages, FAQs and blog categories are saved as drafts unless publish=true (only when the owner asked).',
    inputSchema: S(
      { collection: collectionProp, data: { type: 'object' }, publish: { type: 'boolean', default: false } },
      ['collection', 'data']
    ),
    run: async ({ collection, data, publish = false }) => {
      const c = conf(collection);
      if (!c.create) throw new ToolError(`New ${c.label} cannot be created from Claude. Use the admin panel.`);
      checkFields(c, data);
      if (collection === 'redirect') validateRedirect(data);
      const fields = { ...data };
      if (c.draft) {
        if (publish) delete fields.indexable;
        Object.assign(fields, publish ? { status: 'Published' } : c.draft);
      }
      const doc = await c.model().create(fields);
      return { created: summary(c, doc), note: publish ? 'Published.' : 'Saved as draft.' };
    },
  },
  {
    name: 'update',
    ability: 'write',
    description: 'Change fields on a record. Only the fields you send change; arrays you send replace the whole array. Locked fields (prices, stock, slugs of live records) are refused.',
    inputSchema: S(
      { collection: collectionProp, id: { type: 'string' }, data: { type: 'object' } },
      ['collection', 'id', 'data']
    ),
    run: async ({ collection, id, data }) => {
      const { c, doc } = await loadDoc(collection, { id });
      checkFields(c, data);
      if ('slug' in data && data.slug !== doc.slug && c.live?.(doc.toObject())) {
        throw new ToolError('This record is live: its slug (URL) cannot be changed. Ask the owner first; a 301 redirect is needed.');
      }
      if (collection === 'redirect') validateRedirect({ ...doc.toObject(), ...data });
      const before = {};
      for (const k of Object.keys(data)) before[k] = doc.get(k);
      doc.set(data);
      await doc.save();
      return { updated: summary(c, doc), changed: Object.keys(data), before };
    },
  },
  {
    name: 'publish',
    ability: 'write',
    description: 'Publish (true) or unpublish (false) a blog, page, city page, FAQ, blog category, menu or redirect.',
    inputSchema: S(
      { collection: collectionProp, id: { type: 'string' }, published: { type: 'boolean' } },
      ['collection', 'id', 'published']
    ),
    run: async ({ collection, id, published }) => {
      const { c, doc } = await loadDoc(collection, { id });
      if (!c.write.includes('status')) throw new ToolError(`${c.label} have no publish switch here.`);
      doc.set('status', published ? 'Published' : 'Draft');
      if (collection === 'city_page' && published && doc.indexable === false) doc.set('indexable', true);
      await doc.save();
      return { ...summary(c, doc), status: doc.status };
    },
  },
  {
    name: 'delete',
    ability: 'delete',
    description: 'Permanently delete a record (not products). Needs confirm=true. Prefer publish=false.',
    inputSchema: S(
      { collection: collectionProp, id: { type: 'string' }, confirm: { type: 'boolean' } },
      ['collection', 'id', 'confirm']
    ),
    run: async ({ collection, id, confirm }) => {
      if (confirm !== true) throw new ToolError('Send confirm=true to delete. Unpublishing is usually better.');
      const { c, doc } = await loadDoc(collection, { id });
      if (!c.create) throw new ToolError(`${c.label} cannot be deleted from Claude.`);
      const s = summary(c, doc);
      await doc.deleteOne();
      return { deleted: s };
    },
  },
  {
    name: 'seo_get',
    ability: 'read',
    description: 'SEO fields of one record (meta title, description, robots, canonical, social, schema) with character counts.',
    inputSchema: S({ collection: collectionProp, id: { type: 'string' }, slug: { type: 'string' } }, ['collection']),
    run: async (a) => {
      const { c, doc } = await loadDoc(a.collection, a);
      const o = doc.toObject();
      const g = o.seo?.general || {};
      const title = g.metaTitle || o.seoTitle || '';
      const desc = g.metaDescription || o.seoDescription || '';
      return {
        ...summary(c, doc),
        url: c.path ? `${SITE_URL}${c.path(o)}` : null,
        metaTitle: title,
        metaTitleLength: title.length,
        metaDescription: desc,
        metaDescriptionLength: desc.length,
        seo: o.seo || null,
        seoTitle: o.seoTitle,
        seoDescription: o.seoDescription,
      };
    },
  },
  {
    name: 'seo_set',
    ability: 'write',
    description: 'Set SEO fields on a record. Send only what changes: metaTitle (50-60 chars), metaDescription (140-160), robots, canonicalUrl, og/twitter fields, schemaMarkup, noIndex.',
    inputSchema: S(
      {
        collection: collectionProp,
        id: { type: 'string' },
        metaTitle: { type: 'string' },
        metaDescription: { type: 'string' },
        metaKeywords: { type: 'string' },
        robots: { type: 'string' },
        canonicalUrl: { type: 'string' },
        ogTitle: { type: 'string' },
        ogDescription: { type: 'string' },
        ogImage: { type: 'string' },
        schemaMarkup: { type: 'string', description: 'JSON-LD; must be valid JSON and use real data only.' },
        noIndex: { type: 'boolean' },
      },
      ['collection', 'id']
    ),
    run: async (a) => {
      const { c, doc } = await loadDoc(a.collection, { id: a.id });
      if (!c.write.includes('seo') && !c.write.includes('seoTitle')) throw new ToolError(`${c.label} have no SEO fields.`);
      if (a.schemaMarkup) {
        try {
          JSON.parse(a.schemaMarkup);
        } catch {
          throw new ToolError('schemaMarkup is not valid JSON.');
        }
        if (/aggregateRating|ratingValue|reviewCount/i.test(a.schemaMarkup)) {
          throw new ToolError('Ratings in schema must come from real review data; leave them out.');
        }
      }
      const map = {
        metaTitle: 'seo.general.metaTitle',
        metaDescription: 'seo.general.metaDescription',
        metaKeywords: 'seo.general.metaKeywords',
        robots: 'seo.general.robots',
        canonicalUrl: 'seo.general.canonicalUrl',
        ogTitle: 'seo.social.ogTitle',
        ogDescription: 'seo.social.ogDescription',
        ogImage: 'seo.social.ogImage',
        schemaMarkup: 'seo.advanced.schemaMarkup',
        noIndex: 'seo.advanced.noIndex',
      };
      const changed = [];
      for (const [k, path] of Object.entries(map)) {
        if (a[k] === undefined) continue;
        if (c.write.includes('seo')) doc.set(path, a[k]);
        changed.push(k);
      }
      if (!changed.length) throw new ToolError('Nothing to change.');
      if (a.metaTitle !== undefined && c.write.includes('seoTitle')) doc.set('seoTitle', a.metaTitle);
      if (a.metaDescription !== undefined && c.write.includes('seoDescription')) doc.set('seoDescription', a.metaDescription);
      await doc.save();
      const warn = [];
      if (a.metaTitle && (a.metaTitle.length < 30 || a.metaTitle.length > 60)) warn.push(`metaTitle is ${a.metaTitle.length} chars`);
      if (a.metaDescription && (a.metaDescription.length < 120 || a.metaDescription.length > 160)) {
        warn.push(`metaDescription is ${a.metaDescription.length} chars`);
      }
      return { updated: summary(c, doc), changed, warnings: warn };
    },
  },
  {
    name: 'redirect_check',
    ability: 'read',
    description: 'Show which redirect (if any) applies to a path, following chains up to 5 hops.',
    inputSchema: S({ path: { type: 'string', description: 'Path such as /old-page' } }, ['path']),
    run: async ({ path }) => {
      const Redirect = COLLECTIONS.redirect.model();
      const hops = [];
      let cur = normalizePath(path);
      for (let i = 0; i < 5; i++) {
        const r = await Redirect.findOne({ from: cur, status: 'Published' }).lean();
        if (!r) break;
        hops.push({ from: r.from, to: r.to, type: r.type, id: String(r._id) });
        if (!r.to.startsWith('/') || hops.some((h, j) => j < hops.length - 1 && h.from === r.to)) break;
        cur = r.to;
      }
      return { path: normalizePath(path), redirects: hops, chain: hops.length > 1, final: hops.at(-1)?.to || null };
    },
  },
  {
    name: 'media_bulk_alt',
    ability: 'write',
    description: 'Set alt text and title on up to 50 media library images at once. Alt must describe what is in the image.',
    inputSchema: S(
      {
        items: {
          type: 'array',
          maxItems: 50,
          items: S({ id: { type: 'string' }, alt: { type: 'string' }, title: { type: 'string' } }, ['id']),
        },
      },
      ['items']
    ),
    run: async ({ items }) => {
      const Media = COLLECTIONS.media.model();
      const out = [];
      for (const it of items || []) {
        const set = {};
        if (it.alt !== undefined) set.alt = String(it.alt).slice(0, 250);
        if (it.title !== undefined) set.title = String(it.title).slice(0, 200);
        if (!Object.keys(set).length || !mongoose.isValidObjectId(it.id)) {
          out.push({ id: it.id, ok: false });
          continue;
        }
        const r = await Media.updateOne({ _id: it.id, deletedAt: null }, { $set: set });
        out.push({ id: it.id, ok: r.matchedCount === 1 });
      }
      return { updated: out.filter((o) => o.ok).length, results: out };
    },
  },
  {
    name: 'settings_get',
    ability: 'read',
    description: 'Storefront appearance settings (footer, home page sections, product page copy, popup, theme). Money and gateway settings are not included.',
    inputSchema: S({}),
    run: async () => {
      const Settings = require('../../models/settingsModel');
      const s = await Settings.findOne().select('theme footer homePage productPage popup menus googleAnalyticsId').lean();
      return s || {};
    },
  },
  {
    name: 'tracking_set',
    ability: 'write',
    description: 'Set storefront tracking IDs: googleAnalyticsId (GA4, Admin > Settings > Website Tracking) and/or facebookPixelId (Meta Pixel, Admin > Theme Options > Facebook). Send "" to remove. Tags load only on jaipurio.in; the Pixel only after cookie consent.',
    inputSchema: S({
      googleAnalyticsId: { type: 'string', description: 'Like G-ABC123XYZ, or "" to turn off.' },
      facebookPixelId: { type: 'string', description: 'Numeric Meta Pixel ID, or "" to turn off.' },
    }),
    run: async ({ googleAnalyticsId, facebookPixelId }) => {
      if (googleAnalyticsId === undefined && facebookPixelId === undefined) throw new ToolError('Send googleAnalyticsId and/or facebookPixelId.');
      const ga = googleAnalyticsId === undefined ? undefined : String(googleAnalyticsId).trim().toUpperCase();
      if (ga && (!/^G-[A-Z0-9]{6,12}$/.test(ga) || /^G-X+$/.test(ga))) throw new ToolError('Use a real GA4 Measurement ID like G-ABC123XYZ.');
      const px = facebookPixelId === undefined ? undefined : String(facebookPixelId).trim();
      if (px && !/^\d{10,20}$/.test(px)) throw new ToolError('A Meta Pixel ID is 10-20 digits.');
      const Settings = require('../../models/settingsModel');
      let s = await Settings.findOne();
      if (!s) s = new Settings();
      const before = { googleAnalyticsId: s.googleAnalyticsId || '', facebookPixelId: s.theme?.facebookPixelId || '' };
      if (ga !== undefined) s.googleAnalyticsId = ga;
      if (px !== undefined) {
        s.theme = { ...(s.theme || {}), facebookPixelId: px };
        if (typeof s.markModified === 'function') s.markModified('theme');
      }
      await s.save();
      try {
        await require('../../utils/cache').invalidateCatalog('settings');
      } catch {
        /* cache is optional */
      }
      return { googleAnalyticsId: s.googleAnalyticsId || '', facebookPixelId: s.theme?.facebookPixelId || '', before };
    },
  },
  {
    name: 'mcp_audit_log',
    ability: 'read',
    description: 'Recent connector calls (who, which tool, ok or error).',
    inputSchema: S({ limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 }, tool: { type: 'string' } }),
    run: async ({ limit = 50, tool }) => {
      const q = tool ? { tool } : {};
      const rows = await McpAudit.find(q).sort({ at: -1 }).limit(Math.min(limit, 200)).lean();
      return { entries: rows.map(({ _id, __v, ...r }) => r) };
    },
  },
  {
    name: 'credentials_status',
    ability: 'read',
    description: 'Which API keys are saved (never their values).',
    inputSchema: S({}),
    run: async () => ({ credentials: await credentialStatus(CREDENTIAL_NAMES) }),
  },
  {
    name: 'credential_set',
    ability: 'secrets',
    description: `Save an API key (write-only, encrypted). Names: ${CREDENTIAL_NAMES.join(', ')}.`,
    inputSchema: S({ name: { type: 'string', enum: CREDENTIAL_NAMES }, value: { type: 'string' } }, ['name', 'value']),
    run: async ({ name, value }, ctx) => {
      if (!CREDENTIAL_NAMES.includes(name)) throw new ToolError('Unknown credential name.');
      if (!value || String(value).length < 4) throw new ToolError('Value is empty.');
      if (name === 'gsc_service_account_json') {
        let j;
        try {
          j = JSON.parse(value);
        } catch {
          throw new ToolError('gsc_service_account_json must be the service account JSON.');
        }
        if (!j.client_email || !j.private_key) throw new ToolError('The JSON needs client_email and private_key.');
      }
      await credentialSet(name, value, ctx.user.email);
      return { saved: name };
    },
  },
  {
    name: 'credential_remove',
    ability: 'secrets',
    description: 'Remove a saved API key.',
    inputSchema: S({ name: { type: 'string', enum: CREDENTIAL_NAMES } }, ['name']),
    run: async ({ name }) => ({ removed: await credentialRemove(name) }),
  },
];

function normalizePath(p) {
  let s = String(p || '').trim();
  try {
    if (/^https?:\/\//i.test(s)) s = new URL(s).pathname;
  } catch {
    /* keep */
  }
  if (!s.startsWith('/')) s = `/${s}`;
  return s;
}

function validateRedirect(r) {
  if (!r.from || !String(r.from).startsWith('/')) throw new ToolError('Redirect "from" must be a path starting with /.');
  if (!r.to) throw new ToolError('Redirect "to" is required.');
  if (normalizePath(r.from) === normalizePath(r.to)) throw new ToolError('A redirect cannot point to itself.');
  if (r.type && !['301', '302'].includes(String(r.type))) throw new ToolError('type must be 301 or 302.');
}

module.exports = { tools, CREDENTIAL_NAMES, normalizePath };
