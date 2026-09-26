const PaymentMethod = require('../models/paymentMethodModel');
const { encrypt, decrypt, mask } = require('../utils/crypto');
const { getGateway, listGatewayDefs } = require('../services/paymentGateways');

const decryptConfig = (doc) => {
  if (!doc.encryptedConfig) return {};
  try {
    return JSON.parse(decrypt(doc.encryptedConfig)) || {};
  } catch {
    return {};
  }
};

const serializeAdmin = (doc) => {
  const o = doc.toObject ? doc.toObject() : { ...doc };
  const gateway = getGateway(o.code);
  const config = decryptConfig(o);
  const maskedConfig = {};
  (gateway?.configFields || []).forEach((field) => {
    const value = config[field.key] || '';
    maskedConfig[field.key] = field.secret ? mask(value) : value;
  });
  return {
    ...o,
    id: String(o._id),
    configFields: gateway?.configFields || [],
    config: maskedConfig,
    hasConfig: Object.values(config).some(Boolean),
  };
};

// @desc    List all payment methods (admin) — secrets masked
// @route   GET /api/payments/methods
const listMethods = async (req, res) => {
  try {
    const rows = await PaymentMethod.find({}).sort({ sortOrder: 1 });
    res.json({ success: true, data: rows.map(serializeAdmin) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Public list of enabled payment methods for checkout — no secrets, no config
// @route   GET /api/payments/methods/public
const listPublicMethods = async (req, res) => {
  try {
    const rows = await PaymentMethod.find({ isEnabled: true, status: 'Published' }).sort({ sortOrder: 1 });
    res.json({
      success: true,
      data: rows.map((r) => ({
        code: r.code,
        name: r.name,
        description: r.description,
        instructions: r.instructions,
        logo: r.logo,
        isDefault: r.isDefault,
        minOrderAmount: r.minOrderAmount,
        allCountries: r.allCountries,
        countries: r.countries,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle a method's enabled state
// @route   PUT /api/payments/methods/:id/toggle
const toggleMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findById(req.params.id);
    if (!method) return res.status(404).json({ success: false, message: 'Not found' });
    method.isEnabled = req.body.isEnabled !== undefined ? Boolean(req.body.isEnabled) : !method.isEnabled;
    await method.save();
    res.json({ success: true, data: serializeAdmin(method) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save a method's full settings: gateway config (encrypted), display name,
//          payment guide, minimum order amount, and available-countries restriction.
// @route   PUT /api/payments/methods/:id/config
const saveMethodConfig = async (req, res) => {
  try {
    const method = await PaymentMethod.findById(req.params.id);
    if (!method) return res.status(404).json({ success: false, message: 'Not found' });
    const gateway = getGateway(method.code);
    const existing = decryptConfig(method);
    const incoming = req.body.config || {};
    const next = { ...existing };
    (gateway?.configFields || []).forEach((field) => {
      const value = incoming[field.key];
      // A masked value (starts with the bullet mask) means "unchanged" — keep existing.
      if (value !== undefined && !String(value).startsWith('••••')) {
        next[field.key] = value;
      }
    });
    if (req.body.name !== undefined) method.name = req.body.name;
    if (req.body.instructions !== undefined) method.instructions = req.body.instructions;
    if (req.body.minOrderAmount !== undefined) method.minOrderAmount = Number(req.body.minOrderAmount) || 0;
    if (req.body.allCountries !== undefined) method.allCountries = Boolean(req.body.allCountries);
    if (Array.isArray(req.body.countries)) method.countries = req.body.countries;
    method.encryptedConfig = encrypt(JSON.stringify(next));
    await method.save();
    res.json({ success: true, data: serializeAdmin(method) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Make a method the storefront's pre-selected default (only one at a time)
// @route   PUT /api/payments/methods/:id/default
const setDefaultMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findById(req.params.id);
    if (!method) return res.status(404).json({ success: false, message: 'Not found' });
    await PaymentMethod.updateMany({ _id: { $ne: method._id } }, { $set: { isDefault: false } });
    method.isDefault = true;
    await method.save();
    res.json({ success: true, data: serializeAdmin(method) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    List gateway definitions not yet added as a PaymentMethod row (for an "Add plugin" picker)
// @route   GET /api/payments/methods/available
const listAvailableGateways = async (req, res) => {
  try {
    const existingCodes = new Set((await PaymentMethod.find({}).select('code')).map((m) => m.code));
    const available = listGatewayDefs().filter((g) => !existingCodes.has(g.code));
    res.json({ success: true, data: available.map((g) => ({ code: g.code, name: g.name, configFields: g.configFields })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a new payment method row from a known gateway definition
// @route   POST /api/payments/methods
const createMethod = async (req, res) => {
  try {
    const { code } = req.body;
    const gateway = getGateway(code);
    if (!gateway) return res.status(400).json({ success: false, message: 'Unknown gateway code' });
    const exists = await PaymentMethod.findOne({ code });
    if (exists) return res.status(400).json({ success: false, message: 'This payment method is already added' });
    const method = await PaymentMethod.create({
      name: gateway.name,
      code,
      description: req.body.description || '',
      instructions: gateway.defaultInstructions,
      isEnabled: false,
      sortOrder: await PaymentMethod.countDocuments(),
    });
    res.status(201).json({ success: true, data: serializeAdmin(method) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findByIdAndDelete(req.params.id);
    if (!method) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: { id: String(method._id) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listMethods,
  listPublicMethods,
  toggleMethod,
  saveMethodConfig,
  setDefaultMethod,
  listAvailableGateways,
  createMethod,
  deleteMethod,
  decryptConfig,
};
