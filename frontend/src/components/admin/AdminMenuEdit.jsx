import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FiCheck, FiChevronDown, FiChevronRight, FiLogOut, FiMove, FiSave, FiTrash2, FiUploadCloud, FiX,
} from 'react-icons/fi';
import { fetchMenu, createMenu, updateMenu, fetchMenuSources } from '../../utils/menusApi';
import { uploadMediaFiles } from '../../utils/mediaApi';

const Breadcrumb = ({ items }) => (
  <nav className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-1.5">
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span className="text-slate-300">/</span>}
        {item}
      </React.Fragment>
    ))}
  </nav>
);

const ICON_OPTIONS = ['-- None --', 'Home', 'Shop', 'Info', 'Phone', 'Mail', 'Star', 'Tag'];

const uid = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const typeLabel = {
  page: 'Page', 'product-category': 'Product category', brand: 'Brand',
  category: 'Category', tag: 'Tag', 'custom-link': 'Custom link',
};

// Builds a depth-first ordered render list from a flat items array (parentId-linked).
const buildRenderList = (items) => {
  const byParent = new Map();
  items.forEach((it) => {
    const key = it.parentId || 'root';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(it);
  });
  byParent.forEach((list) => list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));

  const out = [];
  const walk = (parentKey, depth) => {
    (byParent.get(parentKey) || []).forEach((it) => {
      out.push({ ...it, depth });
      walk(it.id, depth + 1);
    });
  };
  walk('root', 0);
  return out;
};

const getDescendantIds = (items, rootId) => {
  const ids = new Set();
  const collect = (parentId) => {
    items.filter((it) => it.parentId === parentId).forEach((child) => {
      ids.add(child.id);
      collect(child.id);
    });
  };
  collect(rootId);
  return ids;
};

const SourcePanel = ({ title, options, onAdd }) => {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(new Set());

  const toggle = (id) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    const picked = options.filter((o) => checked.has(o.id));
    if (!picked.length) return;
    onAdd(picked);
    setChecked(new Set());
  };

  return (
    <div className="border border-slate-200 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 text-xs font-bold text-slate-700"
      >
        {title}
        {open ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
      </button>
      {open && (
        <div className="p-3 space-y-2">
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {options.length === 0 && <p className="text-[11px] text-slate-400">Nothing available yet.</p>}
            {options.map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked.has(o.id)}
                  onChange={() => toggle(o.id)}
                  className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
                {o.title}
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!checked.size}
            className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Add to menu
          </button>
        </div>
      )}
    </div>
  );
};

