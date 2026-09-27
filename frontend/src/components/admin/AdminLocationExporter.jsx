import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import AdminPageHeader from './AdminPageHeader';
import { fetchLocationExportData } from '../../utils/locationToolsApi';

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'importType', label: 'Import Type' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'order', label: 'Order' },
  { key: 'abbreviation', label: 'Abbreviation' },
  { key: 'status', label: 'Status' },
  { key: 'nationality', label: 'Nationality' },
];

const StatCard = ({ label, value }) => (
  <div className="bg-slate-50 border border-slate-200 rounded-md p-5 text-center">
    <p className="text-xs font-semibold text-slate-500 mb-1.5">{label}</p>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
  </div>
);

const AdminLocationExporter = () => {
  const [totals, setTotals] = useState({ locations: 0, countries: 0, states: 0, cities: 0 });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedColumns, setSelectedColumns] = useState(() => new Set(COLUMNS.map((c) => c.key)));
  const [format, setFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchLocationExportData();
        setRows(data.rows || []);
        setTotals(data.totals || {});
      } catch (err) {
        setError(err.parsedMessage || err.message || 'Failed to load export data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleColumn = (key) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedColumns((prev) => (prev.size === COLUMNS.length ? new Set() : new Set(COLUMNS.map((c) => c.key))));
  };

  const handleExport = () => {
    if (!rows.length || !selectedColumns.size) return;
    setExporting(true);
    try {
      const activeColumns = COLUMNS.filter((c) => selectedColumns.has(c.key));
      const sheetRows = rows.map((row) => {
        const out = {};
        activeColumns.forEach((c) => { out[c.label] = row[c.key] ?? ''; });
        return out;
      });
      const sheet = XLSX.utils.json_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet, 'Locations');
      const filename = format === 'excel' ? 'locations-export.xlsx' : 'locations-export.csv';
      XLSX.writeFile(wb, filename, { bookType: format === 'excel' ? 'xlsx' : 'csv' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Location Exporter" hideAction />
      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}

      <div className="bg-white rounded-md border border-slate-200 shadow-2xs p-5 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3">Export Locations</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Locations" value={loading ? '…' : totals.locations} />
            <StatCard label="Total Countries" value={loading ? '…' : totals.countries} />
            <StatCard label="Total States" value={loading ? '…' : totals.states} />
            <StatCard label="Total Cities" value={loading ? '…' : totals.cities} />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Columns</h4>
            <button type="button" onClick={toggleAll} className="text-xs text-blue-600 hover:underline font-medium">
              Check all
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {COLUMNS.map((c) => (
              <label key={c.key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedColumns.has(c.key)}
                  onChange={() => toggleColumn(c.key)}
                  className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">Format</h4>
          <div className="flex items-center gap-5">
            {[['csv', 'CSV'], ['excel', 'Excel']].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="export-format"
                  checked={format === value}
                  onChange={() => setFormat(value)}
                  className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={loading || exporting || !rows.length || !selectedColumns.size}
          className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-md text-xs font-bold"
        >
          {exporting ? 'Exporting…' : 'Export'}
        </button>
      </div>
    </div>
  );
};

export default AdminLocationExporter;
