const WidgetInstance = require('../models/widgetInstanceModel');
const Ad = require('../models/adModel');
const BlogCategory = require('../models/blogCategoryModel');

const listWidgets = async (req, res) => {
  try {
    const widgets = await WidgetInstance.find({}).sort({ sidebarKey: 1, order: 1 }).lean();
    res.json({ success: true, data: widgets.map((w) => ({ ...w, id: String(w._id) })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createWidget = async (req, res) => {
  try {
    const { sidebarKey, widgetType, settings } = req.body;
    if (!sidebarKey || !widgetType) {
      return res.status(400).json({ success: false, message: 'sidebarKey and widgetType are required' });
    }
    const maxOrder = await WidgetInstance.findOne({ sidebarKey }).sort({ order: -1 }).select('order').lean();
    const widget = await WidgetInstance.create({
      sidebarKey,
      widgetType,
      settings: settings || {},
      order: (maxOrder?.order ?? -1) + 1,
    });
    res.status(201).json({ success: true, data: { ...widget.toObject(), id: String(widget._id) } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateWidget = async (req, res) => {
  try {
    const widget = await WidgetInstance.findById(req.params.id);
    if (!widget) return res.status(404).json({ success: false, message: 'Widget not found' });

    const { sidebarKey, order, settings } = req.body;
    if (sidebarKey !== undefined) widget.sidebarKey = sidebarKey;
    if (order !== undefined) widget.order = order;
    if (settings !== undefined) widget.settings = settings;

    await widget.save();
    res.json({ success: true, data: { ...widget.toObject(), id: String(widget._id) } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc  Bulk reorder/move — accepts the full list of {id, sidebarKey, order} after a drag-and-drop.
// @route PUT /api/widgets/reorder
const reorderWidgets = async (req, res) => {
  try {
    const updates = Array.isArray(req.body.updates) ? req.body.updates : [];
    await Promise.all(
      updates.map((u) =>
        WidgetInstance.findByIdAndUpdate(u.id, { sidebarKey: u.sidebarKey, order: u.order })
      )
    );
    res.json({ success: true, data: { updated: updates.length } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteWidget = async (req, res) => {
  try {
    const widget = await WidgetInstance.findById(req.params.id);
    if (!widget) return res.status(404).json({ success: false, message: 'Widget not found' });
    await widget.deleteOne();
    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Source lists (Ads / Blog categories) for widget settings pickers.
// @route GET /api/widgets/meta/sources
const getWidgetSources = async (req, res) => {
  try {
    const [ads, blogCategories] = await Promise.all([
      Ad.find({}).select('title').sort({ title: 1 }).limit(200).lean(),
      BlogCategory.find({}).select('name').sort({ name: 1 }).limit(200).lean(),
    ]);
    res.json({
      success: true,
      data: {
        ads: ads.map((a) => ({ id: String(a._id), title: a.title })),
        blogCategories: blogCategories.map((c) => ({ id: String(c._id), title: c.name })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { listWidgets, createWidget, updateWidget, reorderWidgets, deleteWidget, getWidgetSources };
