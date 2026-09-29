import React, { useEffect, useState } from 'react';
import VendorPage from './VendorPage';
import api from '../../utils/api';

const PLANS = ['Starter', 'Growth', 'Premium'];

const VendorSettings = () => {
  const [vendor, setVendor] = useState(null);
  const [form, setForm] = useState({
    storeName: '', fullName: '', gstNumber: '',
    accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '',
    plan: 'Starter',
  });
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
        if (!v) return;
        setVendor(v);
        setForm({
          storeName: v.storeName || '',
          fullName: v.fullName || '',
          gstNumber: v.gstNumber || '',
          accountHolderName: v.accountHolderName || '',
          bankName: v.bankName || '',
          accountNumber: v.accountNumber || '',
          ifscCode: v.ifscCode || '',
          plan: v.plan || 'Starter',
        });
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.parsedMessage || err?.message || 'Failed to load settings');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaved('');
    try {
      const res = await api.put('/vendors/profile', form);
      setVendor(res.data?.data?.vendor || vendor);
      setSaved('Settings saved.');
    } catch (err) {
      setSaveError(err?.parsedMessage || err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(''), 3000);
    }
  };

  if (loading) {
    return (
      <VendorPage title="Settings">
        <p className="text-xs text-slate-400 py-6 text-center">Loading settings…</p>
      </VendorPage>
    );
  }

  return (
    <VendorPage title="Settings" hint="KYC stays verified after admin approval. Plan upgrade is immediate; downgrade waits for next billing cycle.">
      {loadError && <p className="text-xs text-red-600 mb-3">{loadError}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="admin-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Store & KYC</h2>
          <label className="admin-field"><span>Store name</span><input value={form.storeName} onChange={handleField('storeName')} /></label>
          <label className="admin-field"><span>Owner</span><input value={form.fullName} onChange={handleField('fullName')} /></label>
          <label className="admin-field"><span>GST</span><input value={form.gstNumber} onChange={handleField('gstNumber')} /></label>
          <p className="text-sm">
            KYC status: <span className={`admin-badge ${vendor?.kycStatus === 'Verified' ? 'admin-badge-success' : 'admin-badge-warning'}`}>{vendor?.kycStatus || 'Pending'}</span>
          </p>
        </div>
        <div className="admin-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Verified bank (payouts)</h2>
          <label className="admin-field"><span>Account holder</span><input value={form.accountHolderName} onChange={handleField('accountHolderName')} /></label>
          <label className="admin-field"><span>Bank</span><input value={form.bankName} onChange={handleField('bankName')} /></label>
          <label className="admin-field"><span>Account number</span><input value={form.accountNumber} onChange={handleField('accountNumber')} /></label>
          <label className="admin-field"><span>IFSC</span><input value={form.ifscCode} onChange={handleField('ifscCode')} /></label>
        </div>
        <div className="admin-card p-4 space-y-3 lg:col-span-2">
          <h2 className="text-sm font-semibold">Vendor subscription plan</h2>
          <select className="admin-input max-w-xs" value={form.plan} onChange={handleField('plan')}>
            {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <p className="text-xs text-slate-500">
            Plan sets commission rate ({vendor?.commissionRate ?? '—'}%), listing limit, featured credits and support priority.
            {vendor?.pendingPlan ? ` Downgrade to ${vendor.pendingPlan} takes effect ${vendor.planEffectiveAt ? new Date(vendor.planEffectiveAt).toLocaleDateString('en-IN') : 'next billing cycle'}.` : ''}
          </p>
          <button type="button" className="admin-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && <p className="text-sm text-emerald-700">{saved}</p>}
          {saveError && <p className="text-sm text-red-600">{saveError}</p>}
        </div>
      </div>
    </VendorPage>
  );
};

export default VendorSettings;
