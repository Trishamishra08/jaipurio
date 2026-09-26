import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminPageHeader from './AdminPageHeader';
import api from '../../utils/api';

const AdminSystem = () => {
  const section = useLocation().pathname.split('/').pop();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const titleMap = {
    backup: 'Backup',
    cronjob: 'Cronjob',
    cache: 'Cache Management',
    cleanup: 'Cleanup System',
    platform: 'Platform Administration',
  };

  const clearCache = async () => {
    setBusy(true);
    setMessage('');
    try {
      await api.post('/admins/clear-cache');
      setMessage('Cache cleared.');
    } catch (err) {
      setMessage(err.parsedMessage || err.message || 'Failed to clear cache.');
    } finally {
      setBusy(false);
    }
  };

  const runCleanup = async () => {
    setBusy(true);
    setMessage('');
    try {
      const res = await api.post('/admins/cleanup');
      setMessage(res.data?.message || 'Cleanup complete.');
    } catch (err) {
      setMessage(err.parsedMessage || err.message || 'Cleanup failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title={titleMap[section] || 'System'} hideAction />
      <div className="admin-card p-5 space-y-3 max-w-2xl">
        {section === 'backup' && (
          <>
            <p className="text-sm text-slate-500">
              Full database backups aren't triggered from the admin UI in this app — run <code>mongodump</code> against
              the MongoDB connection in your deployment, or use your hosting provider's automated backup feature.
            </p>
          </>
        )}
        {section === 'cronjob' && (
          <>
            <p className="text-sm text-slate-500 mb-2">
              This app has no in-app job scheduler yet — recurring tasks below are recommendations to run via your
              process manager (e.g. a `node-cron` process or platform cron) rather than jobs already running.
            </p>
            <table className="admin-table">
              <thead><tr><th>Suggested job</th><th>Schedule</th></tr></thead>
              <tbody>
                <tr><td>Sync ecommerce invoices from orders</td><td>Daily</td></tr>
                <tr><td>Cleanup stale incomplete-order records</td><td>Weekly</td></tr>
              </tbody>
            </table>
          </>
        )}
        {section === 'cache' && (
          <>
            <p className="text-sm text-slate-500">Clears the Redis-backed cache for public catalog endpoints (products, categories, banners, offers, settings, etc.).</p>
            <button type="button" className="admin-btn-primary" disabled={busy} onClick={clearCache}>
              {busy ? 'Clearing…' : 'Clear cache'}
            </button>
          </>
        )}
        {section === 'cleanup' && (
          <>
            <p className="text-sm text-slate-500">Removes abandoned incomplete-checkout records older than 30 days.</p>
            <button type="button" className="admin-btn-primary" disabled={busy} onClick={runCleanup}>
              {busy ? 'Running…' : 'Run cleanup'}
            </button>
          </>
        )}
        {section === 'platform' && (
          <p className="text-sm text-slate-500">Platform-wide configuration: marketplace rules, languages, and system ownership. Use Settings and System menus for the working tools.</p>
        )}
        {message && <p className="text-sm text-emerald-700">{message}</p>}
      </div>
    </div>
  );
};

export default AdminSystem;
