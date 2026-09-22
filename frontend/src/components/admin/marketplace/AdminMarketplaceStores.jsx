import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import EcommerceLayout from '../ecommerce/EcommerceLayout';
import AdminDataTable from '../ecommerce/AdminDataTable';
import {
  deleteMarketplaceStore,
  fetchMarketplaceStores,
  syncMarketplaceStoresFromVendors,
} from '../../../utils/marketplaceAdminApi';

const statusClass = (status) => {
  if (status === 'Published') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Pending') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'Blocked') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
};

const fallbackStores = [
  {
    id: '9',
    _id: '9',
    name: 'Caz',
    logo: '/jaipurio_logo.png',
    earnings: 0,
    productsCount: 0,
    vendorDisplay: 'Caz',
    createdAt: '2024-10-07',
    status: 'Published',
  },
];

export default function AdminMarketplaceStores() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(fallbackStores);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      let list = await fetchMarketplaceStores();
      if (!list.length) {
        try {
          await syncMarketplaceStoresFromVendors();
          list = await fetchMarketplaceStores();
        } catch {
          /* keep list */
        }
      }
      if (list.length) {
        setRows(
          list.map((s) => ({
            ...s,
            id: String(s.legacyId ?? s.id ?? s._id),
            vendorDisplay: s.vendorDisplay || s.vendorName || s.vendor?.storeName || '—',
            createdAt: s.createdAt ? String(s.createdAt).slice(0, 10) : '',
          }))
        );
      }
    } catch {
      /* fallback */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete store "${row.name}"?`)) return;
    try {
      await deleteMarketplaceStore(row._id || row.id);
      setRows((prev) => prev.filter((r) => String(r.id) !== String(row.id)));
    } catch (err) {
      window.alert(err?.parsedMessage || err?.message || 'Delete failed');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px' },
    {
      header: 'Logo',
      accessor: 'logo',
      width: '70px',
      sortable: false,
      cell: (row) => (
        <div className="w-10 h-10 rounded-md border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
          {row.logo ? (
            <img src={row.logo} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] text-slate-400">N/A</span>
          )}
        </div>
      ),
    },
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <Link
          to={`/admin/marketplaces/stores/edit/${row.id}`}
          className="text-xs font-semibold text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.name}
        </Link>
      ),
    },
    {
      header: 'Earnings',
      accessor: 'earnings',
      cell: (row) => (
        <span className="text-xs font-medium text-slate-700">
          ₹{Number(row.earnings || 0).toLocaleString('en-IN')}.0
        </span>
      ),
    },
    {
      header: 'Products Count',
      accessor: 'productsCount',
      cell: (row) => <span className="text-xs font-medium">{row.productsCount ?? 0}</span>,
    },
    {
      header: 'Vendor',
      accessor: 'vendorDisplay',
      cell: (row) => (
        <span className="text-xs text-blue-600 font-medium">{row.vendorDisplay || '—'}</span>
      ),
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
          {row.status || 'Published'}
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
            title="View"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/marketplaces/stores/edit/${row.id}`);
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
              navigate(`/admin/marketplaces/stores/edit/${row.id}`);
            }}
            className="w-7 h-7 rounded-md bg-slate-800 text-white flex items-center justify-center hover:bg-black"
          >
            <FiEdit2 size={13} />
          </button>
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
    <EcommerceLayout breadcrumb={['MARKETPLACE', 'STORES']}>
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading stores…</div>
      ) : (
        <AdminDataTable
          columns={columns}
          data={rows}
          searchPlaceholder="Search..."
          createLabel="Create"
          onCreate={() => navigate('/admin/marketplaces/stores/create')}
          onReload={load}
          onRowClick={(row) => navigate(`/admin/marketplaces/stores/edit/${row.id}`)}
        />
      )}
    </EcommerceLayout>
  );
}
