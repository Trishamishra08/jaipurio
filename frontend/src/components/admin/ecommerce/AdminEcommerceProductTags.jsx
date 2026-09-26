import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { ecommerceList, ecommerceRemove } from '../../../utils/ecommerceApi';

const RESOURCE = 'product-tags';
const LIST_PATH = '/admin/ecommerce/product-tags';

const mapRow = (r) => ({
  ...r,
  id: String(r._id || r.id || r.legacyId || ''),
  createdAt: r.createdAt ? String(r.createdAt).slice(0, 10) : r.createdAt,
});

export const AdminEcommerceProductTags = () => {
  const navigate = useNavigate();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await ecommerceList(RESOURCE);
      setTags((Array.isArray(rows) ? rows : []).map(mapRow));
    } catch (err) {
      setTags([]);
      setLoadError(err?.response?.data?.message || err?.message || 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete tag "${row.name}"?`)) return;
    try {
      await ecommerceRemove(RESOURCE, row.id);
      await load();
    } catch (err) {
      setLoadError(err?.response?.data?.message || err?.message || 'Delete failed');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id', width: '70px' },
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <Link
          to={`${LIST_PATH}/edit/${row.id}`}
          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.name}
        </Link>
      ),
    },
    { header: 'Created At', accessor: 'createdAt' },
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
        <div className="flex items-center gap-2.5">
          <Link
            to={`${LIST_PATH}/edit/${row.id}`}
            className="text-blue-600 hover:text-blue-800 hover:underline text-[11px] font-medium flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <FiEdit size={12} />
            <span>Edit</span>
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            className="text-red-500 hover:text-red-700 hover:underline text-[11px] font-medium flex items-center gap-0.5"
          >
            <FiTrash2 size={12} />
            <span>Delete</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <EcommerceLayout breadcrumb={['PRODUCTS', 'PRODUCT TAGS']}>
      {loadError ? (
        <div className="mb-3 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {loadError}
        </div>
      ) : null}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading tags…</div>
      ) : (
        <AdminDataTable
          columns={columns}
          data={tags}
          createLabel="Create"
          onCreate={() => navigate(`${LIST_PATH}/create`)}
          onRowClick={(row) => navigate(`${LIST_PATH}/edit/${row.id}`)}
          searchPlaceholder="Search tags..."
          showExport={false}
          showReload
          onReload={load}
        />
      )}
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductTags;
