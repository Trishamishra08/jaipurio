import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { FiAlertTriangle, FiDownload, FiInfo, FiUploadCloud } from 'react-icons/fi';
import AdminPageHeader from './AdminPageHeader';
import { fetchAdminCountries } from '../../utils/countriesApi';
import { bulkImportLocations, importCountryPreset } from '../../utils/locationToolsApi';
import { COUNTRY_PRESET_LIST, PRESET_COUNTRY_CODES } from '../../data/countryPresetList';

const EXAMPLE_ROWS = [
  { name: 'United States of America', slug: '', importType: 'country', order: 0, abbreviation: '', status: 'published', country: '', state: '', nationality: 'Americans' },
  { name: 'Texas', slug: '', importType: 'state', order: 0, abbreviation: 'TX', status: 'published', country: 'United States of America', state: '', nationality: '' },
  { name: 'Washington', slug: '', importType: 'state', order: 0, abbreviation: 'WA', status: 'published', country: 'United States of America', state: '', nationality: '' },
  { name: 'Houston', slug: 'houston', importType: 'city', order: 0, abbreviation: '', status: 'published', country: 'United States of America', state: 'Texas', nationality: '' },
  { name: 'San Antonio', slug: 'san-antonio', importType: 'city', order: 0, abbreviation: '', status: 'published', country: 'United States of America', state: 'Texas', nationality: '' },
];

const COLUMN_ORDER = ['name', 'slug', 'importType', 'order', 'abbreviation', 'status', 'country', 'state', 'nationality'];
const COLUMN_LABELS = {
  name: 'Name', slug: 'Slug', importType: 'Import Type', order: 'Order', abbreviation: 'Abbreviation',
  status: 'Status', country: 'Country', state: 'State', nationality: 'Nationality',
};

