import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { PRODUCT_COLLECTIONS } from '../../../data/productCollections';
import { liveEcommerceList } from '../../../utils/ecommerceApi';

const mapCollection = (row) => ({
  id: String(row._id || row.id || row.legacyId),
  name: row.name,
  slug: row.slug,
  productsCount: row.productIds?.length || row.productsCount || 0,
  isFeatured: row.isFeatured === true || row.isFeatured === 'Yes' ? 'Yes' : 'No',
  status: row.status || 'Published',
  image: row.image || '',
});

export const AdminEcommerceProductCollections = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState(PRODUCT_COLLECTIONS.map(mapCollection));

  useEffect(() => {
    liveEcommerceList('product-collections', PRODUCT_COLLECTIONS).then((rows) => {
      setCollections(rows.map(mapCollection));
    });
  }, []);

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px' },
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <Link
          to={`/admin/ecommerce/product-collections/edit/${row.id}`}
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
            to={`/admin/ecommerce/product-collections/edit/${row.id}`}
            className="text-blue-600 hover:underline text-[11px] font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCollections((prev) => prev.filter((item) => item.id !== row.id));
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
      <AdminDataTable
        columns={columns}
        data={collections}
        createLabel="Create"
        onCreate={() => navigate('/admin/ecommerce/product-collections/create')}
        onRowClick={(row) => navigate(`/admin/ecommerce/product-collections/edit/${row.id}`)}
        searchPlaceholder="Search collections..."
        showExport={false}
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductCollections;
