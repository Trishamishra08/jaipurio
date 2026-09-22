const express = require('express');
const Page = require('../models/pageModel');
const PageRevision = require('../models/pageRevisionModel');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { normalizeSeo, slugify } = require('../utils/seoFields');

const router = express.Router();

const SNAPSHOT_KEYS = [
  'name',
  'slug',
  'description',
  'content',
  'template',
  'status',
  'image',
  'faqs',
  'seo',
  'seoTitle',
  'seoDescription',
];

const TRACKED_COLUMNS = [
  'name',
  'slug',
  'description',
  'content',
  'template',
  'status',
  'image',
  'faqs',
  'seo',
  'seoTitle',
  'seoDescription',
];

const COLUMN_LABELS = {
  name: 'Name',
  slug: 'Permalink',
  description: 'Description',
  content: 'Content',
  template: 'Template',
  status: 'Status',
  image: 'Image',
  faqs: 'FAQs',
  seo: 'SEO',
  seoTitle: 'SEO Title',
  seoDescription: 'SEO Description',
};

const toPlain = (doc = {}) => (doc?.toObject ? doc.toObject() : { ...doc });

const toSnapshot = (doc = {}) => {
  const src = toPlain(doc);
  const snap = {};
  SNAPSHOT_KEYS.forEach((k) => {
    snap[k] = src[k] ?? (k === 'faqs' ? [] : k === 'seo' ? {} : '');
  });
  return snap;
};

