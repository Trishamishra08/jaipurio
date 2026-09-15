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
  attributes: [],
};

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
  const [attributes, setAttributes] = useState(seed.attributes || []);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    const next = isCreate ? emptySet : getAttributeSetById(id) || emptySet;
    setTitle(next.title);
    setSlug(next.slug);
    setDisplayLayout(next.displayLayout);
    setStatus(next.status);
    setOrder(next.order);
    setIsSearchable(next.isSearchable);
    setIsComparable(next.isComparable);
    setIsUseInProductListing(next.isUseInProductListing);
    setUseImageFromProductVariation(next.useImageFromProductVariation);
    setAttributes(next.attributes || []);
  }, [id, isCreate]);

  const pageTitle = isCreate
    ? 'Create'
    : `Edit "${title || existing?.title || 'Attribute set'}"`;

  const updateAttribute = (attrId, patch) => {
    setAttributes((prev) =>
      prev.map((attr) => (attr.id === attrId ? { ...attr, ...patch } : attr))
    );
  };

  const setDefaultAttribute = (attrId) => {
    setAttributes((prev) =>
      prev.map((attr) => ({ ...attr, isDefault: attr.id === attrId }))
    );
  };

  const removeAttribute = (attrId) => {
    setAttributes((prev) => {
      const next = prev.filter((attr) => attr.id !== attrId);
      if (next.length && !next.some((attr) => attr.isDefault)) {
        next[0] = { ...next[0], isDefault: true };
      }
      return next;
    });
  };

  const addAttribute = () => {
    const nextId = `tmp-${Date.now()}`;
    setAttributes((prev) => [
      ...prev,
      {
        id: nextId,
        title: '',
        slug: '',
        color: '#000000',
        image: '',
        isDefault: prev.length === 0,
      },
    ]);
  };

  const handleSave = (exit = false) => {
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 1800);
    if (exit) navigate('/admin/ecommerce/product-attribute-sets');
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

          <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/80">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Attributes list
              </h4>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[70px_1.4fr_1.2fr_110px_88px_70px] gap-2 px-3 py-2.5 border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  <div className="text-center">Is default?</div>
                  <div>Title</div>
                  <div>Slug</div>
                  <div>Color</div>
                  <div className="text-center">Image</div>
                  <div className="text-center">Remove</div>
                </div>

                <ul className="divide-y divide-slate-100">
                  {attributes.length === 0 && (
                    <li className="px-3 py-8 text-center text-xs text-slate-400">
                      No attributes yet. Click &quot;Add new attribute&quot; below.
                    </li>
                  )}

                  {attributes.map((attr) => (
                    <li
                      key={attr.id}
                      className="grid grid-cols-[70px_1.4fr_1.2fr_110px_88px_70px] gap-2 px-3 py-2.5 items-center"
                    >
                      <div className="flex justify-center">
                        <input
                          type="radio"
                          name="related_attribute_is_default"
                          checked={Boolean(attr.isDefault)}
                          onChange={() => setDefaultAttribute(attr.id)}
                          className="h-3.5 w-3.5 text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={attr.title}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateAttribute(attr.id, {
                              title: value,
                              slug:
                                !attr.slug || attr.slug === slugifyAttribute(attr.title)
                                  ? slugifyAttribute(value)
                                  : attr.slug,
                            });
                          }}
                          className="w-full border border-slate-300 rounded-md py-1.5 px-2 text-xs focus:outline-hidden focus:border-blue-500"
                          placeholder="Title"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={attr.slug}
                          onChange={(e) => updateAttribute(attr.id, { slug: e.target.value })}
                          className="w-full border border-slate-300 rounded-md py-1.5 px-2 text-xs font-mono focus:outline-hidden focus:border-blue-500"
                          placeholder="slug"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={attr.color || '#000000'}
                          onChange={(e) => updateAttribute(attr.id, { color: e.target.value })}
                          className="h-8 w-8 rounded-sm border border-slate-300 bg-white p-0.5 cursor-pointer"
                          title="Pick color"
                        />
                        <input
                          type="text"
                          value={attr.color || ''}
                          onChange={(e) => updateAttribute(attr.id, { color: e.target.value })}
                          className="w-full min-w-0 border border-slate-300 rounded-md py-1.5 px-1.5 text-[11px] font-mono focus:outline-hidden focus:border-blue-500"
                          placeholder="#000000"
                        />
                      </div>
                      <div className="flex justify-center">
                        <label className="relative w-12 h-12 rounded-md border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer overflow-hidden flex items-center justify-center">
                          {attr.image ? (
                            <img src={attr.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <FiImage size={16} className="text-slate-400" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const url = URL.createObjectURL(file);
                              updateAttribute(attr.id, { image: url });
                            }}
                          />
                        </label>
                      </div>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => removeAttribute(attr.id)}
                          className="text-red-500 hover:text-red-700 p-1.5"
                          title="Remove"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-slate-200 bg-white">
              <button
                type="button"
                onClick={addAttribute}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-[#7c69ef] hover:bg-[#6b58e0] transition"
              >
                <FiPlus size={13} />
                Add new attribute
              </button>
            </div>
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
