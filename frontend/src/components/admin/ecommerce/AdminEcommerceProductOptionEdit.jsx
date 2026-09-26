import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FiCheck,
  FiExternalLink,
  FiInfo,
  FiLogOut,
  FiMenu,
  FiPlus,
  FiSave,
  FiTrash2,
} from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import {
  OPTION_TYPE_CHOICES,
  PRICE_TYPE_CHOICES,
  getProductOptionById,
} from '../../../data/productOptions';
import SeoEditorPanel, { normalizeSeoState } from './SeoEditorPanel';
import { ecommerceCreate, ecommerceGet, ecommerceUpdate } from '../../../utils/ecommerceApi';

const isMongoId = (value) => /^[a-f0-9]{24}$/i.test(String(value || ''));

const slugify = (text = '') =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

const LANGUAGES = [
  { code: 'fr_FR', label: 'Français', flag: '🇫🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh_CN', label: '中文 (中国)', flag: '🇨🇳' },
  { code: 'de_CH_informal', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it_IT', label: 'Italiano', flag: '🇮🇹' },
];

const emptyOption = {
  id: 'new',
  name: '',
  optionType: 'dropdown',
  required: false,
  values: [],
};

export const AdminEcommerceProductOptionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';
  const existing = useMemo(() => (isCreate ? null : getProductOptionById(id)), [id, isCreate]);
  const seed = existing || emptyOption;

  const [mongoId, setMongoId] = useState(isMongoId(id) ? id : null);
  const [name, setName] = useState(seed.name);
  const [optionType, setOptionType] = useState(seed.optionType || '');
  const [required, setRequired] = useState(Boolean(seed.required));
  const [values, setValues] = useState(seed.values || []);
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
  const [selectedLangs, setSelectedLangs] = useState({});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (isCreate) {
        setName(emptyOption.name);
        setOptionType(emptyOption.optionType || '');
        setRequired(Boolean(emptyOption.required));
        setValues(emptyOption.values || []);
        setSeo(normalizeSeoState(null));
        setMongoId(null);
        setSelectedLangs({});
        return;
      }
      try {
        if (isMongoId(id)) {
          const row = await ecommerceGet('product-options', id);
          if (cancelled || !row) return;
          setMongoId(row._id || row.id);
          setName(row.name || '');
          setOptionType(row.optionType || '');
          setRequired(Boolean(row.required));
          setValues(Array.isArray(row.values) ? row.values : []);
          setSeo(
            normalizeSeoState(row.seo, {
              slug: row.slug,
              seoTitle: row.seoTitle,
              seoDescription: row.seoDescription,
            })
          );
          setSelectedLangs({});
          return;
        }
      } catch {
        /* fallback local */
      }
      if (cancelled) return;
      const next = getProductOptionById(id) || emptyOption;
      setName(next.name);
      setOptionType(next.optionType || '');
      setRequired(Boolean(next.required));
      setValues(next.values || []);
      setSeo(
        normalizeSeoState(next.seo, {
          slug: next.slug,
          seoTitle: next.seoTitle,
          seoDescription: next.seoDescription,
        })
      );
      setSelectedLangs({});
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const pageTitle = isCreate
    ? 'Create'
    : `Edit option ${name || existing?.name || ''}`.trim();

  const updateValue = (valueId, patch) => {
    setValues((prev) => prev.map((row) => (row.id === valueId ? { ...row, ...patch } : row)));
  };

  const removeValue = (valueId) => {
    setValues((prev) => prev.filter((row) => row.id !== valueId));
  };

  const addValue = () => {
    setValues((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        label: '',
        price: 0,
        priceType: 'fixed',
      },
    ]);
  };

  const handleSave = async (exit = false) => {
    setSaveError('');
    const nextSlug = seo.general?.slug || slugify(name);
    const payload = {
      name,
      optionType,
      required,
      values,
      seo: { ...seo, general: { ...seo.general, slug: nextSlug } },
      seoTitle: seo.general?.metaTitle || '',
      seoDescription: seo.general?.metaDescription || '',
    };
    try {
      if (mongoId) {
        await ecommerceUpdate('product-options', mongoId, payload);
      } else {
        const created = await ecommerceCreate('product-options', payload);
        if (created?._id) setMongoId(created._id);
      }
      setSavedToast(true);
      window.setTimeout(() => setSavedToast(false), 1800);
      if (exit) navigate('/admin/ecommerce/options');
    } catch (err) {
      setSaveError(err?.message || 'Save failed');
    }
  };

  return (
    <EcommerceLayout breadcrumb={['PRODUCTS', 'PRODUCT OPTIONS', pageTitle.toUpperCase()]}>
      {savedToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} />
          <span>Option saved successfully!</span>
        </div>
      )}

      <div className="bg-[#EBF5FB] border border-[#D4E6F1] text-[#2471A3] rounded-md p-3 mb-5 flex items-center gap-2.5 text-xs">
        <FiInfo size={16} className="text-[#2980B9] shrink-0" />
        <span>
          You are editing <strong className="font-bold">"English"</strong> version
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Option name"
              />
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/80">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Option value
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="w-12 px-3 py-2.5 text-center">#</th>
                    <th className="px-3 py-2.5">Label</th>
                    <th className="w-36 px-3 py-2.5">Price</th>
                    <th className="w-40 px-3 py-2.5">Price Type</th>
                    <th className="w-14 px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {values.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-xs text-slate-400">
                        No option values yet. Click &quot;Add new row&quot;.
                      </td>
                    </tr>
                  )}
                  {values.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="px-3 py-2.5 text-center text-slate-400">
                        <FiMenu size={14} className="inline-block" />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={row.label}
                          onChange={(e) => updateValue(row.id, { label: e.target.value })}
                          placeholder="Please fill label"
                          className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs focus:outline-hidden focus:border-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          value={row.price}
                          onChange={(e) =>
                            updateValue(row.id, { price: Number(e.target.value) || 0 })
                          }
                          className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs focus:outline-hidden focus:border-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          value={row.priceType}
                          onChange={(e) => updateValue(row.id, { priceType: e.target.value })}
                          className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs bg-white focus:outline-hidden focus:border-blue-500"
                        >
                          {PRICE_TYPE_CHOICES.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeValue(row.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-slate-200">
              <button
                type="button"
                onClick={addValue}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                <FiPlus size={13} />
                Add new row
              </button>
            </div>
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
                        const metaTitle = name ? `${name} | Jaipurio`.slice(0, 60) : '';
                        const metaDescription = name
                          ? `Choose your ${name} option for Jaipurio products.`
                          : '';
                        const slug = slugify(name);
                        setSeo(
                          normalizeSeoState({
                            general: {
                              slug,
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
                          const row = await ecommerceGet('product-options', mongoId);
                          if (row?.seo) {
                            setSeo(
                              normalizeSeoState(row.seo, {
                                slug: row.slug,
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
                previewTitle={name}
                previewUrl={`https://jaipurio.in/options/${seo.general?.slug || slugify(name) || 'slug'}`}
                onGenerateSlug={() => {
                  const s = slugify(name);
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

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Languages
            </h4>
            <div className="space-y-1.5">
              {LANGUAGES.map((lang) => (
                <div
                  key={lang.code}
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50"
                >
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer min-w-0">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedLangs[lang.code])}
                      onChange={() =>
                        setSelectedLangs((prev) => ({
                          ...prev,
                          [lang.code]: !prev[lang.code],
                        }))
                      }
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span aria-hidden>{lang.flag}</span>
                    <span className="truncate">{lang.label}</span>
                  </label>
                  <Link
                    to={`/admin/ecommerce/options/edit/${id || 'create'}?ref_lang=${lang.code}`}
                    className="text-slate-400 hover:text-blue-600 shrink-0"
                    title={`Edit ${lang.label}`}
                  >
                    <FiExternalLink size={13} />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Type<span className="text-red-500">*</span>
            </label>
            <select
              value={optionType}
              onChange={(e) => setOptionType(e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
            >
              {OPTION_TYPE_CHOICES.map((opt) => (
                <option key={opt.value || 'empty'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
              />
              Is required?
            </label>
          </div>
        </div>
      </div>
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductOptionEdit;
