import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import {
  PRODUCT_ATTRIBUTE_SETS,
  displayLayoutLabel,
} from '../../../data/productAttributeSets';
import { liveEcommerceList } from '../../../utils/ecommerceApi';

const mapAttr = (row) => ({
  id: String(row._id || row.id || row.legacyId),
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
  const [attributes, setAttributes] = useState(PRODUCT_ATTRIBUTE_SETS.map(mapAttr));

  useEffect(() => {
    liveEcommerceList('product-attribute-sets', PRODUCT_ATTRIBUTE_SETS).then((rows) => {
      setAttributes(rows.map(mapAttr));
    });
  }, []);

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px' },
    {
      header: 'Title',
      accessor: 'title',
      cell: (row) => (
        <Link
          to={`/admin/ecommerce/product-attribute-sets/edit/${row.id}`}
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
            to={`/admin/ecommerce/product-attribute-sets/edit/${row.id}`}
            className="text-blue-600 hover:underline text-[11px] font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAttributes((prev) => prev.filter((item) => item.id !== row.id));
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
      <AdminDataTable
        columns={columns}
        data={attributes}
        createLabel="Create"
        onCreate={() => navigate('/admin/ecommerce/product-attribute-sets/create')}
        onRowClick={(row) => navigate(`/admin/ecommerce/product-attribute-sets/edit/${row.id}`)}
        searchPlaceholder="Search product attributes..."
        showExport={false}
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductAttributeSets;
