import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Image as ImageIcon, Plus, RotateCcw, Save, Search, Trash2, X } from 'lucide-react';
import api from '../../utils/api';
import ThumbImg from '../shared/ThumbImg';
import MediaGalleryModal from './ecommerce/MediaGalleryModal';
import { DEFAULT_HOME, HOME_SECTIONS, ICON_CHOICES, MAIN_BLOCK, mergeHomeSections } from '../../data/homeSectionsDefaults';

const SOURCE_OPTIONS = {
  rail: [['auto', 'Automatic (mix from all categories)'], ['category', 'Products from chosen categories'], ['products', 'Pick products by hand']],
  deals: [['auto', 'Automatic (mix from all categories)'], ['category', 'Products from chosen categories'], ['products', 'Pick products by hand']],
  scroll: [['auto', 'Automatic (mix from all categories)'], ['category', 'Products from chosen categories'], ['products', 'Pick products by hand']],
  offers: [['auto', 'Automatic (biggest discounts)'], ['category', 'Only the categories I choose']],
  cats: [['auto', 'Automatic (all categories with products)'], ['categories', 'Only the categories I choose']],
  simple: [],
};

const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#8B2E3A]';

const move = (list, i, dir) => {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

/** Pick categories (order matters): selected list on top, searchable list to add from. */
const CategoryPicker = ({ value, onChange, tree }) => {
  const [q, setQ] = useState('');
  const available = tree.filter((c) => !value.includes(c.name) && c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((name, i) => (
            <li key={name} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px]">
              <span className="flex-1">{name}</span>
              <button type="button" onClick={() => onChange(move(value, i, -1))} className="p-1 text-slate-500 hover:text-slate-900" aria-label="Move up"><ArrowUp size={14} /></button>
              <button type="button" onClick={() => onChange(move(value, i, 1))} className="p-1 text-slate-500 hover:text-slate-900" aria-label="Move down"><ArrowDown size={14} /></button>
              <button type="button" onClick={() => onChange(value.filter((n) => n !== name))} className="p-1 text-slate-400 hover:text-red-600" aria-label="Remove"><X size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      <div>
        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search categories…" className={`${inputCls} pl-8`} />
        </div>
        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
          {available.length === 0 && <p className="px-3 py-2 text-[12px] text-slate-400">No more categories.</p>}
          {available.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange([...value, c.name])}
              className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-slate-50"
              style={{ paddingLeft: 12 + (c.level - 1) * 14 }}
            >
              <span>{c.name}</span>
              <span className="flex items-center gap-2 text-[11px] text-slate-400">
                {c.count} products <Plus size={13} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/** Pick individual products (order matters). */
const ProductPicker = ({ value, onChange }) => {
  const [details, setDetails] = useState({});
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);

  // names/images for the products already picked
  useEffect(() => {
    const missing = value.filter((id) => !details[id]);
    if (!missing.length) return;
    api
      .get('/products', { params: { ids: missing.join(',') } })
      .then((res) => {
        const next = {};
        (res.data?.data?.products || []).forEach((p) => {
          next[String(p._id)] = p;
        });
        setDetails((prev) => ({ ...prev, ...next }));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setResults([]);
      return undefined;
    }
    timer.current = setTimeout(() => {
      setSearching(true);
      api
        .get('/products', { params: { search: q.trim(), limit: 12 } })
        .then((res) => setResults(res.data?.data?.products || []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(timer.current);
  }, [q]);

  const nameOf = (p) => p?.name || p?.title || 'Product';

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((id, i) => {
            const p = details[id];
            return (
              <li key={id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[13px]">
                <span className="w-9 h-9 rounded bg-white border border-slate-200 overflow-hidden shrink-0">
                  {p?.image && <ThumbImg src={p.image} width={200} alt="" className="w-full h-full object-contain" />}
                </span>
                <span className="flex-1 truncate">{p ? nameOf(p) : 'Loading…'}</span>
                <button type="button" onClick={() => onChange(move(value, i, -1))} className="p-1 text-slate-500 hover:text-slate-900" aria-label="Move up"><ArrowUp size={14} /></button>
                <button type="button" onClick={() => onChange(move(value, i, 1))} className="p-1 text-slate-500 hover:text-slate-900" aria-label="Move down"><ArrowDown size={14} /></button>
                <button type="button" onClick={() => onChange(value.filter((x) => x !== id))} className="p-1 text-slate-400 hover:text-red-600" aria-label="Remove"><X size={14} /></button>
              </li>
            );
          })}
        </ul>
      )}
      <div>
        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products to add (type 2+ letters)…" className={`${inputCls} pl-8`} />
        </div>
        {(searching || results.length > 0) && (
          <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
            {searching && <p className="px-3 py-2 text-[12px] text-slate-400">Searching…</p>}
            {results
              .filter((p) => !value.includes(String(p._id)))
              .map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => {
                    setDetails((prev) => ({ ...prev, [String(p._id)]: p }));
                    onChange([...value, String(p._id)]);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-[13px] hover:bg-slate-50"
                >
                  <span className="w-9 h-9 rounded bg-white border border-slate-200 overflow-hidden shrink-0">
                    {p.image && <ThumbImg src={p.image} width={200} alt="" className="w-full h-full object-contain" />}
                  </span>
                  <span className="flex-1 truncate">{nameOf(p)}</span>
                  <span className="text-[11px] text-slate-400 shrink-0">₹{Number(p.price || 0).toLocaleString('en-IN')}</span>
                  <Plus size={13} className="text-slate-400" />
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

/** Heading-style text fields for a section: explicit `def.fields`, else the usual label/heading/description. */
const fieldsFor = (def) => {
  if (def.fields) return def.fields;
  const d = def.defaults || {};
  const out = [];
  if ('eyebrow' in d) out.push(['eyebrow', 'Small label above heading']);
  if ('title' in d) out.push(['title', 'Heading']);
  if ('copy' in d) out.push(['copy', 'Description', 'textarea']);
  if ('linkText' in d) out.push(['linkText', '“See all” link text']);
  return out;
};

/** "Shop by occasion" tiles: caption + a category (its top product is the photo) or one specific product. */
const OccasionEditor = ({ items, onChange, tree }) => {
  const update = (i, patch) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  return (
    <div>
      <span className="block text-[12px] font-medium text-slate-700 mb-1">Tiles</span>
      <p className="text-[11px] text-slate-500 mb-2">
        The photo on each tile is a real product that matches its caption — pick a category (its most popular product is used)
        or choose one specific product.
      </p>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <input value={item.label || ''} onChange={(e) => update(i, { label: e.target.value })} placeholder="Caption, e.g. Wedding & Bridal" className={inputCls} />
              <button type="button" disabled={i === 0} onClick={() => onChange(move(items, i, -1))} className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30" aria-label="Move up"><ArrowUp size={14} /></button>
              <button type="button" disabled={i === items.length - 1} onClick={() => onChange(move(items, i, 1))} className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30" aria-label="Move down"><ArrowDown size={14} /></button>
              <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="p-1 text-slate-400 hover:text-red-600" aria-label="Remove"><Trash2 size={14} /></button>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                <input type="radio" checked={item.mode !== 'product'} onChange={() => update(i, { mode: 'category' })} className="accent-[#8B2E3A]" />
                Photo from a category
              </label>
              <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                <input type="radio" checked={item.mode === 'product'} onChange={() => update(i, { mode: 'product' })} className="accent-[#8B2E3A]" />
                One specific product
              </label>
            </div>
            {item.mode === 'product' ? (
              <ProductPicker
                value={item.productId ? [item.productId] : []}
                onChange={(ids) => update(i, { productId: ids.length ? ids[ids.length - 1] : '' })}
              />
            ) : (
              <select value={item.category || ''} onChange={(e) => update(i, { category: e.target.value })} className={inputCls}>
                <option value="">Choose a category…</option>
                {tree.map((c) => (
                  <option key={c.id} value={c.name}>
                    {'— '.repeat(Math.max(0, c.level - 1))}
                    {c.name} ({c.count})
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
      {items.length < 8 && (
        <button
          type="button"
          onClick={() => onChange([...items, { label: '', mode: 'category', category: '', productId: '' }])}
          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8B2E3A]"
        >
          <Plus size={14} /> Add tile
        </button>
      )}
    </div>
  );
};

/** Editable list of items (icon + text fields), e.g. the features bar. */
const ItemsEditor = ({ list, items, onChange }) => {
  const icons = list.icons ? ICON_CHOICES[list.icons] : null;
  const update = (i, patch) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  return (
    <div>
      <span className="block text-[12px] font-medium text-slate-700 mb-1.5">{list.title}</span>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2">
            {icons && (
              <select value={item.icon} onChange={(e) => update(i, { icon: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-2 text-[13px] bg-white">
                {icons.map((ic) => (
                  <option key={ic} value={ic}>{ic}</option>
                ))}
              </select>
            )}
            {list.fields.map(([key, label]) => (
              <input
                key={key}
                value={item[key] || ''}
                onChange={(e) => update(i, { [key]: e.target.value })}
                placeholder={label}
                className="flex-1 min-w-[120px] border border-slate-300 rounded-lg px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-[#8B2E3A]"
              />
            ))}
            <button type="button" disabled={i === 0} onClick={() => onChange(move(items, i, -1))} className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30" aria-label="Move up"><ArrowUp size={14} /></button>
            <button type="button" disabled={i === items.length - 1} onClick={() => onChange(move(items, i, 1))} className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30" aria-label="Move down"><ArrowDown size={14} /></button>
            <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="p-1 text-slate-400 hover:text-red-600" aria-label="Remove"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      {items.length < (list.max || 8) && (
        <button
          type="button"
          onClick={() => onChange([...items, { ...(icons ? { icon: icons[0] } : {}), ...Object.fromEntries(list.fields.map(([k]) => [k, ''])) }])}
          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8B2E3A]"
        >
          <Plus size={14} /> Add
        </button>
      )}
    </div>
  );
};

const SectionCard = ({ def, cfg, set, tree, open, onToggleOpen, position, onPickImage }) => {
  const options = SOURCE_OPTIONS[def.kind] || [];
  const usesCategories = cfg.source === 'category' || cfg.source === 'categories';
  const fields = fieldsFor(def);
  const where = position ? `position ${position}` : def.scope === 'top' ? 'always first' : '';
  return (
    <section className={`bg-white border rounded-xl shadow-sm border-slate-200 ${cfg.enabled ? '' : 'opacity-70'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={onToggleOpen} className="flex items-center gap-2 flex-1 text-left min-w-0">
          {open ? <ChevronDown size={16} className="shrink-0" /> : <ChevronRight size={16} className="shrink-0" />}
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold text-slate-800 truncate">{def.label}</span>
            <span className="block text-[11px] text-slate-500 truncate">
              {cfg.enabled ? 'Shown' : 'Hidden'}
              {where ? ` · ${where}` : ''}
            </span>
          </span>
        </button>
        <label className="inline-flex items-center gap-2 text-[12px] text-slate-600 cursor-pointer shrink-0">
          <input type="checkbox" checked={cfg.enabled} onChange={(e) => set({ enabled: e.target.checked })} className="w-4 h-4 accent-[#8B2E3A]" />
          Show
        </label>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-4">
          {def.note && <p className="text-[12px] text-slate-500 pt-3">{def.note}</p>}

          {fields.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3 pt-3">
              {fields.map(([key, label, type]) => (
                <label key={key} className={`block ${type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                  <span className="block text-[12px] font-medium text-slate-700 mb-1">{label}</span>
                  {type === 'textarea' ? (
                    <textarea rows={2} value={cfg[key] || ''} onChange={(e) => set({ [key]: e.target.value })} className={inputCls} />
                  ) : type === 'image' ? (
                    <span className="flex items-center gap-2">
                      <span className="w-14 h-10 rounded border border-slate-200 bg-slate-50 overflow-hidden shrink-0">
                        {cfg[key] && <img src={cfg[key]} alt="" className="w-full h-full object-cover" />}
                      </span>
                      <input value={cfg[key] || ''} onChange={(e) => set({ [key]: e.target.value })} className={inputCls} />
                      <button
                        type="button"
                        onClick={() => onPickImage(def.key, key)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-[12px] text-slate-700 hover:bg-slate-50 shrink-0"
                      >
                        <ImageIcon size={14} /> Choose
                      </button>
                    </span>
                  ) : (
                    <input value={cfg[key] || ''} onChange={(e) => set({ [key]: e.target.value })} className={inputCls} />
                  )}
                </label>
              ))}
            </div>
          )}

          {def.sourceChoices && (
            <div>
              <span className="block text-[12px] font-medium text-slate-700 mb-1.5">What to show</span>
              <div className="space-y-1.5">
                {def.sourceChoices.map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                    <input type="radio" name={`src-${def.key}`} checked={cfg.source === value} onChange={() => set({ source: value })} className="accent-[#8B2E3A]" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {def.list && (!def.listWhen || cfg.source === def.listWhen) && <ItemsEditor list={def.list} items={cfg.items || []} onChange={(items) => set({ items })} />}
          {def.custom === 'occasions' && <OccasionEditor items={cfg.items || []} onChange={(items) => set({ items })} tree={tree} />}

          {options.length > 0 && (
            <div className="space-y-3">
              <div>
                <span className="block text-[12px] font-medium text-slate-700 mb-1.5">What to show</span>
                <div className="space-y-1.5">
                  {options.map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                      <input type="radio" name={`src-${def.key}`} checked={cfg.source === value} onChange={() => set({ source: value })} className="accent-[#8B2E3A]" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {usesCategories && <CategoryPicker value={cfg.categories} onChange={(categories) => set({ categories })} tree={tree} />}
              {cfg.source === 'products' && <ProductPicker value={cfg.productIds} onChange={(productIds) => set({ productIds })} />}
              {usesCategories && cfg.categories.length === 0 && (
                <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  No category chosen yet — the storefront shows the automatic selection until you add at least one.
                </p>
              )}
              {cfg.source === 'products' && cfg.productIds.length === 0 && (
                <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  No product picked yet — this section stays hidden until you add at least one.
                </p>
              )}
            </div>
          )}

          {'limit' in (def.defaults || {}) && (
            <label className="block max-w-[200px]">
              <span className="block text-[12px] font-medium text-slate-700 mb-1">
                {def.key === 'categoryRails' ? 'Products per category row' : 'Maximum items'}
              </span>
              <input type="number" min={1} max={60} value={cfg.limit} onChange={(e) => set({ limit: Math.max(1, Math.min(60, Number(e.target.value) || 1)) })} className={inputCls} />
            </label>
          )}
        </div>
      )}
    </section>
  );
};

const ArrowButtons = ({ index, count, onMove }) => (
  <div className="flex flex-col gap-1 pt-2.5">
    <button
      type="button"
      disabled={index === 0}
      onClick={() => onMove(-1)}
      className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30"
      aria-label="Move up"
    >
      <ArrowUp size={14} />
    </button>
    <button
      type="button"
      disabled={index === count - 1}
      onClick={() => onMove(1)}
      className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30"
      aria-label="Move down"
    >
      <ArrowDown size={14} />
    </button>
  </div>
);

/**
 * Appearance → Home Page. Every section of the home page in one place:
 * show/hide, rename, reorder, edit its content, and choose its categories / products.
 */
const AdminHomeSections = () => {
  const [home, setHome] = useState(DEFAULT_HOME);
  const [tree, setTree] = useState([]);
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [mediaFor, setMediaFor] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/settings').then((res) => mergeHomeSections(res.data?.data?.settings?.homePage)).catch(() => DEFAULT_HOME),
      api.get('/products/categories').then((res) => res.data?.data || []).catch(() => []),
    ]).then(([cfg, cats]) => {
      setHome(cfg);
      setTree(cats);
      setLoading(false);
    });
  }, []);

  const defsByKey = useMemo(() => Object.fromEntries(HOME_SECTIONS.map((d) => [d.key, d])), []);
  const setSection = (key, patch) =>
    setHome((prev) => ({ ...prev, sections: { ...prev.sections, [key]: { ...prev.sections[key], ...patch } } }));

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      await api.put('/settings', { homePage: { pageOrder: home.pageOrder, order: home.order, sections: home.sections } });
      setNotice({ type: 'success', text: 'Home page saved. Changes appear on the storefront within a few minutes.' });
    } catch (err) {
      setNotice({ type: 'error', text: err.parsedMessage || err.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading home page settings…</div>;

  const card = (def, position) => (
    <SectionCard
      key={def.key}
      def={def}
      cfg={home.sections[def.key]}
      set={(patch) => setSection(def.key, patch)}
      tree={tree}
      open={open === def.key}
      onToggleOpen={() => setOpen(open === def.key ? null : def.key)}
      position={position}
      onPickImage={(sectionKey, field) => setMediaFor({ sectionKey, field })}
    />
  );

  const movePage = (i, dir) => setHome((prev) => ({ ...prev, pageOrder: move(prev.pageOrder, i, dir) }));
  const moveBlock = (i, dir) => setHome((prev) => ({ ...prev, order: move(prev.order, i, dir) }));

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Home Page</h1>
          <p className="text-[13px] text-slate-500">
            Every section of the home page: show or hide it, edit its text, reorder it, and choose its categories and products.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHome(DEFAULT_HOME)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-[13px] text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw size={14} /> Reset to defaults
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#8B2E3A] hover:bg-[#6F241D] disabled:opacity-60 text-white text-[13px] font-semibold"
          >
            <Save size={14} /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`mb-4 rounded-lg px-4 py-2.5 text-[13px] ${
            notice.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="space-y-2 mb-6">{card(defsByKey.hero, null)}</div>

      <h2 className="text-[12px] font-bold uppercase tracking-wide text-slate-500 mb-1">Page layout — use the arrows to reorder</h2>
      <p className="text-[12px] text-slate-400 mb-2">Sections appear below the hero banner in exactly this order.</p>
      <div className="space-y-2">
        {home.pageOrder.map((key, i) =>
          key === MAIN_BLOCK ? (
            <div key={key} className="flex items-start gap-2">
              <ArrowButtons index={i} count={home.pageOrder.length} onMove={(dir) => movePage(i, dir)} />
              <div className="flex-1 min-w-0 border-2 border-dashed border-[#D8B978] rounded-xl p-3 bg-[#FBF6EA]">
                <h3 className="text-[13px] font-bold text-[#6F241D]">Main sections</h3>
                <p className="text-[12px] text-slate-500 mb-3">
                  Offers, Explore Jaipurio, product rows and more. They move together as one block; reorder them inside it:
                </p>
                <div className="space-y-2">
                  {home.order.map((bk, bi) => (
                    <div key={bk} className="flex items-start gap-2">
                      <ArrowButtons index={bi} count={home.order.length} onMove={(dir) => moveBlock(bi, dir)} />
                      <div className="flex-1 min-w-0">{card(defsByKey[bk], bi + 1)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div key={key} className="flex items-start gap-2">
              <ArrowButtons index={i} count={home.pageOrder.length} onMove={(dir) => movePage(i, dir)} />
              <div className="flex-1 min-w-0">{card(defsByKey[key], i + 1)}</div>
            </div>
          )
        )}
      </div>

      <MediaGalleryModal
        open={!!mediaFor}
        onClose={() => setMediaFor(null)}
        onInsert={(asset) => {
          if (asset?.url && mediaFor) setSection(mediaFor.sectionKey, { [mediaFor.field]: asset.url });
          setMediaFor(null);
        }}
      />
    </div>
  );
};

export default AdminHomeSections;
