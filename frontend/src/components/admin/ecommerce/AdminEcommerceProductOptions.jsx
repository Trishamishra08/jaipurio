import React, { useState } from 'react';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';

export const AdminEcommerceProductOptions = () => {
  const [options, setOptions] = useState([
    { id: '1', name: 'Clay Pot Lid Type', optionType: 'Dropdown (Single)', values: 'Clay Lid, Brass Lid, Wooden Lid', required: 'Yes', order: 1 },
    { id: '2', name: 'Custom Heritage Engraving', optionType: 'Text Field', values: 'Custom Text (Max 30 chars)', required: 'No', order: 2 },
    { id: '3', name: 'Gift Wrapping & Box', optionType: 'Checkbox', values: 'Eco Jute Box, Royal Velvet Box', required: 'No', order: 3 },
  ]);

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px' },
    { header: 'Option Name', accessor: 'name', cell: (row) => <span className="font-semibold text-slate-800">{row.name}</span> },
    { header: 'Type', accessor: 'optionType' },
    { header: 'Available Values', accessor: 'values', cell: (row) => <span className="text-slate-600 text-xs">{row.values}</span> },
    { header: 'Required', accessor: 'required' },
    { header: 'Order', accessor: 'order' },
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
    <EcommerceLayout breadcrumb={['PRODUCTS', 'PRODUCT OPTIONS']}>
      <AdminDataTable
        columns={columns}
        data={options}
        createLabel="Create Option"
        searchPlaceholder="Search product options..."
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductOptions;
