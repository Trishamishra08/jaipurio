import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { flattenCategoryOptions } from '../../data/catalogTaxonomy';
import {
  saveProduct,
  submitProductForReview,
  fetchProductById,
  setProductLifecycle,
  resolveProductId,
} from '../../utils/marketplaceApi';
import { refreshAdminBadges } from '../../utils/adminAuth';
import api from '../../utils/api';

const emptyProduct = {
  title: '',
  sku: '',
  store: '',
  category: '',
  brand: '',
  content: '',
  price: '',
  salePrice: '',
  discountProductPrice: '',
  costPerItem: '',
  barcode: '',
  stock: '',
  warehouse: '',
  stockStatus: 'In Stock',
  trackQuantity: true,
  published: false,
  lifecycle: 'Draft',
  isFeatured: false,
  weight: '',
  length: '',
  width: '',
  height: '',
  attributes: [{ name: 'Material', value: '' }],
  options: [],
  crossSell: '',
  related: '',
  faqs: '',
  tags: '',
  minQty: '',
  maxQty: '',
  featuredImage: '',
  iconImage: '',
  images: [],
  seoTitle: '',
  seoDescription: '',
  rejectReason: '',
  packSize: '',
  careInstructions: '',
  shippingNotes: '',
  returnNotes: '',
};

const Field = ({ label, hint, children }) => (
  <label className="admin-field">
    <span>{label}</span>
    {children}
    {hint ? <small className="text-[11px] text-slate-400">{hint}</small> : null}
  </label>
);

async function uploadFilesToServer(files) {
  if (!files?.length) return [];
  const formData = new FormData();
  files.forEach((file) => formData.append('documents', file));
  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (res.data?.success && Array.isArray(res.data.data)) return res.data.data;
  throw new Error(res.data?.message || 'Image upload failed');
}

