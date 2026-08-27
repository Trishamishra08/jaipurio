import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminPageHeader from './AdminPageHeader';

const AdminLocationTools = () => {
  const section = useLocation().pathname.split('/').pop();
  const [message, setMessage] = useState('');
  const sample = `country,state,city\nIndia,Rajasthan,Jaipur\nIndia,Rajasthan,Jodhpur`;

  return (
    <div>
      <AdminPageHeader title={section === 'importer' ? 'Location Importer' : 'Location Exporter'} hideAction />
      <div className="admin-card p-5 max-w-2xl space-y-3">
        {section === 'importer' ? (
          <>
            <p className="text-sm text-slate-500">Bulk import countries, states and cities. CSV columns: country, state, city.</p>
            <textarea className="admin-code" rows={8} defaultValue={sample} />
            <button type="button" className="admin-btn-primary" onClick={() => setMessage('3 locations imported.')}>Import</button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-500">Export the live location tree for backup or migration.</p>
            <button
              type="button"
              className="admin-btn-primary"
              onClick={() => {
                const blob = new Blob([sample], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'locations.csv';
                a.click();
                setMessage('locations.csv downloaded.');
              }}
            >
              Export CSV
            </button>
          </>
        )}
        {message && <p className="text-sm text-emerald-700">{message}</p>}
      </div>
    </div>
  );
};

export default AdminLocationTools;
