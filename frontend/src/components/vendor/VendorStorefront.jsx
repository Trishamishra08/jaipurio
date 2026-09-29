import React, { useEffect, useState } from 'react';
import VendorPage from './VendorPage';
import api from '../../utils/api';

const VendorStorefront = () => {
  const [form, setForm] = useState({ storeName: '', storeDescription: '', plan: 'Starter' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/vendors/profile')
      .then((res) => {
        if (cancelled) return;
        const v = res.data?.data?.vendor;
        if (v) setForm({ storeName: v.storeName || '', storeDescription: v.storeDescription || '', plan: v.plan || 'Starter' });
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.parsedMessage || err?.message || 'Failed to load storefront');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaved('');
    try {
      await api.put('/vendors/profile', { storeName: form.storeName, storeDescription: form.storeDescription });
      setSaved('Storefront updated.');
    } catch (err) {
      setSaveError(err?.parsedMessage || err?.message || 'Failed to save storefront');
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(''), 3000);
    }
  };

  return (
    <VendorPage title="Storefront" hint="Public seller page. Products belong to this store (same as the product editor Store selector).">
      {loading ? (
        <p className="text-xs text-slate-400 py-6 text-center">Loading storefront…</p>
      ) : (
        <div className="admin-card p-5 max-w-xl space-y-3">
          {loadError && <p className="text-xs text-red-600">{loadError}</p>}
          <label className="admin-field">
            <span>Store name</span>
            <input value={form.storeName} onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))} />
          </label>
          <label className="admin-field">
            <span>Store description</span>
            <textarea rows={4} value={form.storeDescription} onChange={(e) => setForm((f) => ({ ...f, storeDescription: e.target.value }))} />
          </label>
          <label className="admin-field">
            <span>Plan</span>
            <input value={form.plan} disabled className="bg-slate-50 text-slate-500" />
          </label>
          <p className="text-xs text-slate-400">Change your plan from the Settings page. Upgrade applies now; downgrade applies next billing cycle.</p>
          <button type="button" className="admin-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save storefront'}
          </button>
          {saved && <p className="text-sm text-emerald-700">{saved}</p>}
          {saveError && <p className="text-sm text-red-600">{saveError}</p>}
        </div>
      )}
    </VendorPage>
  );
};

export default VendorStorefront;
