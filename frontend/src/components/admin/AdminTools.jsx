import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminPageHeader from './AdminPageHeader';

const PLUGINS = [
  { name: 'Ecommerce', version: '2.8.3', status: 'Activated' },
  { name: 'Marketplace', version: '2.4.1', status: 'Activated' },
  { name: 'Blog', version: '1.9.0', status: 'Activated' },
  { name: 'Payment', version: '1.8.2', status: 'Activated' },
  { name: 'Contact', version: '1.6.4', status: 'Activated' },
  { name: 'Simple Slider', version: '1.5.1', status: 'Activated' },
  { name: 'FAQ', version: '1.4.0', status: 'Activated' },
  { name: 'Newsletter', version: '1.3.2', status: 'Activated' },
  { name: 'Ads', version: '1.2.0', status: 'Activated' },
  { name: 'Language', version: '2.1.0', status: 'Deactivated' },
];

const AdminTools = () => {
  const { pathname } = useLocation();
  const section = pathname.split('/').pop();
  const [message, setMessage] = useState('');

  return (
    <div>
      <AdminPageHeader
        title={section === 'plugins' ? 'Plugins' : section === 'import-export' ? 'Import / Export' : 'System information'}
        hideAction
      />

      {section === 'plugins' && (
        <div className="admin-card overflow-hidden">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Plugin</th>
                <th>Version</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {PLUGINS.map((plugin) => (
                <tr key={plugin.name}>
                  <td>{plugin.name}</td>
                  <td>{plugin.version}</td>
                  <td>
                    <span className={`admin-badge ${plugin.status === 'Activated' ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                      {plugin.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section === 'import-export' && (
        <div className="admin-card p-5 max-w-xl space-y-4">
          <p className="text-sm text-slate-500">Export catalog data as JSON, or import a previously exported file.</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="admin-btn-primary"
              onClick={() => {
                const blob = new Blob([localStorage.getItem('jaipurio_products') || '[]'], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'jaipurio-products.json';
                a.click();
                setMessage('Products exported.');
              }}
            >
              Export products
            </button>
            <button
              type="button"
              className="admin-btn-light"
              onClick={() => setMessage('Cache cleared for admin widgets and lists.')}
            >
              Clear cache
            </button>
          </div>
          {message && <p className="text-sm text-emerald-600">{message}</p>}
        </div>
      )}

      {section === 'system-info' && (
        <div className="admin-card overflow-hidden">
          <table className="admin-table">
            <tbody>
              {[
                ['App', 'Jaipurio'],
                ['Admin version', '1.22.1'],
                ['Frontend', 'React + Vite'],
                ['Timezone', 'Asia/Kolkata'],
                ['Environment', import.meta.env.MODE],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td className="w-48 font-medium">{label}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminTools;
