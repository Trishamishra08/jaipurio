import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminPageHeader from './AdminPageHeader';
import api from '../../utils/api';
import { fetchAdminProducts } from '../../utils/marketplaceApi';

const MODULES = [
  { name: 'Ecommerce', status: 'Active' },
  { name: 'Marketplace', status: 'Active' },
  { name: 'Blog', status: 'Active' },
  { name: 'Payments', status: 'Active' },
  { name: 'Contact', status: 'Active' },
  { name: 'Banners', status: 'Active' },
  { name: 'FAQ', status: 'Active' },
  { name: 'Newsletter', status: 'Active' },
  { name: 'Ads', status: 'Active' },
];

const AdminTools = () => {
  const { pathname } = useLocation();
  const section = pathname.split('/').pop();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  const exportProducts = async () => {
    setBusy(true);
    setMessage('');
    try {
      const products = await fetchAdminProducts();
      const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jaipurio-products.json';
      a.click();
      URL.revokeObjectURL(url);
      setMessage(`${products.length} product(s) exported.`);
    } catch (err) {
      setMessage(err.parsedMessage || err.message || 'Export failed.');
    } finally {
      setBusy(false);
    }
  };

  const clearCache = async () => {
    setBusy(true);
    setMessage('');
    try {
      await api.post('/admins/clear-cache');
      setMessage('Cache cleared for admin widgets and public catalog endpoints.');
    } catch (err) {
      setMessage(err.parsedMessage || err.message || 'Failed to clear cache.');
    } finally {
      setBusy(false);
    }
  };

  const syncInvoices = async () => {
    setBusy(true);
    setSyncResult(null);
    try {
      const res = await api.post('/ecommerce/invoices/sync');
      setSyncResult(`Synced ${res.data?.synced ?? res.data?.data?.length ?? 0} invoice(s) from orders.`);
    } catch (err) {
      setSyncResult(err.parsedMessage || err.message || 'Invoice sync failed.');
    } finally {
      setBusy(false);
    }
  };

  const loadHealth = async () => {
    setBusy(true);
    try {
      const res = await api.get('/health');
      setHealth(res.data);
    } catch {
      setHealth(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title={
          section === 'plugins'
            ? 'Installed Modules'
            : section === 'import-export'
              ? 'Import / Export'
              : section === 'data-synchronize'
                ? 'Data Synchronize'
                : 'System information'
        }
        hideAction
      />

      {section === 'plugins' && (
        <div className="admin-card overflow-hidden">
          <p className="text-xs text-slate-400 px-4 pt-4">
            This app is a single custom codebase, not a plugin-based CMS — these are its built-in feature modules (always active).
          </p>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => (
                <tr key={m.name}>
                  <td>{m.name}</td>
                  <td><span className="admin-badge admin-badge-success">{m.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section === 'import-export' && (
        <div className="admin-card p-5 max-w-xl space-y-4">
          <p className="text-sm text-slate-500">Export the live product catalog as JSON, or clear server-side caches.</p>
          <div className="flex gap-2">
            <button type="button" className="admin-btn-primary" disabled={busy} onClick={exportProducts}>
              {busy ? 'Working…' : 'Export products'}
            </button>
            <button type="button" className="admin-btn-light" disabled={busy} onClick={clearCache}>
              Clear cache
            </button>
          </div>
          {message && <p className="text-sm text-emerald-600">{message}</p>}
        </div>
      )}

      {section === 'data-synchronize' && (
        <div className="admin-card p-5 max-w-xl space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">Sync invoices from orders</h3>
            <p className="text-sm text-slate-500 mb-2">
              Scans all orders and creates any missing invoice records for them — run this after bulk-importing
              orders or if an invoice failed to generate automatically at checkout.
            </p>
            <button type="button" className="admin-btn-primary" disabled={busy} onClick={syncInvoices}>
              {busy ? 'Syncing…' : 'Sync invoices'}
            </button>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">Clear server cache</h3>
            <p className="text-sm text-slate-500 mb-2">
              Clears the Redis-backed cache for public catalog endpoints so storefront visitors immediately see the
              latest products, categories, banners, offers and settings.
            </p>
            <button type="button" className="admin-btn-light" disabled={busy} onClick={clearCache}>
              {busy ? 'Working…' : 'Clear cache'}
            </button>
          </div>
          {syncResult && <p className="text-sm text-emerald-600">{syncResult}</p>}
          {message && <p className="text-sm text-emerald-600">{message}</p>}
        </div>
      )}

      {section === 'system-info' && (
        <div className="admin-card overflow-hidden">
          <table className="admin-table">
            <tbody>
              {[
                ['App', 'Jaipurio'],
                ['Frontend', 'React + Vite'],
                ['Backend', 'Node.js + Express + MongoDB'],
                ['Timezone', 'Asia/Kolkata'],
                ['Environment', import.meta.env.MODE],
                ['Server uptime (s)', health ? Math.round(health.uptime) : '—'],
                ['Cache status', health?.cache?.connected ? 'Connected' : health ? 'Disconnected' : '—'],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td className="w-48 font-medium">{label}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3">
            <button type="button" className="admin-btn-light" disabled={busy} onClick={loadHealth}>
              {busy ? 'Checking…' : 'Refresh live status'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTools;
