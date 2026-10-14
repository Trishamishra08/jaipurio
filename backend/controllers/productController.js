const Product = require('../models/productModel');
const Inventory = require('../models/inventoryModel');
const Category = require('../models/categoryModel');
const mongoose = require('mongoose');
const { invalidateCatalog } = require('../utils/cache');
const { optimizeMediaUrls } = require('../utils/imageOptimize');
const { lifecycleToLegacyStatus, stockStatusFromQty } = require('../constants/flow');
const { serializeProduct } = require('../utils/marketplace');
const { normalizeSeo, slugify } = require('../utils/seoFields');
const { ensureRichCopy } = require('../utils/productCopy');
const { resolveProductImages, resolveImageUrl } = require('../utils/minioStorage');

const isUsableImageUrl = (url) =>
  typeof url === 'string' && url.trim() !== '' && !url.startsWith('blob:');

const normalizeProductMedia = (body = {}) => {
  const images = [...new Set([
    ...(Array.isArray(body.images) ? body.images : []),
    body.image,
    body.featuredImage,
  ].filter(isUsableImageUrl))];
  return {
    images,
    image: images[0] || body.image || ''
  };
};

const applyFlowFields = (body = {}, role) => {
  const title = body.title || body.name;
  let lifecycle = body.lifecycle;
  if (!lifecycle) {
    lifecycle = role === 'admin' ? 'Published' : 'Draft';
  }
  const stock = Number(body.stock ?? 0);
  const trackQuantity = body.trackQuantity !== false;
  const seo = normalizeSeo(body, title, body.description || body.content || '');
  const slug = body.slug || seo.general.slug || slugify(title || '');
  if (seo.general && !seo.general.slug) seo.general.slug = slug;
  const specificationTable =
    body.specificationTable === '' || body.specificationTable === 'None'
      ? null
      : body.specificationTable;
  return {
    ...body,
    ...normalizeProductMedia(body),
    name: title,
    title,
    slug,
    storeName: body.store || body.storeName,
    salePrice: body.salePrice || body.oldPrice,
    oldPrice: body.oldPrice || body.salePrice,
    isFeatured: Boolean(body.isFeatured || body.bestseller),
    lifecycle,
    status: lifecycleToLegacyStatus(lifecycle),
    published: lifecycle === 'Published',
    stockStatus: body.stockStatus || stockStatusFromQty(stock, trackQuantity),
    trackQuantity,
    specificationTable,
    seo,
    seoTitle: seo.general.metaTitle || body.seoTitle || '',
    seoDescription: seo.general.metaDescription || body.seoDescription || '',
  };
};

const injectStock = async (products) => {
  const isArray = Array.isArray(products);
  const prodArray = isArray ? products : [products];
  if (prodArray.length === 0) return isArray ? [] : null;

  const productIds = prodArray.map(p => p._id);
  const inventories = await Inventory.find({ product: { $in: productIds } });

  const mapped = prodArray.map(p => {
    const inv = inventories.find(i => i.product.toString() === p._id.toString());
    const serialized = serializeProduct(p, inv);
    const copy = ensureRichCopy(
      serialized.title || serialized.name,
      serialized.description,
      serialized.content
    );
    serialized.description = copy.description;
    serialized.content = copy.content;
    if (serialized.vendor && typeof serialized.vendor === 'object') {
      serialized.vendor = {
        ...serialized.vendor,
        _id: serialized.vendor._id ? serialized.vendor._id.toString() : serialized.vendor._id
      };
    }
    return optimizeMediaUrls(serialized);
  });
  return isArray ? mapped : mapped[0];
};

