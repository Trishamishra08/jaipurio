import React, { useCallback, useEffect, useState } from 'react';
import { FiCopy, FiCheck, FiX, FiImage } from 'react-icons/fi';
import AdminPageHeader from './AdminPageHeader';
import AdminDataTable from './ecommerce/AdminDataTable';
import api from '../../utils/api';

const PLACEMENTS = ['Homepage Top', 'Homepage Sidebar', 'Category Page', 'Product Page', 'Footer', 'Blog'];

const emptyAd = {
  title: '',
  placement: 'Homepage Top',
  image: '',
  link: '',
  description: '',
  startDate: '',
  endDate: '',
  status: 'Published',
};

const AdEditModal = ({ ad, onClose, onSaved }) => {
  const [form, setForm] = useState(() => ({
    ...emptyAd,
    ...ad,
    startDate: ad?.startDate ? String(ad.startDate).slice(0, 10) : '',
    endDate: ad?.endDate ? String(ad.endDate).slice(0, 10) : '',
  }));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('documents', file);
      const res = await api.post('/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data?.data?.[0];
      if (url) set('image', url);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (ad?._id || ad?.id) {
        await api.put(`/ads/${ad._id || ad.id}`, payload);
      } else {
        await api.post('/ads', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to save ad.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-md shadow-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800">{ad ? 'Edit ad' : 'Create ad'}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <FiX size={18} />
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Name</label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Placement</label>
          <select value={form.placement} onChange={(e) => set('placement', e.target.value)} className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs bg-white focus:outline-hidden focus:border-blue-500">
            {PLACEMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Image</label>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-md border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
              {form.image ? <img src={form.image} alt="" className="w-full h-full object-cover" /> : <FiImage className="text-slate-300" size={20} />}
            </div>
            <label className="text-xs text-blue-600 hover:underline font-medium cursor-pointer">
              {uploading ? 'Uploading…' : 'Choose image'}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Link URL</label>
          <input value={form.link} onChange={(e) => set('link', e.target.value)} placeholder="https://..." className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Start date</label>
            <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Expires at</label>
            <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value)} className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs bg-white focus:outline-hidden focus:border-blue-500">
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2 px-3 rounded-md text-xs shadow-xs transition"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
};

const ShortcodeCell = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const text = `[ads key="${code}"][/ads]`;
  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    });
  };
  return (
    <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 hover:bg-slate-200" title="Copy shortcode">
      {text}
      {copied ? <FiCheck size={11} className="text-emerald-600" /> : <FiCopy size={11} className="text-slate-500" />}
    </button>
  );
};

const AdminAds = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/ads');
      setAds(res.data?.data || []);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to load ads.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete "${row.title}"?`)) return;
    try {
      await api.delete(`/ads/${row._id || row.id}`);
      await load();
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to delete ad.');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id', width: '50px', cell: (row) => <span className="text-slate-500">{row.legacyId || String(row._id || row.id).slice(-4)}</span> },
    {
      header: 'Image',
      accessor: 'image',
      width: '60px',
      sortable: false,
      cell: (row) => (
        <div className="w-10 h-10 rounded border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
          {row.image ? <img src={row.image} alt={row.title} className="w-full h-full object-cover" /> : <FiImage className="text-slate-300" size={16} />}
        </div>
      ),
    },
    {
      header: 'Name',
      accessor: 'title',
      cell: (row) => (
        <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(row); }} className="text-blue-600 hover:underline font-semibold text-left">
          {row.title}
        </button>
      ),
    },
    { header: 'Shortcode', accessor: 'shortcode', sortable: false, cell: (row) => (row.shortcode ? <ShortcodeCell code={row.shortcode} /> : <span className="text-slate-300">—</span>) },
    { header: 'Clicked', accessor: 'clicks', width: '80px', cell: (row) => <span className="font-semibold text-slate-700">{row.clicks || 0}</span> },
    { header: 'Expired At', accessor: 'endDate', cell: (row) => <span>{row.endDate ? String(row.endDate).slice(0, 10) : '—'}</span> },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${row.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Operations',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(row); }} className="text-blue-600 hover:underline text-[11px] font-medium">Edit</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="text-red-500 hover:underline text-[11px] font-medium">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Ads" />
      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
      ) : (
        <AdminDataTable
          columns={columns}
          data={ads}
          createLabel="Create"
          onCreate={() => setCreating(true)}
          showReload
          onReload={load}
          searchPlaceholder="Search ads..."
        />
      )}

      {(editing || creating) && (
        <AdEditModal
          ad={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={load}
        />
      )}
    </div>
  );
};

export default AdminAds;
