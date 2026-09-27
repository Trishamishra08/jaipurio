import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPageHeader from './AdminPageHeader';
import AdminDataTable from './ecommerce/AdminDataTable';
import { fetchCustomFields, deleteCustomField } from '../../utils/contactsApi';

const AdminContactCustomFields = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchCustomFields();
      setFields(rows);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to load custom fields.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/admin/contacts/custom-fields/edit/${row.id || row._id}`); }} className="text-blue-600 hover:underline font-semibold text-left">
          {row.name}
        </button>
      ),
    },
    { header: 'Type', accessor: 'type' },
    { header: 'Required', accessor: 'isRequired', cell: (row) => <span>{row.isRequired ? 'Yes' : 'No'}</span> },
    { header: 'Order', accessor: 'sortOrder' },
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
          <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/admin/contacts/custom-fields/edit/${row.id || row._id}`); }} className="text-blue-600 hover:underline text-[11px] font-medium">Edit</button>
          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              if (!window.confirm(`Delete field "${row.name}"?`)) return;
              try {
                await deleteCustomField(row.id || row._id);
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
      <AdminPageHeader title="Contact Form Custom Fields" actionLabel="Create" onAction={() => navigate('/admin/contacts/custom-fields/create')} />
      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
      ) : (
        <AdminDataTable
          columns={columns}
          data={fields}
          showCreate={false}
          showReload
          onReload={load}
          searchPlaceholder="Search custom fields..."
          onRowClick={(row) => navigate(`/admin/contacts/custom-fields/edit/${row.id || row._id}`)}
        />
      )}
    </div>
  );
};

export default AdminContactCustomFields;
