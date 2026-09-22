import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiCheck,
  FiFile,
  FiInfo,
  FiLogOut,
  FiMenu,
  FiPlus,
  FiSave,
  FiTrash2,
} from 'react-icons/fi';
import EcommerceLayout from './ecommerce/EcommerceLayout';
import SeoEditorPanel, { normalizeSeoState } from './ecommerce/SeoEditorPanel';
import { getSiteOrigin } from '../../utils/siteUrl';
import {
  blogCategoriesCreate,
  blogCategoriesGet,
  blogCategoriesList,
  blogCategoriesRemove,
  blogCategoriesReorder,
  blogCategoriesUpdate,
  slugifyBlog,
} from '../../utils/blogsApi';

const LIST_PATH = '/admin/blog/categories';
const isMongoId = (value) => /^[a-f0-9]{24}$/i.test(String(value || ''));

const emptyForm = () => ({
  name: '',
  slug: '',
  parent: '',
  description: '',
  isDefault: false,
  isFeatured: false,
  icon: '',
  status: 'Published',
  seo: normalizeSeoState({}),
});

const buildTree = (rows = []) => {
  const byId = {};
  rows.forEach((row) => {
    byId[String(row._id || row.id)] = { ...row, children: [] };
  });
  const roots = [];
  Object.values(byId).forEach((node) => {
    const parentId = String(node.parent || node.parentId || '');
    if (parentId && byId[parentId] && parentId !== String(node._id || node.id)) {
      byId[parentId].children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortNodes = (list) => {
    list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || String(a.name).localeCompare(b.name));
    list.forEach((n) => sortNodes(n.children || []));
  };
  sortNodes(roots);
  return roots;
};

const flattenTree = (nodes, depth = 0, acc = []) => {
  nodes.forEach((node) => {
    acc.push({ ...node, depth });
    flattenTree(node.children || [], depth + 1, acc);
  });
  return acc;
};

export const AdminBlogCategories = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedToast, setSavedToast] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [mongoId, setMongoId] = useState(isMongoId(id) ? id : null);
  const [dragId, setDragId] = useState(null);
  const [hoverId, setHoverId] = useState(null);

  const origin = getSiteOrigin();
  const pageTitle = isCreate ? 'Create' : `Edit "${form.name || 'Category'}"`;
  const previewUrl = `${origin}/blog/${form.slug || 'slug'}`;

  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await blogCategoriesList();
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      setRows([]);
      setError(err?.parsedMessage || err?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  const applyRow = (row) => {
    if (!row) return;
    setMongoId(row._id || row.id);
    setForm({
      name: row.name || '',
      slug: row.slug || '',
      parent: row.parent || row.parentId || '',
      description: row.description || '',
      isDefault: Boolean(row.isDefault),
      isFeatured: Boolean(row.isFeatured),
      icon: row.icon || '',
      status: row.status || 'Published',
      seo: normalizeSeoState(row.seo, {
        slug: row.slug,
        seoTitle: row.seoTitle,
        seoDescription: row.seoDescription,
      }),
    });
  };

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    let cancelled = false;
    const loadOne = async () => {
      if (isCreate) {
        setMongoId(null);
        setForm(emptyForm());
        setSeoOpen(false);
        return;
      }
      if (!isMongoId(id)) return;
      try {
        const row = await blogCategoriesGet(id);
        if (!cancelled && row) applyRow(row);
      } catch (err) {
        if (!cancelled) setError(err?.parsedMessage || err?.message || 'Failed to load category');
      }
    };
    loadOne();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const treeRows = useMemo(() => flattenTree(buildTree(rows)), [rows]);
  const parentOptions = useMemo(
    () => treeRows.filter((row) => String(row._id || row.id) !== String(mongoId || '')),
    [treeRows, mongoId]
  );

  const patchForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSave = async (exit = false) => {
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError('');
    const nextSlug = form.slug.trim() || slugifyBlog(form.name);
    const payload = {
      name: form.name.trim(),
      slug: nextSlug,
      description: form.description,
      parent: form.parent || null,
      isDefault: form.isDefault,
      isFeatured: form.isFeatured,
      icon: form.icon,
      status: form.status,
      seo: {
        ...form.seo,
        general: { ...form.seo.general, slug: nextSlug },
      },
      seoTitle: form.seo.general?.metaTitle || '',
      seoDescription: form.seo.general?.metaDescription || '',
    };
    try {
      let saved;
      if (mongoId) {
        saved = await blogCategoriesUpdate(mongoId, payload);
      } else {
        saved = await blogCategoriesCreate(payload);
      }
      await loadList();
      setSavedToast(true);
      window.setTimeout(() => setSavedToast(false), 1800);
      if (exit) {
        navigate(LIST_PATH);
        return;
      }
      const savedId = saved?._id || saved?.id;
      if (!mongoId && savedId) {
        navigate(`${LIST_PATH}/edit/${savedId}`);
        return;
      }
      if (saved) applyRow(saved);
    } catch (err) {
      setError(err?.parsedMessage || err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const catId = row._id || row.id;
    if (!window.confirm(`Delete "${row.name}"?`)) return;
    try {
      await blogCategoriesRemove(catId);
      await loadList();
      if (String(mongoId) === String(catId)) {
        navigate(`${LIST_PATH}/create`);
      }
    } catch (err) {
      window.alert(err?.parsedMessage || err?.message || 'Delete failed');
    }
  };

  const onDropReorder = async (targetId) => {
    if (!dragId || !targetId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const ids = treeRows.map((r) => String(r._id || r.id));
    const from = ids.indexOf(String(dragId));
    const to = ids.indexOf(String(targetId));
    if (from < 0 || to < 0) {
      setDragId(null);
      return;
    }
    const next = [...ids];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const byId = Object.fromEntries(rows.map((r) => [String(r._id || r.id), r]));
    const items = next.map((itemId, idx) => ({
      id: itemId,
      parent: byId[itemId]?.parent || null,
      sortOrder: (idx + 1) * 10,
    }));
    setDragId(null);
    try {
      const updated = await blogCategoriesReorder(items);
      if (Array.isArray(updated) && updated.length) setRows(updated);
      else await loadList();
    } catch (err) {
      window.alert(err?.parsedMessage || err?.message || 'Reorder failed');
    }
  };

  return (
    <EcommerceLayout
      breadcrumb={[
        { label: 'BLOG', to: '/admin/blogs' },
        { label: 'CATEGORIES', to: LIST_PATH },
        ...(isCreate ? [] : [pageTitle.toUpperCase()]),
      ]}
    >
      {savedToast ? (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} />
          <span>Category saved successfully!</span>
        </div>
      ) : null}
      {error ? <div className="mb-3 text-xs text-rose-600 font-medium">{error}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#EBF5FB] border border-[#D4E6F1] text-[#2471A3] rounded-md p-3 flex items-start gap-2.5 text-xs">
            <FiInfo size={16} className="text-[#2980B9] shrink-0 mt-0.5" />
            <span>Drag and drop on the left to change the order or parent of the categories.</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-md shadow-2xs">
            <div className="flex justify-end p-3">
              <button
                type="button"
                onClick={() => navigate(`${LIST_PATH}/create`)}
                className="inline-flex items-center gap-1.5 bg-[#1E293B] hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-md"
              >
                <FiPlus size={14} />
                Create
              </button>
            </div>
            {loading ? (
              <div className="px-4 pb-6 text-sm text-slate-500">Loading categories…</div>
            ) : treeRows.length === 0 ? (
              <div className="px-4 pb-6 text-sm text-slate-500">No categories yet. Click Create to add one.</div>
            ) : (
              <ul className="px-3 pb-3 space-y-2">
                {treeRows.map((row) => {
                  const rowId = String(row._id || row.id);
                  const active = String(mongoId) === rowId;
                  return (
                    <li
                      key={rowId}
                      draggable
                      onDragStart={() => setDragId(rowId)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setHoverId(rowId);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setHoverId(null);
                        onDropReorder(rowId);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setHoverId(null);
                      }}
                      style={{ paddingLeft: `${(row.depth || 0) * 16}px` }}
                      className={`group flex items-center gap-2 border rounded-md px-2 py-2 bg-white ${
                        hoverId === rowId ? 'border-blue-400' : 'border-slate-200'
                      } ${active ? 'ring-1 ring-blue-200' : ''}`}
                    >
                      <span className="text-slate-400 cursor-grab shrink-0" title="Drag to reorder">
                        <FiMenu size={16} />
                      </span>
                      <FiFile className="text-slate-400 shrink-0" size={16} />
                      <button
                        type="button"
                        onClick={() => navigate(`${LIST_PATH}/edit/${rowId}`)}
                        className="text-left text-xs font-semibold text-slate-800 hover:text-blue-700 flex-1 truncate"
                      >
                        {row.name}
                        <span className="text-slate-400 font-normal"> ({row.postsCount || 0})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row)}
                        className="opacity-0 group-hover:opacity-100 text-white bg-red-500 hover:bg-red-600 rounded-sm p-1 shrink-0"
                        title="Delete"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#EBF5FB] border border-[#D4E6F1] text-[#2471A3] rounded-md p-3 flex items-center gap-2.5 text-xs">
            <FiInfo size={16} className="text-[#2980B9] shrink-0" />
            <span>
              You are editing <strong className="font-bold">&quot;English&quot;</strong> version
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-md shadow-2xs p-4 sm:p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => patchForm({ name: e.target.value })}
                placeholder="Name"
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Permalink <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 whitespace-nowrap">{origin}/blog/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => patchForm({ slug: e.target.value })}
                  className="flex-1 border border-slate-300 rounded-md py-1.5 px-2.5 text-xs"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Preview: {previewUrl}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Parent</label>
              <select
                value={form.parent || ''}
                onChange={(e) => patchForm({ parent: e.target.value })}
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs bg-white"
              >
                <option value="">None</option>
                {parentOptions.map((opt) => (
                  <option key={opt._id || opt.id} value={opt._id || opt.id}>
                    {'— '.repeat(opt.depth || 0)}
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => patchForm({ description: e.target.value })}
                rows={4}
                placeholder="Short description"
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs resize-y"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => patchForm({ isDefault: e.target.checked })}
              />
              Is default?
            </label>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Icon</label>
              <select
                value={form.icon || ''}
                onChange={(e) => patchForm({ icon: e.target.value })}
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs bg-white"
              >
                <option value="">-- None --</option>
                <option value="folder">Folder</option>
                <option value="tag">Tag</option>
                <option value="star">Star</option>
                <option value="book">Book</option>
              </select>
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => patchForm({ isFeatured: e.target.checked })}
              />
              Is featured?
            </label>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Status<span className="text-red-500">*</span>
              </label>
              <select
                value={form.status}
                onChange={(e) => patchForm({ status: e.target.value })}
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs bg-white"
              >
                <option>Published</option>
                <option>Draft</option>
                <option>Pending</option>
              </select>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Search Engine Optimize
              </h4>
              <button
                type="button"
                onClick={() => setSeoOpen((v) => !v)}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                {seoOpen ? 'Hide SEO meta' : 'Edit SEO meta'}
              </button>
            </div>
            {seoOpen ? (
              <SeoEditorPanel
                value={form.seo}
                onChange={(next) => {
                  patchForm({ seo: next });
                  if (next?.general?.slug != null) patchForm({ slug: next.general.slug, seo: next });
                }}
                previewTitle={form.seo.general?.metaTitle || form.name}
                previewUrl={previewUrl}
                onGenerateSlug={() => {
                  const s = slugifyBlog(form.name);
                  patchForm({
                    slug: s,
                    seo: { ...form.seo, general: { ...form.seo.general, slug: s } },
                  });
                }}
              />
            ) : (
              <p className="text-[11px] text-slate-500">
                Setup meta title &amp; description to make your site easy to discovered on search engines
                such as Google
              </p>
            )}
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Publish
            </h4>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="w-full flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-slate-900 text-white font-semibold py-2 px-3 rounded-md text-xs disabled:opacity-60"
            >
              <FiSave size={14} />
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="w-full flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold py-2 px-3 rounded-md text-xs disabled:opacity-60"
            >
              <FiLogOut size={14} />
              Save &amp; Exit
            </button>
          </div>
        </div>
      </div>
    </EcommerceLayout>
  );
};

export default AdminBlogCategories;
