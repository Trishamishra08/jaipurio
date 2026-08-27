import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminPageHeader from './AdminPageHeader';
import { platformStore } from '../../data/platformStore';

const AdminSystem = () => {
  const section = useLocation().pathname.split('/').pop();
  const [message, setMessage] = useState('');

  const titleMap = {
    backup: 'Backup',
    cronjob: 'Cronjob',
    cache: 'Cache Management',
    cleanup: 'Cleanup System',
    platform: 'Platform Administration',
  };

  return (
    <div>
      <AdminPageHeader title={titleMap[section] || 'System'} hideAction />
      <div className="admin-card p-5 space-y-3 max-w-2xl">
        {section === 'backup' && (
          <>
            <p className="text-sm text-slate-500">Create and restore platform backups.</p>
            <button type="button" className="admin-btn-primary" onClick={() => setMessage('Backup created: jaipurio-backup.json')}>Run backup</button>
          </>
        )}
        {section === 'cronjob' && (
          <table className="admin-table">
            <thead><tr><th>Job</th><th>Schedule</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>Abandoned cart emails</td><td>Every 30 min</td><td>Running</td></tr>
              <tr><td>Payout batches</td><td>Daily 02:00</td><td>Running</td></tr>
              <tr><td>Report generation</td><td>Daily 03:00</td><td>Running</td></tr>
            </tbody>
          </table>
        )}
        {section === 'cache' && (
          <button type="button" className="admin-btn-primary" onClick={() => setMessage('Cache cleared.')}>Clear cache</button>
        )}
        {section === 'cleanup' && (
          <button type="button" className="admin-btn-primary" onClick={() => setMessage('Draft products, expired sessions and unused media cleaned.')}>Run cleanup</button>
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
