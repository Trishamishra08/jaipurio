const Product = require('../models/productModel');
const Inventory = require('../models/inventoryModel');
const { invalidateCatalog } = require('../utils/cache');
const { optimizeMediaUrls } = require('../utils/imageOptimize');
const { lifecycleToLegacyStatus, stockStatusFromQty } = require('../constants/flow');
const { serializeProduct } = require('../utils/marketplace');

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
  return {
    ...body,
    ...normalizeProductMedia(body),
    name: title,
    title,
    storeName: body.store || body.storeName,
    salePrice: body.salePrice || body.oldPrice,
    oldPrice: body.oldPrice || body.salePrice,
    isFeatured: Boolean(body.isFeatured || body.bestseller),
    lifecycle,
    status: lifecycleToLegacyStatus(lifecycle),
    published: lifecycle === 'Published',
    stockStatus: body.stockStatus || stockStatusFromQty(stock, trackQuantity),
    trackQuantity,
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

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $or: [{ lifecycle: 'Published' }, { status: 'approved' }]
    })
      .populate('vendor', 'storeName fullName')
      .populate('admin', 'name')
      .lean();
    const productsWithStock = await injectStock(products);
    res.status(200).json({ success: true, data: { products: productsWithStock } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendor', 'storeName fullName')
      .populate('admin', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const canSeeHidden = req.user && (req.user.role === 'admin' || (req.user.role === 'vendor' && product.vendor?.toString() === req.user._id.toString()));
    if (product.lifecycle !== 'Published' && product.status !== 'approved' && !canSeeHidden) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const data = await injectStock(product);
    res.status(200).json({ success: true, data });
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
    const products = await Product.find({ vendor: req.user._id }).sort('-createdAt');
    const productsWithStock = await injectStock(products);
    res.status(200).json({ success: true, data: productsWithStock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate('vendor', 'storeName fullName')
      .populate('admin', 'name')
      .sort('-createdAt');
    const productsWithStock = await injectStock(products);
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

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  getVendorProducts,
  getAdminProducts,
  updateProductStatus,
  submitProduct,
  updateProduct,
  deleteProduct
};
