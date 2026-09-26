import React, { useCallback, useEffect, useState } from 'react';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { fetchIncompleteOrders } from '../../../utils/orderApi';

export const AdminEcommerceIncompleteOrders = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await fetchIncompleteOrders();
      setData(rows);
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to load incomplete orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { header: 'Code', accessor: 'code', width: '110px', cell: (row) => <span className="font-bold text-slate-800">{row.code}</span> },
    {
      header: 'Customer',
      accessor: 'customer',
      cell: (row) => (
        <span className={row.customer !== 'Guest' ? 'font-medium text-slate-800' : 'text-slate-400'}>
          {row.customer}
        </span>
      )
    },
    { header: 'Amount', accessor: 'amount', cell: (row) => <span className="font-bold text-slate-800">{row.amount}</span> },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
          {row.status}
        </span>
      )
    },
    { header: 'Created At', accessor: 'createdAt', cell: (row) => <span>{new Date(row.createdAt).toLocaleDateString('en-IN')}</span> },
  ];

  return (
    <EcommerceLayout breadcrumb={['ORDERS', 'INCOMPLETE ORDERS']}>
      {loadError && (
        <div className="mb-3 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {loadError}
        </div>
      )}
      <AdminDataTable
        columns={columns}
        data={data}
        searchPlaceholder="Search incomplete orders..."
        showCreate={false}
        showReload
        onReload={load}
      />
      {loading && <div className="text-center text-xs text-slate-400 py-4">Loading…</div>}
    </EcommerceLayout>
  );
};

export default AdminEcommerceIncompleteOrders;
