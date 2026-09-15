import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FiCheck,
  FiExternalLink,
  FiInfo,
  FiLogOut,
  FiRefreshCw,
  FiSave,
} from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import { getProductTagById, slugifyTag } from '../../../data/productTags';

const LANGUAGES = [
  { code: 'fr_FR', label: 'Français', flag: '🇫🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh_CN', label: '中文 (中国)', flag: '🇨🇳' },
  { code: 'de_CH_informal', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it_IT', label: 'Italiano', flag: '🇮🇹' },
];

const formatSeoDate = (isoDate = '2025-07-20') => {
  const [year, month, day] = String(isoDate).split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (!year || !month || !day) return isoDate;
  return `${months[month - 1]} ${day}, ${year}`;
};

const emptyTag = {
  id: 'new',
  name: '',
  slug: '',
  description: '',
  status: 'Published',
  createdAt: new Date().toISOString().slice(0, 10),
  seoTitle: '',
  seoDescription: '',
};

export const AdminEcommerceProductTagEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';

  const existing = useMemo(() => (isCreate ? null : getProductTagById(id)), [id, isCreate]);
  const seed = existing || emptyTag;

  const [name, setName] = useState(seed.name);
  const [permalink, setPermalink] = useState(seed.slug);
  const [description, setDescription] = useState(seed.description || '');
  const [status, setStatus] = useState(seed.status || 'Published');
  const [seoOpen, setSeoOpen] = useState(false);
  const [seoTitle, setSeoTitle] = useState(seed.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(seed.seoDescription || '');
  const [savedToast, setSavedToast] = useState(false);
  const [selectedLangs, setSelectedLangs] = useState({});

  useEffect(() => {
    const next = isCreate ? emptyTag : getProductTagById(id) || emptyTag;
    setName(next.name);
    setPermalink(next.slug);
    setDescription(next.description || '');
    setStatus(next.status || 'Published');
    setSeoTitle(next.seoTitle || '');
    setSeoDescription(next.seoDescription || '');
    setSelectedLangs({});
  }, [id, isCreate]);

  const previewUrl = `https://jaipurio.in/product-tags/${permalink || 'slug'}`;
  const displaySeoTitle = seoTitle || name || 'Product tag';
  const displaySeoDescription =
    seoDescription ||
    (name
      ? `Shop ${name} products and handcrafted collections from Jaipurio.`
      : 'Product tag on Jaipurio.');
  const pageTitle = isCreate ? 'Create' : `Edit "${name || existing?.name || 'Tag'}"`;

  const handleGenerateUrl = () => {
    setPermalink(slugifyTag(name));
  };

  const handleSave = (exit = false) => {
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 1800);
    if (exit) {
      navigate('/admin/ecommerce/product-tags');
    }
  };

  const toggleLang = (code) => {
    setSelectedLangs((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  return (
    <EcommerceLayout breadcrumb={['PRODUCTS', 'PRODUCT TAGS', pageTitle.toUpperCase()]}>
      {savedToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} />
          <span>Tag saved successfully!</span>
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
                placeholder="Enter tag name..."
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between text-xs mb-1 text-slate-600">
                <span className="font-semibold text-slate-700">
                  Permalink <span className="text-red-500">*</span>
                </span>
                <button
                  type="button"
                  onClick={handleGenerateUrl}
                  className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                >
                  <FiRefreshCw size={11} />
                  <span>Generate URL</span>
                </button>
              </div>

              <div className="flex items-center rounded-md border border-slate-300 bg-slate-50 overflow-hidden text-xs">
                <span className="px-2.5 py-1.5 text-slate-500 bg-slate-100 border-r border-slate-300 select-none text-[11px] whitespace-nowrap">
                  https://jaipurio.in/product-tags/
                </span>
                <input
                  type="text"
                  value={permalink}
                  onChange={(e) => setPermalink(e.target.value)}
                  className="flex-1 bg-white py-1.5 px-2.5 text-xs text-slate-800 focus:outline-hidden min-w-0"
                />
              </div>

              <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1 flex-wrap">
                <span>Preview:</span>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {previewUrl}
                </a>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Short description"
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y min-h-[110px]"
              />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Search Engine Optimize
              </h4>
              <button
                type="button"
                onClick={() => setSeoOpen((v) => !v)}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Edit SEO meta
              </button>
            </div>

            {seoOpen && (
              <div className="space-y-3 pb-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">SEO Title</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    SEO Description
                  </label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={3}
                    className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs focus:outline-hidden focus:border-blue-500 resize-y"
                  />
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1">
              <h4 className="text-sm font-semibold text-blue-800 hover:underline cursor-pointer">
                {displaySeoTitle}
              </h4>
              <p className="text-emerald-700 text-xs font-mono break-all">{previewUrl}</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="text-slate-400 font-medium">
                  {formatSeoDate(existing?.createdAt || seed.createdAt)} -{' '}
                </span>
                {displaySeoDescription}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Publish
            </h4>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleSave(false)}
                className="w-full flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-slate-900 text-white font-semibold py-2 px-3 rounded-md text-xs shadow-xs transition"
              >
                <FiSave size={14} />
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="w-full flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold py-2 px-3 rounded-md text-xs transition"
              >
                <FiLogOut size={14} />
                <span>Save & Exit</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Languages
            </h4>
            <div className="space-y-1.5">
              {LANGUAGES.map((lang) => (
                <div
                  key={lang.code}
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-100"
                >
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer min-w-0">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedLangs[lang.code])}
                      onChange={() => toggleLang(lang.code)}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span aria-hidden>{lang.flag}</span>
                    <span className="truncate">{lang.label}</span>
                  </label>
                  <Link
                    to={`/admin/ecommerce/product-tags/edit/${id || 'create'}?ref_lang=${lang.code}`}
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
              Status<span className="text-red-500">*</span>
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
        </div>
      </div>
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductTagEdit;
