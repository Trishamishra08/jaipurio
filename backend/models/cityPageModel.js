const mongoose = require('mongoose');

// A city / country landing page (/shop/<slug>), e.g. "Shop Rajasthani Handicrafts Online in London".
// Auto content (title, H1, summary, quick answers, FAQs) is generated on read by
// services/cityPageContentEngine.js from the shipping zone; the fields below are
// what a person fills in. Publishing needs real content — see meetsPublishBar().
const MIN_MAIN_WORDS = 700;

const cityPageSchema = new mongoose.Schema(
  {
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    zoneKey: { type: String, required: true },
    // Category names (from the live category tree) that get their own product grid
    categories: { type: [String], default: [] },
    // Occasion labels (from Home Page → Shop by occasion tiles)
    occasions: { type: [String], default: [] },
    featureNote: { type: String, default: '' }, // 2–3 sentences about THIS city
    featureImage: { type: String, default: '' },
    mainContent: { type: String, default: '' }, // 700+ words, plain text or simple HTML
    localProof: { type: [{ label: String, detail: String, _id: false }], default: [] },
    // Empty = use the generated FAQs; filled = the editor's own list
    faqs: { type: [{ question: String, answer: String, _id: false }], default: [] },
    customsNote: { type: String, default: '' }, // optional override of the zone's customs note
    relatedBlogs: { type: [String], default: [] }, // blog slugs for "Relevant reading"
    status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
    indexable: { type: Boolean, default: true },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

const countWords = (html = '') =>
  String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

/** What still blocks publishing: { ok, words, proofCount, missing[] }. */
cityPageSchema.statics.publishBar = (page = {}) => {
  const words = countWords(page.mainContent);
  const proofCount = (page.localProof || []).filter((f) => f && String(f.label || '').trim() && String(f.detail || '').trim()).length;
  const missing = [];
  if (words < MIN_MAIN_WORDS) missing.push(`${MIN_MAIN_WORDS - words} more words of main content`);
  if (proofCount < 1) missing.push('at least 1 local proof fact');
  return { ok: missing.length === 0, words, proofCount, minWords: MIN_MAIN_WORDS, missing };
};

cityPageSchema.methods.meetsPublishBar = function meetsPublishBar() {
  return this.constructor.publishBar(this);
};

// Server-side gate: a page can never be saved as Published without real content.
cityPageSchema.pre('save', function gate() {
  if (this.status !== 'Published') return;
  const bar = this.meetsPublishBar();
  if (!bar.ok) throw new Error(`Cannot publish yet — still needed: ${bar.missing.join(' and ')}.`);
  if (!this.publishedAt) this.publishedAt = new Date();
});

module.exports = mongoose.model('CityPage', cityPageSchema);
module.exports.countWords = countWords;
