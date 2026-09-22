const mongoose = require('mongoose');

const changeSchema = new mongoose.Schema(
  {
    column: { type: String, required: true, trim: true },
    origin: { type: String, default: '' },
    after: { type: String, default: '' },
  },
  { _id: false }
);

const pageRevisionSchema = new mongoose.Schema(
  {
    page: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Page',
      required: true,
      index: true,
    },
    revisionNumber: { type: Number, required: true },
    author: { type: String, default: 'Admin' },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    /** Field-level diffs shown in Revision History (Author / Column / Origin / After) */
    changes: { type: [changeSchema], default: [] },
    /** Full page snapshot for restore (includes faqs + seo) */
    snapshot: {
      name: { type: String, default: '' },
      slug: { type: String, default: '' },
      description: { type: String, default: '' },
      content: { type: String, default: '' },
      template: { type: String, default: 'Default' },
      status: { type: String, default: 'Published' },
      image: { type: String, default: '' },
      faqs: { type: Array, default: [] },
      seo: { type: mongoose.Schema.Types.Mixed, default: {} },
      seoTitle: { type: String, default: '' },
      seoDescription: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

pageRevisionSchema.index({ page: 1, revisionNumber: -1 });
pageRevisionSchema.index({ page: 1, createdAt: -1 });

module.exports = mongoose.model('PageRevision', pageRevisionSchema);
