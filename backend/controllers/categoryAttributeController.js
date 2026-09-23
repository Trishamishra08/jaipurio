const EcommerceCategoryAttribute = require('../models/ecommerceCategoryAttributeModel');
const { serializeDoc } = require('../utils/crudFactory');

// @desc    List attributes assigned to a category (populated, sorted by sortOrder)
// @route   GET /api/ecommerce/categories/:categoryId/attributes
const listForCategory = async (req, res) => {
  try {
    const rows = await EcommerceCategoryAttribute.find({ category: req.params.categoryId })
      .populate({ path: 'attribute', populate: { path: 'group', select: 'name slug' } })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    res.json({ success: true, data: rows.map(serializeDoc), total: rows.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign a specification attribute to a category
// @route   POST /api/ecommerce/categories/:categoryId/attributes
const assignAttribute = async (req, res) => {
  try {
    const { attribute, isRequired, isVariantAttribute, isFilterable, sortOrder, status } = req.body;
    if (!attribute) {
      return res.status(400).json({ success: false, message: 'attribute is required' });
    }
    const doc = await EcommerceCategoryAttribute.create({
      category: req.params.categoryId,
      attribute,
      isRequired: Boolean(isRequired),
      isVariantAttribute: Boolean(isVariantAttribute),
      isFilterable: Boolean(isFilterable),
      sortOrder: Number(sortOrder) || 0,
      status: status || 'Published',
    });
    const populated = await doc.populate({ path: 'attribute', populate: { path: 'group', select: 'name slug' } });
    res.status(201).json({ success: true, data: serializeDoc(populated) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'This attribute is already assigned to the category' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a category-attribute assignment
// @route   PUT /api/ecommerce/categories/:categoryId/attributes/:assignmentId
const updateAssignment = async (req, res) => {
  try {
    const payload = { ...req.body };
    delete payload._id;
    delete payload.id;
    delete payload.category;
    delete payload.attribute;
    const doc = await EcommerceCategoryAttribute.findOneAndUpdate(
      { _id: req.params.assignmentId, category: req.params.categoryId },
      payload,
      { new: true, runValidators: true }
    ).populate({ path: 'attribute', populate: { path: 'group', select: 'name slug' } });
    if (!doc) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, data: serializeDoc(doc) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Remove a category-attribute assignment
// @route   DELETE /api/ecommerce/categories/:categoryId/attributes/:assignmentId
const removeAssignment = async (req, res) => {
  try {
    const doc = await EcommerceCategoryAttribute.findOneAndDelete({
      _id: req.params.assignmentId,
      category: req.params.categoryId,
    });
    if (!doc) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, data: { id: String(doc._id) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reorder attribute assignments for a category
// @route   POST /api/ecommerce/categories/:categoryId/attributes/reorder
const reorderAssignments = async (req, res) => {
  try {
    const order = Array.isArray(req.body.order) ? req.body.order : [];
    await Promise.all(
      order.map((id, index) =>
        EcommerceCategoryAttribute.updateOne(
          { _id: id, category: req.params.categoryId },
          { sortOrder: index }
        )
      )
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listForCategory,
  assignAttribute,
  updateAssignment,
  removeAssignment,
  reorderAssignments,
};