const ImagePicker = ({ label, hint, images = [], onChange, uploading }) => {
  const inputRef = useRef(null);

  const removeAt = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-700">{label}</p>
      {hint ? <p className="text-[11px] text-slate-400">{hint}</p> : null}
      <div
        className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50/80 hover:bg-slate-50 transition-colors cursor-pointer relative"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => {
            const picked = Array.from(e.target.files || []);
            if (picked.length) onChange([...images, ...picked]);
            e.target.value = '';
          }}
        />
        {uploading ? (
          <Loader2 size={22} className="mx-auto animate-spin text-slate-500" />
        ) : (
          <Upload size={22} className="mx-auto text-slate-500" />
        )}
        <p className="text-[11px] font-semibold text-slate-700 mt-2">Choose from device</p>
        <p className="text-[10px] text-slate-400">JPG, PNG, WebP — up to 10 images</p>
      </div>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((item, index) => {
            const src = typeof item === 'string' ? item : URL.createObjectURL(item);
            const isMain = index === 0;
            return (
              <div key={`${src}-${index}`} className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden group">
                <img src={src} alt="" className="w-full h-full object-cover" />
                {isMain && (
                  <span className="absolute bottom-0 inset-x-0 bg-[#6F241D]/85 text-white text-[7px] font-bold text-center py-0.5">
                    MAIN
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center text-red-500 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ProductEditorForm = ({ role = 'vendor', productId, onSaved }) => {
  const isVendor = role === 'vendor';
  const categories = useMemo(() => flattenCategoryOptions(), []);
  const [form, setForm] = useState({ ...emptyProduct });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!productId) {
        let storeName = '';
        if (isVendor) {
          try {
            const res = await api.get('/vendors/profile');
            storeName = res.data?.data?.vendor?.storeName || res.data?.data?.storeName || '';
          } catch {
            /* profile optional on demo */
          }
        }
        if (!cancelled) {
          setForm({ ...emptyProduct, store: storeName });
          setPendingImages([]);
          setMessage('');
        }
        return;
      }
      try {
        const existing = await fetchProductById(productId);
        const gallery = existing?.images?.length
          ? existing.images
          : existing?.featuredImage || existing?.image
            ? [existing.featuredImage || existing.image]
            : [];
        if (!cancelled) {
          setForm({ ...emptyProduct, ...(existing || {}), images: gallery });
          setPendingImages(gallery);
          setMessage('');
        }
      } catch (err) {
        if (!cancelled) {
          setMessage(err.response?.data?.message || err.message || 'Could not load product.');
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [productId, role, isVendor]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const materialValue = (form.attributes || []).find((a) => a.name === 'Material')?.value || '';
  const setMaterial = (value) => {
    const attrs = [...(form.attributes || [{ name: 'Material', value: '' }])];
    const idx = attrs.findIndex((a) => a.name === 'Material');
    if (idx >= 0) attrs[idx] = { ...attrs[idx], value };
    else attrs.unshift({ name: 'Material', value });
    set('attributes', attrs);
  };

  const resolveImageUrls = async () => {
    const fileItems = pendingImages.filter((item) => item instanceof File);
    const urlItems = pendingImages.filter((item) => typeof item === 'string' && item.trim());
    if (!fileItems.length) return urlItems;
    setUploadingImages(true);
    try {
      const uploaded = await uploadFilesToServer(fileItems);
      return [...urlItems, ...uploaded];
    } finally {
      setUploadingImages(false);
    }
  };

  const persist = async (nextLifecycle, extras = {}) => {
    if (!form.title || !form.sku || !form.category || !form.price) {
      setMessage('Required: Title, SKU, Category, Price.');
      return;
    }
    if (isVendor && pendingImages.length === 0) {
      setMessage('Add at least one product image from your device.');
      return;
    }

    let imageUrls = [];
    try {
      imageUrls = await resolveImageUrls();
    } catch (err) {
      setMessage(err.message || 'Image upload failed');
      return;
    }

    const record = {
      ...form,
      ...extras,
      featuredImage: imageUrls[0] || form.featuredImage || '',
      image: imageUrls[0] || form.image || '',
      images: imageUrls,
      lifecycle: nextLifecycle === 'Pending Approval' && isVendor ? 'Draft' : nextLifecycle,
      published: nextLifecycle === 'Published',
      stockStatus:
        form.trackQuantity && Number(form.stock) === 0 ? 'Out of Stock' : form.stockStatus || 'In Stock',
    };

    setSaving(true);
    setMessage('');
    try {
      if (role === 'admin' && (nextLifecycle === 'Published' || nextLifecycle === 'Rejected')) {
        const productId = resolveProductId(record);
        if (!productId) {
          setMessage('Could not find product ID. Reload from the products list.');
          return;
        }
        await saveProduct({ ...record, lifecycle: form.lifecycle || record.lifecycle }, role);
        const saved = await setProductLifecycle(productId, nextLifecycle, extras);
        const merged = { ...record, ...saved, lifecycle: nextLifecycle };
        setForm(merged);
        setPendingImages(merged.images || imageUrls);
        setMessage(`Saved as ${nextLifecycle}`);
        refreshAdminBadges();
        onSaved?.(merged);
        return;
      }

      if (role === 'admin') {
        const saved = await saveProduct({ ...record, lifecycle: nextLifecycle }, role);
        const merged = { ...record, ...saved, id: saved.id || saved._id || record.id, _id: saved._id || saved.id || record._id };
        setForm(merged);
        setPendingImages(merged.images || imageUrls);
        setMessage(`Saved as ${nextLifecycle}`);
        refreshAdminBadges();
        onSaved?.(merged);
        return;
      }

      const saved = await saveProduct(record, role);
      let merged = {
        ...record,
        ...saved,
        id: saved.id || saved._id || record.id,
        _id: saved._id || saved.id || record._id,
      };

      if (isVendor && nextLifecycle === 'Pending Approval') {
        merged = { ...merged, ...(await submitProductForReview(merged)), lifecycle: 'Pending Approval' };
      } else {
        merged.lifecycle = nextLifecycle;
      }

      setForm(merged);
      setPendingImages(merged.images || imageUrls);
      setMessage(`Saved as ${nextLifecycle}`);
      onSaved?.(merged);
    } catch (err) {
      const apiMsg = err.response?.data?.message || err.parsedMessage || err.message;
      setMessage(apiMsg || 'Could not save product. Check vendor login and backend connection.');
    } finally {
      setSaving(false);
    }
  };

  const submitReview = (e) => {
    e.preventDefault();
    persist('Pending Approval');
  };

  const lifecycleBar = (
    <div className="admin-card p-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Product lifecycle</p>
        <strong>{form.lifecycle}</strong>
        <span className="ml-2 admin-badge admin-badge-info">{form.stockStatus}</span>
        {form.published ? <span className="ml-2 admin-badge admin-badge-success">Published</span> : <span className="ml-2 admin-badge admin-badge-warning">Hidden</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="admin-btn-light" disabled={uploadingImages || saving} onClick={() => persist(form.lifecycle === 'Published' ? 'Published' : 'Draft')}>Save</button>
        {role === 'vendor' && form.lifecycle !== 'Published' && (
          <button type="submit" className="admin-btn-primary" disabled={uploadingImages || saving}>
            {saving ? 'Submitting…' : 'Submit for review'}
          </button>
        )}
        {role === 'admin' && form.lifecycle === 'Pending Approval' && (
          <>
            <button type="button" className="admin-btn-light" onClick={() => persist('Rejected', { rejectReason: form.rejectReason || 'Needs better images' })}>Reject</button>
            <button type="button" className="admin-btn-primary" onClick={() => persist('Published')}>Approve & publish</button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <form className="space-y-4" onSubmit={submitReview}>
      {lifecycleBar}
      {message && (
        <p className={`text-sm ${message.startsWith('Saved as') ? 'text-emerald-700' : 'text-amber-700'}`}>
          {message}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="admin-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Product details</h2>
          {form.store || role === 'admin' ? (
            <Field label={isVendor ? 'Your store' : 'Store'}>
              <input
                value={form.store}
                onChange={(e) => set('store', e.target.value)}
                readOnly={isVendor}
                className={isVendor ? 'bg-slate-50 text-slate-600' : undefined}
              />
            </Field>
          ) : null}
          <Field label="Title *"><input value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="e.g. Kundan Bangle Set" /></Field>
          <Field label="SKU *"><input value={form.sku} onChange={(e) => set('sku', e.target.value)} required placeholder="e.g. JP-BAN-001" /></Field>
          <Field label="Category *">
            <select value={form.category} onChange={(e) => set('category', e.target.value)} required>
              <option value="">Select category</option>
              {categories.map((cat) => <option key={cat.id} value={cat.label}>{cat.label}</option>)}
            </select>
          </Field>
          <Field label="Description" hint="Craft story, material, size notes — shown on product page">
            <textarea rows={4} value={form.content} onChange={(e) => set('content', e.target.value)} placeholder="Describe your product..." />
          </Field>
          <Field label="Brand" hint="Shown on product page"><input value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="e.g. Jaipurio Heritage" /></Field>
          <Field label="Material / Finish" hint="Shown in specifications & finish selector"><input value={materialValue} onChange={(e) => setMaterial(e.target.value)} placeholder="e.g. Kundan, Terracotta" /></Field>
          <Field label="Pack / Size label" hint="Shown as size on product page"><input value={form.packSize} onChange={(e) => set('packSize', e.target.value)} placeholder="e.g. Standard, Set of 2" /></Field>
          <Field label="Tags" hint="Comma separated — e.g. kundan, bridal"><input value={form.tags} onChange={(e) => set('tags', e.target.value)} /></Field>
        </div>

        <div className="admin-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Pricing & stock</h2>
          <Field label="Price (₹) *" hint="MRP — shown struck-through when sale price is lower"><input type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} required /></Field>
          <Field label="Sale price (₹)" hint="Customer pays this if lower than MRP"><input type="number" min="0" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} /></Field>
          <Field label="Cost per item (₹)" hint="Internal only — never shown to customers"><input type="number" min="0" value={form.costPerItem} onChange={(e) => set('costPerItem', e.target.value)} /></Field>
          <Field label="Warehouse"><input value={form.warehouse} onChange={(e) => set('warehouse', e.target.value)} placeholder="Jaipur WH-1" /></Field>
          <Field label="Stock quantity *"><input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} required /></Field>
          <Field label="Stock status">
            <select value={form.stockStatus} onChange={(e) => set('stockStatus', e.target.value)}>
              <option>In Stock</option>
              <option>Out of Stock</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.trackQuantity} onChange={(e) => set('trackQuantity', e.target.checked)} /> Track quantity</label>
        </div>

        <div className="admin-card p-4 space-y-3 lg:col-span-2">
          <h2 className="text-sm font-semibold flex items-center gap-2"><ImageIcon size={16} /> Product images *</h2>
          <ImagePicker
            label=""
            hint="First image becomes the main product photo on the storefront."
            images={pendingImages}
            uploading={uploadingImages}
            onChange={setPendingImages}
          />
        </div>

        <div className="admin-card p-4 space-y-3 lg:col-span-2">
          <h2 className="text-sm font-semibold">Customer-facing details</h2>
          <Field label="Care instructions" hint="Shown in Care accordion on product page">
            <textarea rows={2} value={form.careInstructions} onChange={(e) => set('careInstructions', e.target.value)} placeholder="Wipe with soft dry cloth..." />
          </Field>
          <Field label="Shipping notes" hint="Shown in Shipping accordion">
            <textarea rows={2} value={form.shippingNotes} onChange={(e) => set('shippingNotes', e.target.value)} placeholder="Hand-packed in 3–5 business days..." />
          </Field>
          <Field label="Return policy notes" hint="Shown in Returns accordion">
            <textarea rows={2} value={form.returnNotes} onChange={(e) => set('returnNotes', e.target.value)} placeholder="7-day window for defects..." />
          </Field>
          <Field label="Product FAQs" hint="One per block — Q: question then A: answer on next line">
            <textarea rows={4} value={form.faqs} onChange={(e) => set('faqs', e.target.value)} placeholder={'Q: Is this handmade?\nA: Yes, finished by named artisan houses.'} />
          </Field>
        </div>

        <div className="admin-card p-4 space-y-3 lg:col-span-2">
          <h2 className="text-sm font-semibold">Shipping dimensions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Weight (kg)"><input type="number" min="0" step="0.01" value={form.weight} onChange={(e) => set('weight', e.target.value)} /></Field>
            <Field label="Length (cm)"><input type="number" min="0" value={form.length} onChange={(e) => set('length', e.target.value)} /></Field>
            <Field label="Width (cm)"><input type="number" min="0" value={form.width} onChange={(e) => set('width', e.target.value)} /></Field>
            <Field label="Height (cm)"><input type="number" min="0" value={form.height} onChange={(e) => set('height', e.target.value)} /></Field>
          </div>
        </div>
      </div>

      {role === 'admin' && form.lifecycle === 'Pending Approval' && (
        <div className="admin-card p-4">
          <Field label="Reject reason (if rejecting)">
            <input value={form.rejectReason} onChange={(e) => set('rejectReason', e.target.value)} />
          </Field>
        </div>
      )}

      <p className="text-[11px] text-slate-400">
        Vendor and admin use the same product fields. Customers see this data after the product is published.
      </p>
    </form>
  );
};

export default ProductEditorForm;


