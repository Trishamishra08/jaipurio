import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FiCheck,
  FiExternalLink,
  FiInfo,
  FiLogOut,
  FiSave,
  FiSearch,
  FiTrash2,
} from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import {
  FLASH_SALE_PRODUCT_CATALOG,
  formatFlashPrice,
  getFlashSaleById,
  getFlashSaleProduct,
} from '../../../data/flashSales';

const LANGUAGES = [
  { code: 'fr_FR', label: 'Français', flag: '🇫🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh_CN', label: '中文 (中国)', flag: '🇨🇳' },
  { code: 'de_CH_informal', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it_IT', label: 'Italiano', flag: '🇮🇹' },
];

const emptySale = {
  id: 'new',
  name: '',
  endDate: '',
  status: 'Published',
  products: [],
};

export const AdminEcommerceFlashSaleEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';
  const existing = useMemo(() => (isCreate ? null : getFlashSaleById(id)), [id, isCreate]);
  const seed = existing || emptySale;

  const [name, setName] = useState(seed.name);
  const [endDate, setEndDate] = useState(seed.endDate || '');
  const [status, setStatus] = useState(seed.status || 'Published');
  const [products, setProducts] = useState(seed.products || []);
  const [productQuery, setProductQuery] = useState('');
  const [savedToast, setSavedToast] = useState(false);
  const [selectedLangs, setSelectedLangs] = useState({});

  useEffect(() => {
    const next = isCreate ? emptySale : getFlashSaleById(id) || emptySale;
    setName(next.name);
    setEndDate(next.endDate || '');
    setStatus(next.status || 'Published');
    setProducts(next.products || []);
    setProductQuery('');
    setSelectedLangs({});
  }, [id, isCreate]);

  const selectedProductIds = useMemo(
    () => products.map((p) => String(p.productId)),
    [products]
  );

  const searchResults = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return [];
    return FLASH_SALE_PRODUCT_CATALOG.filter(
      (p) =>
        !selectedProductIds.includes(String(p.id)) &&
        (p.name.toLowerCase().includes(q) || String(p.id).includes(q))
    ).slice(0, 8);
  }, [productQuery, selectedProductIds]);

  const pageTitle = isCreate
    ? 'Create'
    : `Edit "${name || existing?.name || 'Flash sale'}"`;

  const handleSave = (exit = false) => {
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 1800);
    if (exit) navigate('/admin/ecommerce/flash-sales');
  };

  const addProduct = (product) => {
    setProducts((prev) => [
      ...prev,
      {
        productId: String(product.id),
        price: Math.round((Number(product.price) || 0) * 0.7),
        quantity: 1,
      },
    ]);
    setProductQuery('');
  };

  const removeProduct = (productId) => {
    setProducts((prev) => prev.filter((p) => String(p.productId) !== String(productId)));
  };

  const updateProductField = (productId, field, value) => {
    setProducts((prev) =>
      prev.map((p) =>
        String(p.productId) === String(productId)
          ? { ...p, [field]: field === 'quantity' ? Number(value) || 0 : value }
          : p
      )
    );
  };

  return (
    <EcommerceLayout breadcrumb={['FLASH SALES', pageTitle.toUpperCase()]}>
      {savedToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} />
          <span>Flash sale saved successfully!</span>
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
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                placeholder="Name"
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/80">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Products
              </h4>
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
                        onClick={() => addProduct(product)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b border-slate-100 last:border-0"
                      >
                        <span className="font-medium text-slate-800">{product.name}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          {formatFlashPrice(product.price)} · ID: {product.id}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Selected products</p>
                {products.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-200 rounded-md">
                    No products selected.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden">
                    {products.map((row) => {
                      const product = getFlashSaleProduct(row.productId);
                      const label = product?.name || `Product #${row.productId}`;
                      const regular = product?.price ?? 0;
                      return (
                        <li key={row.productId} className="px-3 py-3 hover:bg-slate-50/80 space-y-2.5">
                          <div className="flex items-start justify-between gap-3">
                            <Link
                              to={`/admin/ecommerce/products/edit/${row.productId}`}
                              className="text-xs text-blue-600 hover:underline leading-snug"
                            >
                              {label} ({formatFlashPrice(regular)})
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeProduct(row.productId)}
                              className="text-red-500 hover:text-red-700 shrink-0 p-0.5"
                              title="Delete"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Price <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={row.price}
                                onChange={(e) =>
                                  updateProductField(
                                    row.productId,
                                    'price',
                                    e.target.value.replace(/[^\d.]/g, '')
                                  )
                                }
                                className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Quantity
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={row.quantity}
                                onChange={(e) =>
                                  updateProductField(row.productId, 'quantity', e.target.value)
                                }
                                className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </li>
                      );
                    })}
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
                    to={`/admin/ecommerce/flash-sales/edit/${id || 'create'}?ref_lang=${lang.code}`}
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

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              End date<span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </EcommerceLayout>
  );
};

export default AdminEcommerceFlashSaleEdit;
