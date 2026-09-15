import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FiCheck,
  FiExternalLink,
  FiImage,
  FiInfo,
  FiLogOut,
  FiSave,
  FiSearch,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import {
  COLLECTION_PRODUCT_CATALOG,
  getProductCollectionById,
  slugifyCollection,
} from '../../../data/productCollections';

const LANGUAGES = [
  { code: 'fr_FR', label: 'Français', flag: '🇫🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh_CN', label: '中文 (中国)', flag: '🇨🇳' },
  { code: 'de_CH_informal', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it_IT', label: 'Italiano', flag: '🇮🇹' },
];

const emptyCollection = {
  id: 'new',
  name: '',
  slug: '',
  description: '',
  status: 'Published',
  isFeatured: false,
  image: '',
  productIds: [],
};

export const AdminEcommerceProductCollectionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';
  const existing = useMemo(
    () => (isCreate ? null : getProductCollectionById(id)),
    [id, isCreate]
  );
  const seed = existing || emptyCollection;

  const [name, setName] = useState(seed.name);
  const [slug, setSlug] = useState(seed.slug);
  const [description, setDescription] = useState(seed.description || '');
  const [status, setStatus] = useState(seed.status || 'Published');
  const [isFeatured, setIsFeatured] = useState(Boolean(seed.isFeatured));
  const [image, setImage] = useState(seed.image || '');
  const [productIds, setProductIds] = useState(seed.productIds || []);
  const [productQuery, setProductQuery] = useState('');
  const [savedToast, setSavedToast] = useState(false);
  const [selectedLangs, setSelectedLangs] = useState({});

  useEffect(() => {
    const next = isCreate ? emptyCollection : getProductCollectionById(id) || emptyCollection;
    setName(next.name);
    setSlug(next.slug);
    setDescription(next.description || '');
    setStatus(next.status || 'Published');
    setIsFeatured(Boolean(next.isFeatured));
    setImage(next.image || '');
    setProductIds(next.productIds || []);
    setProductQuery('');
    setSelectedLangs({});
  }, [id, isCreate]);

  const selectedProducts = useMemo(
    () =>
      productIds
        .map((pid) => COLLECTION_PRODUCT_CATALOG.find((p) => String(p.id) === String(pid)))
        .filter(Boolean),
    [productIds]
  );

  const searchResults = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return [];
    return COLLECTION_PRODUCT_CATALOG.filter(
      (p) =>
        !productIds.includes(p.id) &&
        (p.name.toLowerCase().includes(q) || String(p.id).includes(q))
    ).slice(0, 8);
  }, [productQuery, productIds]);

  const pageTitle = isCreate
    ? 'Create'
    : `Edit "${name || existing?.name || 'Collection'}"`;

  const handleSave = (exit = false) => {
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 1800);
    if (exit) navigate('/admin/ecommerce/product-collections');
  };

  const addProduct = (productId) => {
    setProductIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
    setProductQuery('');
  };

  const removeProduct = (productId) => {
    setProductIds((prev) => prev.filter((pid) => pid !== productId));
  };

  return (
    <EcommerceLayout breadcrumb={['PRODUCTS', 'PRODUCT COLLECTIONS', pageTitle.toUpperCase()]}>
      {savedToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} />
          <span>Collection saved successfully!</span>
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  const value = e.target.value;
                  setName(value);
                  if (!existing || slug === slugifyCollection(seed.name)) {
                    setSlug(slugifyCollection(value));
                  }
                }}
                maxLength={120}
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Collection name"
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                Label key:{' '}
                <code className="px-1 py-0.5 rounded-sm bg-slate-100 text-slate-700 font-mono">
                  {slug || 'slug'}
                </code>
                . We will use this key for filter.
              </p>
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
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 font-mono focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={400}
                placeholder="Short description"
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
              />
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/80">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Products</h4>
            </div>

            <div className="p-4 space-y-4">
              <div className="relative">
                <FiSearch
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search products"
                  className="w-full border border-slate-300 rounded-md py-2 pl-9 pr-3 text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg max-h-56 overflow-auto">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(product.id)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b border-slate-100 last:border-0"
                      >
                        <span className="font-medium text-slate-800">{product.name}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          ID: {product.id}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Selected products</p>
                {selectedProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-md">
                    No products selected.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden">
                    {selectedProducts.map((product) => (
                      <li
                        key={product.id}
                        className="flex items-start justify-between gap-3 px-3 py-2.5 hover:bg-slate-50/80"
                      >
                        <Link
                          to={`/admin/ecommerce/products/edit/${product.id}`}
                          className="text-xs text-blue-600 hover:underline leading-snug"
                        >
                          {product.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeProduct(product.id)}
                          className="text-red-500 hover:text-red-700 shrink-0 p-0.5"
                          title="Delete"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
                    to={`/admin/ecommerce/product-collections/edit/${id || 'create'}?ref_lang=${lang.code}`}
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

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
              />
              Is featured?
            </label>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Image
            </h4>
            <div className="relative w-full aspect-[4/3] rounded-md border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
              {image ? (
                <>
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute top-2 right-2 bg-white/90 text-slate-600 hover:text-red-600 rounded-full p-1 shadow-sm"
                    title="Remove image"
                  >
                    <FiX size={14} />
                  </button>
                </>
              ) : (
                <FiImage size={28} className="text-slate-300" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="text-blue-600 hover:underline font-medium cursor-pointer">
                Choose image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setImage(URL.createObjectURL(file));
                  }}
                />
              </label>
              <span className="text-slate-400">or</span>
              <button
                type="button"
                onClick={() => {
                  const url = window.prompt('Add image from URL');
                  if (url) setImage(url.trim());
                }}
                className="text-blue-600 hover:underline font-medium"
              >
                Add from URL
              </button>
            </div>
          </div>
        </div>
      </div>
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductCollectionEdit;
