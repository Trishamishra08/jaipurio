const express = require('express');
const CityPage = require('../models/cityPageModel');
const { SHIPPING_ZONES, zoneForCountry } = require('../data/shippingZones');
const { generateCityContent } = require('../services/cityPageContentEngine');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { slugify } = require('../utils/seoFields');

const router = express.Router();

const EDITABLE = [
  'city', 'country', 'slug', 'zoneKey', 'categories', 'occasions', 'featureNote', 'featureImage',
  'mainContent', 'localProof', 'faqs', 'customsNote', 'relatedBlogs', 'indexable',
];

const pick = (body = {}) => {
  const out = {};
  EDITABLE.forEach((k) => {
    if (body[k] !== undefined) out[k] = body[k];
  });
  if (Array.isArray(out.localProof)) {
    out.localProof = out.localProof
      .map((f) => ({ label: String(f?.label || '').trim(), detail: String(f?.detail || '').trim() }))
      .filter((f) => f.label || f.detail);
  }
  if (Array.isArray(out.faqs)) {
    out.faqs = out.faqs
      .map((f) => ({ question: String(f?.question || '').trim(), answer: String(f?.answer || '').trim() }))
      .filter((f) => f.question && f.answer);
  }
  ['categories', 'occasions', 'relatedBlogs'].forEach((k) => {
    if (Array.isArray(out[k])) out[k] = [...new Set(out[k].map((v) => String(v).trim()).filter(Boolean))];
  });
  if (out.slug !== undefined) out.slug = slugify(out.slug);
  return out;
};

/** Page + generated content + publish-bar status, as the storefront and admin preview use it. */
const withContent = (page) => {
  const plain = page.toObject ? page.toObject() : { ...page };
  const generated = generateCityContent(plain);
  return {
    ...plain,
    generated,
    faqsResolved: plain.faqs && plain.faqs.length ? plain.faqs : generated?.faqs || [],
    publishBar: CityPage.publishBar(plain),
  };
};

// ── Public (storefront) ───────────────────────────────────────────────

// Published, indexable city pages — for the storefront index and the sitemap.
router.get('/public', async (req, res) => {
  try {
    const rows = await CityPage.find({ status: 'Published', indexable: true })
      .select('city country slug zoneKey updatedAt')
      .sort({ country: 1, city: 1 })
      .lean();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/public/:slug', async (req, res) => {
  try {
    const page = await CityPage.findOne({ slug: String(req.params.slug || '').toLowerCase(), status: 'Published' }).lean();
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    const data = withContent(page);
    delete data.publishBar;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Admin ────────────────────────────────────────────────────────────
router.use(protect, authorize('admin'));

router.get('/zones', (req, res) => {
  res.json({
    success: true,
    data: Object.entries(SHIPPING_ZONES).map(([key, z]) => ({ key, ...z })),
  });
});

router.get('/zone-for-country', (req, res) => {
  res.json({ success: true, data: { zoneKey: zoneForCountry(req.query.country) } });
});

router.get('/', async (req, res) => {
  try {
    const rows = await CityPage.find({}).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, data: rows.map((r) => ({ ...r, mainContent: undefined, publishBar: CityPage.publishBar(r) })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate content for unsaved form data (admin live preview). Writes nothing.
router.post('/preview', (req, res) => {
  const data = pick(req.body);
  if (!SHIPPING_ZONES[data.zoneKey]) return res.status(400).json({ success: false, message: 'Choose a shipping zone' });
  res.json({ success: true, data: withContent({ ...data, status: 'Draft' }) });
});

router.get('/:id', async (req, res) => {
  try {
    const page = await CityPage.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: withContent(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = pick(req.body);
    if (!data.city || !data.country) return res.status(400).json({ success: false, message: 'City and country are required' });
    if (!SHIPPING_ZONES[data.zoneKey]) return res.status(400).json({ success: false, message: 'Choose a shipping zone' });
    data.slug = data.slug || slugify(data.city);
    if (await CityPage.exists({ slug: data.slug })) {
      return res.status(400).json({ success: false, message: `A page already uses the address /shop/${data.slug} — change the URL slug.` });
    }
    const page = await CityPage.create({ ...data, status: 'Draft' });
    res.status(201).json({ success: true, data: withContent(page) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const page = await CityPage.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Not found' });
    const data = pick(req.body);
    if (data.zoneKey !== undefined && !SHIPPING_ZONES[data.zoneKey]) {
      return res.status(400).json({ success: false, message: 'Choose a shipping zone' });
    }
    if (data.slug && data.slug !== page.slug && (await CityPage.exists({ slug: data.slug }))) {
      return res.status(400).json({ success: false, message: `A page already uses the address /shop/${data.slug}.` });
    }
    Object.assign(page, data);
    await page.save(); // a published page that loses its content fails the gate here
    res.json({ success: true, data: withContent(page) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/:id/publish', async (req, res) => {
  try {
    const page = await CityPage.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Not found' });
    const bar = page.meetsPublishBar();
    if (!bar.ok) return res.status(400).json({ success: false, message: `Still needed before publish: ${bar.missing.join(' and ')}.`, data: bar });
    page.status = 'Published';
    await page.save();
    res.json({ success: true, data: withContent(page) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/:id/unpublish', async (req, res) => {
  try {
    const page = await CityPage.findByIdAndUpdate(req.params.id, { status: 'Draft' }, { new: true });
    if (!page) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: withContent(page) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const page = await CityPage.findByIdAndDelete(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: { id: String(page._id) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
