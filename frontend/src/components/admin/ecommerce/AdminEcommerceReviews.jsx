import React, { useState } from 'react';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { FiStar } from 'react-icons/fi';

export const AdminEcommerceReviews = () => {
  const [reviews, setReviews] = useState([
    {
      id: 'REV-501',
      product: 'Rajasthani Design Matka (5L)',
      customer: 'Sunita Meena',
      rating: 5,
      comment: 'Authentic pure clay taste! Water stays incredibly chilled without electricity.',
      status: 'Approved',
      createdAt: '2026-09-08'
    },
    {
      id: 'REV-502',
      product: 'Kulhad (Pack of 6)',
      customer: 'Kavita Singh',
      rating: 5,
      comment: 'Brings genuine village tea aroma to our morning breakfast. Superb packing!',
      status: 'Approved',
      createdAt: '2026-09-04'
    },
    {
      id: 'REV-503',
      product: 'Decorative Diya Set (8 Pcs)',
      customer: 'Rahul Agarwal',
      rating: 4,
      comment: 'Beautiful gold detailing on the terracotta rim. Highly recommended.',
      status: 'Approved',
      createdAt: '2026-09-01'
    }
  ]);

  const columns = [
    { header: 'ID', accessor: 'id', width: '70px' },
    { header: 'Product', accessor: 'product', cell: (row) => <span className="font-semibold text-slate-800">{row.product}</span> },
    { header: 'Customer', accessor: 'customer' },
    {
      header: 'Rating',
      accessor: 'rating',
      cell: (row) => (
        <div className="flex items-center text-amber-500 font-bold gap-1">
          <span>{row.rating}</span>
          <FiStar size={13} className="fill-amber-400 text-amber-500" />
        </div>
      )
    },
    { header: 'Comment', accessor: 'comment', cell: (row) => <span className="text-slate-600 line-clamp-1">{row.comment}</span> },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
          {row.status}
        </span>
      )
    },
    { header: 'Created At', accessor: 'createdAt' },
    {
      header: 'Operations',
      sortable: false,
      cell: () => (
        <div className="flex items-center gap-2">
          <button className="text-blue-600 hover:underline text-[11px] font-medium">Approve</button>
          <button className="text-red-500 hover:underline text-[11px] font-medium">Delete</button>
        </div>
      )
    }
  ];

  return (
    <EcommerceLayout breadcrumb={['REVIEWS']}>
      <AdminDataTable
        columns={columns}
        data={reviews}
        showCreate={false}
        searchPlaceholder="Search reviews..."
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceReviews;