const syncInventory = async (product, stock, extra = {}) => {
  const qty = Number(stock ?? 0);
  const trackQuantity = extra.trackQuantity !== false && extra.trackQuantity !== undefined
    ? extra.trackQuantity
    : product.trackQuantity;
  const payload = {
    product: product._id,
    vendor: product.vendor,
    admin: product.admin,
    stock: qty,
    warehouse: extra.warehouse || product.warehouse,
    trackQuantity,
    stockStatus: stockStatusFromQty(qty, trackQuantity),
  };
  const inventory = await Inventory.findOneAndUpdate(
    { product: product._id },
    payload,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  product.stockStatus = payload.stockStatus;
  await product.save();
  return inventory;
};

// Every sort ends with `_id` as a tiebreaker — `reviews`/`rating`/`price` are
// frequently equal across many products (e.g. the same default rating), and
// without a unique tiebreaker Mongo's tie order isn't guaranteed stable
// between separate skip/limit calls, which silently duplicates or skips rows
// across pages.
const PRODUCT_SORTS = {
  popular: { reviews: -1, rating: -1, _id: 1 },
  new: { createdAt: -1, _id: 1 },
  'price-low': { price: 1, _id: 1 },
  'price-high': { price: -1, _id: 1 },
  rating: { rating: -1, reviews: -1, _id: 1 },
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// `?category=` accepts a category title or slug. Products carry every category
// they belong to plus its ancestors in `categoryIds`, so picking a parent
// ("Brass Idols") also lists everything filed under its children ("Ganesha").
// The plain `category` string is kept as a fallback for products that predate
// the taxonomy import or sit in a category with no Category document.
const buildCategoryClause = async (value) => {
  const raw = String(value).trim();
  const cat = await Category.findOne({
    isActive: { $ne: false },
    $or: [{ slug: raw }, { title: new RegExp(`^${escapeRegex(raw)}$`, 'i') }],
  })
    .sort({ legacyId: -1 }) // imported taxonomy wins over same-named topic categories
    .select('_id title')
    .lean();
  // Old links (banners, bookmarks) may use a retired name like "Idols" — fall
  // back to the broadest live category containing it, e.g. "Religious Statuary Idols".
  const fuzzy = cat
    ? null
    : await Category.findOne({ isActive: { $ne: false }, title: new RegExp(escapeRegex(raw), 'i') })
        .sort({ level: 1, sortOrder: 1 })
        .select('_id title')
        .lean();
  if (fuzzy) return { $or: [{ categoryIds: fuzzy._id }, { category: fuzzy.title }] };
  if (!cat) return { category: raw };
  return { $or: [{ categoryIds: cat._id }, { category: cat.title }] };
};

// Breadcrumb for a product: root → … → its most specific category.
const buildCategoryTrail = async (product) => {
  const trail = [];
  let cursor = product.categoryRef;
  for (let hops = 0; cursor && hops < 8; hops += 1) {
    const cat = await Category.findById(cursor).select('title slug parent').lean();
    if (!cat) break;
    trail.unshift({ title: cat.title, slug: cat.slug });
    cursor = cat.parent;
  }
  if (!trail.length && product.category) trail.push({ title: product.category, slug: slugify(product.category) });
  return trail;
};

const getProducts = async (req, res) => {
  try {
    const filter = {
      $or: [{ lifecycle: 'Published' }, { status: 'approved' }]
    };

    const ids = String(req.query.ids || '')
      .split(',')
      .map((id) => id.trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (ids.length) filter._id = { $in: ids };

    const andClauses = [];
    if (req.query.category) {
      andClauses.push(await buildCategoryClause(req.query.category));
    }
    if (req.query.vendor && mongoose.Types.ObjectId.isValid(req.query.vendor)) {
      filter.vendor = req.query.vendor;
    }
    if (req.query.bestseller === 'true') {
      filter.bestseller = true;
    }
    if (req.query.tags) {
      const tagList = String(req.query.tags)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (tagList.length) filter.tagList = { $in: tagList };
    }
    if (req.query.search) {
      const re = new RegExp(String(req.query.search).trim(), 'i');
      andClauses.push({ $or: [{ name: re }, { title: re }, { tags: re }] });
    }
    if (andClauses.length) filter.$and = andClauses;

    const sort = PRODUCT_SORTS[req.query.sort] || PRODUCT_SORTS.popular;

    // `ids` is an exact batch lookup (cart/wishlist resolution) — always return
    // every match rather than paginating, but keep a safety cap either way.
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = ids.length
      ? Math.min(ids.length, 200)
      : Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 100);
    const skip = ids.length ? 0 : (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('vendor', 'storeName fullName')
        .populate('admin', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);
    const productsWithStock = await resolveProductImages(await injectStock(products));
    res.status(200).json({
      success: true,
      data: {
        products: productsWithStock,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// The category tree, limited to categories that actually contain a live
// product (directly or through a descendant) so a chip never leads to an empty
// shop page. Returned depth-first (siblings by sortOrder) so parents sit right
// before their children. Each row also carries an image — the category's own
// icon, else a photo of one of its products — for the storefront tiles.
const getProductCategories = async (req, res) => {
  try {
    const live = { $or: [{ lifecycle: 'Published' }, { status: 'approved' }] };
    const [cats, byRef, byName] = await Promise.all([
      Category.find({ isActive: { $ne: false } }).lean(),
      Product.aggregate([
        { $match: { ...live, 'categoryIds.0': { $exists: true } } },
        { $project: { categoryIds: 1, category: 1, image: 1, isFeatured: 1, reviews: 1 } },
        { $sort: { isFeatured: -1, reviews: -1 } },
        { $unwind: '$categoryIds' },
        { $group: { _id: '$categoryIds', count: { $sum: 1 }, image: { $first: '$image' } } },
      ]),
      // Products with no taxonomy ids yet — counted by their plain category name.
      Product.aggregate([
        {
          $match: {
            $and: [
              live,
              { category: { $nin: ['', null] } },
              { $or: [{ categoryIds: { $exists: false } }, { categoryIds: { $size: 0 } }] },
            ],
          },
        },
        { $project: { categoryIds: 1, category: 1, image: 1, isFeatured: 1, reviews: 1 } },
        { $sort: { isFeatured: -1, reviews: -1 } },
        { $group: { _id: '$category', count: { $sum: 1 }, image: { $first: '$image' } } },
      ]),
    ]);

    const stats = new Map(byRef.map((r) => [String(r._id), { count: r.count, image: r.image }]));
    const byTitle = new Map(cats.map((c) => [c.title.toLowerCase(), c]));
    const orphans = [];
    byName.forEach((r) => {
      const doc = byTitle.get(String(r._id).toLowerCase());
      if (!doc) return orphans.push({ name: r._id, count: r.count, image: r.image });
      const cur = stats.get(String(doc._id)) || { count: 0, image: r.image };
      stats.set(String(doc._id), { count: cur.count + r.count, image: cur.image || r.image });
    });

    const children = new Map();
    cats.forEach((c) => {
      const key = c.parent ? String(c.parent) : 'root';
      if (!children.has(key)) children.set(key, []);
      children.get(key).push(c);
    });
    const rows = [];
    const walk = (parentKey, level) => {
      (children.get(parentKey) || [])
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.title.localeCompare(b.title))
        .forEach((c) => {
          const st = stats.get(String(c._id));
          if (st && st.count > 0) {
            rows.push({
              id: String(c._id),
              name: c.title,
              slug: c.slug,
              parent: c.parent ? String(c.parent) : null,
              level,
              count: st.count,
              isFeatured: !!c.isFeatured,
              image: resolveImageUrl(c.image || st.image || '') || null,
            });
          }
          walk(String(c._id), level + 1);
        });
    };
    walk('root', 1);
    orphans.forEach((o) =>
      rows.push({ id: o.name, name: o.name, slug: slugify(o.name), parent: null, level: 1, count: o.count, isFeatured: false, image: resolveImageUrl(o.image || '') || null })
    );

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const key = String(req.params.id || '').trim();
    if (!key) {
      return res.status(400).json({ success: false, message: 'Product id required' });
    }

    let product = null;
    const looksLikeObjectId = /^[a-fA-F0-9]{24}$/.test(key);

    if (looksLikeObjectId) {
      try {
        product = await Product.findById(key)
          .populate('vendor', 'storeName fullName')
          .populate('admin', 'name');
      } catch {
        product = null;
      }
    }

    if (!product) {
      product = await Product.findOne({
        $or: [{ slug: key }, { 'seo.general.slug': key }],
      })
        .populate('vendor', 'storeName fullName')
        .populate('admin', 'name');
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const canSeeHidden =
      req.user &&
      (req.user.role === 'admin' ||
        (req.user.role === 'vendor' &&
          product.vendor?.toString() === req.user._id.toString()));
    if (product.lifecycle !== 'Published' && product.status !== 'approved' && !canSeeHidden) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const data = await resolveProductImages(await injectStock(product));
    data.categoryTrail = await buildCategoryTrail(product);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Powers the "similar products" rail on the product detail page — same
// category first (closest substitutes/complements), ranked by shared tags
// and price proximity to the viewed product so the cheaper, closely-related
// items that nudge cart value up surface before loosely-related ones.
const getRelatedProducts = async (req, res) => {
  try {
    const key = String(req.params.id || '').trim();
    const looksLikeObjectId = /^[a-fA-F0-9]{24}$/.test(key);
    const source = looksLikeObjectId
      ? await Product.findById(key).select('category categoryRef tagList price vendor').lean()
      : await Product.findOne({ $or: [{ slug: key }, { 'seo.general.slug': key }] })
          .select('category categoryRef tagList price vendor')
          .lean();

    if (!source) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 20);
    const baseFilter = {
      _id: { $ne: source._id },
      $or: [{ lifecycle: 'Published' }, { status: 'approved' }],
    };

    // Same most-specific category first; categoryIds also pulls in products
    // filed under a child of it (e.g. a "Brass Idols" page showing Ganesha).
    const sameCategory = source.categoryRef
      ? { $or: [{ category: source.category }, { categoryIds: source.categoryRef }] }
      : { category: source.category };
    let candidates = await Product.find({ ...baseFilter, $and: [sameCategory] })
      .select('name title price oldPrice salePrice image images rating reviews category tagList vendor isFeatured slug')
      .populate('vendor', 'storeName fullName')
      .limit(60)
      .lean();

    // Same category rarely runs dry, but top up with same-vendor picks when it does
    // so the section never renders empty on thin categories.
    if (candidates.length < limit && source.vendor) {
      const fill = await Product.find({ ...baseFilter, vendor: source.vendor, category: { $ne: source.category } })
        .select('name title price oldPrice salePrice image images rating reviews category tagList vendor isFeatured slug')
        .populate('vendor', 'storeName fullName')
        .limit(limit - candidates.length)
        .lean();
      candidates = candidates.concat(fill);
    }

    const sourceTags = new Set(Array.isArray(source.tagList) ? source.tagList : []);
    const sourcePrice = Number(source.price) || 0;
    const scored = candidates.map((p) => {
      const tags = Array.isArray(p.tagList) ? p.tagList : [];
      const tagOverlap = tags.reduce((n, t) => n + (sourceTags.has(t) ? 1 : 0), 0);
      const priceDelta = sourcePrice ? Math.abs((Number(p.price) || 0) - sourcePrice) / sourcePrice : 1;
      const score =
        (p.category === source.category ? 10 : 0) +
        tagOverlap * 5 +
        (p.isFeatured ? 2 : 0) -
        priceDelta;
      return { p, score };
    });
    scored.sort((a, b) => b.score - a.score);

    const products = await resolveProductImages(
      await injectStock(scored.slice(0, limit).map((s) => s.p))
    );
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const productData = applyFlowFields(req.body, req.user.role);

    if (req.user.role === 'admin') {
      productData.admin = req.user._id;
      if (!productData.lifecycle || productData.lifecycle === 'Draft') {
        productData.lifecycle = 'Published';
        productData.status = 'approved';
        productData.published = true;
      }
    } else {
      productData.vendor = req.user._id;
      productData.storeName = productData.storeName || req.user.storeName;
      if (productData.lifecycle === 'Published') {
        productData.lifecycle = 'Pending Approval';
        productData.published = false;
        productData.status = 'pending';
      }
    }

    if (!productData.title || !productData.sku || !productData.category || productData.price === undefined || productData.price === '') {
      return res.status(400).json({ success: false, message: 'Required: Title, SKU, Category, Price.' });
    }

    const product = await Product.create(productData);
    await syncInventory(product, req.body.stock, productData);
    const productWithStock = await injectStock(product);
    invalidateCatalog('products').catch(() => {});
    res.status(201).json({ success: true, data: productWithStock });

    if (req.user.role === 'vendor' && product.lifecycle === 'Pending Approval') {
      try {
        const { sendNotificationToUser } = require('../utils/pushNotificationHelper');
        await sendNotificationToUser(
          null,
          'admin',
          {
            title: 'New Product Pending Approval',
            body: `Vendor has submitted a new product "${product.name}" for review.`
          },
          'info'
        );
      } catch (err) {
        console.error('FCM Product Creation Error:', err);
      }
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getVendorProducts = async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user._id })
      .select('-content')
      .sort({ createdAt: -1 })
      .lean();
    const productsWithStock = await resolveProductImages(await injectStock(products));
    res.status(200).json({ success: true, data: productsWithStock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .select('-content')
      .populate('vendor', 'storeName fullName')
      .populate('admin', 'name')
      .sort({ createdAt: -1 })
      .lean();
    const productsWithStock = await resolveProductImages(await injectStock(products));
    const LOW_STOCK_ALERT = 8;
    const summary = productsWithStock.reduce((acc, product) => {
      const stock = Number(product.stock) || 0;
      const price = Number(product.price) || 0;
      acc.totalValuation += price * stock;
      if (product.stockStatus === 'Out of Stock' || stock === 0) acc.outOfStockCount += 1;
      else if (stock < LOW_STOCK_ALERT) acc.lowStockCount += 1;
      else acc.healthyStockCount += 1;
      return acc;
    }, { totalValuation: 0, outOfStockCount: 0, lowStockCount: 0, healthyStockCount: 0 });
    summary.totalValuation = Math.round(summary.totalValuation * 100) / 100;
    summary.valuationLabel = `₹${(summary.totalValuation / 100000).toFixed(2)}L`;
    res.status(200).json({ success: true, data: productsWithStock, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProductStatus = async (req, res) => {
  try {
    const requested = req.body.lifecycle || req.body.status;
    const map = {
      approved: 'Published',
      rejected: 'Rejected',
      pending: 'Pending Approval',
      Published: 'Published',
      Rejected: 'Rejected',
      'Pending Approval': 'Pending Approval',
      Draft: 'Draft',
    };
    const lifecycle = map[requested];
    if (!lifecycle) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.lifecycle = lifecycle;
    product.status = lifecycleToLegacyStatus(lifecycle);
    product.published = lifecycle === 'Published';
    if (lifecycle === 'Rejected') {
      product.rejectReason = req.body.rejectReason || product.rejectReason || 'Needs better images';
    }
    await product.save();

    invalidateCatalog('products').catch(() => {});
    const data = await injectStock(product);
    res.status(200).json({ success: true, data });

    if (product.vendor) {
      try {
        const { sendNotificationToUser } = require('../utils/pushNotificationHelper');
        let title = 'Product Status Updated';
        let type = 'info';
        if (lifecycle === 'Published') {
          title = 'Product Approved';
          type = 'success';
        } else if (lifecycle === 'Rejected') {
          title = 'Product Rejected';
          type = 'alert';
        }
        await sendNotificationToUser(
          product.vendor,
          'vendor',
          { title, body: `Your product "${product.name}" is now ${lifecycle}.` },
          type
        );
      } catch (err) {
        console.error('FCM Product Status Error:', err);
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (req.user.role === 'vendor' && product.vendor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!product.title && !product.name || !product.sku || !product.category || product.price == null) {
      return res.status(400).json({ success: false, message: 'Required: Title, SKU, Category, Price.' });
    }
    product.lifecycle = 'Pending Approval';
    product.status = 'pending';
    product.published = false;
    await product.save();
    invalidateCatalog('products').catch(() => {});
    res.status(200).json({ success: true, data: await injectStock(product) });

    try {
      const { sendNotificationToUser } = require('../utils/pushNotificationHelper');
      await sendNotificationToUser(
        null,
        'admin',
        {
          title: 'Product Pending Approval',
          body: `Vendor submitted "${product.title || product.name}" (${product.sku}) for review.`,
        },
        'info'
      );
    } catch (err) {
      console.error('FCM Product Submit Error:', err);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (req.user.role === 'vendor' && product.vendor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }

    const flow = applyFlowFields({ ...product.toObject(), ...req.body }, req.user.role);
    if (req.user.role === 'vendor' && flow.lifecycle === 'Published' && product.lifecycle !== 'Published') {
      flow.lifecycle = 'Pending Approval';
      flow.published = false;
      flow.status = 'pending';
    }

    product = await Product.findByIdAndUpdate(req.params.id, flow, {
      new: true,
      runValidators: true
    });

    if (req.body.stock !== undefined || req.body.warehouse || req.body.trackQuantity !== undefined) {
      await syncInventory(product, req.body.stock ?? undefined, flow);
    }

    const productWithStock = await injectStock(product);
    invalidateCatalog('products').catch(() => {});
    res.status(200).json({ success: true, data: productWithStock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (req.user.role === 'vendor' && product.vendor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
    }

    await product.deleteOne();
    await Inventory.deleteOne({ product: req.params.id });

    invalidateCatalog('products').catch(() => {});
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const duplicateProduct = async (req, res) => {
  try {
    const source = await Product.findById(req.params.id);
    if (!source) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (req.user.role === 'vendor' && source.vendor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (req.user.role !== 'admin' && req.user.role !== 'vendor') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const raw = source.toObject();
    delete raw._id;
    delete raw.id;
    delete raw.createdAt;
    delete raw.updatedAt;
    delete raw.__v;

    const baseSku = raw.sku || 'COPY';
    raw.sku = `${baseSku}-COPY-${Date.now().toString().slice(-6)}`;
    raw.name = `${raw.name || raw.title || 'Product'} (Copy)`;
    raw.title = raw.name;
    if (raw.slug) raw.slug = `${raw.slug}-copy-${Date.now().toString().slice(-4)}`;
    if (req.user.role === 'admin') {
      raw.admin = req.user._id;
      raw.lifecycle = raw.lifecycle || 'Published';
      raw.status = 'approved';
      raw.published = raw.lifecycle === 'Published';
    } else {
      raw.vendor = req.user._id;
      raw.lifecycle = 'Draft';
      raw.published = false;
      raw.status = 'pending';
    }

    const created = await Product.create(raw);
    const inv = await Inventory.findOne({ product: source._id }).lean();
    await syncInventory(created, inv?.stock ?? 0, {
      trackQuantity: inv?.trackQuantity ?? created.trackQuantity,
      warehouse: inv?.warehouse || created.warehouse,
    });
    const productWithStock = await injectStock(created);
    invalidateCatalog('products').catch(() => {});
    res.status(201).json({ success: true, data: productWithStock });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductCategories,
  getProductById,
  getRelatedProducts,
  createProduct,
  getVendorProducts,
  getAdminProducts,
  updateProductStatus,
  submitProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
};
