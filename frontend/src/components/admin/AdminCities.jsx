import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPageHeader from './AdminPageHeader';
import AdminDataTable from './ecommerce/AdminDataTable';
import { OpButton } from './AdminFaqs';
import { fetchAdminCities, updateAdminCity, deleteAdminCity } from '../../utils/citiesApi';

const AdminCities = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchAdminCities();
      setCities(rows);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to load cities.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { header: 'ID', accessor: 'id', width: '70px', cell: (row) => <span className="text-slate-500">{cities.findIndex((c) => c.id === row.id) + 1}</span> },
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/locations/cities/edit/${row.id}`); }}
          className="text-blue-600 hover:underline font-semibold text-left"
        >
          {row.name}
        </button>
      ),
    },
    { header: 'State', accessor: 'stateName', cell: (row) => <span className="text-blue-600">{row.stateName || '—'}</span> },
    { header: 'Country', accessor: 'countryName', cell: (row) => <span className="text-blue-600">{row.countryName || '—'}</span> },
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
          <OpButton variant="edit" title="Edit" onClick={(e) => { e.stopPropagation(); navigate(`/admin/locations/cities/edit/${row.id}`); }} />
          <OpButton
            variant="delete"
            title="Delete"
            onClick={async (e) => {
              e.stopPropagation();
              if (!window.confirm(`Delete city "${row.name}"?`)) return;
              try {
                await deleteAdminCity(row.id);
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
      <AdminPageHeader title="Cities" hideAction />
      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
      ) : (
        <AdminDataTable
          columns={columns}
          data={cities}
          showCreate
          createLabel="Create"
          onCreate={() => navigate('/admin/locations/cities/create')}
          showExport={false}
          showReload
          onReload={load}
          searchPlaceholder="Search..."
          filterFields={[
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'stateName', label: 'State', type: 'text' },
            { key: 'countryName', label: 'Country', type: 'text' },
            { key: 'createdAt', label: 'Created At', type: 'date' },
          ]}
          bulkStatusOptions={['Published', 'Draft']}
          onBulkStatusChange={async (items, status) => {
            await Promise.all(items.map((item) => updateAdminCity(item.id, { status })));
            await load();
          }}
          onBulkDelete={async (items) => {
            await Promise.all(items.map((item) => deleteAdminCity(item.id)));
            await load();
          }}
          onRowClick={(row) => navigate(`/admin/locations/cities/edit/${row.id}`)}
        />
      )}
    </div>
  );
};

export default AdminCities;
