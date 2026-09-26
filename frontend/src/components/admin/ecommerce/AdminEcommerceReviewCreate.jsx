import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiCheck,
  FiImage,
  FiLogOut,
  FiSave,
  FiSearch,
  FiStar,
  FiX,
} from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import { fetchAdminProducts } from '../../../utils/marketplaceApi';
import { fetchEcommerceCustomers } from '../../../utils/ecommerceApi';
import { createAdminReview } from '../../../utils/reviewApi';

const formatNowForReview = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

const SearchSelect = ({
  label,
  required,
  placeholder,
  valueLabel,
  query,
  onQueryChange,
  options,
  onSelect,
  onClear,
}) => (
  <div>
    <label className="block text-xs font-bold text-slate-700 mb-1.5">
      {label}
      {required ? <span className="text-red-500">*</span> : null}
    </label>
    <div className="relative">
      <div className="flex items-center border border-slate-300 rounded-md bg-white overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        <FiSearch size={14} className="ml-2.5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={valueLabel || placeholder}
          className="flex-1 py-2 px-2 text-xs text-slate-800 focus:outline-hidden min-w-0"
        />
        {valueLabel ? (
          <button
            type="button"
            onClick={onClear}
            className="px-2 text-slate-400 hover:text-slate-600"
            title="Clear"
          >
            <FiX size={14} />
          </button>
        ) : null}
      </div>
      {query.trim() && options.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg max-h-48 overflow-auto">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b border-slate-100 last:border-0"
            >
              <span className="font-medium text-slate-800">{opt.name}</span>
              {opt.email ? (
                <span className="block text-[10px] text-slate-400 mt-0.5">{opt.email}</span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
);

export const AdminEcommerceReviewCreate = () => {
  const navigate = useNavigate();

  const [allProducts, setAllProducts] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);

  useEffect(() => {
    fetchAdminProducts()
      .then((rows) => setAllProducts(rows.map((p) => ({ id: String(p._id || p.id), name: p.title || p.name }))))
      .catch(() => {});
    fetchEcommerceCustomers()
      .then((rows) => setAllCustomers((Array.isArray(rows) ? rows : []).map((c) => ({ id: String(c._id || c.id), name: c.name, email: c.email }))))
      .catch(() => {});
  }, []);

  const [productId, setProductId] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [star, setStar] = useState(5);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [createdAt, setCreatedAt] = useState(formatNowForReview());
  const [savedToast, setSavedToast] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const selectedProduct = useMemo(
    () => allProducts.find((p) => p.id === productId) || null,
    [productId, allProducts]
  );
  const selectedCustomer = useMemo(
    () => allCustomers.find((c) => c.id === customerId) || null,
    [customerId, allCustomers]
  );

  const productOptions = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return [];
    return allProducts.filter((p) => p.name?.toLowerCase().includes(q)).slice(0, 8);
  }, [productQuery, allProducts]);

  const customerOptions = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return [];
    return allCustomers.filter(
      (c) => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [customerQuery, allCustomers]);

  const handleSave = async (exit = false) => {
    if (!productId) {
      setSaveError('Please select a product.');
      return;
    }
    if (!comment.trim()) {
      setSaveError('Please enter a comment.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await createAdminReview({
        productId,
        customerId: customerId || undefined,
        guestName: customerId ? undefined : customerName,
        guestEmail: customerId ? undefined : customerEmail,
        rating: star,
        comment,
        images: images.map((img) => img.url).filter((url) => !url.startsWith('blob:')),
      });
      setSavedToast(true);
      window.setTimeout(() => setSavedToast(false), 1800);
      if (exit) navigate('/admin/ecommerce/reviews');
    } catch (err) {
      setSaveError(err.parsedMessage || err.message || 'Failed to save review.');
    } finally {
      setSaving(false);
    }
  };

  const addImages = (files) => {
    const list = Array.from(files || []).map((file) => ({
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setImages((prev) => [...prev, ...list]);
  };

  return (
    <EcommerceLayout breadcrumb={['REVIEWS', 'CREATE REVIEW']}>
      {savedToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} />
          <span>Review saved successfully!</span>
        </div>
      )}

      {saveError && (
        <div className="mb-4 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-4">
            <SearchSelect
              label="Product"
              required
              placeholder="--Select--"
              valueLabel={selectedProduct?.name || ''}
              query={productQuery}
              onQueryChange={setProductQuery}
              options={productOptions}
              onSelect={(opt) => {
                setProductId(opt.id);
                setProductQuery('');
              }}
              onClear={() => {
                setProductId('');
                setProductQuery('');
              }}
            />

            <div>
              <SearchSelect
                label="Choose from existing customers"
                placeholder="--Select--"
                valueLabel={
                  selectedCustomer
                    ? `${selectedCustomer.name} (${selectedCustomer.email})`
                    : ''
                }
                query={customerQuery}
                onQueryChange={setCustomerQuery}
                options={customerOptions}
                onSelect={(opt) => {
                  setCustomerId(opt.id);
                  setCustomerName(opt.name);
                  setCustomerEmail(opt.email);
                  setCustomerQuery('');
                }}
                onClear={() => {
                  setCustomerId('');
                  setCustomerQuery('');
                }}
              />
              <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
                Choose a customer to leave a review as them. If you want to enter the customer
                details manually, leave empty this field and fill the customer name and email
                fields below.
              </p>
            </div>

            <div className="pt-1 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-600 mb-3">
                Or enter manually customer details:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Customer name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Customer email
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Star</label>
              <select
                value={star}
                onChange={(e) => setStar(Number(e.target.value))}
                className="w-full sm:w-40 border border-slate-300 rounded-md py-2 px-3 text-xs bg-white focus:outline-hidden focus:border-blue-500"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FiStar
                    key={i}
                    size={14}
                    className={i < star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Comment<span className="text-red-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Images</label>
              <div className="flex flex-wrap gap-2">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative w-20 h-20 rounded-md border border-slate-200 overflow-hidden bg-slate-50"
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((x) => x.id !== img.id))}
                      className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 text-slate-600 hover:text-red-600"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 rounded-md border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer flex flex-col items-center justify-center text-slate-400 gap-1">
                  <FiImage size={18} />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      addImages(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">Click here to add more images.</p>
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
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-slate-900 disabled:opacity-60 text-white font-semibold py-2 px-3 rounded-md text-xs shadow-xs transition"
            >
              <FiSave size={14} />
              Save
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-800 font-semibold py-2 px-3 rounded-md text-xs transition"
            >
              <FiLogOut size={14} />
              Save & Exit
            </button>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Created At
            </h4>
            <input
              type="text"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs font-mono focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </EcommerceLayout>
  );
};

export default AdminEcommerceReviewCreate;
