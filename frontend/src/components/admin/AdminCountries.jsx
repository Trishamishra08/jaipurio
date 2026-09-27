import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPageHeader from './AdminPageHeader';
import AdminDataTable from './ecommerce/AdminDataTable';
import { OpButton } from './AdminFaqs';
import { fetchAdminCountries, updateAdminCountry, deleteAdminCountry } from '../../utils/countriesApi';

const AdminCountries = () => {
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchAdminCountries();
      setCountries(rows);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to load countries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px', cell: (row) => <span className="text-slate-500">{countries.findIndex((c) => c.id === row.id) + 1}</span> },
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/locations/countries/edit/${row.id}`); }}
          className="text-blue-600 hover:underline font-semibold text-left flex items-center gap-2"
        >
          {row.image ? (
            <img src={row.image} alt="" className="h-4 w-6 object-cover rounded-sm border border-slate-200" />
          ) : null}
          {row.name}
          {row.isDefault ? (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">Default</span>
          ) : null}
        </button>
      ),
    },
    { header: 'Code', accessor: 'code', cell: (row) => <span>{row.code || '—'}</span> },
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
      className: 'text-center',
      cell: (row) => (
        <div className="flex items-center justify-center gap-2">
          <OpButton variant="edit" title="Edit" onClick={(e) => { e.stopPropagation(); navigate(`/admin/locations/countries/edit/${row.id}`); }} />
          <OpButton
            variant="delete"
            title="Delete"
            onClick={async (e) => {
              e.stopPropagation();
              if (!window.confirm(`Delete country "${row.name}"?`)) return;
              try {
                await deleteAdminCountry(row.id);
                await load();
              } catch (err) {
                setError(err.parsedMessage || err.message || 'Delete failed.');
              }
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Countries" hideAction />
      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
      ) : (
        <AdminDataTable
          columns={columns}
          data={countries}
          showCreate
          createLabel="Create"
          onCreate={() => navigate('/admin/locations/countries/create')}
          showExport={false}
          showReload
          onReload={load}
          searchPlaceholder="Search..."
          filterFields={[
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'code', label: 'Code', type: 'text' },
            { key: 'createdAt', label: 'Created At', type: 'date' },
          ]}
          bulkStatusOptions={['Published', 'Draft']}
          onBulkStatusChange={async (items, status) => {
            await Promise.all(items.map((item) => updateAdminCountry(item.id, { status })));
            await load();
          }}
          onBulkDelete={async (items) => {
            await Promise.all(items.map((item) => deleteAdminCountry(item.id)));
            await load();
          }}
          onRowClick={(row) => navigate(`/admin/locations/countries/edit/${row.id}`)}
        />
      )}
    </div>
  );
};

export default AdminCountries;
