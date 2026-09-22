import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import EcommerceLayout from '../ecommerce/EcommerceLayout';
import AdminDataTable from '../ecommerce/AdminDataTable';
import {
  advancePayout,
  deletePayout,
  fetchPayouts,
  updatePayout,
} from '../../../utils/marketplaceApi';

const statusClass = (status) => {
  const s = String(status || '');
  if (s === 'Completed' || s === 'Settled') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'Processing' || s === 'Approved' || s === 'Sent to bank') {
    return 'bg-sky-50 text-sky-700 border-sky-200';
  }
  if (s === 'Pending' || s === 'Pending approval') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (s === 'Refused' || s === 'Rejected') return 'bg-slate-100 text-slate-600 border-slate-200';
  if (s === 'Canceled') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}.0`;

export default function AdminMarketplaceWithdrawals() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await fetchPayouts();
      setRows(
        (Array.isArray(list) ? list : []).map((row) => ({
          ...row,
          id: String(row.id || row.legacyId || row.payoutNumber || row._id),
          vendorDisplay: row.vendorName || row.vendor || '—',
        }))
      );
    } catch (err) {
      setRows([]);
      setError(err?.parsedMessage || err?.message || 'Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete withdrawal #${row.id}?`)) return;
    try {
      await deletePayout(row._id || row.id);
      setRows((prev) => prev.filter((r) => String(r.id) !== String(row.id)));
    } catch (err) {
      window.alert(err?.parsedMessage || err?.message || 'Delete failed');
    }
  };

  const handleAdvance = async (row) => {
    try {
      const saved = await advancePayout(row);
      setRows((prev) =>
        prev.map((r) =>
          String(r.id) === String(row.id) || String(r._id) === String(row._id)
            ? { ...r, ...saved, vendorDisplay: saved.vendorName || saved.vendor || r.vendorDisplay }
            : r
        )
      );
    } catch (err) {
      window.alert(err?.parsedMessage || err?.message || 'Update failed');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id', width: '70px' },
    {
      header: 'Vendor',
      accessor: 'vendorDisplay',
      cell: (row) => (
        <span className="text-xs font-semibold text-blue-600">{row.vendorDisplay}</span>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
      cell: (row) => <span className="text-xs font-medium text-slate-800">{fmt(row.amount)}</span>,
    },
    {
      header: 'Fee',
      accessor: 'fee',
      cell: (row) => <span className="text-xs text-slate-600">{fmt(row.fee)}</span>,
    },
    { header: 'Created At', accessor: 'createdAt' },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusClass(
            row.status
          )}`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: 'Operations',
      accessor: 'ops',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="View / Edit"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/marketplaces/withdrawals/edit/${row.id}`);
            }}
            className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
          >
            <FiEye size={13} />
          </button>
          <button
            type="button"
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/marketplaces/withdrawals/edit/${row.id}`);
            }}
            className="w-7 h-7 rounded-md bg-slate-800 text-white flex items-center justify-center hover:bg-black"
          >
            <FiEdit2 size={13} />
          </button>
          {(row.status === 'Pending' || row.status === 'Pending approval') && (
            <button
              type="button"
              title="Approve"
              onClick={(e) => {
                e.stopPropagation();
                handleAdvance(row);
              }}
              className="px-2 h-7 rounded-md bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700"
            >
              Approve
            </button>
          )}
          <button
            type="button"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            className="w-7 h-7 rounded-md bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700"
          >
            <FiTrash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <EcommerceLayout breadcrumb={['MARKETPLACE', 'WITHDRAWALS']}>
      {error ? (
        <div className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2">
          {error}
        </div>
      ) : null}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading withdrawals…</div>
      ) : (
        <AdminDataTable
          columns={columns}
          data={rows}
          searchPlaceholder="Search..."
          showCreate={false}
          onReload={load}
          emptyMessage="No data to display"
          bulkStatusOptions={['Pending', 'Processing', 'Completed', 'Canceled', 'Refused']}
          onBulkStatusChange={async (items, status) => {
            await Promise.all(
              items.map((item) => updatePayout(item._id || item.id, { status }))
            );
            await load();
          }}
          onBulkDelete={async (items) => {
            await Promise.all(items.map((item) => deletePayout(item._id || item.id)));
            await load();
          }}
          onRowClick={(row) => navigate(`/admin/marketplaces/withdrawals/edit/${row.id}`)}
        />
      )}
      <div className="mt-3 text-[11px] text-slate-400">
        Tip: vendors request payouts from their dashboard; they appear here for review. Also see{' '}
        <Link to="/admin/marketplaces/stores" className="text-blue-600 hover:underline">
          Stores
        </Link>
        .
      </div>
    </EcommerceLayout>
  );
}
