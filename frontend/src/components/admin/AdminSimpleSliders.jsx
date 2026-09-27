import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCopy, FiEdit2, FiTrash2 } from 'react-icons/fi';
import AdminPageHeader from './AdminPageHeader';
import AdminDataTable from './ecommerce/AdminDataTable';
import { fetchSliders, deleteSlider, updateSlider } from '../../utils/simpleSlidersApi';

const shortcodeFor = (row) => row.shortcode || `[simple-slider alias="${row.key}"][/simple-slider]`;

const AdminSimpleSliders = () => {
  const navigate = useNavigate();
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchSliders();
      setSliders(rows);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to load sliders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCopy = (row) => {
    const text = shortcodeFor(row);
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(row.id);
    window.setTimeout(() => setCopiedId(null), 1500);
  };

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px', cell: (row) => <span className="text-slate-500">{String(row.id).slice(-4)}</span> },
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/simple-sliders/edit/${row.id}`); }}
          className="text-blue-600 hover:underline font-semibold text-left"
        >
          {row.name}
        </button>
      ),
    },
    {
      header: 'Shortcode',
      accessor: 'shortcode',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <code className="text-[11px] bg-slate-100 text-slate-600 rounded px-2 py-1">{shortcodeFor(row)}</code>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleCopy(row); }}
            title="Copy shortcode"
            className="text-slate-400 hover:text-blue-600"
          >
            <FiCopy size={13} />
          </button>
          {copiedId === row.id && <span className="text-[10px] text-emerald-600 font-semibold">Copied!</span>}
        </div>
      ),
    },
    { header: 'Created At', accessor: 'createdAt', cell: (row) => <span>{row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN') : '—'}</span> },
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
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/simple-sliders/edit/${row.id}`); }}
            title="Edit"
            className="text-slate-500 hover:text-blue-600"
          >
            <FiEdit2 size={14} />
          </button>
          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              if (!window.confirm(`Delete slider "${row.name}"?`)) return;
              try {
                await deleteSlider(row.id);
                await load();
              } catch (err) {
                setError(err.parsedMessage || err.message || 'Delete failed.');
              }
            }}
            title="Delete"
            className="text-slate-500 hover:text-rose-600"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Simple Sliders" hideAction />
      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
      ) : (
        <AdminDataTable
          columns={columns}
          data={sliders}
          showCreate
          createLabel="Create"
          onCreate={() => navigate('/admin/simple-sliders/create')}
          showExport={false}
          showReload
          onReload={load}
          searchPlaceholder="Search..."
          bulkStatusOptions={['Published', 'Draft']}
          onBulkStatusChange={async (items, status) => {
            await Promise.all(items.map((item) => updateSlider(item.id, { status })));
            await load();
          }}
          onBulkDelete={async (items) => {
            await Promise.all(items.map((item) => deleteSlider(item.id)));
            await load();
          }}
          onRowClick={(row) => navigate(`/admin/simple-sliders/edit/${row.id}`)}
        />
      )}
    </div>
  );
};

export default AdminSimpleSliders;
