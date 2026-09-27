const Menu = require('../models/menuModel');
const Page = require('../models/pageModel');
const Category = require('../models/categoryModel');
const Brand = require('../models/ecommerceBrandModel');
const BlogCategory = require('../models/blogCategoryModel');
const ProductTag = require('../models/ecommerceProductTagModel');

const slugify = (v = '') =>
  v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const listMenus = async (req, res) => {
  try {
    const menus = await Menu.find({}).sort({ createdAt: -1 }).lean();
    const data = menus.map((m) => ({
      id: String(m._id),
      name: m.name,
      status: m.status,
      locations: m.locations || [],
      itemsCount: (m.items || []).length,
      createdAt: m.createdAt,
    }));
    res.json({ success: true, data, total: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id).lean();
    if (!menu) return res.status(404).json({ success: false, message: 'Menu not found' });
    res.json({ success: true, data: { ...menu, id: String(menu._id) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createMenu = async (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const menu = await Menu.create({
      name: name.trim(),
      slug: slugify(name),
      status: status || 'Published',
      locations: [],
      items: [],
    });
    res.status(201).json({ success: true, data: { ...menu.toObject(), id: String(menu._id) } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) return res.status(404).json({ success: false, message: 'Menu not found' });

    const { name, status, locations, items } = req.body;
    if (name !== undefined) {
      menu.name = name.trim();
      menu.slug = slugify(name);
    }
    if (status !== undefined) menu.status = status;
    if (locations !== undefined) menu.locations = Array.isArray(locations) ? locations : [];
    if (items !== undefined) {
      menu.items = (Array.isArray(items) ? items : []).map((item, index) => ({
        _id: item.id && /^[a-f0-9]{24}$/i.test(item.id) ? item.id : undefined,
        parentId: item.parentId || null,
        title: item.title || '',
        url: item.url || '',
        itemType: item.itemType || 'custom-link',
        referenceId: item.referenceId || null,
        icon: item.icon || '',
        iconImage: item.iconImage || '',
        order: index,
        status: item.status || 'Published',
      }));
    }

    await menu.save();
    res.json({ success: true, data: { ...menu.toObject(), id: String(menu._id) } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) return res.status(404).json({ success: false, message: 'Menu not found' });
    await menu.deleteOne();
    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Source lists (Pages / Product categories / Brands) for the menu-item picker panels.
// @route GET /api/menus/meta/sources
const getMenuSources = async (req, res) => {
  try {
    const [pages, categories, brands, blogCategories, tags] = await Promise.all([
      Page.find({}).select('name slug').sort({ name: 1 }).limit(200).lean(),
      Category.find({}).select('title slug url').sort({ title: 1 }).limit(200).lean(),
      Brand.find({}).select('name slug').sort({ name: 1 }).limit(200).lean(),
      BlogCategory.find({}).select('name slug').sort({ name: 1 }).limit(200).lean(),
      ProductTag.find({}).select('name slug').sort({ name: 1 }).limit(200).lean(),
    ]);
    res.json({
      success: true,
      data: {
        pages: pages.map((p) => ({ id: String(p._id), title: p.name, url: `/${p.slug || ''}` })),
        productCategories: categories.map((c) => ({
          id: String(c._id),
          title: c.title,
          url: c.url || `/category/${c.slug || ''}`,
        })),
        brands: brands.map((b) => ({ id: String(b._id), title: b.name, url: `/brand/${b.slug || ''}` })),
        categories: blogCategories.map((c) => ({ id: String(c._id), title: c.name, url: `/blog/category/${c.slug || ''}` })),
        tags: tags.map((t) => ({ id: String(t._id), title: t.name, url: `/products?tag=${t.slug || ''}` })),
        locations: Menu.MENU_LOCATIONS,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { listMenus, getMenu, createMenu, updateMenu, deleteMenu, getMenuSources };
