import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Image as ImageIcon, Plus, RotateCcw, Save, Search, Trash2, X } from 'lucide-react';
import api from '../../utils/api';
import ThumbImg from '../shared/ThumbImg';
import MediaGalleryModal from './ecommerce/MediaGalleryModal';
import {
  CUSTOM_TYPES, DEFAULT_HOME, HOME_SECTIONS, ICON_CHOICES, MAIN_BLOCK, MAX_CUSTOM,
  customDef, customDefaults, customKey, isCustomKey, mergeHomeSections,
} from '../../data/homeSectionsDefaults';

const SOURCE_OPTIONS = {
  rail: [['auto', 'Automatic (mix from all categories)'], ['rating', 'Top rated — ranked from customer reviews'], ['category', 'Products from chosen categories'], ['products', 'Pick products by hand']],
  deals: [['auto', 'Automatic (mix from all categories)'], ['rating', 'Top rated — ranked from customer reviews'], ['category', 'Products from chosen categories'], ['products', 'Pick products by hand']],
  scroll: [['auto', 'Automatic (mix from all categories)'], ['rating', 'Top rated — ranked from customer reviews'], ['category', 'Products from chosen categories'], ['products', 'Pick products by hand']],
  offers: [['auto', 'Automatic (biggest discounts)'], ['category', 'Only the categories I choose']],
  cats: [['auto', 'Automatic (all categories with products)'], ['categories', 'Only the categories I choose'], ['rows', 'Custom rows — add, rename or delete rows and add products to each']],
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

/** Styled edits: each card has a heading and up to 4 pictures — from chosen categories or hand-picked products. */
const StyledEditsEditor = ({ items, onChange, tree }) => {
  const update = (i, patch) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  return (
    <div>
      <span className="block text-[12px] font-medium text-slate-700 mb-1">Edits</span>
      <p className="text-[11px] text-slate-500 mb-2">
        Each card shows up to 4 pictures. Choose categories (the most popular product of each is shown and the card links to those
        categories), or pick the exact products.
      </p>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <input value={item.title || ''} onChange={(e) => update(i, { title: e.target.value })} placeholder="Heading, e.g. The Groom's Edit" maxLength={60} className={inputCls} />
              <button type="button" disabled={i === 0} onClick={() => onChange(move(items, i, -1))} className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30" aria-label="Move up"><ArrowUp size={14} /></button>
              <button type="button" disabled={i === items.length - 1} onClick={() => onChange(move(items, i, 1))} className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30" aria-label="Move down"><ArrowDown size={14} /></button>
              <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="p-1 text-slate-400 hover:text-red-600" aria-label="Remove"><Trash2 size={14} /></button>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                <input type="radio" checked={item.mode !== 'products'} onChange={() => update(i, { mode: 'category' })} className="accent-[#8B2E3A]" />
                Products from categories
              </label>
              <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                <input type="radio" checked={item.mode === 'products'} onChange={() => update(i, { mode: 'products' })} className="accent-[#8B2E3A]" />
                Products I pick
              </label>
            </div>
            {item.mode === 'products' ? (
              <ProductPicker value={(item.productIds || []).slice(0, 4)} onChange={(ids) => update(i, { productIds: ids.slice(0, 4) })} />
            ) : (
              <CategoryPicker value={(item.categories || []).slice(0, 4)} onChange={(cats) => update(i, { categories: cats.slice(0, 4) })} tree={tree} />
            )}
            <p className="text-[11px] text-slate-400">Up to 4 {item.mode === 'products' ? 'products' : 'categories'}.</p>
          </div>
        ))}
      </div>
      {items.length < 6 && (
        <button
          type="button"
          onClick={() => onChange([...items, { title: '', mode: 'category', categories: [], productIds: [] }])}
          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8B2E3A]"
        >
          <Plus size={14} /> Add edit
        </button>
      )}
    </div>
  );
};

