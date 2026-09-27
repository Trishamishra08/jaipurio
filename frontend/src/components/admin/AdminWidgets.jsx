import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronDown, FiChevronRight, FiInfo, FiMove, FiPlus, FiUploadCloud, FiX } from 'react-icons/fi';
import AdminPageHeader from './AdminPageHeader';
import { SIDEBARS, WIDGET_TYPES, widgetTypeByKey, defaultSettingsForType } from '../../data/widgetCatalog';
import { fetchWidgets, createWidget, updateWidget, reorderWidgets, deleteWidget, fetchWidgetSources } from '../../utils/widgetsApi';
import { fetchMenus } from '../../utils/menusApi';
import { uploadMediaFiles } from '../../utils/mediaApi';

const emptyFeature = () => ({ title: '', subtitle: '', icon: '' });

const ImageField = ({ value, onChange }) => {
  const [urlOpen, setUrlOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadMediaFiles([file]);
      const url = uploaded?.[0]?.url;
      if (url) onChange(url);
    } catch (err) {
      window.alert(err.parsedMessage || err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (value) {
    return (
      <div className="relative inline-block">
        <img src={value} alt="" className="h-16 w-16 object-cover rounded-md border border-slate-200" />
        <button type="button" onClick={() => onChange('')} className="absolute -top-1.5 -right-1.5 bg-white border border-slate-300 rounded-full p-0.5 text-slate-500 hover:text-rose-600">
          <FiX size={10} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-[11px]">
        <label className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
          <FiUploadCloud size={12} /> {uploading ? 'Uploading…' : 'Choose image'}
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleUpload(e.target.files?.[0])} />
        </label>
        <span className="text-slate-300">or</span>
        <button type="button" onClick={() => setUrlOpen((v) => !v)} className="text-blue-600 hover:underline">Add from URL</button>
      </div>
      {urlOpen && (
        <div className="flex items-center gap-1.5">
          <input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://..."
            className="flex-1 border border-slate-300 rounded-md py-1 px-2 text-xs focus:outline-hidden focus:border-blue-500"
          />
          <button type="button" onClick={() => { if (urlDraft.trim()) onChange(urlDraft.trim()); setUrlDraft(''); setUrlOpen(false); }} className="px-2 py-1 bg-slate-900 text-white rounded-md text-[11px] font-semibold">
            Add
          </button>
        </div>
      )}
    </div>
  );
};

const FeaturesRepeater = ({ value, onChange }) => {
  const features = Array.isArray(value) && value.length ? value : [];

  const update = (index, patch) => {
    const next = features.map((f, i) => (i === index ? { ...f, ...patch } : f));
    onChange(next);
  };
  const add = () => onChange([...features, emptyFeature()]);
  const remove = (index) => onChange(features.filter((_, i) => i !== index));

  return (
    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
      {features.map((f, i) => (
        <div key={i} className="border border-slate-200 rounded-md p-2.5 space-y-2 relative">
          <button type="button" onClick={() => remove(i)} className="absolute top-1.5 right-1.5 text-slate-400 hover:text-rose-600">
            <FiX size={12} />
          </button>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">Title {i + 1}</label>
            <input value={f.title} onChange={(e) => update(i, { title: e.target.value })} className="w-full border border-slate-300 rounded-md py-1.5 px-2 text-xs focus:outline-hidden focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">Subtitle {i + 1}</label>
            <textarea rows={2} value={f.subtitle} onChange={(e) => update(i, { subtitle: e.target.value })} className="w-full border border-slate-300 rounded-md py-1.5 px-2 text-xs focus:outline-hidden focus:border-blue-500 resize-y" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">Icon {i + 1}</label>
            <ImageField value={f.icon} onChange={(url) => update(i, { icon: url })} />
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="w-full flex items-center justify-center gap-1.5 border border-dashed border-slate-300 rounded-md py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
        <FiPlus size={12} /> Add feature
      </button>
    </div>
  );
};

const CategoryMultiSelect = ({ value, options, onChange }) => {
  const selectedIds = Array.isArray(value) ? value : [];
  const selected = options.filter((o) => selectedIds.includes(o.id));
  const remaining = options.filter((o) => !selectedIds.includes(o.id));

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {selected.map((o) => (
          <span key={o.id} className="flex items-center gap-1 bg-slate-100 text-slate-700 rounded-full pl-2 pr-1 py-0.5 text-[11px]">
            {o.title}
            <button type="button" onClick={() => onChange(selectedIds.filter((id) => id !== o.id))} className="hover:text-rose-600">
              <FiX size={11} />
            </button>
          </span>
        ))}
        {selected.length === 0 && <span className="text-[11px] text-slate-400">No categories selected.</span>}
      </div>
      {remaining.length > 0 && (
        <select
          value=""
          onChange={(e) => { if (e.target.value) onChange([...selectedIds, e.target.value]); }}
          className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs bg-white focus:outline-hidden focus:border-blue-500"
        >
          <option value="">+ Add category...</option>
          {remaining.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
        </select>
      )}
    </div>
  );
};

const WidgetSettingsForm = ({ widget, menus, sources, onSave, onDelete }) => {
  const type = widgetTypeByKey(widget.widgetType);
  const [values, setValues] = useState(widget.settings || {});
  const [saving, setSaving] = useState(false);

  const setField = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(widget.id, values);
    } finally {
      setSaving(false);
    }
  };

  if (!type?.fields?.length) {
    return (
      <div className="px-3 pb-3 pt-1 border-t border-slate-100">
        <p className="text-[11px] text-slate-400 mb-2">This widget has no configurable settings.</p>
        <button type="button" onClick={() => onDelete(widget.id)} className="px-3 py-1.5 border border-rose-200 text-rose-600 rounded-md text-xs font-semibold hover:bg-rose-50">
          Delete
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-3">
      {type.fields.map((f) => (
        <div key={f.key}>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">{f.label}</label>
          {f.type === 'textarea' ? (
            <textarea
              rows={3}
              value={values[f.key] || ''}
              onChange={(e) => setField(f.key, e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs focus:outline-hidden focus:border-blue-500 resize-y"
            />
          ) : f.type === 'number' ? (
            <input
              type="number"
              value={values[f.key] ?? ''}
              onChange={(e) => setField(f.key, e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs focus:outline-hidden focus:border-blue-500"
            />
          ) : f.type === 'menu' ? (
            <select
              value={values[f.key] || ''}
              onChange={(e) => setField(f.key, e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs bg-white focus:outline-hidden focus:border-blue-500"
            >
              <option value="">Select a menu...</option>
              {menus.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          ) : f.type === 'ads' ? (
            <select
              value={values[f.key] || ''}
              onChange={(e) => setField(f.key, e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs bg-white focus:outline-hidden focus:border-blue-500"
            >
              <option value="">Select an ad...</option>
              {(sources.ads || []).map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          ) : f.type === 'select' ? (
            <select
              value={values[f.key] || f.options[0]?.value || ''}
              onChange={(e) => setField(f.key, e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs bg-white focus:outline-hidden focus:border-blue-500"
            >
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : f.type === 'yesno' ? (
            <select
              value={values[f.key] === false ? 'no' : 'yes'}
              onChange={(e) => setField(f.key, e.target.value === 'yes')}
              className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs bg-white focus:outline-hidden focus:border-blue-500"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          ) : f.type === 'image' ? (
            <ImageField value={values[f.key] || ''} onChange={(url) => setField(f.key, url)} />
          ) : f.type === 'multiselect-categories' ? (
            <CategoryMultiSelect value={values[f.key] || []} options={sources.blogCategories || []} onChange={(ids) => setField(f.key, ids)} />
          ) : f.type === 'repeater' ? (
            <FeaturesRepeater value={values[f.key] || []} onChange={(list) => setField(f.key, list)} />
          ) : (
            <input
              value={values[f.key] || ''}
              onChange={(e) => setField(f.key, e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs focus:outline-hidden focus:border-blue-500"
            />
          )}
        </div>
      ))}
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onDelete(widget.id)} className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50">
          Delete
        </button>
        <button type="button" onClick={handleSave} disabled={saving} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-md text-xs font-semibold">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
};

const AdminWidgets = () => {
  const [widgets, setWidgets] = useState([]);
  const [menus, setMenus] = useState([]);
  const [sources, setSources] = useState({ ads: [], blogCategories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [collapsedSidebars, setCollapsedSidebars] = useState(new Set());

  const dragPayloadRef = useRef(null); // { kind: 'new', widgetType } | { kind: 'existing', id }
  const [dropTarget, setDropTarget] = useState(null); // { sidebarKey, index }

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [w, m, s] = await Promise.all([fetchWidgets(), fetchMenus(), fetchWidgetSources()]);
      setWidgets(w);
      setMenus(m);
      setSources(s);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to load widgets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const bySidebar = useMemo(() => {
    const map = {};
    SIDEBARS.forEach((s) => { map[s.key] = []; });
    widgets.forEach((w) => {
      if (!map[w.sidebarKey]) map[w.sidebarKey] = [];
      map[w.sidebarKey].push(w);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    return map;
  }, [widgets]);

  const toggleSidebar = (key) => {
    setCollapsedSidebars((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const persistOrder = async (sidebarKey, list) => {
    const updates = list.map((w, i) => ({ id: w.id, sidebarKey, order: i }));
    await reorderWidgets(updates);
  };

  const handleDropOnSidebar = async (sidebarKey, index) => {
    const payload = dragPayloadRef.current;
    dragPayloadRef.current = null;
    setDropTarget(null);
    if (!payload) return;

    if (payload.kind === 'new') {
      try {
        const created = await createWidget({ sidebarKey, widgetType: payload.widgetType, settings: defaultSettingsForType(payload.widgetType) });
        const list = [...(bySidebar[sidebarKey] || [])];
        const insertAt = index == null ? list.length : index;
        list.splice(insertAt, 0, created);
        await persistOrder(sidebarKey, list);
        await load();
      } catch (err) {
        setError(err.parsedMessage || err.message || 'Failed to add widget.');
      }
      return;
    }

    // Moving an existing instance (within the same zone or across zones).
    const draggedId = payload.id;
    const dragged = widgets.find((w) => w.id === draggedId);
    if (!dragged) return;

    try {
      if (dragged.sidebarKey === sidebarKey) {
        const list = (bySidebar[sidebarKey] || []).filter((w) => w.id !== draggedId);
        const insertAt = index == null ? list.length : index;
        list.splice(insertAt, 0, dragged);
        await persistOrder(sidebarKey, list);
      } else {
        const sourceList = (bySidebar[dragged.sidebarKey] || []).filter((w) => w.id !== draggedId);
        const targetList = [...(bySidebar[sidebarKey] || [])];
        const insertAt = index == null ? targetList.length : index;
        targetList.splice(insertAt, 0, dragged);
        await Promise.all([persistOrder(dragged.sidebarKey, sourceList), persistOrder(sidebarKey, targetList)]);
      }
      await load();
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to move widget.');
    }
  };

  const handleSaveSettings = async (id, settings) => {
    try {
      await updateWidget(id, { settings });
      await load();
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to save widget.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this widget from the sidebar?')) return;
    try {
      await deleteWidget(id);
      if (expandedId === id) setExpandedId(null);
      await load();
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to delete widget.');
    }
  };

  return (
    <div>
      <AdminPageHeader title="Widgets" hideAction />
      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}

      <div className="flex items-start gap-2.5 bg-sky-50 border border-sky-200 text-sky-800 rounded-md p-3 text-xs mb-5">
        <FiInfo size={15} className="mt-0.5 shrink-0" />
        <span>To activate a widget drag and drop it to a sidebar. To deactivate a widget, open it in sidebar and click delete button.</span>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-slate-800">Available Widgets</h3>
            <span className="text-xs text-slate-500">
              Translations: <span className="font-semibold text-slate-700">English</span>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WIDGET_TYPES.map((wt) => (
                <div
                  key={wt.key}
                  draggable
                  onDragStart={() => { dragPayloadRef.current = { kind: 'new', widgetType: wt.key }; }}
                  className="bg-white border border-slate-200 rounded-md p-4 cursor-grab hover:border-blue-300 hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-1">
                    <FiMove size={13} className="text-slate-300" /> {wt.title}
                  </div>
                  <p className="text-[11px] text-slate-500">{wt.description}</p>
                </div>
              ))}
            </div>

            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SIDEBARS.map((sb) => {
                const list = bySidebar[sb.key] || [];
                const collapsed = collapsedSidebars.has(sb.key);
                return (
                  <div key={sb.key} className="bg-white border border-slate-200 rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleSidebar(sb.key)}
                      className="w-full flex items-center justify-between px-4 py-3"
                    >
                      <div className="text-left">
                        <div className="text-sm font-medium text-slate-800">{sb.label}</div>
                        <div className="text-[11px] text-slate-400">{sb.hint}</div>
                      </div>
                      {collapsed ? <FiChevronRight size={14} className="text-slate-400" /> : <FiChevronDown size={14} className="text-slate-400" />}
                    </button>

                    {!collapsed && (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDropTarget({ sidebarKey: sb.key, index: list.length }); }}
                        onDrop={(e) => { e.preventDefault(); handleDropOnSidebar(sb.key, dropTarget?.sidebarKey === sb.key ? dropTarget.index : list.length); }}
                        className="p-3 space-y-2 min-h-[60px]"
                      >
                        {list.length === 0 ? (
                          <p className="text-[11px] text-slate-400 text-center py-3">Drag and drop widgets to this area.</p>
                        ) : (
                          list.map((w, index) => {
                            const type = widgetTypeByKey(w.widgetType);
                            const expanded = expandedId === w.id;
                            return (
                              <div
                                key={w.id}
                                draggable
                                onDragStart={() => { dragPayloadRef.current = { kind: 'existing', id: w.id }; }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const before = e.clientY - rect.top < rect.height / 2;
                                  setDropTarget({ sidebarKey: sb.key, index: before ? index : index + 1 });
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  handleDropOnSidebar(sb.key, dropTarget?.sidebarKey === sb.key ? dropTarget.index : index);
                                }}
                                className="border border-slate-200 rounded-md"
                              >
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(expanded ? null : w.id)}
                                  className="w-full flex items-center justify-between px-3 py-2"
                                >
                                  <span className="flex items-center gap-2 text-xs font-medium text-slate-800">
                                    <FiMove size={12} className="text-slate-300" /> {type?.title || w.widgetType}
                                  </span>
                                  {expanded ? <FiChevronDown size={13} className="text-slate-400" /> : <FiChevronRight size={13} className="text-slate-400" />}
                                </button>
                                {expanded && (
                                  <WidgetSettingsForm widget={w} menus={menus} sources={sources} onSave={handleSaveSettings} onDelete={handleDelete} />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminWidgets;
