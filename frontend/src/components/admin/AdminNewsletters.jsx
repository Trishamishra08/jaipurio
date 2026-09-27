import React, { useCallback, useEffect, useState } from 'react';
import { FiMail, FiTrash2 } from 'react-icons/fi';
import AdminPageHeader from './AdminPageHeader';
import AdminDataTable from './ecommerce/AdminDataTable';
import api from '../../utils/api';

const unwrap = (res) => res.data?.data ?? res.data;

const fetchSubscribers = async () => {
  const res = await api.get('/newsletters');
  const rows = unwrap(res);
  return (Array.isArray(rows) ? rows : []).map((r) => ({ ...r, id: r._id || r.id }));
};

const updateSubscriber = async (id, payload) => {
  const res = await api.put(`/newsletters/${id}`, payload);
  return unwrap(res);
};

const deleteSubscriber = async (id) => {
  const res = await api.delete(`/newsletters/${id}`);
  return unwrap(res);
};

const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const toCsv = (rows) => {
  const header = 'ID,Email,Name,Status,Created At';
  const lines = rows.map((r) =>
    [r.id, r.email, r.name, r.status, r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '']
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header, ...lines].join('\n');
};

const toExcelHtml = (rows) => {
  const headerCells = ['ID', 'Email', 'Name', 'Status', 'Created At'].map((h) => `<th>${h}</th>`).join('');
  const bodyRows = rows
    .map(
      (r) =>
        `<tr><td>${r.id}</td><td>${r.email || ''}</td><td>${r.name || ''}</td><td>${r.status || ''}</td><td>${
          r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''
        }</td></tr>`
    )
    .join('');
  return `<html><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;
};

const AdminNewsletters = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchSubscribers();
      setSubscribers(rows);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to load subscribers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { header: 'ID', accessor: 'id', width: '70px', cell: (row) => <span className="text-slate-500">{subscribers.findIndex((s) => s.id === row.id) + 1}</span> },
    {
      header: 'Email',
      accessor: 'email',
      cell: (row) => (
        <a
          href={`mailto:${row.email}`}
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 hover:underline font-medium flex items-center gap-1.5"
        >
          <FiMail size={12} /> {row.email}
        </a>
      ),
    },
    { header: 'Name', accessor: 'name', cell: (row) => <span>{row.name || '—'}</span> },
    { header: 'Created At', accessor: 'createdAt', cell: (row) => <span>{row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN') : '—'}</span> },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${row.status === 'Subscribed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Operations',
      sortable: false,
      cell: (row) => (
        <button
          type="button"
          onClick={async (e) => {
            e.stopPropagation();
            if (!window.confirm(`Delete subscriber "${row.email}"?`)) return;
            try {
              await deleteSubscriber(row.id);
              await load();
            } catch (err) {
              setError(err.parsedMessage || err.message || 'Delete failed.');
            }
          }}
          title="Delete"
          className="h-7 w-7 rounded-md bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center"
        >
          <FiTrash2 size={13} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Newsletters" hideAction />
      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
      ) : (
        <AdminDataTable
          columns={columns}
          data={subscribers}
          showCreate={false}
          showReload
          onReload={load}
          searchPlaceholder="Search..."
          filterFields={[
            { key: 'email', label: 'Email', type: 'text' },
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'createdAt', label: 'Created At', type: 'date' },
          ]}
          onExportCsv={() => downloadBlob(toCsv(subscribers), 'newsletter-subscribers.csv', 'text/csv')}
          onExportExcel={() => downloadBlob(toExcelHtml(subscribers), 'newsletter-subscribers.xls', 'application/vnd.ms-excel')}
          bulkStatusOptions={['Subscribed', 'Unsubscribed']}
          onBulkStatusChange={async (items, status) => {
            await Promise.all(items.map((item) => updateSubscriber(item.id, { status })));
            await load();
          }}
          onBulkDelete={async (items) => {
            await Promise.all(items.map((item) => deleteSubscriber(item.id)));
            await load();
          }}
        />
      )}
    </div>
  );
};

export default AdminNewsletters;
