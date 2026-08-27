import React, { useMemo, useState } from 'react';
import { flattenCategoryOptions, GLOBAL_ATTRIBUTES, GLOBAL_OPTIONS } from '../../data/catalogTaxonomy';
import { platformStore } from '../../data/platformStore';

const emptyProduct = {
  title: '',
  sku: '',
  store: 'Shyam Pottery',
  category: '',
  brand: 'Jaipurio Heritage',
  content: '',
  price: '',
  salePrice: '',
  discountProductPrice: '',
  costPerItem: '',
  barcode: '',
  stock: '',
  warehouse: 'Jaipur WH-1',
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
  seoTitle: '',
  seoDescription: '',
  rejectReason: '',
};

const Field = ({ label, hint, children }) => (
  <label className="admin-field">
    <span>{label}</span>
    {children}
    {hint ? <small className="text-[11px] text-slate-400">{hint}</small> : null}
  </label>
);

const ProductEditorForm = ({ role = 'vendor', productId, onSaved }) => {
  const categories = useMemo(() => flattenCategoryOptions(), []);
  const existing = platformStore.products().find((p) => p.id === productId);
  const [form, setForm] = useState({ ...emptyProduct, ...(existing || {}) });
  const [message, setMessage] = useState('');

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const persist = (nextLifecycle, extras = {}) => {
    const products = platformStore.products();
    const record = {
      ...form,
      ...extras,
      id: form.id || `prd-${Date.now()}`,
      lifecycle: nextLifecycle,
      published: nextLifecycle === 'Published',
      stockStatus:
        form.trackQuantity && Number(form.stock) === 0 ? 'Out of Stock' : form.stockStatus || 'In Stock',
    };
    const next = form.id
      ? products.map((item) => (item.id === form.id ? record : item))
      : [record, ...products];
    platformStore.saveProducts(next);
    setForm(record);
    setMessage(`Saved as ${nextLifecycle}`);
    onSaved?.(record);
  };

  const submitReview = (e) => {
    e.preventDefault();
    if (!form.title || !form.sku || !form.category || !form.price) {
      setMessage('Required: Title, SKU, Category, Price.');
      return;
    }
    persist('Pending Approval');
  };

  return (
    <form className="space-y-4" onSubmit={submitReview}>
      <div className="admin-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Product lifecycle</p>
          <strong>{form.lifecycle}</strong>
          <span className="ml-2 admin-badge admin-badge-info">{form.stockStatus}</span>
          {form.published ? <span className="ml-2 admin-badge admin-badge-success">Published</span> : <span className="ml-2 admin-badge admin-badge-warning">Hidden</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="admin-btn-light" onClick={() => persist('Draft')}>Save draft</button>
          {role === 'vendor' && form.lifecycle !== 'Published' && (
            <button type="submit" className="admin-btn-primary">Submit for review</button>
          )}
          {role === 'admin' && form.lifecycle === 'Pending Approval' && (
            <>
              <button type="button" className="admin-btn-light" onClick={() => persist('Rejected', { rejectReason: form.rejectReason || 'Needs better images' })}>Reject</button>
              <button type="button" className="admin-btn-primary" onClick={() => persist('Published')}>Approve & publish</button>
            </>
          )}
        </div>
      </div>
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="admin-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Basics</h2>
          <Field label="Store selector"><input value={form.store} onChange={(e) => set('store', e.target.value)} /></Field>
          <Field label="Title *"><input value={form.title} onChange={(e) => set('title', e.target.value)} required /></Field>
          <Field label="SKU *"><input value={form.sku} onChange={(e) => set('sku', e.target.value)} required /></Field>
          <Field label="Product Category *">
            <select value={form.category} onChange={(e) => set('category', e.target.value)} required>
              <option value="">Select category</option>
              {categories.map((cat) => <option key={cat.id} value={cat.label}>{cat.label}</option>)}
            </select>
          </Field>
          <Field label="Brand"><input value={form.brand} onChange={(e) => set('brand', e.target.value)} /></Field>
          <Field label="Content (rich text)">
            <textarea rows={4} value={form.content} onChange={(e) => set('content', e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} /> Is Featured</label>
        </div>

        <div className="admin-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Pricing</h2>
          <Field label="Price *"><input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} required /></Field>
          <Field label="Sale Price"><input type="number" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} /></Field>
          <Field label="Discount Product Price" hint="Separate from sale price"><input type="number" value={form.discountProductPrice} onChange={(e) => set('discountProductPrice', e.target.value)} /></Field>
          <Field label="Cost per item" hint="Vendor only — never shown to customer"><input type="number" value={form.costPerItem} onChange={(e) => set('costPerItem', e.target.value)} /></Field>
          <Field label="Barcode (EAN, UPC, ISBN)"><input value={form.barcode} onChange={(e) => set('barcode', e.target.value)} /></Field>
        </div>

        <div className="admin-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Stock / warehouse</h2>
          <Field label="Warehouse"><input value={form.warehouse} onChange={(e) => set('warehouse', e.target.value)} /></Field>
          <Field label="Stock quantity"><input type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} /></Field>
          <Field label="In Stock / Out of Stock">
            <select value={form.stockStatus} onChange={(e) => set('stockStatus', e.target.value)}>
              <option>In Stock</option>
              <option>Out of Stock</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.trackQuantity} onChange={(e) => set('trackQuantity', e.target.checked)} /> Track Quantity</label>
        </div>

        <div className="admin-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Shipping dimensions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Weight (kg)"><input type="number" value={form.weight} onChange={(e) => set('weight', e.target.value)} /></Field>
            <Field label="Length (cm)"><input type="number" value={form.length} onChange={(e) => set('length', e.target.value)} /></Field>
            <Field label="Width (cm)"><input type="number" value={form.width} onChange={(e) => set('width', e.target.value)} /></Field>
            <Field label="Height (cm)"><input type="number" value={form.height} onChange={(e) => set('height', e.target.value)} /></Field>
          </div>
        </div>
      </div>

      <div className="admin-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Attributes (global values) — separate from Options</h2>
        {(form.attributes || []).map((attr, index) => (
          <div key={index} className="grid grid-cols-2 gap-3">
            <select value={attr.name} onChange={(e) => {
              const next = [...form.attributes];
              next[index] = { ...attr, name: e.target.value };
              set('attributes', next);
            }}>
              {GLOBAL_ATTRIBUTES.map((item) => <option key={item.name}>{item.name}</option>)}
            </select>
            <input placeholder="Value" value={attr.value} onChange={(e) => {
              const next = [...form.attributes];
              next[index] = { ...attr, value: e.target.value };
              set('attributes', next);
            }} />
          </div>
        ))}
        <button type="button" className="admin-btn-light" onClick={() => set('attributes', [...(form.attributes || []), { name: 'Material', value: '' }])}>Add attribute</button>
        <p className="text-xs text-slate-400">Global: {GLOBAL_ATTRIBUTES.map((a) => a.name).join(', ')}</p>
      </div>

      <div className="admin-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Product Options (global option) — separate from Attributes</h2>
        <select value="" onChange={(e) => e.target.value && set('options', [...new Set([...(form.options || []), e.target.value])]) }>
          <option value="">Select Global Option</option>
          {GLOBAL_OPTIONS.map((opt) => <option key={opt.name} value={opt.name}>{opt.name} ({opt.type})</option>)}
        </select>
        <p className="text-sm">{(form.options || []).join(', ') || 'None selected'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="admin-card p-4 space-y-3">
          <Field label="Cross-selling products"><input value={form.crossSell} onChange={(e) => set('crossSell', e.target.value)} placeholder="Add SKUs" /></Field>
          <Field label="Related products"><input value={form.related} onChange={(e) => set('related', e.target.value)} placeholder="Add SKUs" /></Field>
          <Field label="Product FAQs" hint="Add new, or select from existing FAQs"><textarea rows={3} value={form.faqs} onChange={(e) => set('faqs', e.target.value)} /></Field>
          <Field label="Tags"><input value={form.tags} onChange={(e) => set('tags', e.target.value)} /></Field>
        </div>
        <div className="admin-card p-4 space-y-3">
          <Field label="Minimum order quantity"><input type="number" value={form.minQty} onChange={(e) => set('minQty', e.target.value)} /></Field>
          <Field label="Maximum order quantity"><input type="number" value={form.maxQty} onChange={(e) => set('maxQty', e.target.value)} /></Field>
          <Field label="Featured Image (Choose / URL)"><input value={form.featuredImage} onChange={(e) => set('featuredImage', e.target.value)} /></Field>
          <Field label="Icon Image (Choose / URL)" hint="Separate from featured image, optional"><input value={form.iconImage} onChange={(e) => set('iconImage', e.target.value)} /></Field>
          <Field label="SEO Title"><input value={form.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} /></Field>
          <Field label="SEO Description"><textarea rows={2} value={form.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} /></Field>
        </div>
      </div>

      {role === 'admin' && (
        <div className="admin-card p-4">
          <Field label="Reject reason (if rejecting)">
            <input value={form.rejectReason} onChange={(e) => set('rejectReason', e.target.value)} />
          </Field>
        </div>
      )}
    </form>
  );
};

export default ProductEditorForm;
