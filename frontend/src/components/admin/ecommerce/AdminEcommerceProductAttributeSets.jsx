import React, { useState } from 'react';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';

export const AdminEcommerceProductAttributeSets = () => {
  const [attributes, setAttributes] = useState([
    { id: '1', title: 'Clay Material Grade', slug: 'clay-material-grade', displayLayout: 'Dropdown list', isSearchable: 'Yes', isComparable: 'Yes', isUseInProductListing: 'Yes', order: 1 },
    { id: '2', title: 'Volume / Capacity', slug: 'volume-capacity', displayLayout: 'Visual Swatch', isSearchable: 'Yes', isComparable: 'Yes', isUseInProductListing: 'Yes', order: 2 },
    { id: '3', title: 'Art Style / Origin', slug: 'art-style-origin', displayLayout: 'Text Swatch', isSearchable: 'Yes', isComparable: 'No', isUseInProductListing: 'Yes', order: 3 },
    { id: '4', title: 'Color Palette', slug: 'color-palette', displayLayout: 'Color Swatch', isSearchable: 'Yes', isComparable: 'Yes', isUseInProductListing: 'Yes', order: 4 },
  ]);

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px' },
    { header: 'Title', accessor: 'title', cell: (row) => <span className="font-semibold text-slate-800">{row.title}</span> },
    { header: 'Slug', accessor: 'slug', cell: (row) => <span className="text-slate-400 font-mono text-[11px]">{row.slug}</span> },
    { header: 'Display Layout', accessor: 'displayLayout' },
    { header: 'Searchable', accessor: 'isSearchable' },
    { header: 'Comparable', accessor: 'isComparable' },
    { header: 'Used in Listing', accessor: 'isUseInProductListing' },
    {
      header: 'Operations',
      sortable: false,
      cell: () => (
        <div className="flex items-center gap-2">
          <button className="text-blue-600 hover:underline text-[11px] font-medium">Edit</button>
          <button className="text-red-500 hover:underline text-[11px] font-medium">Delete</button>
        </div>
      )
    }
  ];

  return (
    <EcommerceLayout breadcrumb={['PRODUCTS', 'PRODUCT ATTRIBUTES']}>
      <AdminDataTable
        columns={columns}
        data={attributes}
        createLabel="Create Attribute"
        searchPlaceholder="Search product attributes..."
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductAttributeSets;
