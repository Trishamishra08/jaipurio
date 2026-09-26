import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { ecommerceList, ecommerceRemove } from '../../../utils/ecommerceApi';

const RESOURCE = 'product-collections';
const LIST_PATH = '/admin/ecommerce/product-collections';

const mapCollection = (row) => ({
  id: String(row._id || row.id || row.legacyId || ''),
  name: row.name,
  slug: row.slug,
  productsCount: row.productIds?.length || row.productsCount || 0,
  isFeatured: row.isFeatured === true || row.isFeatured === 'Yes' ? 'Yes' : 'No',
  status: row.status || 'Published',
  image: row.image || '',
  createdAt: row.createdAt ? String(row.createdAt).slice(0, 10) : '',
});

export const AdminEcommerceProductCollections = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await ecommerceList(RESOURCE);
      setCollections((Array.isArray(rows) ? rows : []).map(mapCollection));
    } catch (err) {
      setCollections([]);
      setLoadError(err?.response?.data?.message || err?.message || 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete collection "${row.name}"?`)) return;
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
          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.name}
        </Link>
      ),
    },
    {
      header: 'Slug',
      accessor: 'slug',
      cell: (row) => <span className="text-slate-400 font-mono text-[11px]">{row.slug}</span>,
    },
    {
      header: 'Products',
      accessor: 'productsCount',
      cell: (row) => <span className="font-bold">{row.productsCount}</span>,
    },
    {
      header: 'Featured',
      accessor: 'isFeatured',
      cell: (row) => (
        <span className={row.isFeatured === 'Yes' ? 'text-blue-600 font-bold' : 'text-slate-400'}>
          {row.isFeatured}
        </span>
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
    <EcommerceLayout breadcrumb={['PRODUCTS', 'PRODUCT COLLECTIONS']}>
      {loadError ? (
        <div className="mb-3 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {loadError}
        </div>
      ) : null}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading collections…</div>
      ) : (
        <AdminDataTable
          columns={columns}
          data={collections}
          createLabel="Create"
          onCreate={() => navigate(`${LIST_PATH}/create`)}
          onRowClick={(row) => navigate(`${LIST_PATH}/edit/${row.id}`)}
          searchPlaceholder="Search collections..."
          showExport={false}
          showReload
          onReload={load}
        />
      )}
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductCollections;
