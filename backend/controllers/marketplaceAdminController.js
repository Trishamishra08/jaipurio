const MarketplaceStore = require('../models/marketplaceStoreModel');
const Vendor = require('../models/vendorModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const { slugify, normalizeSeo } = require('../utils/seoFields');

const nextLegacyId = async () => {
  const last = await MarketplaceStore.findOne({}).sort({ legacyId: -1 }).select('legacyId').lean();
  return (last?.legacyId || 8) + 1;
};

const serializeStore = (doc, extras = {}) => {
  const s = doc.toObject ? doc.toObject() : { ...doc };
  return {
    ...s,
    id: s.legacyId != null ? String(s.legacyId) : String(s._id),
    _id: s._id,
    vendorDisplay:
      s.vendorName ||
      (s.vendor && typeof s.vendor === 'object'
        ? s.vendor.storeName || s.vendor.fullName || s.vendor.businessName
        : '') ||
      '',
    ...extras,
  };
};

const refreshStoreStats = async (store) => {
  const vendorId = store.vendor;
  let productsCount = 0;
  let earnings = Number(store.earnings) || 0;

  if (vendorId) {
    productsCount = await Product.countDocuments({
      $or: [{ vendor: vendorId }, { storeName: store.name }],
    });
    const orders = await Order.find({
      'orderItems.vendor': vendorId,
      isPaid: true,
    })
      .select('orderItems totalPrice')
      .lean();
    earnings = orders.reduce((sum, order) => {
      const items = (order.orderItems || []).filter(
        (item) => String(item.vendor) === String(vendorId)
      );
      const line = items.reduce((s, item) => s + Number(item.price || 0) * Number(item.qty || 1), 0);
      return sum + line;
    }, 0);
  } else if (store.name) {
    productsCount = await Product.countDocuments({
      $or: [{ storeName: store.name }, { store: store.name }, { brand: store.name }],
    });
  }

  store.productsCount = productsCount;
  store.earnings = Math.round(earnings * 100) / 100;
  await store.save();
  return store;
};

const listStores = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const filter = {};
    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { vendorName: new RegExp(q, 'i') },
      ];
    }
    if (req.query.status) filter.status = req.query.status;

    const stores = await MarketplaceStore.find(filter)
      .populate('vendor', 'fullName storeName email businessName')
      .sort({ legacyId: -1, createdAt: -1 });

    const data = await Promise.all(
      stores.map(async (store) => {
        try {
          await refreshStoreStats(store);
        } catch {
          /* keep stored stats */
        }
        return serializeStore(store);
      })
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStoreById = async (req, res) => {
  try {
    const key = String(req.params.id || '').trim();
    let store = null;
    if (/^[a-fA-F0-9]{24}$/.test(key)) {
      store = await MarketplaceStore.findById(key).populate(
        'vendor',
        'fullName storeName email businessName mobile'
      );
    }
    if (!store && /^\d+$/.test(key)) {
      store = await MarketplaceStore.findOne({ legacyId: Number(key) }).populate(
        'vendor',
        'fullName storeName email businessName mobile'
      );
    }
    if (!store) {
      store = await MarketplaceStore.findOne({ slug: key }).populate(
        'vendor',
        'fullName storeName email businessName mobile'
      );
    }
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    await refreshStoreStats(store);
    res.status(200).json({ success: true, data: serializeStore(store) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createStore = async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.name) {
      return res.status(400).json({ success: false, message: 'Store name is required' });
    }
    const legacyId = body.legacyId || (await nextLegacyId());
    const slug = body.slug || slugify(body.name);
    const seo = normalizeSeo(body, body.name, body.description || '');
    if (seo.general && !seo.general.slug) seo.general.slug = slug;

    let vendorName = body.vendorName || '';
    if (body.vendor) {
      const vendor = await Vendor.findById(body.vendor).select('fullName storeName businessName');
      if (vendor) {
        vendorName = vendor.storeName || vendor.fullName || vendor.businessName || vendorName;
      }
    }

    const store = await MarketplaceStore.create({
      legacyId,
      name: body.name,
      slug,
      email: body.email || '',
      phone: body.phone || '',
      logo: body.logo || '',
      coverImage: body.coverImage || '',
      description: body.description || '',
      content: body.content || '',
      status: body.status || 'Published',
      vendor: body.vendor || undefined,
      vendorName,
      companyName: body.companyName || '',
      taxId: body.taxId || '',
      taxCountry: body.taxCountry || 'IN',
      taxState: body.taxState || '',
      address: body.address || '',
      country: body.country || 'India',
      state: body.state || '',
      city: body.city || '',
      zipCode: body.zipCode || '',
      isVerified: Boolean(body.isVerified),
      verifiedAt: body.isVerified ? body.verifiedAt || new Date() : undefined,
      verifiedBy: body.verifiedBy || '',
      verificationNote: body.verificationNote || '',
      isFeatured: Boolean(body.isFeatured),
      seo,
    });

    await refreshStoreStats(store);
    res.status(201).json({ success: true, data: serializeStore(store) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStore = async (req, res) => {
  try {
    const key = String(req.params.id || '').trim();
    let store = null;
    if (/^[a-fA-F0-9]{24}$/.test(key)) store = await MarketplaceStore.findById(key);
    if (!store && /^\d+$/.test(key)) store = await MarketplaceStore.findOne({ legacyId: Number(key) });
    if (!store) store = await MarketplaceStore.findOne({ slug: key });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const body = req.body || {};
    const fields = [
      'name',
      'email',
      'phone',
      'logo',
      'coverImage',
      'description',
      'content',
      'status',
      'vendor',
      'vendorName',
      'companyName',
      'taxId',
      'taxCountry',
      'taxState',
      'address',
      'country',
      'state',
      'city',
      'zipCode',
      'verificationNote',
      'verifiedBy',
      'isFeatured',
    ];
    fields.forEach((keyName) => {
      if (body[keyName] !== undefined) store[keyName] = body[keyName];
    });

    if (body.slug) store.slug = body.slug;
    else if (body.name) store.slug = slugify(body.name);

    if (body.isVerified !== undefined) {
      store.isVerified = Boolean(body.isVerified);
      if (store.isVerified && !store.verifiedAt) store.verifiedAt = new Date();
      if (!store.isVerified) store.verifiedAt = undefined;
    }

    if (body.vendor) {
      const vendor = await Vendor.findById(body.vendor).select('fullName storeName businessName');
      if (vendor) {
        store.vendorName = vendor.storeName || vendor.fullName || vendor.businessName || store.vendorName;
      }
    }

    store.seo = normalizeSeo(body, store.name, store.description || '');
    if (store.seo.general && !store.seo.general.slug) store.seo.general.slug = store.slug;

    await store.save();
    await refreshStoreStats(store);
    const populated = await MarketplaceStore.findById(store._id).populate(
      'vendor',
      'fullName storeName email businessName mobile'
    );
    res.status(200).json({ success: true, data: serializeStore(populated) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteStore = async (req, res) => {
  try {
    const key = String(req.params.id || '').trim();
    let store = null;
    if (/^[a-fA-F0-9]{24}$/.test(key)) store = await MarketplaceStore.findById(key);
    if (!store && /^\d+$/.test(key)) store = await MarketplaceStore.findOne({ legacyId: Number(key) });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    await store.deleteOne();
    res.status(200).json({ success: true, message: 'Store deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMarketplaceReports = async (req, res) => {
  try {
    const stores = await MarketplaceStore.find({}).lean();
    const vendorsCount = await Vendor.countDocuments({});
    const approvedVendors = await Vendor.countDocuments({ isApproved: true });
    const pendingVendors = await Vendor.countDocuments({ isApproved: false, isBlocked: { $ne: true } });

    const paidOrders = await Order.find({ isPaid: true }).select('totalPrice createdAt orderItems').lean();
    const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.totalPrice || 0), 0);
    const totalCommission = stores.reduce((s, st) => {
      const rate = 0.1;
      return s + Number(st.earnings || 0) * rate;
    }, 0);
    const vendorEarnings = stores.reduce((s, st) => s + Number(st.earnings || 0), 0);

    const topStores = [...stores]
      .sort((a, b) => Number(b.earnings || 0) - Number(a.earnings || 0))
      .slice(0, 8)
      .map((st) => ({
        id: st.legacyId != null ? String(st.legacyId) : String(st._id),
        name: st.name,
        earnings: st.earnings || 0,
        productsCount: st.productsCount || 0,
        status: st.status,
      }));

    const byDay = {};
    paidOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      if (Number.isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0, 10);
      if (!byDay[key]) byDay[key] = { date: key, sales: 0, orders: 0 };
      byDay[key].sales += Number(o.totalPrice || 0);
      byDay[key].orders += 1;
    });
    const salesTrend = Object.values(byDay)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          vendorEarnings: Math.round(vendorEarnings * 100) / 100,
          platformCommission: Math.round(totalCommission * 100) / 100,
          storesCount: stores.length,
          vendorsCount,
          approvedVendors,
          pendingVendors,
          paidOrders: paidOrders.length,
          productsAcrossStores: stores.reduce((s, st) => s + Number(st.productsCount || 0), 0),
        },
        topStores,
        salesTrend,
        recentStores: stores
          .slice()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10)
          .map((st) => ({
            id: st.legacyId != null ? String(st.legacyId) : String(st._id),
            name: st.name,
            status: st.status,
            createdAt: st.createdAt,
            earnings: st.earnings || 0,
          })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const syncStoresFromVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({}).select('-password');
    let created = 0;
    let updated = 0;
    for (const vendor of vendors) {
      const existing = await MarketplaceStore.findOne({
        $or: [{ vendor: vendor._id }, { email: vendor.email }],
      });
      const payload = {
        name: vendor.storeName || vendor.businessName || vendor.fullName,
        email: vendor.email || '',
        phone: vendor.mobile || '',
        description: vendor.storeDescription || '',
        vendor: vendor._id,
        vendorName: vendor.fullName || vendor.storeName,
        companyName: vendor.businessName || '',
        taxId: vendor.gstNumber || '',
        address: vendor.businessAddress || '',
        city: vendor.city || '',
        state: vendor.state || '',
        status: vendor.isBlocked ? 'Blocked' : vendor.isApproved ? 'Published' : 'Pending',
        isVerified: Boolean(vendor.isApproved),
        slug: slugify(vendor.storeName || vendor.businessName || vendor.fullName || 'store'),
      };
      if (existing) {
        Object.assign(existing, payload);
        await existing.save();
        await refreshStoreStats(existing);
        updated += 1;
      } else {
        const legacyId = await nextLegacyId();
        const store = await MarketplaceStore.create({
          ...payload,
          legacyId,
          seo: normalizeSeo({}, payload.name, payload.description),
        });
        await refreshStoreStats(store);
        created += 1;
      }
    }
    res.status(200).json({ success: true, data: { created, updated, total: vendors.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  getMarketplaceReports,
  syncStoresFromVendors,
  serializeStore,
  refreshStoreStats,
  nextLegacyId,
};
