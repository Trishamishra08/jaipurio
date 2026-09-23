const AdSetting = require('../models/adSettingModel');

const getAdSettings = async (req, res) => {
  try {
    let doc = await AdSetting.findOne({ key: 'default' });
    if (!doc) doc = await AdSetting.create({ key: 'default' });
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const TRUTHY = new Set(['yes', 'true', '1', 1, true]);

const updateAdSettings = async (req, res) => {
  try {
    const payload = { ...req.body };
    delete payload._id;
    delete payload.id;
    delete payload.key;
    if (payload.enableAds !== undefined) {
      const raw = payload.enableAds;
      payload.enableAds = TRUTHY.has(typeof raw === 'string' ? raw.toLowerCase() : raw);
    }
    const doc = await AdSetting.findOneAndUpdate({ key: 'default' }, payload, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    });
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getAdSettings, updateAdSettings };