/** Editable list of items (icon + text fields), e.g. the features bar. */
const ItemsEditor = ({ list, items, onChange, onPickImage }) => {
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
            {list.fields.map(([key, label, type]) =>
              type === 'image' ? (
                <span key={key} className="flex items-center gap-2 flex-1 min-w-[220px]">
                  <span className="w-12 h-9 rounded border border-slate-200 bg-white overflow-hidden shrink-0">
                    {item[key] && <img src={item[key]} alt="" className="w-full h-full object-cover" />}
                  </span>
                  <input
                    value={item[key] || ''}
                    onChange={(e) => update(i, { [key]: e.target.value })}
                    placeholder={label}
                    className="flex-1 min-w-[100px] border border-slate-300 rounded-lg px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-[#8B2E3A]"
                  />
                  {onPickImage && (
                    <button
                      type="button"
                      onClick={() => onPickImage(i, key)}
                      className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-300 text-[12px] text-slate-700 hover:bg-white shrink-0"
                    >
                      <ImageIcon size={13} /> Choose
                    </button>
                  )}
                </span>
              ) : (
                <input
                  key={key}
                  value={item[key] || ''}
                  onChange={(e) => update(i, { [key]: e.target.value })}
                  placeholder={label}
                  className="flex-1 min-w-[120px] border border-slate-300 rounded-lg px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-[#8B2E3A]"
                />
              )
            )}
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

/** Options for "Top rated" sections + a live preview of what customers would see right now. */
const RatingOptions = ({ cfg, set }) => {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const key = `${cfg.rankBy}|${cfg.minReviews}|${cfg.limit}`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/products/top-rated', { params: { limit: Math.min(cfg.limit || 8, 8), minReviews: cfg.minReviews || 1, rankBy: cfg.rankBy === 'product' ? 'product' : 'seller' } })
      .then((res) => !cancelled && setRows(res.data?.data?.products || []))
      .catch(() => !cancelled && setRows([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
      <div>
        <span className="block text-[12px] font-medium text-slate-700 mb-1.5">Rank products by</span>
        <div className="space-y-1.5">
          <label className="flex items-start gap-2 text-[13px] text-slate-700 cursor-pointer">
            <input type="radio" name={`rank-${key}`} checked={cfg.rankBy !== 'product'} onChange={() => set({ rankBy: 'seller' })} className="mt-0.5 accent-[#8B2E3A]" />
            <span>
              <strong>Best-rated sellers first</strong> — a seller's rating is the average of all reviews on their products; their products are
              shown first, then ordered by each product's own rating.
            </span>
          </label>
          <label className="flex items-start gap-2 text-[13px] text-slate-700 cursor-pointer">
            <input type="radio" name={`rank-${key}`} checked={cfg.rankBy === 'product'} onChange={() => set({ rankBy: 'product' })} className="mt-0.5 accent-[#8B2E3A]" />
            <span>
              <strong>Best-rated products</strong> — purely each product's own rating, whichever seller it belongs to.
            </span>
          </label>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="block text-[12px] font-medium text-slate-700 mb-1">Minimum reviews per product</span>
          <input
            type="number"
            min={1}
            max={50}
            value={cfg.minReviews}
            onChange={(e) => set({ minReviews: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })}
            className={`${inputCls} w-24`}
          />
        </label>
        <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer pb-2">
          <input type="checkbox" checked={cfg.fillWithPopular !== false} onChange={(e) => set({ fillWithPopular: e.target.checked })} className="w-4 h-4 accent-[#8B2E3A]" />
          If fewer rated products than the maximum, fill the rest with popular products
        </label>
      </div>
      <p className="text-[11px] text-slate-500">
        Ratings are smoothed, so one 5★ review cannot beat many strong reviews. Products with no reviews are never ranked.
      </p>

      <div>
        <span className="block text-[12px] font-medium text-slate-700 mb-1.5">Right now this would show</span>
        {loading ? (
          <p className="text-[12px] text-slate-400">Checking reviews…</p>
        ) : rows && rows.length ? (
          <ul className="space-y-1">
            {rows.map((p) => (
              <li key={p._id} className="flex items-center gap-2 text-[12px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                <span className="flex-1 truncate">{p.name || p.title}</span>
                <span className="shrink-0 text-amber-600 font-semibold">★ {p.rating} ({p.reviews})</span>
                <span className="shrink-0 text-slate-500">· {p.sellerName} ★ {p.sellerRating}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            No product has enough customer reviews yet, so nothing can be ranked.
            {cfg.fillWithPopular !== false ? ' Until reviews come in, popular products are shown instead.' : ' This section stays hidden until reviews come in.'}
          </p>
        )}
      </div>
    </div>
  );
};

const newRailId = () => Math.random().toString(36).slice(2, 9);

/** Rows of the "one product row per category" section: each has a heading, an optional category and add-on products. */
const RailsEditor = ({ rails, onChange, tree }) => {
  const [openId, setOpenId] = useState(null);
  const update = (i, patch) => onChange(rails.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const add = () => {
    const id = newRailId();
    onChange([...rails, { id, title: '', category: '', productIds: [] }]);
    setOpenId(id);
  };
  const topLevel = tree.filter((c) => c.level === 1);

  return (
    <div className="space-y-2">
      {rails.length === 0 && (
        <p className="text-[12px] text-slate-500">No rows yet. Add one, or start from the automatic rows.</p>
      )}
      {rails.map((rail, i) => {
        const isOpen = openId === rail.id;
        const heading = rail.title || rail.category || 'Untitled row';
        return (
          <div key={rail.id} className="border border-slate-200 rounded-lg bg-slate-50">
            <div className="flex items-center gap-2 px-3 py-2">
              <button type="button" onClick={() => setOpenId(isOpen ? null : rail.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                {isOpen ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                <span className="text-[13px] font-semibold text-slate-800 truncate">{heading}</span>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {rail.category ? 'category' : 'hand-picked'}
                  {rail.productIds?.length ? ` · +${rail.productIds.length} added` : ''}
                </span>
              </button>
              <button type="button" disabled={i === 0} onClick={() => onChange(move(rails, i, -1))} className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30" aria-label="Move up"><ArrowUp size={14} /></button>
              <button type="button" disabled={i === rails.length - 1} onClick={() => onChange(move(rails, i, 1))} className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30" aria-label="Move down"><ArrowDown size={14} /></button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete the row "${heading}"?`)) onChange(rails.filter((_, idx) => idx !== i));
                }}
                className="p-1 text-slate-400 hover:text-red-600"
                aria-label="Delete row"
              >
                <Trash2 size={14} />
              </button>
            </div>
            {isOpen && (
              <div className="px-3 pb-3 pt-1 space-y-3 border-t border-slate-200 bg-white rounded-b-lg">
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <label className="block">
                    <span className="block text-[12px] font-medium text-slate-700 mb-1">Row heading</span>
                    <input value={rail.title} onChange={(e) => update(i, { title: e.target.value })} placeholder={rail.category || 'e.g. Festive picks'} maxLength={60} className={inputCls} />
                    <span className="block text-[11px] text-slate-400 mt-1">Leave empty to use the category name.</span>
                  </label>
                  <label className="block">
                    <span className="block text-[12px] font-medium text-slate-700 mb-1">Fill from category</span>
                    <select value={rail.category} onChange={(e) => update(i, { category: e.target.value })} className={inputCls}>
                      <option value="">None — only the products I add</option>
                      {tree.map((c) => (
                        <option key={c.id} value={c.name}>
                          {'  '.repeat(Math.max(0, c.level - 1))}
                          {c.name} ({c.count})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div>
                  <span className="block text-[12px] font-medium text-slate-700 mb-1">Add-on products (shown first in this row)</span>
                  <ProductPicker value={rail.productIds || []} onChange={(productIds) => update(i, { productIds })} />
                </div>
                {!rail.category && !(rail.productIds || []).length && (
                  <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Choose a category or add products — an empty row stays hidden.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" onClick={add} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-[13px] font-semibold text-[#8B2E3A] hover:bg-slate-50">
          <Plus size={14} /> Add row
        </button>
        {rails.length === 0 && topLevel.length > 0 && (
          <button
            type="button"
            onClick={() => onChange(topLevel.filter((c) => c.count > 0).slice(0, 8).map((c) => ({ id: newRailId(), title: '', category: c.name, productIds: [] })))}
            className="px-3 py-2 rounded-lg border border-slate-300 text-[13px] text-slate-700 hover:bg-slate-50"
          >
            Start from automatic rows
          </button>
        )}
      </div>
    </div>
  );
};

const SectionCard = ({ def, cfg, set, tree, open, onToggleOpen, position, onPickImage, custom }) => {
  const options = SOURCE_OPTIONS[def.kind] || [];
  const usesCategories = cfg.source === 'category' || cfg.source === 'categories';
  const fields = fieldsFor(def);
  const where = custom ? `${custom.typeTitle} · added by you` : position ? `position ${position}` : def.scope === 'top' ? 'always first' : '';
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
          {custom && (
            <div className="pt-3 flex flex-wrap items-end gap-3">
              <label className="block flex-1 min-w-[180px]">
                <span className="block text-[12px] font-medium text-slate-700 mb-1">Section name (only you see this)</span>
                <input value={custom.label} onChange={(e) => custom.onLabel(e.target.value)} maxLength={60} className={inputCls} />
              </label>
              <label className="block min-w-[210px]">
                <span className="block text-[12px] font-medium text-slate-700 mb-1">Move to…</span>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) custom.onMoveAfter(e.target.value);
                  }}
                  className={inputCls}
                >
                  <option value="">Place after…</option>
                  {custom.anchors.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={custom.onDuplicate}
                disabled={!custom.canDuplicate}
                className="px-3 py-2 rounded-lg border border-slate-300 text-[13px] text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={custom.onDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-[13px] text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
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

          {def.list && (!def.listWhen || cfg.source === def.listWhen) && <ItemsEditor list={def.list} items={cfg.items || []} onChange={(items) => set({ items })} onPickImage={(i, field) => onPickImage(def.key, field, i)} />}
          {def.custom === 'occasions' && <OccasionEditor items={cfg.items || []} onChange={(items) => set({ items })} tree={tree} />}
          {def.custom === 'edits' && <StyledEditsEditor items={cfg.items || []} onChange={(items) => set({ items })} tree={tree} />}

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

              {cfg.source === 'rating' && <RatingOptions cfg={cfg} set={set} />}
              {cfg.source === 'rows' && <RailsEditor rails={cfg.rails || []} onChange={(rails) => set({ rails })} tree={tree} />}
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

// Put `key` after `anchor` ('top' = very top of the page, 'end' = very end). A section lives in
// exactly one list: the page list, or inside the "Main sections" block.
const placeAfter = (lists, key, anchor) => {
  const pageOrder = lists.pageOrder.filter((k) => k !== key);
  const order = lists.order.filter((k) => k !== key);
  if (anchor === 'top') return { pageOrder: [key, ...pageOrder], order };
  const pi = pageOrder.indexOf(anchor);
  if (pi >= 0) return { pageOrder: [...pageOrder.slice(0, pi + 1), key, ...pageOrder.slice(pi + 1)], order };
  const oi = order.indexOf(anchor);
  if (oi >= 0) return { pageOrder, order: [...order.slice(0, oi + 1), key, ...order.slice(oi + 1)] };
  return { pageOrder: [...pageOrder, key], order };
};

const newCustomId = (existing) => {
  let id;
  do {
    id = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
  } while (existing.includes(id));
  return id;
};

/**
 * Appearance → Home Page. Every section of the home page in one place:
 * show/hide, rename, reorder, edit its content, choose its categories / products,
 * and ADD new sections of your own anywhere in the page.
 */
const AdminHomeSections = () => {
  const [home, setHome] = useState(DEFAULT_HOME);
  const [tree, setTree] = useState([]);
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [mediaFor, setMediaFor] = useState(null);
  const [adder, setAdder] = useState({ open: false, type: 'banner', name: '', after: 'end' });

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
  const defFor = (key) => {
    if (isCustomKey(key)) {
      const meta = home.custom.find((m) => customKey(m.id) === key);
      return meta ? customDef(meta) : null;
    }
    return defsByKey[key] || null;
  };
  const labelOf = (key) => (defFor(key) ? defFor(key).label : key);

  const setSection = (key, patch) =>
    setHome((prev) => ({ ...prev, sections: { ...prev.sections, [key]: { ...prev.sections[key], ...patch } } }));

  /** "Place after…" choices in the order they appear on the page. */
  const anchorOptions = (excludeKey = null) => {
    const opts = [{ value: 'top', label: 'At the very top of the page (above everything)' }];
    home.pageOrder.forEach((key) => {
      if (key === excludeKey) return;
      if (key === MAIN_BLOCK) {
        opts.push({ value: MAIN_BLOCK, label: 'After the whole "Main sections" block' });
        home.order.forEach((bk) => {
          if (bk !== excludeKey) opts.push({ value: bk, label: ` ↳ ${labelOf(bk)}` });
        });
      } else {
        opts.push({ value: key, label: labelOf(key) });
      }
    });
    return opts;
  };

  const addSection = () => {
    const type = adder.type;
    const typeInfo = CUSTOM_TYPES.find((t) => t.type === type);
    const label = adder.name.trim() || typeInfo.title;
    const id = newCustomId(home.custom.map((m) => m.id));
    const key = customKey(id);
    setHome((prev) => ({
      ...prev,
      custom: [...prev.custom, { id, type, label }],
      sections: { ...prev.sections, [key]: customDefaults(type, label) },
      ...placeAfter(prev, key, adder.after),
    }));
    setOpen(key);
    setAdder({ open: false, type: 'banner', name: '', after: 'end' });
    setNotice({ type: 'success', text: `"${label}" added — fill it in below, then press Save changes.` });
  };

  const deleteCustom = (key) => {
    if (!window.confirm(`Delete "${labelOf(key)}"? This removes the section and its content.`)) return;
    setHome((prev) => {
      const sections = { ...prev.sections };
      delete sections[key];
      return {
        ...prev,
        custom: prev.custom.filter((m) => customKey(m.id) !== key),
        sections,
        pageOrder: prev.pageOrder.filter((k) => k !== key),
        order: prev.order.filter((k) => k !== key),
      };
    });
    if (open === key) setOpen(null);
  };

  const duplicateCustom = (key) => {
    const meta = home.custom.find((m) => customKey(m.id) === key);
    if (!meta || home.custom.length >= MAX_CUSTOM) return;
    const id = newCustomId(home.custom.map((m) => m.id));
    const newKey = customKey(id);
    const label = `${meta.label} (copy)`.slice(0, 60);
    setHome((prev) => ({
      ...prev,
      custom: [...prev.custom, { id, type: meta.type, label }],
      sections: { ...prev.sections, [newKey]: JSON.parse(JSON.stringify(prev.sections[key])) },
      ...placeAfter(prev, newKey, key),
    }));
    setOpen(newKey);
  };

  const renameCustom = (key, label) =>
    setHome((prev) => ({ ...prev, custom: prev.custom.map((m) => (customKey(m.id) === key ? { ...m, label } : m)) }));

  const moveCustomAfter = (key, anchor) => setHome((prev) => ({ ...prev, ...placeAfter(prev, key, anchor) }));

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      await api.put('/settings', {
        homePage: { pageOrder: home.pageOrder, order: home.order, sections: home.sections, custom: home.custom },
      });
      setNotice({ type: 'success', text: 'Home page saved. Changes appear on the storefront within a few minutes.' });
    } catch (err) {
      setNotice({ type: 'error', text: err.parsedMessage || err.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const resetAll = () => {
    if (home.custom.length && !window.confirm('Reset everything to the defaults? Sections you added will be removed.')) return;
    setHome(DEFAULT_HOME);
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading home page settings…</div>;

  const card = (def, position) => {
    if (!def) return null;
    const custom = def.isCustom
      ? {
          label: def.label,
          typeTitle: (CUSTOM_TYPES.find((t) => t.type === def.customType) || {}).title || 'Custom',
          onLabel: (v) => renameCustom(def.key, v),
          anchors: anchorOptions(def.key),
          onMoveAfter: (anchor) => moveCustomAfter(def.key, anchor),
          onDuplicate: () => duplicateCustom(def.key),
          onDelete: () => deleteCustom(def.key),
          canDuplicate: home.custom.length < MAX_CUSTOM,
        }
      : null;
    return (
      <SectionCard
        key={def.key}
        def={def}
        cfg={home.sections[def.key]}
        set={(patch) => setSection(def.key, patch)}
        tree={tree}
        open={open === def.key}
        onToggleOpen={() => setOpen(open === def.key ? null : def.key)}
        position={position}
        onPickImage={(sectionKey, field, itemIndex) => setMediaFor({ sectionKey, field, itemIndex })}
        custom={custom}
      />
    );
  };

  const movePage = (i, dir) => setHome((prev) => ({ ...prev, pageOrder: move(prev.pageOrder, i, dir) }));
  const moveBlock = (i, dir) => setHome((prev) => ({ ...prev, order: move(prev.order, i, dir) }));

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Home Page</h1>
          <p className="text-[13px] text-slate-500">
            Every section of the home page: show or hide it, edit its text, reorder it, choose its categories and products — and add new sections of your own anywhere.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetAll}
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

      <div className="flex flex-wrap items-end justify-between gap-2 mb-2">
        <div>
          <h2 className="text-[12px] font-bold uppercase tracking-wide text-slate-500 mb-1">Page layout — use the arrows to reorder</h2>
          <p className="text-[12px] text-slate-400">Sections appear below the hero banner in exactly this order.</p>
        </div>
        <button
          type="button"
          onClick={() => setAdder((a) => ({ ...a, open: !a.open }))}
          disabled={home.custom.length >= MAX_CUSTOM}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#8B2E3A] hover:bg-[#6F241D] disabled:opacity-50 text-white text-[13px] font-semibold"
        >
          <Plus size={14} /> Add section
        </button>
      </div>

      {adder.open && (
        <div className="mb-4 rounded-xl border-2 border-[#D8B978] bg-[#FBF6EA] p-4 space-y-4">
          <div>
            <h3 className="text-[14px] font-bold text-[#6F241D]">Add a new section</h3>
            <p className="text-[12px] text-slate-500">Pick what kind of section it is, give it a name, and choose where it goes.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {CUSTOM_TYPES.map((t) => (
              <label
                key={t.type}
                className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer bg-white ${adder.type === t.type ? 'border-[#8B2E3A] ring-1 ring-[#8B2E3A]/30' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <input type="radio" name="custom-type" checked={adder.type === t.type} onChange={() => setAdder((a) => ({ ...a, type: t.type }))} className="mt-1 accent-[#8B2E3A]" />
                <span>
                  <span className="block text-[13px] font-semibold text-slate-800">{t.title}</span>
                  <span className="block text-[11.5px] text-slate-500 leading-snug">{t.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[12px] font-medium text-slate-700 mb-1">Name (also the starting heading)</span>
              <input value={adder.name} onChange={(e) => setAdder((a) => ({ ...a, name: e.target.value }))} placeholder="e.g. Diwali Gifts" className={inputCls} />
            </label>
            <label className="block">
              <span className="block text-[12px] font-medium text-slate-700 mb-1">Place it after</span>
              <select value={adder.after} onChange={(e) => setAdder((a) => ({ ...a, after: e.target.value }))} className={inputCls}>
                <option value="end">At the end of the page</option>
                {anchorOptions().map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={addSection} className="px-4 py-2 rounded-lg bg-[#8B2E3A] hover:bg-[#6F241D] text-white text-[13px] font-semibold">
              Add section
            </button>
            <button type="button" onClick={() => setAdder((a) => ({ ...a, open: false }))} className="px-3 py-2 rounded-lg border border-slate-300 text-[13px] text-slate-700 hover:bg-white">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {home.pageOrder.map((key, i) =>
          key === MAIN_BLOCK ? (
            <div key={key} className="flex items-start gap-2">
              <ArrowButtons index={i} count={home.pageOrder.length} onMove={(dir) => movePage(i, dir)} />
              <div className="flex-1 min-w-0 border-2 border-dashed border-[#D8B978] rounded-xl p-3 bg-[#FBF6EA]">
                <h3 className="text-[13px] font-bold text-[#6F241D]">Main sections</h3>
                <p className="text-[12px] text-slate-500 mb-3">
                  Offers, Explore Jaipurio, product rows and more. They move together as one block; reorder them inside it, and sections you add can be placed between them:
                </p>
                <div className="space-y-2">
                  {home.order.map((bk, bi) => (
                    <div key={bk} className="flex items-start gap-2">
                      <ArrowButtons index={bi} count={home.order.length} onMove={(dir) => moveBlock(bi, dir)} />
                      <div className="flex-1 min-w-0">{card(defFor(bk), bi + 1)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div key={key} className="flex items-start gap-2">
              <ArrowButtons index={i} count={home.pageOrder.length} onMove={(dir) => movePage(i, dir)} />
              <div className="flex-1 min-w-0">{card(defFor(key), i + 1)}</div>
            </div>
          )
        )}
      </div>

      <MediaGalleryModal
        open={!!mediaFor}
        onClose={() => setMediaFor(null)}
        onInsert={(asset) => {
          if (asset?.url && mediaFor) {
            if (mediaFor.itemIndex !== undefined && mediaFor.itemIndex !== null) {
              const items = (home.sections[mediaFor.sectionKey].items || []).map((it, idx) =>
                idx === mediaFor.itemIndex ? { ...it, [mediaFor.field]: asset.url } : it
              );
              setSection(mediaFor.sectionKey, { items });
            } else {
              setSection(mediaFor.sectionKey, { [mediaFor.field]: asset.url });
            }
          }
          setMediaFor(null);
        }}
      />
    </div>
  );
};

export default AdminHomeSections;
