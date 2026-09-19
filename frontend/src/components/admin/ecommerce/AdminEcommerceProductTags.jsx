import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { PRODUCT_TAGS } from '../../../data/productTags';
import { liveEcommerceList } from '../../../utils/ecommerceApi';

export const AdminEcommerceProductTags = () => {
  const navigate = useNavigate();
  const [tags, setTags] = useState(PRODUCT_TAGS);

  useEffect(() => {
    liveEcommerceList('product-tags', PRODUCT_TAGS).then((rows) => {
      setTags(
        rows.map((r) => ({
          ...r,
          id: String(r._id || r.id || r.legacyId),
          createdAt: r.createdAt ? String(r.createdAt).slice(0, 10) : r.createdAt,
        }))
      );
    });
  }, []);

  const columns = [
    { header: 'ID', accessor: 'id', width: '70px' },
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <Link
          to={`/admin/ecommerce/product-tags/edit/${row.id}`}
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
            to={`/admin/ecommerce/product-tags/edit/${row.id}`}
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
              setTags((prev) => prev.filter((tag) => tag.id !== row.id));
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
      <AdminDataTable
        columns={columns}
        data={tags}
        createLabel="Create"
        onCreate={() => navigate('/admin/ecommerce/product-tags/create')}
        onRowClick={(row) => navigate(`/admin/ecommerce/product-tags/edit/${row.id}`)}
        searchPlaceholder="Search tags..."
        showExport={false}
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductTags;
