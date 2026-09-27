const SimpleSlider = require('../models/simpleSliderModel');

const slugifyKey = (value = '') =>
  value
    .toString()
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `slider-${Date.now()}`;

const ensureUniqueKey = async (baseKey, excludeId = null) => {
  let key = slugifyKey(baseKey);
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = { key };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await SimpleSlider.findOne(query).lean();
    if (!existing) return key;
    suffix += 1;
    key = `${slugifyKey(baseKey)}-${suffix}`;
  }
};

const sortItems = (items = []) =>
  [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

const listSliders = async (req, res) => {
  try {
    const sliders = await SimpleSlider.find({}).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: sliders, total: sliders.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSlider = async (req, res) => {
  try {
    const slider = await SimpleSlider.findById(req.params.id);
    if (!slider) return res.status(404).json({ success: false, message: 'Slider not found' });
    res.status(200).json({ success: true, data: slider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSlider = async (req, res) => {
  try {
    const { name, key, description, status, items } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const finalKey = await ensureUniqueKey(key || name);
    const slider = await SimpleSlider.create({
      name: name.trim(),
      key: finalKey,
      description: description || '',
      status: status || 'Published',
      items: sortItems(items || []),
    });
    res.status(201).json({ success: true, data: slider });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateSlider = async (req, res) => {
  try {
    const slider = await SimpleSlider.findById(req.params.id);
    if (!slider) return res.status(404).json({ success: false, message: 'Slider not found' });

    const { name, key, description, status, items } = req.body;
    if (name !== undefined) slider.name = name.trim();
    if (key !== undefined && key !== slider.key) {
      slider.key = await ensureUniqueKey(key, slider._id);
    }
    if (description !== undefined) slider.description = description;
    if (status !== undefined) slider.status = status;
    if (items !== undefined) slider.items = sortItems(items);

    await slider.save();
    res.status(200).json({ success: true, data: slider });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteSlider = async (req, res) => {
  try {
    const slider = await SimpleSlider.findById(req.params.id);
    if (!slider) return res.status(404).json({ success: false, message: 'Slider not found' });
    await slider.deleteOne();
    res.status(200).json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Public: resolve a slider by its shortcode key for storefront rendering.
const resolveSliderByKey = async (req, res) => {
  try {
    const slider = await SimpleSlider.findOne({ key: req.params.key, status: 'Published' }).lean();
    if (!slider) return res.status(404).json({ success: false, message: 'Slider not found' });
    res.status(200).json({
      success: true,
      data: { ...slider, items: sortItems(slider.items || []) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listSliders,
  getSlider,
  createSlider,
  updateSlider,
  deleteSlider,
  resolveSliderByKey,
};
