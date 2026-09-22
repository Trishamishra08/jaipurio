const Blog = require('../models/blogModel');
const BlogCategory = require('../models/blogCategoryModel');
const BlogTag = require('../models/blogTagModel');
const UiBlock = require('../models/uiBlockModel');
const { invalidateCatalog } = require('../utils/cache');
const { normalizeSeo, slugify } = require('../utils/seoFields');

const DEFAULT_UI_BLOCKS = [
  {
    key: 'ads',
    name: 'Ads',
    description: 'Ads',
    markup: '[ads]\n[/ads]',
    sortOrder: 10,
  },
  {
    key: 'media-audio',
    name: 'Media - Audio',
    description: 'Support native audio',
    markup: '[media-audio url="" autoplay="false" loop="false"]\n[/media-audio]',
    sortOrder: 20,
  },
  {
    key: 'blog-posts',
    name: 'Blog posts',
    description: 'Add blog posts',
    markup: '[blog-posts limit="4" category="" style="grid"]\n[/blog-posts]',
    sortOrder: 30,
  },
  {
    key: 'coming-soon',
    name: 'Coming Soon',
    description: 'Coming Soon',
    markup: '[coming-soon title="Coming Soon" subtitle="We are working hard to bring something amazing."]\n[/coming-soon]',
    sortOrder: 40,
  },
  {
    key: 'contact-form',
    name: 'Contact form',
    description: 'Add a contact form',
    markup: '[contact-form]\n[/contact-form]',
    sortOrder: 50,
  },
  {
    key: 'faq',
    name: 'FAQ',
    description: 'FAQ accordion',
    markup: '[faq]\n[/faq]',
    sortOrder: 60,
  },
  {
    key: 'gallery',
    name: 'Gallery',
    description: 'Image gallery',
    markup: '[gallery images="" columns="3"]\n[/gallery]',
    sortOrder: 70,
  },
  {
    key: 'google-map',
    name: 'Google Map',
    description: 'Embed a Google Map',
    markup: '[google-map address="Jaipur, Rajasthan" zoom="14"]\n[/google-map]',
    sortOrder: 80,
  },
  {
    key: 'simple-slider',
    name: 'Simple Slider',
    description: 'Add a simple slider',
    markup: '[simple-slider key=""]\n[/simple-slider]',
    sortOrder: 90,
  },
  {
    key: 'youtube',
    name: 'YouTube',
    description: 'Embed YouTube video',
    markup: '[youtube url="" width="100%" height="400"]\n[/youtube]',
    sortOrder: 100,
  },
];

const authorName = (user) =>
  user?.name || user?.fullName || user?.email || user?.username || 'Admin';

const serializeBlog = (doc) => {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  o.id = o._id ? String(o._id) : o.id;
  o.title = o.title || o.name || '';
  o.name = o.name || o.title || '';
  o.excerpt = o.excerpt || o.description || '';
  o.description = o.description || o.excerpt || '';
  o.categories = Array.isArray(o.categories)
    ? o.categories
    : o.category
      ? [o.category]
      : [];
  o.category = o.category || o.categories[0] || '';
  o.tags = Array.isArray(o.tags) ? o.tags : [];
  return o;
};

const normalizeBlogPayload = (body = {}, user) => {
  const payload = { ...body };
  delete payload._id;
  delete payload.id;
  delete payload.__v;
  delete payload.createdAt;

  if (!payload.name && payload.title) payload.name = payload.title;
  if (!payload.title && payload.name) payload.title = payload.name;
  if (payload.name && !payload.slug) payload.slug = slugify(payload.name);

  if (payload.description != null && payload.excerpt == null) payload.excerpt = payload.description;
  if (payload.excerpt != null && payload.description == null) payload.description = payload.excerpt;

  if (Array.isArray(payload.categories)) {
    payload.categories = payload.categories.map((c) => String(c).trim()).filter(Boolean);
    payload.category = payload.categories[0] || payload.category || '';
  } else if (payload.category) {
    payload.categories = [String(payload.category).trim()];
  }

  if (typeof payload.tags === 'string') {
    payload.tags = payload.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  } else if (!Array.isArray(payload.tags)) {
    payload.tags = [];
  }

  if (!Array.isArray(payload.faqs)) payload.faqs = [];

  payload.seo = normalizeSeo(payload, payload.name || '', payload.description || '');
  payload.seoTitle = payload.seo.general.metaTitle;
  payload.seoDescription = payload.seo.general.metaDescription;
  if (!payload.slug && payload.seo.general.slug) payload.slug = payload.seo.general.slug;

  if (user) {
    payload.author = authorName(user);
    if (user._id) payload.authorId = user._id;
  }

  return payload;
};

