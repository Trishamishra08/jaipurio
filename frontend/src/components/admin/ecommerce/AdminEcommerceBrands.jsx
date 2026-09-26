import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { ecommerceList, ecommerceRemove } from '../../../utils/ecommerceApi';

const RESOURCE = 'brands';
const LIST_PATH = '/admin/ecommerce/brands';

const mapRow = (r) => ({
  ...r,
  id: String(r._id || r.id || r.legacyId || ''),
});

export const AdminEcommerceBrands = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await ecommerceList(RESOURCE);
      setBrands((Array.isArray(rows) ? rows : []).map(mapRow));
    } catch (err) {
      setBrands([]);
      setLoadError(err?.response?.data?.message || err?.message || 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete brand "${row.name}"?`)) return;
    try {
      await ecommerceRemove(RESOURCE, row.id);
      await load();
    } catch (err) {
      setLoadError(err?.response?.data?.message || err?.message || 'Delete failed');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px' },
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <Link
          to={`${LIST_PATH}/edit/${row.id}`}
          className="flex items-center gap-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="w-8 h-8 rounded-md border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
            {row.logo ? (
              <img src={row.logo} alt="" className="w-full h-full object-contain" />
            ) : (
              <span className="text-[10px] text-slate-400">—</span>
            )}
          </span>
          <span className="font-semibold text-blue-600 hover:underline">{row.name}</span>
        </Link>
      ),
    },
    {
      header: 'Website',
      accessor: 'website',
      cell: (row) =>
        row.website ? (
          <a
            href={row.website}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.website}
          </a>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      header: 'Featured',
      accessor: 'isFeatured',
      cell: (row) => (
        <span className={row.isFeatured ? 'text-blue-600 font-bold' : 'text-slate-400'}>
          {row.isFeatured ? 'Yes' : 'No'}
        </span>
      ),
    },
    { header: 'Order', accessor: 'order' },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {row.status}
        </span>
      ),
    },
    {
      header: 'Operations',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`${LIST_PATH}/edit/${row.id}`}
            className="text-blue-600 hover:underline text-[11px] font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
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
    <EcommerceLayout breadcrumb={['BRANDS']}>
      {loadError ? (
        <div className="mb-3 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {loadError}
        </div>
      ) : null}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading brands…</div>
      ) : (
        <AdminDataTable
          columns={columns}
          data={brands}
          createLabel="Create"
          onCreate={() => navigate(`${LIST_PATH}/create`)}
          onRowClick={(row) => navigate(`${LIST_PATH}/edit/${row.id}`)}
          searchPlaceholder="Search brands..."
          showExport={false}
          showReload
          onReload={load}
        />
      )}
    </EcommerceLayout>
  );
};

export default AdminEcommerceBrands;
