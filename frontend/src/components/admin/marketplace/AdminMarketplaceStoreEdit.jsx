import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiSave } from 'react-icons/fi';
import EcommerceLayout from '../ecommerce/EcommerceLayout';
import AdminCkEditor from '../ecommerce/AdminCkEditor';
import {
  createMarketplaceStore,
  fetchMarketplaceStore,
  updateMarketplaceStore,
} from '../../../utils/marketplaceAdminApi';

const LANGUAGES = [
  { code: 'fr_FR', label: 'Français', flag: '🇫🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh_CN', label: '中文 (中国)', flag: '🇨🇳' },
  { code: 'de_CH_informal', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it_IT', label: 'Italiano', flag: '🇮🇹' },
];

const emptyStore = {
  name: '',
  slug: '',
  email: '',
  phone: '',
  logo: '',
  coverImage: '',
  description: '',
  content: '',
  status: 'Published',
  vendorName: '',
  companyName: '',
  taxId: '',
  taxCountry: 'IN',
  taxState: '',
  address: '',
  country: 'India',
  state: '',
  city: '',
  zipCode: '',
  isVerified: false,
  verificationNote: '',
  isFeatured: false,
};

const slugify = (text = '') =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default function AdminMarketplaceStoreEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';

  const [mongoId, setMongoId] = useState(null);
  const [legacyId, setLegacyId] = useState(isCreate ? null : id);
  const [form, setForm] = useState(emptyStore);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [loading, setLoading] = useState(!isCreate);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (isCreate) {
        setForm(emptyStore);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const row = await fetchMarketplaceStore(id);
        if (cancelled || !row) return;
        setMongoId(row._id || null);
        setLegacyId(row.legacyId != null ? String(row.legacyId) : String(row.id || id));
        setForm({
          name: row.name || '',
          slug: row.slug || '',
          email: row.email || '',
          phone: row.phone || '',
          logo: row.logo || '',
          coverImage: row.coverImage || '',
          description: row.description || '',
          content: row.content || '',
          status: row.status || 'Published',
          vendorName: row.vendorName || row.vendorDisplay || '',
          companyName: row.companyName || '',
          taxId: row.taxId || '',
          taxCountry: row.taxCountry || 'IN',
          taxState: row.taxState || '',
          address: row.address || '',
          country: row.country || 'India',
          state: row.state || '',
          city: row.city || '',
          zipCode: row.zipCode || '',
          isVerified: Boolean(row.isVerified),
          verificationNote: row.verificationNote || '',
          isFeatured: Boolean(row.isFeatured),
        });
      } catch {
        if (!cancelled) setSaveError('Could not load store');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const handleSave = async (andExit = false) => {
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name),
      };
      const saved = mongoId || (!isCreate && id)
        ? await updateMarketplaceStore(mongoId || id, payload)
        : await createMarketplaceStore(payload);
      if (saved?._id) setMongoId(saved._id);
      if (saved?.legacyId != null) setLegacyId(String(saved.legacyId));
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (andExit) navigate('/admin/marketplaces/stores');
        else if (isCreate && (saved?.legacyId != null || saved?._id)) {
          navigate(`/admin/marketplaces/stores/edit/${saved.legacyId ?? saved._id}`);
        }
      }, 700);
    } catch (err) {
      setSaveError(err?.parsedMessage || err?.message || 'Failed to save store');
    } finally {
      setSaving(false);
    }
  };

  const crumbName = form.name || (isCreate ? 'Create Store' : `Edit Store`);

  return (
    <EcommerceLayout breadcrumb={['MARKETPLACE', 'STORES', crumbName.toUpperCase()]}>
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading store…</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-9 space-y-4">
            <div className="bg-sky-50 border border-sky-100 text-sky-800 text-xs rounded-md px-3 py-2">
              You are editing &apos;English&apos; version.
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    setField('name', e.target.value);
                    if (!form.slug || form.slug === slugify(form.name)) {
                      setField('slug', slugify(e.target.value));
                    }
                  }}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-hidden focus:border-blue-500"
                  placeholder="Store name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Permalink</label>
                <div className="flex gap-2">
                  <input
                    value={form.slug}
                    onChange={(e) => setField('slug', slugify(e.target.value))}
                    className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-hidden focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setField('slug', slugify(form.name))}
                    className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-md hover:bg-slate-50"
                  >
                    Generate URL
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  rows={3}
                  maxLength={400}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Short store description (max 400 characters)"
                />
              </div>

              <AdminCkEditor
                label="Content"
                value={form.content}
                onChange={(html) => setField('content', html)}
                minHeight={220}
                placeholder="Full store content…"
                editorKey={`store-content-${legacyId || 'new'}`}
                defaultVisible
              />

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
                  Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                    <input
                      value={form.address}
                      onChange={(e) => setField('address', e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Country</label>
                    <input
                      value={form.country}
                      onChange={(e) => setField('country', e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
                    <input
                      value={form.state}
                      onChange={(e) => setField('state', e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                    <input
                      value={form.city}
                      onChange={(e) => setField('city', e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Zip code</label>
                    <input
                      value={form.zipCode}
                      onChange={(e) => setField('zipCode', e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
                  Business information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Company</label>
                    <input
                      value={form.companyName}
                      onChange={(e) => setField('companyName', e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tax ID / GST</label>
                    <input
                      value={form.taxId}
                      onChange={(e) => setField('taxId', e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tax country</label>
                    <input
                      value={form.taxCountry}
                      onChange={(e) => setField('taxCountry', e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tax state</label>
                    <input
                      value={form.taxState}
                      onChange={(e) => setField('taxState', e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Media</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Logo URL</label>
                  <input
                    value={form.logo}
                    onChange={(e) => setField('logo', e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                    placeholder="/store-logo.png"
                  />
                  {form.logo ? (
                    <img
                      src={form.logo}
                      alt=""
                      className="mt-2 w-16 h-16 object-cover rounded-md border border-slate-200"
                    />
                  ) : null}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cover image URL</label>
                  <input
                    value={form.coverImage}
                    onChange={(e) => setField('coverImage', e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-3 space-y-4">
            <div className="bg-white border border-slate-200 rounded-md p-3 space-y-2">
              <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wide">Publish</div>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(false)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-md disabled:opacity-60"
              >
                <FiSave size={14} />
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="w-full bg-slate-800 hover:bg-black text-white text-sm font-semibold py-2 rounded-md disabled:opacity-60"
              >
                Save &amp; Exit
              </button>
              {saveSuccess ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <FiCheck size={14} /> Saved
                </div>
              ) : null}
              {saveError ? <div className="text-xs text-rose-600">{saveError}</div> : null}
              {!isCreate && legacyId ? (
                <div className="text-[11px] text-slate-400">Store ID: {legacyId}</div>
              ) : null}
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-3 space-y-2">
              <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wide">Languages</div>
              <div className="space-y-1.5">
                {LANGUAGES.map((lang) => (
                  <label key={lang.code} className="flex items-center gap-2 text-xs text-slate-600">
                    <input type="checkbox" className="rounded-sm border-slate-300" />
                    <span>
                      {lang.flag} {lang.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-3 space-y-2">
              <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wide">Status</div>
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              >
                <option>Published</option>
                <option>Pending</option>
                <option>Blocked</option>
                <option>Draft</option>
              </select>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-3 space-y-2">
              <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wide">Vendor</div>
              <input
                value={form.vendorName}
                onChange={(e) => setField('vendorName', e.target.value)}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                placeholder="Vendor / owner name"
              />
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-3 space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isVerified}
                  onChange={(e) => setField('isVerified', e.target.checked)}
                />
                Is verified?
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setField('isFeatured', e.target.checked)}
                />
                Is featured?
              </label>
              <textarea
                value={form.verificationNote}
                onChange={(e) => setField('verificationNote', e.target.value)}
                rows={2}
                placeholder="Verification note"
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs"
              />
            </div>

            <Link
              to="/admin/marketplaces/stores"
              className="block text-center text-xs text-blue-600 hover:underline"
            >
              ← Back to stores
            </Link>
          </div>
        </div>
      )}
    </EcommerceLayout>
  );
}