const serializeCategory = (doc, postsCount = 0) => {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  const parentId = o.parent ? String(o.parent) : '';
  return {
    ...o,
    id: o._id ? String(o._id) : o.id,
    parent: parentId,
    parentId,
    postsCount: Number(postsCount) || 0,
  };
};

const categoryPostCountMap = async (categories = []) => {
  const names = categories.map((c) => c.name).filter(Boolean);
  if (!names.length) return {};
  const counts = await Blog.aggregate([
    {
      $project: {
        allCats: {
          $setUnion: [
            { $cond: [{ $isArray: '$categories' }, '$categories', []] },
            {
              $cond: [
                { $and: [{ $ne: ['$category', null] }, { $ne: ['$category', ''] }] },
                ['$category'],
                [],
              ],
            },
          ],
        },
      },
    },
    { $unwind: '$allCats' },
    { $match: { allCats: { $in: names } } },
    { $group: { _id: '$allCats', count: { $sum: 1 } } },
  ]);
  const map = {};
  counts.forEach((row) => {
    map[row._id] = row.count;
  });
  return map;
};

const normalizeCategoryPayload = (body = {}) => {
  const payload = { ...body };
  delete payload._id;
  delete payload.id;
  delete payload.__v;
  delete payload.createdAt;
  delete payload.updatedAt;
  delete payload.postsCount;
  delete payload.parentId;

  const name = String(payload.name || '').trim();
  payload.name = name;
  if (name && !payload.slug) payload.slug = slugify(name);
  payload.slug = slugify(payload.slug || name || '');
  payload.description = payload.description || '';
  payload.status = payload.status || 'Published';
  payload.icon = payload.icon || '';
  payload.isDefault = Boolean(payload.isDefault);
  payload.isFeatured = Boolean(payload.isFeatured);
  if (payload.sortOrder == null || payload.sortOrder === '') payload.sortOrder = 0;
  payload.sortOrder = Number(payload.sortOrder) || 0;

  const parentRaw = payload.parent;
  if (!parentRaw || parentRaw === 'none' || parentRaw === 'None') {
    payload.parent = null;
  }

  payload.seo = normalizeSeo(payload, payload.name || '', payload.description || '');
  payload.seoTitle = payload.seo.general.metaTitle;
  payload.seoDescription = payload.seo.general.metaDescription;
  if (!payload.slug && payload.seo.general.slug) payload.slug = payload.seo.general.slug;
  return payload;
};

const unsetOtherDefaults = async (keepId) => {
  await BlogCategory.updateMany(
    keepId ? { _id: { $ne: keepId } } : {},
    { $set: { isDefault: false } }
  );
};

const ensureDefaultUiBlocks = async () => {
  const count = await UiBlock.countDocuments();
  if (count > 0) return;
  await UiBlock.insertMany(
    DEFAULT_UI_BLOCKS.map((b) => ({
      ...b,
      status: 'Published',
    }))
  );
};

