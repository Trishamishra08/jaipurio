import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiCopy, FiCheck } from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { DISCOUNTS, buildDiscountDetail } from '../../../data/discounts';

export const AdminEcommerceDiscounts = () => {
  const navigate = useNavigate();
  const [rows] = useState(DISCOUNTS);
  const [copiedId, setCopiedId] = useState(null);

  const copyCode = async (row) => {
    try {
      await navigator.clipboard.writeText(row.code);
      setCopiedId(row.id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const columns = useMemo(
    () => [
      { header: 'ID', accessor: 'id', width: '60px' },
      {
        header: 'Detail',
        accessor: 'code',
        cell: (row) => (
          <div className="space-y-1.5 py-0.5 max-w-md">
            {row.expired && (
              <span className="inline-block px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-600">
                Expired
              </span>
            )}
            {row.type === 'coupon' ? (
              <p className="text-xs text-slate-700">
                Coupon code:{' '}
                <span className="font-mono font-bold text-slate-900">{row.code}</span>{' '}
                <button
                  type="button"
                  onClick={() => copyCode(row)}
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                >
                  {copiedId === row.id ? <FiCheck size={11} /> : <FiCopy size={11} />}
                  {copiedId === row.id ? 'Copied' : 'Copy'}
                </button>
              </p>
            ) : (
              <p className="text-xs font-semibold text-slate-800">{row.title}</p>
            )}
            <p className="text-xs text-slate-600">{buildDiscountDetail(row)}</p>
            {row.type === 'coupon' && (
              <p className="text-[11px] text-slate-500">
                (Coupon code{' '}
                <strong className="font-semibold text-slate-700">
                  {row.canUseWithPromotion ? 'can' : 'cannot'}
                </strong>{' '}
                be used with promotion).
              </p>
            )}
          </div>
        ),
      },
      {
        header: 'Used',
        accessor: 'used',
        cell: (row) => <span className="font-semibold text-slate-800">{row.used}</span>,
      },
      { header: 'Start date', accessor: 'startDate' },
      {
        header: 'End date',
        accessor: 'endDate',
        cell: (row) => (row.neverExpired ? '—' : row.endDate),
      },
      {
        header: 'Store',
        accessor: 'store',
        cell: (row) => <span className="text-slate-500">{row.store || '—'}</span>,
      },
      {
        header: 'Operations',
        sortable: false,
        cell: (row) => (
          <div className="flex items-center gap-2">
            <Link
              to={`/admin/ecommerce/discounts/edit/${row.id}`}
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
    [copiedId]
  );

  return (
    <EcommerceLayout breadcrumb={['DISCOUNTS']}>
      <AdminDataTable
        columns={columns}
        data={rows}
        createLabel="Create"
        searchPlaceholder="Search..."
        showFilters={false}
        showExport={false}
        onCreate={() => navigate('/admin/ecommerce/discounts/create')}
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceDiscounts;
