import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminPageHeader from './AdminPageHeader';
import api from '../../utils/api';

const parseCsv = (text) => {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim());
    const row = {};
    header.forEach((h, i) => { row[h] = cells[i] || ''; });
    return row;
  });
};

const toCsv = (rows) => {
  const header = 'pincode,city,district,state';
  const lines = rows.map((r) => [r.pincode, r.city, r.district, r.state].join(','));
  return [header, ...lines].join('\n');
};

const AdminLocationTools = () => {
  const section = useLocation().pathname.split('/').pop();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [csvText, setCsvText] = useState('pincode,city,district,state\n302001,Jaipur,Jaipur,Rajasthan\n342001,Jodhpur,Jodhpur,Rajasthan');

  const handleImport = async () => {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const rows = parseCsv(csvText);
      const res = await api.post('/locations/bulk-import', { rows });
      const { imported, total, errors } = res.data?.data || {};
      setMessage(`${imported || 0} of ${total || rows.length} location(s) imported.`);
      if (errors?.length) setError(errors.slice(0, 5).join('; '));
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Import failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const res = await api.get('/locations');
      const rows = res.data?.data?.locations || [];
      const csv = toCsv(rows);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'locations.csv';
      a.click();
      URL.revokeObjectURL(url);
      setMessage(`${rows.length} location(s) exported.`);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Export failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title={section === 'importer' ? 'Location Importer' : 'Location Exporter'} hideAction />
      <div className="admin-card p-5 max-w-2xl space-y-3">
        {section === 'importer' ? (
          <>
            <p className="text-sm text-slate-500">Bulk import serviceable pincodes. CSV columns: pincode, city, district, state.</p>
            <textarea className="admin-code" rows={8} value={csvText} onChange={(e) => setCsvText(e.target.value)} />
            <button type="button" className="admin-btn-primary" disabled={busy} onClick={handleImport}>
              {busy ? 'Importing…' : 'Import'}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-500">Export the live serviceable-locations list for backup or migration.</p>
            <button type="button" className="admin-btn-primary" disabled={busy} onClick={handleExport}>
              {busy ? 'Exporting…' : 'Export CSV'}
            </button>
          </>
        )}
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
};

export default AdminLocationTools;