const formatValue = (key, value) => {
  if (value == null || value === '') return '';
  if (key === 'faqs') {
    const list = Array.isArray(value) ? value : [];
    if (!list.length) return '';
    return list
      .map((f, i) => {
        const q = String(f?.question || '').trim();
        const a = String(f?.answer || '').trim();
        return `Q${i + 1}: ${q}\nA${i + 1}: ${a}`;
      })
      .join('\n\n');
  }
  if (key === 'seo' || (typeof value === 'object' && !Array.isArray(value))) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

const valuesEqual = (key, a, b) => {
  if (key === 'faqs' || key === 'seo' || (typeof a === 'object' && a != null) || (typeof b === 'object' && b != null)) {
    return formatValue(key, a) === formatValue(key, b);
  }
  return String(a ?? '') === String(b ?? '');
};

const buildChanges = (before = {}, after = {}) => {
  const prev = toPlain(before);
  const next = toPlain(after);
  const changes = [];
  TRACKED_COLUMNS.forEach((key) => {
    const originVal = prev[key];
    const afterVal = next[key];
    if (valuesEqual(key, originVal, afterVal)) return;
    changes.push({
      column: COLUMN_LABELS[key] || key,
      origin: formatValue(key, originVal),
      after: formatValue(key, afterVal),
    });
  });
  return changes;
};

const authorName = (user) =>
  user?.name || user?.fullName || user?.email || user?.username || 'Admin';

const nextRevisionNumber = async (pageId) => {
  const last = await PageRevision.findOne({ page: pageId }).sort({ revisionNumber: -1 }).lean();
  return (last?.revisionNumber || 0) + 1;
};

const createRevisionFromPage = async (pageDoc, user, beforeDoc = null) => {
  if (!pageDoc?._id) return null;
  const snapshot = toSnapshot(pageDoc);
  const changes = beforeDoc
    ? buildChanges(beforeDoc, pageDoc)
    : TRACKED_COLUMNS.filter((k) => {
        const v = snapshot[k];
        if (k === 'faqs') return Array.isArray(v) && v.length > 0;
        if (k === 'seo') return v && typeof v === 'object' && Object.keys(v).length > 0;
        return String(v ?? '').trim() !== '';
      }).map((key) => ({
        column: COLUMN_LABELS[key] || key,
        origin: '',
        after: formatValue(key, snapshot[key]),
      }));

  // Skip empty update revisions (no actual field changes)
  if (beforeDoc && changes.length === 0) return null;

  const revisionNumber = await nextRevisionNumber(pageDoc._id);
  return PageRevision.create({
    page: pageDoc._id,
    revisionNumber,
    author: authorName(user),
    authorId: user?._id,
    changes,
    snapshot,
  });
};

/** Expand a snapshot into history rows when older revisions have no change list */
const changesFromSnapshot = (snapshot = {}) => {
  const rows = [];
  TRACKED_COLUMNS.forEach((key) => {
    const after = formatValue(key, snapshot[key]);
    if (!after) return;
    rows.push({
      column: COLUMN_LABELS[key] || key,
      origin: '',
      after,
    });
  });
  return rows;
};

/** Flatten revisions into Botble-style history rows */
const serializeRevisionRows = (revisions = []) => {
  const rows = [];
  revisions.forEach((rev) => {
    const o = toPlain(rev);
    const author = o.author || 'Admin';
    const createdAt = o.createdAt;
    const revisionId = String(o._id);
    let changes = Array.isArray(o.changes) && o.changes.length ? o.changes : [];
    if (!changes.length && o.snapshot) {
      changes = changesFromSnapshot(o.snapshot);
    }
    if (!changes.length) {
      changes = [
        {
          column: 'Page',
          origin: '',
          after: o.snapshot?.name || `Revision #${o.revisionNumber}`,
        },
      ];
    }
    changes.forEach((change, idx) => {
      rows.push({
        id: `${revisionId}-${idx}`,
        revisionId,
        revisionNumber: o.revisionNumber,
        author,
        column: change.column || '',
        origin: change.origin || '',
        after: change.after || '',
        createdAt,
        snapshot: o.snapshot,
      });
    });
  });
  return rows;
};

const serializePage = (doc) => {
  if (!doc) return null;
  const o = toPlain(doc);
  o.id = o._id ? String(o._id) : o.id;
  return o;
};

/** Public storefront endpoints */
router.get('/public', async (req, res) => {
  try {
    const rows = await Page.find({ status: 'Published' }).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/public/slug/:slug', async (req, res) => {
  try {
    const row = await Page.findOne({
      slug: String(req.params.slug || '').trim(),
      status: 'Published',
    }).lean();
    if (!row) return res.status(404).json({ success: false, message: 'Page not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.use(protect, authorize('admin'));

router.get('/', async (req, res) => {
  try {
    const q = String(req.query.q || req.query.search || '').trim();
    const filter = {};
    if (q) {
      filter.$or = ['name', 'slug', 'description', 'template'].map((f) => ({
        [f]: { $regex: q, $options: 'i' },
      }));
    }
    if (req.query.status) filter.status = req.query.status;
    const limit = Math.min(Number(req.query.limit) || 500, 1000);
    const rows = await Page.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({
      success: true,
      data: rows.map(serializePage),
      total: rows.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    let payload = { ...req.body };
    delete payload._id;
    delete payload.id;
    if (payload.name && !payload.slug) payload.slug = slugify(payload.name);
    payload.seo = normalizeSeo(payload, payload.name || '', payload.description || '');
    payload.seoTitle = payload.seo.general.metaTitle;
    payload.seoDescription = payload.seo.general.metaDescription;
    if (!payload.slug && payload.seo.general.slug) payload.slug = payload.seo.general.slug;
    if (!Array.isArray(payload.faqs)) payload.faqs = [];
    const doc = await Page.create(payload);
    await createRevisionFromPage(doc, req.user, null);
    res.status(201).json({ success: true, data: serializePage(doc) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/:id/revisions', async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    let rows = await PageRevision.find({ page: req.params.id })
      .sort({ createdAt: -1, revisionNumber: -1 })
      .lean();
    // Existing pages saved before revision tracking: seed current content once
    if (rows.length === 0) {
      await createRevisionFromPage(page, req.user, null);
      rows = await PageRevision.find({ page: req.params.id })
        .sort({ createdAt: -1, revisionNumber: -1 })
        .lean();
    }
    res.json({ success: true, data: serializeRevisionRows(rows) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/revisions/:revisionId/restore', async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });

    const revision = await PageRevision.findOne({
      _id: req.params.revisionId,
      page: page._id,
    });
    if (!revision) return res.status(404).json({ success: false, message: 'Revision not found' });

    const before = page.toObject();
    const snap = revision.snapshot || {};
    SNAPSHOT_KEYS.forEach((k) => {
      if (snap[k] !== undefined) page[k] = snap[k];
    });
    await page.save();
    await createRevisionFromPage(page, req.user, before);

    res.json({ success: true, data: serializePage(page) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/:id/revisions/:revisionId', async (req, res) => {
  try {
    const revision = await PageRevision.findOneAndDelete({
      _id: req.params.revisionId,
      page: req.params.id,
    });
    if (!revision) return res.status(404).json({ success: false, message: 'Revision not found' });
    res.json({ success: true, data: { id: String(revision._id) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await Page.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: serializePage(doc) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await Page.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

    const before = existing.toObject();
    let payload = { ...req.body };
    delete payload._id;
    delete payload.id;
    delete payload.__v;
    delete payload.createdAt;
    if (payload.name && !payload.slug) payload.slug = slugify(payload.name);
    payload.seo = normalizeSeo(
      { ...existing.toObject(), ...payload, seo: payload.seo || existing.seo },
      payload.name || existing.name || '',
      payload.description || existing.description || ''
    );
    payload.seoTitle = payload.seo.general.metaTitle;
    payload.seoDescription = payload.seo.general.metaDescription;
    if (!payload.slug && payload.seo.general.slug) payload.slug = payload.seo.general.slug;
    if (payload.faqs !== undefined && !Array.isArray(payload.faqs)) payload.faqs = [];

    Object.assign(existing, payload);
    await existing.save();
    await createRevisionFromPage(existing, req.user, before);
    res.json({ success: true, data: serializePage(existing) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await Page.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    await PageRevision.deleteMany({ page: req.params.id });
    res.json({ success: true, data: { id: String(doc._id) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