/** Public published posts */
const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'Published' }).sort('-createdAt').lean();
    res.status(200).json({ success: true, data: { blogs: blogs.map(serializeBlog) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Admin list with search */
const getAdminBlogs = async (req, res) => {
  try {
    const q = String(req.query.q || req.query.search || '').trim();
    const filter = {};
    if (q) {
      filter.$or = ['name', 'title', 'slug', 'description', 'category', 'author'].map((f) => ({
        [f]: { $regex: q, $options: 'i' },
      }));
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) {
      filter.$or = [{ category: req.query.category }, { categories: req.query.category }];
    }
    const limit = Math.min(Number(req.query.limit) || 500, 1000);
    const blogs = await Blog.find(filter).sort('-createdAt').limit(limit).lean();
    res.status(200).json({
      success: true,
      data: { blogs: blogs.map(serializeBlog) },
      total: blogs.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).lean();
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    res.status(200).json({ success: true, data: { blog: serializeBlog(blog) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: String(req.params.slug || '').trim(),
      status: 'Published',
    }).lean();
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    res.status(200).json({ success: true, data: { blog: serializeBlog(blog) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createBlog = async (req, res) => {
  try {
    const payload = normalizeBlogPayload(req.body, req.user);
    if (!payload.name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const blog = await Blog.create(payload);
    invalidateCatalog('blogs').catch(() => {});
    res.status(201).json({ success: true, data: { blog: serializeBlog(blog) } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateBlog = async (req, res) => {
  try {
    const existing = await Blog.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    const payload = normalizeBlogPayload(
      { ...existing.toObject(), ...req.body, seo: req.body.seo || existing.seo },
      req.user
    );
    Object.assign(existing, payload);
    await existing.save();
    invalidateCatalog('blogs').catch(() => {});
    res.status(200).json({ success: true, data: { blog: serializeBlog(existing) } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    invalidateCatalog('blogs').catch(() => {});
    res.status(200).json({ success: true, message: 'Blog removed', data: { id: String(blog._id) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const listCategories = async (req, res) => {
  try {
    await BlogCategory.updateMany(
      { $or: [{ parent: '' }, { parent: 'none' }, { parent: 'None' }] },
      { $set: { parent: null } }
    );
    const rows = await BlogCategory.find({}).sort({ sortOrder: 1, createdAt: 1 }).lean();
    const counts = await categoryPostCountMap(rows);
    res.json({
      success: true,
      data: rows.map((r) => serializeCategory(r, counts[r.name] || 0)),
      total: rows.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const doc = await BlogCategory.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Category not found' });
    const counts = await categoryPostCountMap([doc]);
    res.json({ success: true, data: serializeCategory(doc, counts[doc.name] || 0) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const payload = normalizeCategoryPayload(req.body);
    if (!payload.name) return res.status(400).json({ success: false, message: 'Name is required' });
    if (payload.parent) {
      const parent = await BlogCategory.findById(payload.parent);
      if (!parent) return res.status(400).json({ success: false, message: 'Parent category not found' });
    }
    if (payload.isDefault) await unsetOtherDefaults(null);
    const max = await BlogCategory.findOne({ parent: payload.parent || null })
      .sort({ sortOrder: -1 })
      .lean();
    if (!req.body.sortOrder && req.body.sortOrder !== 0) {
      payload.sortOrder = (max?.sortOrder || 0) + 10;
    }
    const doc = await BlogCategory.create(payload);
    res.status(201).json({ success: true, data: serializeCategory(doc, 0) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const existing = await BlogCategory.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Category not found' });
    const payload = normalizeCategoryPayload({
      ...existing.toObject(),
      ...req.body,
      seo: req.body.seo || existing.seo,
    });
    if (!payload.name) return res.status(400).json({ success: false, message: 'Name is required' });
    if (payload.parent && String(payload.parent) === String(existing._id)) {
      return res.status(400).json({ success: false, message: 'A category cannot be its own parent' });
    }
    if (payload.parent) {
      const parent = await BlogCategory.findById(payload.parent);
      if (!parent) return res.status(400).json({ success: false, message: 'Parent category not found' });
    }
    if (payload.isDefault) await unsetOtherDefaults(existing._id);
    Object.assign(existing, payload);
    await existing.save();
    const counts = await categoryPostCountMap([existing]);
    res.json({
      success: true,
      data: serializeCategory(existing, counts[existing.name] || 0),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const doc = await BlogCategory.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Category not found' });
    await BlogCategory.updateMany({ parent: doc._id }, { $set: { parent: doc.parent || null } });
    await BlogCategory.findByIdAndDelete(doc._id);
    res.json({ success: true, data: { id: String(doc._id) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const reorderCategories = async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    await Promise.all(
      items.map((item, idx) => {
        const id = item.id || item._id;
        if (!id) return null;
        const parentRaw = item.parent;
        const parent =
          !parentRaw || parentRaw === 'none' || parentRaw === 'None' ? null : parentRaw;
        return BlogCategory.findByIdAndUpdate(id, {
          $set: {
            parent,
            sortOrder: Number(item.sortOrder != null ? item.sortOrder : (idx + 1) * 10) || 0,
          },
        });
      })
    );
    const rows = await BlogCategory.find({}).sort({ sortOrder: 1, createdAt: 1 }).lean();
    const counts = await categoryPostCountMap(rows);
    res.json({
      success: true,
      data: rows.map((r) => serializeCategory(r, counts[r.name] || 0)),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listTags = async (req, res) => {
  try {
    const rows = await BlogTag.find({}).sort({ name: 1 }).lean();
    res.json({
      success: true,
      data: rows.map((r) => ({ ...r, id: String(r._id) })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTag = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    const doc = await BlogTag.findOneAndUpdate(
      { name },
      {
        $setOnInsert: {
          name,
          slug: req.body.slug || slugify(name),
          description: req.body.description || '',
          status: 'Published',
        },
      },
      { upsert: true, new: true }
    );
    res.status(201).json({ success: true, data: { ...doc.toObject(), id: String(doc._id) } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listUiBlocks = async (req, res) => {
  try {
    await ensureDefaultUiBlocks();
    const q = String(req.query.q || req.query.search || '').trim();
    const filter = { status: 'Published' };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { key: { $regex: q, $options: 'i' } },
      ];
    }
    const rows = await UiBlock.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
    res.json({
      success: true,
      data: rows.map((r) => ({ ...r, id: String(r._id) })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBlogs,
  getAdminBlogs,
  getBlogById,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  listTags,
  createTag,
  listUiBlocks,
};
