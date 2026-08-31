const Inventory = require('../models/inventoryModel');
const Product = require('../models/productModel');
const { invalidateCatalog } = require('../utils/cache');
const { stockStatusFromQty, LOW_STOCK_THRESHOLD } = require('../constants/flow');
const { serializeProduct } = require('../utils/marketplace');

const updateStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { stock, warehouse, trackQuantity } = req.body;

    if (stock === undefined) {
      return res.status(400).json({ success: false, message: 'Stock value is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (req.user.role === 'vendor' && product.vendor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const qty = Number(stock);
    const track = trackQuantity !== undefined ? Boolean(trackQuantity) : product.trackQuantity;
    const status = stockStatusFromQty(qty, track);

    const inventory = await Inventory.findOneAndUpdate(
      { product: productId },
      {
        product: product._id,
        vendor: product.vendor,
        admin: product.admin,
        stock: qty,
        warehouse: warehouse || product.warehouse,
        trackQuantity: track,
        stockStatus: status,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    product.trackQuantity = track;
    product.warehouse = warehouse || product.warehouse;
    product.stockStatus = status;
    await product.save();

    invalidateCatalog('products').catch(() => {});
    res.status(200).json({
      success: true,
      data: serializeProduct(product, inventory),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const listInventory = async (req, res) => {
  try {
    const filter = req.user.role === 'vendor' ? { vendor: req.user._id } : {};
    const products = await Product.find(filter).sort('sku');
    const inventories = await Inventory.find({ product: { $in: products.map((p) => p._id) } });
    const rows = products.map((product) => {
      const inv = inventories.find((i) => i.product.toString() === product._id.toString());
      return serializeProduct(product, inv);
    });
    const summary = {
      skus: rows.length,
      lowStock: rows.filter((r) => r.lowStock).length,
      outOfStock: rows.filter((r) => r.stockStatus === 'Out of Stock').length,
      threshold: LOW_STOCK_THRESHOLD,
    };
    res.status(200).json({ success: true, data: rows, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  updateStock,
  listInventory,
};