const buildWorkbook = (rows) => {
  const sheetRows = rows.map((r) => ({
    Name: r.name, Slug: r.slug, 'Import Type': r.importType, Order: r.order,
    Abbreviation: r.abbreviation, Status: r.status, Country: r.country, State: r.state, Nationality: r.nationality,
  }));
  const sheet = XLSX.utils.json_to_sheet(sheetRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Locations');
  return wb;
};

const normalizeHeaderKey = (key) => key.toLowerCase().replace(/[\s_]+/g, '');

const HEADER_KEY_MAP = {
  name: 'name', slug: 'slug', importtype: 'importType', order: 'order',
  abbreviation: 'abbreviation', status: 'status', country: 'country', state: 'state', nationality: 'nationality',
};

const AdminLocationImporter = () => {
  const [existingCountryNames, setExistingCountryNames] = useState(new Set());
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [presetBusy, setPresetBusy] = useState(false);
  const [presetMessage, setPresetMessage] = useState('');
  const [presetError, setPresetError] = useState('');

  const [file, setFile] = useState(null);
  const [chunkSize, setChunkSize] = useState(200);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const loadCountries = useCallback(async () => {
    setLoadingCountries(true);
    try {
      const rows = await fetchAdminCountries();
      setExistingCountryNames(new Set(rows.map((c) => c.name.toLowerCase())));
    } catch {
      // non-fatal — dropdown just won't exclude existing countries
    } finally {
      setLoadingCountries(false);
    }
  }, []);

  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  const availableCountries = useMemo(
    () => COUNTRY_PRESET_LIST.filter(([name]) => !existingCountryNames.has(name.toLowerCase())),
    [existingCountryNames]
  );

  const handlePresetImport = async () => {
    if (!selectedCountry) return;
    const entry = COUNTRY_PRESET_LIST.find(([name]) => name === selectedCountry);
    setPresetBusy(true);
    setPresetMessage('');
    setPresetError('');
    try {
      const result = await importCountryPreset(selectedCountry, entry?.[1] || '');
      setPresetMessage(result.message);
      setSelectedCountry('');
      await loadCountries();
    } catch (err) {
      setPresetError(err.parsedMessage || err.message || 'Import failed.');
    } finally {
      setPresetBusy(false);
    }
  };

  const parseFile = (f) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          const rows = raw.map((r) => {
            const row = {};
            Object.entries(r).forEach(([k, v]) => {
              const mapped = HEADER_KEY_MAP[normalizeHeaderKey(k)];
              if (mapped) row[mapped] = String(v).trim();
            });
            return row;
          });
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(f);
    });

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setImportError('');
    setImportResult(null);
    try {
      const rows = await parseFile(file);
      if (!rows.length) {
        setImportError('No rows found in the uploaded file.');
        return;
      }
      const size = Math.max(1, Number(chunkSize) || 200);
      let imported = 0;
      let skipped = 0;
      const errors = [];
      for (let i = 0; i < rows.length; i += size) {
        const chunk = rows.slice(i, i + size);
        // eslint-disable-next-line no-await-in-loop
        const result = await bulkImportLocations(chunk);
        imported += result.imported || 0;
        skipped += result.skipped || 0;
        if (result.errors?.length) errors.push(...result.errors);
      }
      setImportResult({ imported, skipped, total: rows.length, errors: errors.slice(0, 20) });
      await loadCountries();
    } catch (err) {
      setImportError(err.parsedMessage || err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const downloadExampleCsv = () => {
    const wb = buildWorkbook(EXAMPLE_ROWS);
    XLSX.writeFile(wb, 'example-locations.csv', { bookType: 'csv' });
  };

  const downloadExampleExcel = () => {
    const wb = buildWorkbook(EXAMPLE_ROWS);
    XLSX.writeFile(wb, 'example-locations.xlsx', { bookType: 'xlsx' });
  };

  return (
    <div>
      <AdminPageHeader title="Location Importer" hideAction />

      <div className="bg-white rounded-md border border-slate-200 shadow-2xs p-5 space-y-4 mb-5">
        <h3 className="text-sm font-bold text-slate-800">Import available data</h3>

        {!loadingCountries && (
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 text-xs">
            <FiAlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>
              Countries are excluded from the list as they're already in the system. To re-import any, delete them
              from the <Link to="/admin/locations/countries" className="font-semibold underline">Countries</Link> page and retry.
            </span>
          </div>
        )}

        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs bg-white focus:outline-hidden focus:border-blue-500"
        >
          <option value="">Choose country...</option>
          {availableCountries.map(([name, code]) => (
            <option key={name} value={name}>
              {name}{PRESET_COUNTRY_CODES.includes(code) ? ' (includes states + cities)' : ''}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-400">
          Full state/city data is bundled for <strong>United States</strong> and <strong>India</strong>; other
          countries are added as a country entry only, then States/Cities can be added manually.
        </p>

        {presetMessage && <p className="text-xs text-emerald-700 font-medium">{presetMessage}</p>}
        {presetError && <p className="text-xs text-rose-600 font-medium">{presetError}</p>}

        <button
          type="button"
          onClick={handlePresetImport}
          disabled={!selectedCountry || presetBusy}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-md text-xs font-bold"
        >
          {presetBusy ? 'Importing…' : 'Import'}
        </button>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-2xs p-5 space-y-5">
        <h3 className="text-sm font-bold text-slate-800">Import Locations</h3>

        <div className="flex items-start gap-2.5 bg-sky-50 border border-sky-200 text-sky-800 rounded-md p-3 text-xs">
          <FiInfo size={15} className="mt-0.5 shrink-0" />
          <span>
            If you want to export Locations data, you can do it quickly from{' '}
            <Link to="/admin/locations/exporter" className="font-semibold underline">Location Exporter</Link>.
          </span>
        </div>

        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) setFile(f);
          }}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md py-10 cursor-pointer text-sm transition ${
            dragOver ? 'border-blue-400 bg-blue-50/40 text-blue-600' : 'border-slate-300 text-slate-500 hover:border-blue-300'
          }`}
        >
          <FiUploadCloud size={22} />
          {file ? <span className="font-semibold text-slate-700">{file.name}</span> : 'Drag and drop file here or click to upload'}
          <input
            type="file"
            accept=".csv,.xls,.xlsx"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        <p className="text-[11px] text-slate-400 -mt-3">Choose a file with following extensions: csv, xls, xlsx</p>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Chunk size</label>
          <input
            type="number"
            min={1}
            value={chunkSize}
            onChange={(e) => setChunkSize(e.target.value)}
            className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            The number of rows imported per request. Increase this value if you have a large file and want fewer
            requests; decrease it if you hit timeouts.
          </p>
        </div>

        {importResult && (
          <p className="text-xs text-emerald-700 font-medium">
            {importResult.imported} imported, {importResult.skipped} skipped, of {importResult.total} row(s).
            {importResult.errors?.length ? ` ${importResult.errors.length} issue(s): ${importResult.errors.slice(0, 3).join('; ')}` : ''}
          </p>
        )}
        {importError && <p className="text-xs text-rose-600 font-medium">{importError}</p>}

        <button
          type="button"
          onClick={handleImport}
          disabled={!file || importing}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-md text-xs font-bold"
        >
          {importing ? 'Importing…' : 'Import'}
        </button>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-800">Example</h4>
            <div className="flex items-center gap-2">
              <button type="button" onClick={downloadExampleCsv} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50">
                <FiDownload size={13} /> Download example CSV file
              </button>
              <button type="button" onClick={downloadExampleExcel} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50">
                <FiDownload size={13} /> Download example Excel file
              </button>
            </div>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-md">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {COLUMN_ORDER.map((c) => <th key={c} className="px-3 py-2">{COLUMN_LABELS[c]}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {EXAMPLE_ROWS.map((row, i) => (
                  <tr key={i}>
                    {COLUMN_ORDER.map((c) => <td key={c} className="px-3 py-2 text-slate-700">{row[c] || '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-800 mb-3">Rules</h4>
          <div className="overflow-x-auto border border-slate-200 rounded-md">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-3 py-2 w-40">Column</th>
                  <th className="px-3 py-2">Rules</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {[
                  ['Name', 'The name of the location is mandatory and should not exceed 120 characters.'],
                  ['Slug', 'The slug of the location, if provided, should not exceed 120 characters.'],
                  ['Import Type', 'The type of import is mandatory and should be one of: country, state, city.'],
                  ['Order', 'The order of the location, if provided, should be a positive integer.'],
                  ['Abbreviation', 'The abbreviation of the location, if provided, should not exceed 10 characters.'],
                  ['Status', 'The status of the location is mandatory and should be published or draft.'],
                  ['Country', 'The country field is mandatory if the import type is state or city.'],
                  ['State', 'The state field is mandatory if the import type is city.'],
                  ['Nationality', 'The nationality of the location, if provided, should not exceed 120 characters.'],
                ].map(([col, rule]) => (
                  <tr key={col}>
                    <td className="px-3 py-2 font-semibold">{col}</td>
                    <td className="px-3 py-2">{rule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLocationImporter;
