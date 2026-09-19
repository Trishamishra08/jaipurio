import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { CUSTOMERS, customerInitials } from '../../../data/customers';
import { fetchEcommerceCustomers } from '../../../utils/ecommerceApi';

export const AdminEcommerceCustomers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState(CUSTOMERS);

  useEffect(() => {
    (async () => {
      try {
        const rows = await fetchEcommerceCustomers();
        if (Array.isArray(rows) && rows.length) {
          setCustomers(
            rows.map((r) => ({
              ...r,
              id: String(r._id || r.id),
              phone: r.mobile || r.phone || '',
              status: r.isBlocked ? 'Blocked' : 'Activated',
              createdAt: r.createdAt ? String(r.createdAt).slice(0, 10) : '',
            }))
          );
        }
      } catch {
        /* keep fallback */
      }
    })();
  }, []);

  const columns = useMemo(
    () => [
      { header: 'ID', accessor: 'id', width: '60px' },
      {
        header: 'Avatar',
        accessor: 'avatar',
        sortable: false,
        cell: (row) =>
          row.avatar ? (
            <img
              src={row.avatar}
              alt={row.name}
              className="w-9 h-9 rounded-md object-cover border border-slate-200"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-md bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center"
              title={row.name}
            >
              {customerInitials(row.name)}
            </div>
          ),
      },
      {
        header: 'Name',
        accessor: 'name',
        cell: (row) => (
          <Link
            to={`/admin/customers/edit/${row.id}`}
            className="font-semibold text-blue-600 hover:underline"
          >
            {row.name}
          </Link>
        ),
      },
      {
        header: 'Email',
        accessor: 'email',
        cell: (row) => <span className="text-slate-600">{row.email}</span>,
      },
      { header: 'Created At', accessor: 'createdAt' },
      {
        header: 'Status',
        accessor: 'status',
        cell: (row) => (
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              row.status === 'Activated'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {row.status}
          </span>
        ),
      },
      {
        header: 'Is vendor?',
        accessor: 'isVendor',
        cell: (row) => (
          <span className="text-slate-700 font-medium">{row.isVendor ? 'Yes' : 'No'}</span>
        ),
      },
      {
        header: 'Operations',
        sortable: false,
        cell: (row) => (
          <div className="flex items-center gap-2">
            <Link
              to={`/admin/customers/edit/${row.id}`}
              className="text-blue-600 hover:underline text-[11px] font-medium"
            >
              Edit
            </Link>
            <button type="button" className="text-red-500 hover:underline text-[11px] font-medium">
              Delete
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <EcommerceLayout breadcrumb={['CUSTOMERS']}>
      <AdminDataTable
        columns={columns}
        data={customers}
        createLabel="Create"
        searchPlaceholder="Search..."
        onCreate={() => navigate('/admin/customers/create')}
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceCustomers;
