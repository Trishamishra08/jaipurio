import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPageHeader from './AdminPageHeader';
import AdminDataTable from './ecommerce/AdminDataTable';
import { fetchContacts, updateContact, deleteContact } from '../../utils/contactsApi';

const toCsv = (rows) => {
  const header = 'ID,Name,Email,Phone,Subject,Status,Created At';
  const lines = rows.map((r) =>
    [r.id, r.name, r.email, r.phone, r.subject, r.status, new Date(r.createdAt).toLocaleDateString()]
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header, ...lines].join('\n');
};

const AdminContacts = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchContacts();
      setContacts(rows);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to load contacts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = () => {
    const csv = toCsv(contacts);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px', cell: (row) => <span className="text-slate-500">{String(row.id).slice(-4)}</span> },
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/contacts/edit/${row.id}`); }}
          className="text-blue-600 hover:underline font-semibold text-left"
        >
          {row.name}
        </button>
      ),
    },
    { header: 'Email', accessor: 'email', cell: (row) => <a href={`mailto:${row.email}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>{row.email}</a> },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Created At', accessor: 'createdAt', cell: (row) => <span>{row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN') : '—'}</span> },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${row.status === 'Unread' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Operations',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/admin/contacts/edit/${row.id}`); }} className="text-blue-600 hover:underline text-[11px] font-medium">Edit</button>
          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              if (!window.confirm(`Delete message from "${row.name}"?`)) return;
              try {
                await deleteContact(row.id);
                await load();
              } catch (err) {
                setError(err.parsedMessage || err.message || 'Delete failed.');
              }
            }}
            className="text-red-500 hover:underline text-[11px] font-medium"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Contact" hideAction />
      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
      ) : (
        <AdminDataTable
          columns={columns}
          data={contacts}
          showCreate={false}
          showReload
          onReload={load}
          onExport={handleExport}
          searchPlaceholder="Search..."
          bulkStatusOptions={['Unread', 'Read']}
          onBulkStatusChange={async (items, status) => {
            await Promise.all(items.map((item) => updateContact(item.id, { status })));
            await load();
          }}
          onBulkDelete={async (items) => {
            await Promise.all(items.map((item) => deleteContact(item.id)));
            await load();
          }}
          onRowClick={(row) => navigate(`/admin/contacts/edit/${row.id}`)}
        />
      )}
    </div>
  );
};

export default AdminContacts;
