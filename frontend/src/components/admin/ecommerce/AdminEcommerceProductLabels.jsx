import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { ecommerceList, ecommerceRemove } from '../../../utils/ecommerceApi';

const RESOURCE = 'product-labels';
const LIST_PATH = '/admin/ecommerce/product-labels';

const mapRow = (r) => ({
  ...r,
  id: String(r._id || r.id || r.legacyId || ''),
  createdAt: r.createdAt ? String(r.createdAt).slice(0, 10) : r.createdAt,
});

export const AdminEcommerceProductLabels = () => {
  const navigate = useNavigate();
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await ecommerceList(RESOURCE);
      setLabels((Array.isArray(rows) ? rows : []).map(mapRow));
    } catch (err) {
      setLabels([]);
      setLoadError(err?.response?.data?.message || err?.message || 'Failed to load labels');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete label "${row.name}"?`)) return;
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
          className="inline-flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <span
            className="px-2.5 py-1 rounded-md text-xs font-bold text-white"
            style={{ backgroundColor: row.color }}
          >
            {row.name}
          </span>
        </Link>
      ),
    },
    {
      header: 'Color',
      accessor: 'color',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-4 h-4 rounded-sm border border-slate-200"
            style={{ backgroundColor: row.color }}
          />
          <span className="font-mono text-xs text-slate-600">{row.color}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {row.status}
        </span>
      ),
    },
    { header: 'Created At', accessor: 'createdAt' },
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
    <EcommerceLayout breadcrumb={['PRODUCTS', 'PRODUCT LABELS']}>
      {loadError ? (
        <div className="mb-3 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {loadError}
        </div>
      ) : null}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading product labels…</div>
      ) : (
        <AdminDataTable
          columns={columns}
          data={labels}
          createLabel="Create"
          onCreate={() => navigate(`${LIST_PATH}/create`)}
          onRowClick={(row) => navigate(`${LIST_PATH}/edit/${row.id}`)}
          searchPlaceholder="Search product labels..."
          showExport={false}
          showReload
          onReload={load}
        />
      )}
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductLabels;
