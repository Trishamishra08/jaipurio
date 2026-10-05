import React, { useCallback, useEffect, useState } from 'react';
import AdminPageHeader from './AdminPageHeader';
import { AdminDataTable } from './ecommerce/AdminDataTable';
import api from '../../utils/api';

const TYPE_BADGE = {
  Payment: 'bg-blue-100 text-blue-700',
  'Vendor Payout': 'bg-purple-100 text-purple-700',
  'Affiliate Payout': 'bg-amber-100 text-amber-700',
};

const AdminTransactionLedger = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await api.get('/ledger');
      setRows(res.data?.data || []);
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to load ledger.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = typeFilter ? rows.filter((r) => r.type === typeFilter) : rows;

  const columns = [
    {
      header: 'Type',
      accessor: 'type',
      cell: (row) => <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${TYPE_BADGE[row.type] || 'bg-slate-100 text-slate-600'}`}>{row.type}</span>,
    },
    { header: 'Reference', accessor: 'reference' },
    { header: 'Party', accessor: 'party' },
    { header: 'Amount', accessor: 'amount', cell: (row) => <span>₹{Number(row.amount || 0).toLocaleString('en-IN')}</span> },
    { header: 'Status', accessor: 'status', cell: (row) => <span className="text-slate-600">{row.status}</span> },
    { header: 'Date', accessor: 'createdAt', cell: (row) => <span>{row.createdAt ? new Date(row.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'}</span> },
  ];

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Transaction Ledger" hideAction />
      <div className="flex gap-2">
        {['', 'Payment', 'Vendor Payout', 'Affiliate Payout'].map((t) => (
          <button
            key={t || 'all'}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${typeFilter === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
          >
            {t || 'All'}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="text-sm text-slate-400 py-8 text-center">Loading…</p>
      ) : loadError ? (
        <p className="text-sm text-red-600 py-8 text-center">{loadError}</p>
      ) : (
        <AdminDataTable title="Ledger" columns={columns} data={filtered} onReload={load} showCreate={false} showExport={false} showBulkActions={false} />
      )}
    </div>
  );
};

export default AdminTransactionLedger;
