import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLink } from 'react-icons/fi';
import AdminPageHeader from './AdminPageHeader';
import AdminDataTable from './ecommerce/AdminDataTable';
import { OpButton } from './AdminFaqs';
import { fetchMenus, updateMenu, deleteMenu } from '../../utils/menusApi';

const LOCATION_COLORS = {
  'Main Navigation': 'bg-blue-100 text-blue-700',
  'Header Navigation': 'bg-sky-100 text-sky-700',
  'Footer Menu': 'bg-violet-100 text-violet-700',
};

const AdminMenus = () => {
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchMenus();
      setMenus(rows);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to load menus.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px', cell: (row) => <span className="text-slate-500">{menus.findIndex((m) => m.id === row.id) + 1}</span> },
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/menus/edit/${row.id}`); }}
          className="text-blue-600 hover:underline font-semibold text-left"
        >
          {row.name}
        </button>
      ),
    },
    {
      header: 'Locations',
      accessor: 'locations',
      cell: (row) =>
        row.locations?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {row.locations.map((loc) => (
              <span key={loc} className={`px-2 py-0.5 rounded text-[11px] font-semibold ${LOCATION_COLORS[loc] || 'bg-slate-100 text-slate-600'}`}>
                {loc}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      header: 'Items',
      accessor: 'itemsCount',
      cell: (row) => (
        <span className="flex items-center gap-1 text-slate-600">
          <FiLink size={12} /> {row.itemsCount ?? 0}
        </span>
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
      className: 'text-center',
      cell: (row) => (
        <div className="flex items-center justify-center gap-2">
          <OpButton variant="edit" title="Edit" onClick={(e) => { e.stopPropagation(); navigate(`/admin/menus/edit/${row.id}`); }} />
          <OpButton
            variant="delete"
            title="Delete"
            onClick={async (e) => {
              e.stopPropagation();
              if (!window.confirm(`Delete menu "${row.name}"?`)) return;
              try {
                await deleteMenu(row.id);
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
      <AdminPageHeader title="Menus" hideAction />
      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
      ) : (
        <AdminDataTable
          columns={columns}
          data={menus}
          showCreate
          createLabel="Create"
          onCreate={() => navigate('/admin/menus/create')}
          showExport={false}
          showReload
          onReload={load}
          searchPlaceholder="Search..."
          filterFields={[
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'createdAt', label: 'Created At', type: 'date' },
          ]}
          bulkStatusOptions={['Published', 'Draft']}
          onBulkStatusChange={async (items, status) => {
            await Promise.all(items.map((item) => updateMenu(item.id, { status })));
            await load();
          }}
          onBulkDelete={async (items) => {
            await Promise.all(items.map((item) => deleteMenu(item.id)));
            await load();
          }}
          onRowClick={(row) => navigate(`/admin/menus/edit/${row.id}`)}
        />
      )}
    </div>
  );
};

export default AdminMenus;