const AddLinkPanel = ({ onAdd }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('/');
  const [icon, setIcon] = useState('-- None --');
  const [iconImage, setIconImage] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleIconImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadMediaFiles([file]);
      const uploadedUrl = uploaded?.[0]?.url;
      if (uploadedUrl) setIconImage(uploadedUrl);
    } catch (err) {
      window.alert(err.parsedMessage || err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = () => {
    if (!title.trim() || !url.trim()) return;
    onAdd([{
      id: uid(),
      title: title.trim(),
      url: url.trim(),
      icon: icon === '-- None --' ? '' : icon,
      iconImage,
    }]);
    setTitle('');
    setUrl('/');
    setIcon('-- None --');
    setIconImage('');
  };

  return (
    <div className="border border-slate-200 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 text-xs font-bold text-slate-700"
      >
        Add link
        {open ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
      </button>
      {open && (
        <div className="p-3 space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs focus:outline-hidden focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs focus:outline-hidden focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Icon</label>
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs bg-white focus:outline-hidden focus:border-blue-500"
            >
              {ICON_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Icon image</label>
            {iconImage ? (
              <div className="relative inline-block">
                <img src={iconImage} alt="" className="h-14 w-14 object-cover rounded-md border border-slate-200" />
                <button
                  type="button"
                  onClick={() => setIconImage('')}
                  className="absolute -top-1.5 -right-1.5 bg-white border border-slate-300 rounded-full p-0.5 text-slate-500 hover:text-rose-600"
                >
                  <FiX size={10} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:underline cursor-pointer">
                <FiUploadCloud size={12} /> {uploading ? 'Uploading…' : 'Choose image'}
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleIconImageUpload(e.target.files?.[0])} />
              </label>
            )}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!title.trim() || !url.trim()}
            className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Add to menu
          </button>
        </div>
      )}
    </div>
  );
};

const MenuItemRow = ({
  item, expanded, onToggleExpand, onChange, onRemove, dragProps, dropIndicator,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleIconImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadMediaFiles([file]);
      const url = uploaded?.[0]?.url;
      if (url) onChange({ ...item, iconImage: url });
    } catch (err) {
      window.alert(err.parsedMessage || err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginLeft: item.depth * 24 }}>
      {dropIndicator === 'before' && <div className="h-0.5 bg-blue-500 rounded-full mb-1" />}
      <div
        {...dragProps}
        className={`border rounded-md bg-white ${dropIndicator === 'inside' ? 'border-blue-400 ring-1 ring-blue-300' : 'border-slate-200'}`}
      >
        <div className="flex items-center gap-2 px-3 py-2.5">
          <span className="cursor-grab text-slate-400" title="Drag to reorder / nest">
            <FiMove size={14} />
          </span>
          <button type="button" onClick={onToggleExpand} className="flex items-center gap-2 flex-1 min-w-0 text-left">
            <span className="text-xs font-semibold text-slate-800 truncate">{item.title || 'Untitled'}</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
              {typeLabel[item.itemType] || 'Custom link'}
            </span>
          </button>
          <button type="button" onClick={onToggleExpand} className="text-slate-400 hover:text-slate-700">
            {expanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
          </button>
        </div>

        {expanded && (
          <div className="px-3 pb-3 space-y-3 border-t border-slate-100 pt-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Title</label>
              <input
                value={item.title}
                onChange={(e) => onChange({ ...item, title: e.target.value })}
                className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">URL</label>
              <input
                value={item.url}
                onChange={(e) => onChange({ ...item, url: e.target.value })}
                className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Icon</label>
              <select
                value={item.icon || '-- None --'}
                onChange={(e) => onChange({ ...item, icon: e.target.value === '-- None --' ? '' : e.target.value })}
                className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs bg-white focus:outline-hidden focus:border-blue-500"
              >
                {ICON_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Icon image</label>
              {item.iconImage ? (
                <div className="relative inline-block">
                  <img src={item.iconImage} alt="" className="h-12 w-12 object-cover rounded-md border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => onChange({ ...item, iconImage: '' })}
                    className="absolute -top-1.5 -right-1.5 bg-white border border-slate-300 rounded-full p-0.5 text-slate-500 hover:text-rose-600"
                  >
                    <FiX size={10} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:underline cursor-pointer">
                  <FiUploadCloud size={12} /> {uploading ? 'Uploading…' : 'Upload image'}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleIconImageUpload(e.target.files?.[0])} />
                </label>
              )}
            </div>
            <button type="button" onClick={onRemove} className="text-[11px] text-rose-600 hover:underline font-semibold flex items-center gap-1">
              <FiTrash2 size={11} /> Remove
            </button>
          </div>
        )}
      </div>
      {dropIndicator === 'after' && <div className="h-0.5 bg-blue-500 rounded-full mt-1" />}
    </div>
  );
};

const AdminMenuEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';

  const [name, setName] = useState('');
  const [status, setStatus] = useState('Published');
  const [locations, setLocations] = useState([]);
  const [items, setItems] = useState([]);
  const [sources, setSources] = useState({ pages: [], productCategories: [], brands: [], categories: [], tags: [], locations: [] });
  const [expandedIds, setExpandedIds] = useState(new Set());

  const [loading, setLoading] = useState(!isCreate);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  const dragIdRef = useRef(null);
  const [dropInfo, setDropInfo] = useState(null); // { targetId, position }

  useEffect(() => {
    fetchMenuSources().then(setSources).catch(() => {});
  }, []);

  useEffect(() => {
    if (isCreate) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchMenu(id)
      .then((m) => {
        setName(m.name || '');
        setStatus(m.status || 'Published');
        setLocations(m.locations || []);
        setItems((m.items || []).map((it) => ({ ...it, id: it._id || it.id })));
      })
      .catch((err) => setLoadError(err.parsedMessage || err.message || 'Failed to load menu.'))
      .finally(() => setLoading(false));
  }, [id, isCreate]);

  const renderList = useMemo(() => buildRenderList(items), [items]);

  const handleSave = async (exit = false) => {
    if (!name.trim()) {
      setSaveError('Name is required.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      if (isCreate) {
        const created = await createMenu({ name: name.trim(), status });
        setSavedToast(true);
        window.setTimeout(() => setSavedToast(false), 1800);
        if (exit) {
          navigate('/admin/menus');
        } else if (created?._id || created?.id) {
          navigate(`/admin/menus/edit/${created._id || created.id}`, { replace: true });
        }
      } else {
        await updateMenu(id, { name: name.trim(), status, locations, items });
        setSavedToast(true);
        window.setTimeout(() => setSavedToast(false), 1800);
        if (exit) navigate('/admin/menus');
      }
    } catch (err) {
      setSaveError(err.parsedMessage || err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const appendItems = (picked, itemType) => {
    const maxOrder = Math.max(-1, ...items.filter((it) => !it.parentId).map((it) => it.order ?? 0));
    const newItems = picked.map((p, i) => ({
      id: uid(),
      parentId: null,
      title: p.title,
      url: p.url || '',
      itemType,
      referenceId: itemType === 'custom-link' ? null : p.id,
      icon: p.icon || '',
      iconImage: p.iconImage || '',
      order: maxOrder + 1 + i,
      status: 'Published',
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const toggleExpand = (itemId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const updateItem = (updated) => {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  };

  const removeItem = (itemId) => {
    const toRemove = new Set([itemId, ...getDescendantIds(items, itemId)]);
    setItems((prev) => prev.filter((it) => !toRemove.has(it.id)));
  };

  const toggleLocation = (loc) => {
    setLocations((prev) => (prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]));
  };

  const renumber = (list) => {
    const groups = new Map();
    list.forEach((it) => {
      const key = it.parentId || 'root';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(it);
    });
    const out = [];
    groups.forEach((group) => {
      group.forEach((it, i) => out.push({ ...it, order: i }));
    });
    return out;
  };

  const handleDrop = (targetId, position) => {
    const draggedId = dragIdRef.current;
    dragIdRef.current = null;
    setDropInfo(null);
    if (!draggedId || draggedId === targetId) return;

    const dragged = items.find((it) => it.id === draggedId);
    const target = items.find((it) => it.id === targetId);
    if (!dragged || !target) return;

    const descendants = getDescendantIds(items, draggedId);
    if (descendants.has(targetId)) return; // can't drop a parent into its own descendant

    let next = items.map((it) => ({ ...it }));
    const draggedRef = next.find((it) => it.id === draggedId);

    if (position === 'inside') {
      draggedRef.parentId = target.id;
      const siblings = next.filter((it) => it.parentId === target.id && it.id !== draggedId);
      draggedRef.order = siblings.length;
    } else {
      draggedRef.parentId = target.parentId;
      // reinsert dragged just before/after target among its new siblings
      const siblings = next.filter((it) => it.parentId === target.parentId && it.id !== draggedId);
      const targetIndex = siblings.findIndex((it) => it.id === target.id);
      const insertAt = position === 'before' ? targetIndex : targetIndex + 1;
      siblings.splice(insertAt, 0, draggedRef);
      siblings.forEach((it, i) => { it.order = i; });
      const others = next.filter((it) => it.parentId !== target.parentId);
      next = [...others, ...siblings];
    }

    setItems(renumber(next));
  };

  if (loading) {
    return (
      <div>
        <Breadcrumb items={['APPEARANCE', 'MENUS', isCreate ? 'CREATE' : 'EDIT']} />
        <div className="text-center text-xs text-slate-400 py-10">Loading…</div>
      </div>
    );
  }

  // Create-only mode: simple Name + Status form, matching the reference's two-step flow.
  if (isCreate) {
    return (
      <div>
        <Breadcrumb items={[<Link key="1" to="/admin/menus" className="hover:underline">MENUS</Link>, 'CREATE']} />
        {savedToast && (
          <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
            <FiCheck size={16} /><span>Saved successfully!</span>
          </div>
        )}
        {saveError && (
          <div className="mb-4 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">{saveError}</div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8">
            <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Publish</h4>
              <button type="button" onClick={() => handleSave(false)} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-slate-900 disabled:opacity-60 text-white font-semibold py-2 px-3 rounded-md text-xs shadow-xs transition">
                <FiSave size={14} /> Save
              </button>
              <button type="button" onClick={() => handleSave(true)} disabled={saving} className="w-full flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-800 font-semibold py-2 px-3 rounded-md text-xs transition">
                <FiLogOut size={14} /> Save & Exit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb items={[<Link key="1" to="/admin/menus" className="hover:underline">MENUS</Link>, `EDIT "${name}"`]} />
      {savedToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} /><span>Saved successfully!</span>
        </div>
      )}
      {(loadError || saveError) && (
        <div className="mb-4 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">{loadError || saveError}</div>
      )}

      <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs mb-5">
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-3 space-y-3">
          <SourcePanel title="Brands" options={sources.brands} onAdd={(picked) => appendItems(picked, 'brand')} />
          <SourcePanel title="Product categories" options={sources.productCategories} onAdd={(picked) => appendItems(picked, 'product-category')} />
          <SourcePanel title="Pages" options={sources.pages} onAdd={(picked) => appendItems(picked, 'page')} />
          <SourcePanel title="Categories" options={sources.categories} onAdd={(picked) => appendItems(picked, 'category')} />
          <SourcePanel title="Tags" options={sources.tags} onAdd={(picked) => appendItems(picked, 'tag')} />
          <AddLinkPanel onAdd={(picked) => appendItems(picked, 'custom-link')} />
        </div>

        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Menu structure</h4>
            {renderList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Add items from the panels on the left to build this menu.</p>
            ) : (
              <div className="space-y-2">
                {renderList.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => { dragIdRef.current = item.id; }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const offsetY = e.clientY - rect.top;
                      const ratio = offsetY / rect.height;
                      const position = ratio < 0.25 ? 'before' : ratio > 0.75 ? 'after' : 'inside';
                      setDropInfo({ targetId: item.id, position });
                    }}
                    onDrop={(e) => { e.preventDefault(); handleDrop(item.id, dropInfo?.position || 'inside'); }}
                    onDragEnd={() => setDropInfo(null)}
                  >
                    <MenuItemRow
                      item={item}
                      expanded={expandedIds.has(item.id)}
                      onToggleExpand={() => toggleExpand(item.id)}
                      onChange={updateItem}
                      onRemove={() => removeItem(item.id)}
                      dropIndicator={dropInfo?.targetId === item.id ? dropInfo.position : null}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Menu settings</h4>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="text-xs italic text-slate-500">Display location</span>
              {(sources.locations || []).map((loc) => (
                <label key={loc} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={locations.includes(loc)}
                    onChange={() => toggleLocation(loc)}
                    className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                  />
                  {loc}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Publish</h4>
            <button type="button" onClick={() => handleSave(false)} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-slate-900 disabled:opacity-60 text-white font-semibold py-2 px-3 rounded-md text-xs shadow-xs transition">
              <FiSave size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => handleSave(true)} disabled={saving} className="w-full flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-800 font-semibold py-2 px-3 rounded-md text-xs transition">
              <FiLogOut size={14} /> Save & Exit
            </button>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
            >
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMenuEdit;
