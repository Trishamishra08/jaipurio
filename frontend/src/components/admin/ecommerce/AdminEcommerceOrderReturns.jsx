import React, { useCallback, useEffect, useState } from 'react';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { fetchReturns, advanceReturn, rejectReturn } from '../../../utils/orderApi';

export const AdminEcommerceOrderReturns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await fetchReturns();
      setReturns(rows);
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to load returns.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdvance = async (row) => {
    setBusyId(row._id);
    try {
      await advanceReturn(row._id);
      await load();
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to advance return.');
    } finally {
      setBusyId('');
    }
  };

  const handleReject = async (row) => {
    const note = window.prompt('Rejection note (optional):', '') || '';
    setBusyId(row._id);
    try {
      await rejectReturn(row._id, note);
      await load();
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to reject return.');
    } finally {
      setBusyId('');
    }
  };

  const columns = [
    { header: 'RMA', accessor: 'id', width: '90px' },
    { header: 'Order', accessor: 'orderId', cell: (row) => <span className="text-blue-600 font-semibold">{row.orderId}</span> },
    { header: 'Customer', accessor: 'customer', cell: (row) => <span className="font-medium text-slate-800">{row.customer}</span> },
    { header: 'Return reason', accessor: 'reason' },
    { header: 'Photos', accessor: 'photos' },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
          row.status === 'Payment status: Refunded' || row.status === 'Commission reversed'
            ? 'bg-emerald-100 text-emerald-700'
            : row.status?.startsWith('Rejected')
              ? 'bg-rose-100 text-rose-700'
              : 'bg-amber-100 text-amber-700'
        }`}>
          {row.status}
        </span>
      )
    },
    { header: 'Created At', accessor: 'createdAt' },
    {
      header: 'Operations',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={busyId === row._id || row.status === 'Commission reversed' || row.status?.startsWith('Rejected')}
            onClick={(e) => { e.stopPropagation(); handleAdvance(row); }}
            className="text-blue-600 hover:underline text-[11px] font-medium disabled:opacity-40"
          >
            Advance
          </button>
          <button
            type="button"
            disabled={busyId === row._id || row.status?.startsWith('Rejected')}
            onClick={(e) => { e.stopPropagation(); handleReject(row); }}
            className="text-red-500 hover:underline text-[11px] font-medium disabled:opacity-40"
          >
            Reject
          </button>
        </div>
      )
    }
  ];

  return (
    <EcommerceLayout breadcrumb={['ORDER RETURNS']}>
      {loadError && (
        <div className="mb-3 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {loadError}
        </div>
      )}
      <AdminDataTable
        columns={columns}
        data={returns}
        showCreate={false}
        showReload
        onReload={load}
        searchPlaceholder="Search returns..."
      />
      {loading && <div className="text-center text-xs text-slate-400 py-4">Loading…</div>}
    </EcommerceLayout>
  );
};

export default AdminEcommerceOrderReturns;
