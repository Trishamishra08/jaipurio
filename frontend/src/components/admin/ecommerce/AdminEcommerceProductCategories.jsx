import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Plus, Folder, GripVertical, Minus, Save, Check, Trash2, X } from 'lucide-react';
import EcommerceLayout from './EcommerceLayout';
import AdminCkEditor from './AdminCkEditor';
import SeoEditorPanel, { normalizeSeoState } from './SeoEditorPanel';
import { categoryService } from '../../../services/categoryService';
import {
  liveEcommerceList,
  fetchCategoryAttributes,
  assignCategoryAttribute,
  updateCategoryAttribute,
  removeCategoryAttribute,
} from '../../../utils/ecommerceApi';

const slugify = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const buildTree = (flat) => {
  const byId = new Map(flat.map((c) => [String(c._id), { ...c, children: [] }]));
  const roots = [];
  byId.forEach((node) => {
    const parentId = node.parent ? String(node.parent._id || node.parent) : null;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
};

export const AdminEcommerceProductCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [permalink, setPermalink] = useState('');
  const [parent, setParent] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [seo, setSeo] = useState(() => normalizeSeoState());
  const [seoOpen, setSeoOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  // Category → Attributes assignment
  const [allAttributes, setAllAttributes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attrLoading, setAttrLoading] = useState(false);
  const [attrToAdd, setAttrToAdd] = useState('');
  const [attrError, setAttrError] = useState('');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await categoryService.getAllCategories();
      setCategories(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setLoadError(err?.response?.data?.message || err?.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    liveEcommerceList('specification-attributes')
      .then((list) => setAllAttributes(Array.isArray(list) ? list : []))
      .catch(() => setAllAttributes([]));
  }, [loadCategories]);

  const tree = useMemo(() => buildTree(categories), [categories]);

  const loadAssignments = useCallback(async (categoryId) => {
    if (!categoryId) {
      setAssignments([]);
      return;
    }
    setAttrLoading(true);
    setAttrError('');
    try {
      const rows = await fetchCategoryAttributes(categoryId);
      setAssignments(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setAssignments([]);
      setAttrError(err?.parsedMessage || err?.message || 'Failed to load attributes');
    } finally {
      setAttrLoading(false);
    }
  }, []);

  const toggleNode = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectCategory = (category) => {
    const id = String(category._id);
    setSelectedId(id);
    setName(category.title || '');
    setPermalink(category.slug || slugify(category.title || ''));
    setParent(category.parent ? String(category.parent._id || category.parent) : '');
    setDescription(category.description || '');
    setIsActive(category.isActive !== false);
    setSeo(
      normalizeSeoState(category.seo, {
        slug: category.slug,
        seoTitle: category.seoTitle,
        seoDescription: category.seoDescription,
      })
    );
    setSeoOpen(false);
    setSaveError('');
    loadAssignments(id);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!selectedId) setPermalink(slugify(val));
  };

  const handleCreateNew = () => {
    setSelectedId(null);
    setName('');
    setPermalink('');
    setParent('');
    setDescription('');
    setIsActive(true);
    setSeo(normalizeSeoState());
    setSeoOpen(false);
    setSaveError('');
    setAssignments([]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setSaveError('Name is required');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        title: name.trim(),
        url: permalink || slugify(name),
        parent: parent || null,
        description,
        isActive,
        seo,
        seoTitle: seo.general.metaTitle,
        seoDescription: seo.general.metaDescription,
      };
      if (selectedId) {
        await categoryService.updateCategory(selectedId, payload);
      } else {
        const created = await categoryService.createCategory(payload);
        const newId = created?.data?._id;
        if (newId) setSelectedId(String(newId));
      }
      await loadCategories();
      setSavedToast(true);
      window.setTimeout(() => setSavedToast(false), 2000);
    } catch (err) {
      setSaveError(err?.response?.data?.message || err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category "${category.title}"? This cannot be undone.`)) return;
    try {
      await categoryService.deleteCategory(category._id);
      if (selectedId === String(category._id)) handleCreateNew();
      await loadCategories();
    } catch (err) {
      window.alert(err?.response?.data?.message || err?.message || 'Delete failed');
    }
  };

  const unassignedAttributes = useMemo(() => {
    const assignedIds = new Set(assignments.map((a) => String(a.attribute?._id || a.attribute)));
    return allAttributes.filter((a) => !assignedIds.has(String(a._id || a.id)));
  }, [allAttributes, assignments]);

  const handleAssignAttribute = async () => {
    if (!attrToAdd || !selectedId) return;
    setAttrError('');
    try {
      await assignCategoryAttribute(selectedId, {
        attribute: attrToAdd,
        sortOrder: assignments.length,
      });
      setAttrToAdd('');
      await loadAssignments(selectedId);
    } catch (err) {
      setAttrError(err?.parsedMessage || err?.message || 'Failed to assign attribute');
    }
  };

  const handleToggleFlag = async (assignment, field) => {
    try {
      await updateCategoryAttribute(selectedId, assignment._id, { [field]: !assignment[field] });
      await loadAssignments(selectedId);
    } catch (err) {
      setAttrError(err?.parsedMessage || err?.message || 'Update failed');
    }
  };

  const handleRemoveAssignment = async (assignment) => {
    try {
      await removeCategoryAttribute(selectedId, assignment._id);
      await loadAssignments(selectedId);
    } catch (err) {
      setAttrError(err?.parsedMessage || err?.message || 'Remove failed');
    }
  };

  const renderTree = (nodes, level = 0) => (
    <div className={`space-y-1 ${level > 0 ? 'ml-6 pl-2 border-l border-slate-200' : ''}`}>
      {nodes.map((node) => {
        const hasChildren = node.children && node.children.length > 0;
        const isSelected = selectedId === String(node._id);
        const isOpen = expanded[node._id] !== false;

        return (
          <div key={node._id} className="select-none">
            <div
              className={`flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => selectCategory(node)}
            >
              <div className="flex items-center gap-2 overflow-hidden pr-2">
                <GripVertical size={14} className="text-slate-400 flex-shrink-0" />
                <Folder size={15} className="text-slate-400 flex-shrink-0" />
                <span className="font-medium truncate text-[13px]">{node.title}</span>
                {!node.isActive ? (
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    Inactive
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(node);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                  title="Delete category"
                >
                  <Trash2 size={13} />
                </button>
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNode(node._id);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                  >
                    {isOpen ? <Minus size={13} /> : <Plus size={13} />}
                  </button>
                ) : (
                  <div className="w-5" />
                )}
              </div>
            </div>

            {hasChildren && isOpen && <div className="mt-1">{renderTree(node.children, level + 1)}</div>}
          </div>
        );
      })}
    </div>
  );

  return (
    <EcommerceLayout breadcrumb={['ECOMMERCE', 'PRODUCT CATEGORIES']}>
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT COLUMN: Categories Tree */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            <div className="bg-sky-50 border-l-4 border-sky-400 p-3.5 rounded-r flex items-start gap-2.5 text-sky-800 text-[13px] leading-relaxed">
              <Info size={16} className="text-sky-500 mt-0.5 flex-shrink-0" />
              <span>Select a category on the left to edit it and manage which attributes apply to it.</span>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCreateNew}
                className="bg-black text-white hover:bg-slate-800 px-4 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus size={14} />
                Create
              </button>
            </div>

            {loadError ? (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2">
                {loadError}
              </div>
            ) : null}

            {loading ? (
              <div className="py-10 text-center text-sm text-slate-500">Loading categories…</div>
            ) : tree.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">No categories yet. Create one to get started.</div>
            ) : (
              <div className="bg-transparent">{renderTree(tree)}</div>
            )}
          </div>

          {/* RIGHT COLUMN: Edit/Create Form */}
          <div className="col-span-12 lg:col-span-7 space-y-5">
            {savedToast && (
              <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
                <Check size={16} />
                <span>Category saved successfully!</span>
              </div>
            )}
            {saveError ? (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2">
                {saveError}
              </div>
            ) : null}

            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Name</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Permalink <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center text-sm border border-slate-300 rounded overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                  <span className="bg-slate-100 text-slate-500 px-3 py-2 text-xs border-r border-slate-200 select-none">
                    /product-categories/
                  </span>
                  <input
                    type="text"
                    value={permalink}
                    onChange={(e) => setPermalink(slugify(e.target.value))}
                    className="w-full px-3 py-2 text-sm outline-none text-slate-800"
                    placeholder="category-slug"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Parent</label>
                <select
                  value={parent}
                  onChange={(e) => setParent(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white text-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">None</option>
                  {categories
                    .filter((c) => String(c._id) !== String(selectedId))
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.path || c.title}
                      </option>
                    ))}
                </select>
              </div>

              <AdminCkEditor
                label="Description"
                value={description}
                onChange={setDescription}
                minHeight={140}
                placeholder="Enter category description..."
              />

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-xs font-medium text-slate-700 select-none cursor-pointer">
                  Active (visible in storefront navigation)
                </label>
              </div>
            </div>

            {/* SEO Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-semibold text-slate-800">Search Engine Optimize</h4>
                <button
                  type="button"
                  onClick={() => setSeoOpen((v) => !v)}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  {seoOpen ? 'Hide SEO meta' : 'Edit SEO meta'}
                </button>
              </div>
              {seoOpen && (
                <SeoEditorPanel
                  value={seo}
                  onChange={setSeo}
                  previewTitle={name}
                  previewUrl={`https://jaipurio.in/product-categories/${seo.general?.slug || permalink || 'slug'}`}
                  onGenerateSlug={() => {
                    const s = slugify(name);
                    setPermalink(s);
                    setSeo((prev) => ({ ...prev, general: { ...prev.general, slug: s } }));
                  }}
                />
              )}
            </div>

            {/* Publish Actions Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
              <h4 className="text-sm font-semibold text-slate-800">Publish</h4>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-60"
                >
                  <Save size={14} />
                  {saving ? 'Saving…' : selectedId ? 'Save' : 'Create'}
                </button>
              </div>
            </div>

            {/* Category → Attributes assignment */}
            {selectedId ? (
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-semibold text-slate-800">Assigned Attributes</h4>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/ecommerce/specification-attributes/create')}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    + New attribute
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Attributes assigned here will dynamically appear on products in this category. Mark an attribute
                  as <strong>Variant</strong> to let it drive product variant generation (SKU/price/stock per
                  combination).
                </p>

                {attrError ? (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2">
                    {attrError}
                  </div>
                ) : null}

                {attrLoading ? (
                  <div className="py-6 text-center text-xs text-slate-500">Loading attributes…</div>
                ) : assignments.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No attributes assigned to this category yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignments.map((a) => (
                      <div
                        key={a._id}
                        className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 rounded-md px-3 py-2"
                      >
                        <div className="min-w-[140px]">
                          <div className="text-xs font-semibold text-slate-800">{a.attribute?.name || '—'}</div>
                          <div className="text-[10px] text-slate-400">
                            {a.attribute?.group?.name || a.attribute?.groupName || ''} · {a.attribute?.type || ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(a.isRequired)}
                              onChange={() => handleToggleFlag(a, 'isRequired')}
                              className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5"
                            />
                            Required
                          </label>
                          <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(a.isVariantAttribute)}
                              onChange={() => handleToggleFlag(a, 'isVariantAttribute')}
                              className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5"
                            />
                            Variant
                          </label>
                          <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(a.isFilterable)}
                              onChange={() => handleToggleFlag(a, 'isFilterable')}
                              className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5"
                            />
                            Filterable
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveAssignment(a)}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="Unassign"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <select
                    value={attrToAdd}
                    onChange={(e) => setAttrToAdd(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-md py-1.5 px-3 text-xs"
                  >
                    <option value="">Select an attribute to assign…</option>
                    {unassignedAttributes.map((a) => (
                      <option key={a._id || a.id} value={a._id || a.id}>
                        {a.name} ({a.groupName || a.group?.name || 'no group'})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAssignAttribute}
                    disabled={!attrToAdd}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-dashed border-slate-300 rounded-lg p-5 text-center text-xs text-slate-400">
                Save this category first to assign attributes to it.
              </div>
            )}
          </div>
        </div>
      </div>
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductCategories;
