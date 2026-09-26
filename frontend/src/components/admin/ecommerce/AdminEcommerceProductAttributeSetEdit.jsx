import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiCheck,
  FiImage,
  FiLogOut,
  FiPlus,
  FiSave,
  FiTrash2,
} from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import {
  DISPLAY_LAYOUT_OPTIONS,
  getAttributeSetById,
  slugifyAttribute,
} from '../../../data/productAttributeSets';
import SeoEditorPanel, { normalizeSeoState } from './SeoEditorPanel';
import { ecommerceCreate, ecommerceGet, ecommerceUpdate } from '../../../utils/ecommerceApi';

const isMongoId = (value) => /^[a-f0-9]{24}$/i.test(String(value || ''));

const emptySet = {
  id: 'new',
  title: '',
  slug: '',
  displayLayout: 'dropdown',
  status: 'Published',
  order: 0,
  isSearchable: false,
  isComparable: false,
  isUseInProductListing: false,
  useImageFromProductVariation: false,
  groups: [],
};

const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/** Normalizes any loaded/legacy shape into groups[].attributes[].values[] with local ids for React keys. */
const normalizeGroups = (rawGroups) => {
  if (!Array.isArray(rawGroups)) return [];
  return rawGroups.map((g) => ({
    id: g._id || g.id || uid('group'),
    name: g.name || '',
    slug: g.slug || '',
    order: g.order ?? 0,
    attributes: Array.isArray(g.attributes)
      ? g.attributes.map((a) => ({
          id: a._id || a.id || uid('attr'),
          title: a.title || '',
          slug: a.slug || '',
          values: Array.isArray(a.values)
            ? a.values.map((v) =>
                typeof v === 'string'
                  ? { id: uid('val'), title: v, slug: '', color: '', image: '', isDefault: false }
                  : {
                      id: v._id || v.id || uid('val'),
                      title: v.title || '',
                      slug: v.slug || '',
                      color: v.color || '',
                      image: v.image || '',
                      isDefault: Boolean(v.isDefault),
                    }
              )
            : [],
        }))
      : [],
  }));
};

/** Strips local-only ids before sending to the backend. */
const serializeGroups = (groups) =>
  groups.map((g) => ({
    name: g.name,
    slug: g.slug,
    order: g.order,
    attributes: g.attributes.map((a) => ({
      title: a.title,
      slug: a.slug,
      values: a.values.map((v) => ({
        title: v.title,
        slug: v.slug,
        color: v.color,
        image: v.image,
        isDefault: v.isDefault,
      })),
    })),
  }));

const OnOffToggle = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between gap-3 py-1">
    <span className="text-xs font-semibold text-slate-700">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  </div>
);

export const AdminEcommerceProductAttributeSetEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';
  const existing = useMemo(() => (isCreate ? null : getAttributeSetById(id)), [id, isCreate]);
  const seed = existing || emptySet;

  const [title, setTitle] = useState(seed.title);
  const [slug, setSlug] = useState(seed.slug);
  const [displayLayout, setDisplayLayout] = useState(seed.displayLayout);
  const [status, setStatus] = useState(seed.status);
  const [order, setOrder] = useState(seed.order);
  const [isSearchable, setIsSearchable] = useState(seed.isSearchable);
  const [isComparable, setIsComparable] = useState(seed.isComparable);
  const [isUseInProductListing, setIsUseInProductListing] = useState(seed.isUseInProductListing);
  const [useImageFromProductVariation, setUseImageFromProductVariation] = useState(
    seed.useImageFromProductVariation
  );
  const [groups, setGroups] = useState(() => normalizeGroups(seed.groups));
  const [mongoId, setMongoId] = useState(isMongoId(id) ? id : null);
  const [seo, setSeo] = useState(() =>
    normalizeSeoState(seed.seo, {
      slug: seed.slug,
      seoTitle: seed.seoTitle,
      seoDescription: seed.seoDescription,
    })
  );
  const [seoOpen, setSeoOpen] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (isCreate) {
        setTitle(emptySet.title);
        setSlug(emptySet.slug);
        setDisplayLayout(emptySet.displayLayout);
        setStatus(emptySet.status);
        setOrder(emptySet.order);
        setIsSearchable(emptySet.isSearchable);
        setIsComparable(emptySet.isComparable);
        setIsUseInProductListing(emptySet.isUseInProductListing);
        setUseImageFromProductVariation(emptySet.useImageFromProductVariation);
        setGroups([]);
        setSeo(normalizeSeoState(null));
        setMongoId(null);
        return;
      }
      try {
        if (isMongoId(id)) {
          const row = await ecommerceGet('product-attribute-sets', id);
          if (cancelled || !row) return;
          setMongoId(row._id || row.id);
          setTitle(row.title || '');
          setSlug(row.slug || '');
          setDisplayLayout(row.displayLayout || 'dropdown');
          setStatus(row.status || 'Published');
          setOrder(row.order ?? 0);
          setIsSearchable(Boolean(row.isSearchable));
          setIsComparable(Boolean(row.isComparable));
          setIsUseInProductListing(Boolean(row.isUseInProductListing));
          setUseImageFromProductVariation(Boolean(row.useImageFromProductVariation));
          setGroups(normalizeGroups(row.groups));
          setSeo(
            normalizeSeoState(row.seo, {
              slug: row.slug,
              seoTitle: row.seoTitle,
              seoDescription: row.seoDescription,
            })
          );
          return;
        }
      } catch {
        /* fallback local */
      }
      if (cancelled) return;
      const next = getAttributeSetById(id) || emptySet;
      setTitle(next.title);
      setSlug(next.slug);
      setDisplayLayout(next.displayLayout);
      setStatus(next.status);
      setOrder(next.order);
      setIsSearchable(next.isSearchable);
      setIsComparable(next.isComparable);
      setIsUseInProductListing(next.isUseInProductListing);
      setUseImageFromProductVariation(next.useImageFromProductVariation);
      setGroups(normalizeGroups(next.groups));
      setSeo(
        normalizeSeoState(next.seo, {
          slug: next.slug,
          seoTitle: next.seoTitle,
          seoDescription: next.seoDescription,
        })
      );
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const pageTitle = isCreate
    ? 'Create'
    : `Edit "${title || existing?.title || 'Attribute set'}"`;

  const addGroup = () => {
    setGroups((prev) => [...prev, { id: uid('group'), name: '', slug: '', order: prev.length, attributes: [] }]);
  };

  const updateGroup = (groupId, patch) => {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, ...patch } : g)));
  };

  const removeGroup = (groupId) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const addAttribute = (groupId) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, attributes: [...g.attributes, { id: uid('attr'), title: '', slug: '', values: [] }] }
          : g
      )
    );
  };

  const updateAttribute = (groupId, attrId, patch) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, attributes: g.attributes.map((a) => (a.id === attrId ? { ...a, ...patch } : a)) }
          : g
      )
    );
  };

  const removeAttribute = (groupId, attrId) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, attributes: g.attributes.filter((a) => a.id !== attrId) } : g))
    );
  };

  const addValue = (groupId, attrId) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              attributes: g.attributes.map((a) =>
                a.id === attrId
                  ? {
                      ...a,
                      values: [
                        ...a.values,
                        { id: uid('val'), title: '', slug: '', color: '#000000', image: '', isDefault: a.values.length === 0 },
                      ],
                    }
                  : a
              ),
            }
          : g
      )
    );
  };

  const updateValue = (groupId, attrId, valueId, patch) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              attributes: g.attributes.map((a) =>
                a.id === attrId
                  ? { ...a, values: a.values.map((v) => (v.id === valueId ? { ...v, ...patch } : v)) }
                  : a
              ),
            }
          : g
      )
    );
  };

  const setDefaultValue = (groupId, attrId, valueId) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              attributes: g.attributes.map((a) =>
                a.id === attrId
                  ? { ...a, values: a.values.map((v) => ({ ...v, isDefault: v.id === valueId })) }
                  : a
              ),
            }
          : g
      )
    );
  };

  const removeValue = (groupId, attrId, valueId) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              attributes: g.attributes.map((a) => {
                if (a.id !== attrId) return a;
                const next = a.values.filter((v) => v.id !== valueId);
                if (next.length && !next.some((v) => v.isDefault)) next[0] = { ...next[0], isDefault: true };
                return { ...a, values: next };
              }),
            }
          : g
      )
    );
  };

  const handleSave = async (exit = false) => {
    setSaveError('');
    const nextSlug = seo.general?.slug || slug || slugifyAttribute(title);
    const payload = {
      title,
      slug: nextSlug,
      displayLayout,
      status,
      order: Number(order) || 0,
      isSearchable,
      isComparable,
      isUseInProductListing,
      useImageFromProductVariation,
      groups: serializeGroups(groups),
      seo: { ...seo, general: { ...seo.general, slug: nextSlug } },
      seoTitle: seo.general?.metaTitle || '',
      seoDescription: seo.general?.metaDescription || '',
    };
    try {
      if (mongoId) {
        await ecommerceUpdate('product-attribute-sets', mongoId, payload);
      } else {
        const created = await ecommerceCreate('product-attribute-sets', payload);
        if (created?._id) setMongoId(created._id);
      }
      setSlug(nextSlug);
      setSavedToast(true);
      window.setTimeout(() => setSavedToast(false), 1800);
      if (exit) navigate('/admin/ecommerce/product-attribute-sets');
    } catch (err) {
      setSaveError(err?.message || 'Save failed');
    }
  };

  return (
    <EcommerceLayout breadcrumb={['PRODUCTS', 'PRODUCT ATTRIBUTES', pageTitle.toUpperCase()]}>
      {savedToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} />
          <span>Attribute set saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  const value = e.target.value;
                  setTitle(value);
                  if (!existing || slug === slugifyAttribute(seed.title)) {
                    setSlug(slugifyAttribute(value));
                  }
                }}
                maxLength={120}
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Color, Size"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                maxLength={120}
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="pt-1 border-t border-slate-100">
              <OnOffToggle
                label="Use image from product variation (for Visual Swatch only)"
                checked={useImageFromProductVariation}
                onChange={setUseImageFromProductVariation}
              />
            </div>
          </div>

          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.id} className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center gap-3">
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => updateGroup(group.id, { name: e.target.value, slug: slugifyAttribute(e.target.value) })}
                    placeholder="Group name, e.g. Physical Properties"
                    className="flex-1 border border-slate-300 rounded-md py-1.5 px-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeGroup(group.id)}
                    className="text-red-500 hover:text-red-700 p-1.5"
                    title="Remove group"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {group.attributes.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2">
                      No attributes in this group yet.
                    </p>
                  )}

                  {group.attributes.map((attr) => (
                    <div key={attr.id} className="border border-slate-200 rounded-md overflow-hidden">
                      <div className="px-3 py-2 bg-slate-50 flex items-center gap-2">
                        <input
                          type="text"
                          value={attr.title}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateAttribute(group.id, attr.id, {
                              title: value,
                              slug: !attr.slug ? slugifyAttribute(value) : attr.slug,
                            });
                          }}
                          placeholder="Attribute name, e.g. Color"
                          className="flex-1 border border-slate-300 rounded-md py-1.5 px-2 text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                        />
                        <input
                          type="text"
                          value={attr.slug}
                          onChange={(e) => updateAttribute(group.id, attr.id, { slug: e.target.value })}
                          placeholder="slug"
                          className="w-32 border border-slate-300 rounded-md py-1.5 px-2 text-xs font-mono focus:outline-hidden focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeAttribute(group.id, attr.id)}
                          className="text-red-500 hover:text-red-700 p-1.5"
                          title="Remove attribute"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <div className="min-w-[640px]">
                          <div className="grid grid-cols-[60px_1.4fr_1.2fr_110px_80px_60px] gap-2 px-3 py-2 border-b border-slate-100 bg-white text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                            <div className="text-center">Default</div>
                            <div>Value</div>
                            <div>Slug</div>
                            <div>Color</div>
                            <div className="text-center">Image</div>
                            <div className="text-center">Remove</div>
                          </div>
                          <ul className="divide-y divide-slate-100">
                            {attr.values.length === 0 && (
                              <li className="px-3 py-4 text-center text-xs text-slate-400">
                                No values yet.
                              </li>
                            )}
                            {attr.values.map((val) => (
                              <li key={val.id} className="grid grid-cols-[60px_1.4fr_1.2fr_110px_80px_60px] gap-2 px-3 py-2 items-center">
                                <div className="flex justify-center">
                                  <input
                                    type="radio"
                                    name={`default-value-${attr.id}`}
                                    checked={Boolean(val.isDefault)}
                                    onChange={() => setDefaultValue(group.id, attr.id, val.id)}
                                    className="h-3.5 w-3.5 text-blue-600 border-slate-300 focus:ring-blue-500"
                                  />
                                </div>
                                <input
                                  type="text"
                                  value={val.title}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    updateValue(group.id, attr.id, val.id, {
                                      title: value,
                                      slug: !val.slug ? slugifyAttribute(value) : val.slug,
                                    });
                                  }}
                                  placeholder="e.g. Red"
                                  className="w-full border border-slate-300 rounded-md py-1.5 px-2 text-xs focus:outline-hidden focus:border-blue-500"
                                />
                                <input
                                  type="text"
                                  value={val.slug}
                                  onChange={(e) => updateValue(group.id, attr.id, val.id, { slug: e.target.value })}
                                  className="w-full border border-slate-300 rounded-md py-1.5 px-2 text-xs font-mono focus:outline-hidden focus:border-blue-500"
                                />
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="color"
                                    value={val.color || '#000000'}
                                    onChange={(e) => updateValue(group.id, attr.id, val.id, { color: e.target.value })}
                                    className="h-8 w-8 rounded-sm border border-slate-300 bg-white p-0.5 cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={val.color || ''}
                                    onChange={(e) => updateValue(group.id, attr.id, val.id, { color: e.target.value })}
                                    className="w-full min-w-0 border border-slate-300 rounded-md py-1.5 px-1.5 text-[11px] font-mono focus:outline-hidden focus:border-blue-500"
                                    placeholder="#000000"
                                  />
                                </div>
                                <div className="flex justify-center">
                                  <label className="relative w-10 h-10 rounded-md border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer overflow-hidden flex items-center justify-center">
                                    {val.image ? (
                                      <img src={val.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <FiImage size={14} className="text-slate-400" />
                                    )}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="absolute inset-0 opacity-0 cursor-pointer"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const url = URL.createObjectURL(file);
                                        updateValue(group.id, attr.id, val.id, { image: url });
                                      }}
                                    />
                                  </label>
                                </div>
                                <div className="flex justify-center">
                                  <button
                                    type="button"
                                    onClick={() => removeValue(group.id, attr.id, val.id)}
                                    className="text-red-500 hover:text-red-700 p-1.5"
                                  >
                                    <FiTrash2 size={14} />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="px-3 py-2 bg-white border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => addValue(group.id, attr.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition"
                        >
                          <FiPlus size={12} />
                          Add value
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addAttribute(group.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-[#7c69ef] hover:bg-[#6b58e0] transition"
                  >
                    <FiPlus size={13} />
                    Add attribute to this group
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addGroup}
              className="w-full flex items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 rounded-md py-3 text-xs font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              <FiPlus size={14} />
              Add attribute group
            </button>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Search Engine Optimize
              </h4>
              <div className="flex items-center gap-2 shrink-0">
                {seoOpen ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const metaTitle = title ? `${title} | Jaipurio`.slice(0, 60) : '';
                        const metaDescription = title
                          ? `Browse ${title} attribute options for Jaipurio products.`
                          : '';
                        const nextSlug = slug || slugifyAttribute(title);
                        setSeo(
                          normalizeSeoState({
                            general: {
                              slug: nextSlug,
                              metaTitle,
                              metaDescription,
                              metaKeywords: '',
                              robots: 'index,follow',
                              canonicalUrl: '',
                            },
                          })
                        );
                      }}
                      className="text-xs text-white bg-blue-600 hover:bg-blue-700 font-semibold px-2.5 py-1 rounded-sm"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeoOpen(false)}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Hide SEO meta
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      if (mongoId && isMongoId(mongoId)) {
                        try {
                          const row = await ecommerceGet('product-attribute-sets', mongoId);
                          if (row?.seo) {
                            setSeo(
                              normalizeSeoState(row.seo, {
                                slug: row.slug || slug,
                                seoTitle: row.seoTitle,
                                seoDescription: row.seoDescription,
                              })
                            );
                          }
                        } catch {
                          /* keep in-memory seo */
                        }
                      }
                      setSeoOpen(true);
                    }}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Edit SEO meta
                  </button>
                )}
              </div>
            </div>

            {seoOpen && (
              <SeoEditorPanel
                value={seo}
                onChange={setSeo}
                previewTitle={title}
                previewUrl={`https://jaipurio.in/attribute-sets/${seo.general?.slug || slug || 'slug'}`}
                onGenerateSlug={() => {
                  const s = slugifyAttribute(title);
                  setSlug(s);
                  setSeo((prev) => ({ ...prev, general: { ...prev.general, slug: s } }));
                }}
              />
            )}
            {saveError ? <div className="text-xs text-red-600 font-medium">{saveError}</div> : null}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Publish
            </h4>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="w-full flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-slate-900 text-white font-semibold py-2 px-3 rounded-md text-xs shadow-xs transition"
            >
              <FiSave size={14} />
              Save
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="w-full flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold py-2 px-3 rounded-md text-xs transition"
            >
              <FiLogOut size={14} />
              Save & Exit
            </button>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Display Layout <span className="text-red-500">*</span>
              </label>
              <select
                value={displayLayout}
                onChange={(e) => setDisplayLayout(e.target.value)}
                className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
              >
                {DISPLAY_LAYOUT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-2">
              <OnOffToggle label="Searchable" checked={isSearchable} onChange={setIsSearchable} />
              <OnOffToggle label="Comparable" checked={isComparable} onChange={setIsComparable} />
              <OnOffToggle
                label="Used in product listing"
                checked={isUseInProductListing}
                onChange={setIsUseInProductListing}
              />
            </div>

            <div className="border-t border-slate-100 pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Order</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs focus:outline-hidden focus:border-blue-500"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductAttributeSetEdit;
