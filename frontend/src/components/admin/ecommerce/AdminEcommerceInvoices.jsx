import React, { useCallback, useEffect, useState } from 'react';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { ecommerceList, syncEcommerceInvoices } from '../../../utils/ecommerceApi';

const formatMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;

export const AdminEcommerceInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await ecommerceList('invoices');
      setInvoices(rows);
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    setLoadError('');
    try {
      await syncEcommerceInvoices();
      await load();
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to generate invoices.');
    } finally {
      setSyncing(false);
    }
  };

  const columns = [
    { header: 'Invoice #', accessor: 'invoiceNumber', width: '140px', cell: (row) => <span className="font-semibold text-slate-800">{row.invoiceNumber}</span> },
    { header: 'Order', accessor: 'orderNumber', cell: (row) => <span className="text-blue-600">{row.orderNumber}</span> },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Amount', accessor: 'amount', cell: (row) => <span className="font-bold text-slate-800">{formatMoney(row.amount)}</span> },
    { header: 'Tax', accessor: 'tax', cell: (row) => <span>{formatMoney(row.tax)}</span> },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
          row.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
        }`}>
          {row.status}
        </span>
      )
    },
    { header: 'Issue Date', accessor: 'issuedAt', cell: (row) => <span>{row.issuedAt ? new Date(row.issuedAt).toLocaleDateString('en-IN') : '—'}</span> },
  ];

  return (
    <EcommerceLayout breadcrumb={['INVOICES']}>
      {loadError && (
        <div className="mb-3 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {loadError}
        </div>
      )}
      <AdminDataTable
        columns={columns}
        data={invoices}
        createLabel={syncing ? 'Generating…' : 'Generate invoices from orders'}
        onCreate={handleSync}
        showReload
        onReload={load}
        searchPlaceholder="Search invoices..."
      />
      {loading && <div className="text-center text-xs text-slate-400 py-4">Loading…</div>}
    </EcommerceLayout>
  );
};

export default AdminEcommerceInvoices;
