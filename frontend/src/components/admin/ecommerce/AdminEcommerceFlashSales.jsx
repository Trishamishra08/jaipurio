import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { FLASH_SALES } from '../../../data/flashSales';
import { liveEcommerceList } from '../../../utils/ecommerceApi';

export const AdminEcommerceFlashSales = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState(FLASH_SALES);

  useEffect(() => {
    liveEcommerceList('flash-sales', FLASH_SALES).then((rows) => {
      setSales(
        rows.map((r) => ({
          ...r,
          id: String(r._id || r.id || r.legacyId),
          endDate: r.endDate ? String(r.endDate).slice(0, 10) : r.endDate,
          createdAt: r.createdAt ? String(r.createdAt).slice(0, 10) : r.createdAt,
        }))
      );
    });
  }, []);

  const columns = useMemo(
    () => [
      { header: 'ID', accessor: 'id', width: '60px' },
      {
        header: 'Name',
        accessor: 'name',
        cell: (row) => (
          <Link
            to={`/admin/ecommerce/flash-sales/edit/${row.id}`}
            className="font-semibold text-blue-600 hover:underline"
          >
            {row.name}
          </Link>
        ),
      },
      { header: 'End date', accessor: 'endDate' },
      { header: 'Created At', accessor: 'createdAt' },
      {
        header: 'Status',
        accessor: 'status',
        cell: (row) => (
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              row.status === 'Published'
                ? 'bg-emerald-100 text-emerald-700'
                : row.status === 'Draft'
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-amber-100 text-amber-700'
            }`}
          >
            {row.status}
          </span>
        ),
      },
      {
        header: 'Operations',
        sortable: false,
        cell: (row) => (
          <div className="flex items-center gap-2">
            <Link
              to={`/admin/ecommerce/flash-sales/edit/${row.id}`}
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
    <EcommerceLayout breadcrumb={['FLASH SALES']}>
      <AdminDataTable
        columns={columns}
        data={sales}
        createLabel="Create"
        searchPlaceholder="Search..."
        onCreate={() => navigate('/admin/ecommerce/flash-sales/create')}
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceFlashSales;
