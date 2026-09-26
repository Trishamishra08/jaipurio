import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { displayLayoutLabel } from '../../../data/productAttributeSets';
import { ecommerceList, ecommerceRemove } from '../../../utils/ecommerceApi';

const RESOURCE = 'product-attribute-sets';
const LIST_PATH = '/admin/ecommerce/product-attribute-sets';

const mapAttr = (row) => ({
  id: String(row._id || row.id || row.legacyId || ''),
  title: row.title || row.name,
  slug: row.slug,
  displayLayout: displayLayoutLabel(row.displayLayout) || row.displayLayout || '—',
  isSearchable: row.isSearchable ? 'Yes' : 'No',
  isComparable: row.isComparable ? 'Yes' : 'No',
  isUseInProductListing: row.isUseInProductListing ? 'Yes' : 'No',
  order: row.order ?? 0,
});

export const AdminEcommerceProductAttributeSets = () => {
  const navigate = useNavigate();
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await ecommerceList(RESOURCE);
      setAttributes((Array.isArray(rows) ? rows : []).map(mapAttr));
    } catch (err) {
      setAttributes([]);
      setLoadError(err?.response?.data?.message || err?.message || 'Failed to load attribute sets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete attribute set "${row.title}"?`)) return;
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
      header: 'Title',
      accessor: 'title',
      cell: (row) => (
        <Link
          to={`${LIST_PATH}/edit/${row.id}`}
          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.title}
        </Link>
      ),
    },
    {
      header: 'Slug',
      accessor: 'slug',
      cell: (row) => <span className="text-slate-400 font-mono text-[11px]">{row.slug}</span>,
    },
    { header: 'Display Layout', accessor: 'displayLayout' },
    { header: 'Searchable', accessor: 'isSearchable' },
    { header: 'Comparable', accessor: 'isComparable' },
    { header: 'Listing', accessor: 'isUseInProductListing' },
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
    <EcommerceLayout breadcrumb={['PRODUCTS', 'PRODUCT ATTRIBUTES']}>
      {loadError ? (
        <div className="mb-3 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {loadError}
        </div>
      ) : null}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading product attributes…</div>
      ) : (
        <AdminDataTable
          columns={columns}
          data={attributes}
          createLabel="Create"
          onCreate={() => navigate(`${LIST_PATH}/create`)}
          onRowClick={(row) => navigate(`${LIST_PATH}/edit/${row.id}`)}
          searchPlaceholder="Search product attributes..."
          showExport={false}
          showReload
          onReload={load}
        />
      )}
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductAttributeSets;
