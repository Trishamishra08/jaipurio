import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar,
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiPercent,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import EcommerceLayout from '../ecommerce/EcommerceLayout';
import AdminDataTable from '../ecommerce/AdminDataTable';
import { fetchMarketplaceReports } from '../../../utils/marketplaceAdminApi';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}.0`;

export default function AdminMarketplaceReports() {
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    vendorEarnings: 0,
    platformCommission: 0,
    storesCount: 0,
    vendorsCount: 0,
    approvedVendors: 0,
    pendingVendors: 0,
    paidOrders: 0,
    productsAcrossStores: 0,
  });
  const [topStores, setTopStores] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [recentStores, setRecentStores] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMarketplaceReports();
        if (data?.summary) setSummary(data.summary);
        if (Array.isArray(data?.topStores)) setTopStores(data.topStores);
        if (Array.isArray(data?.salesTrend)) setSalesTrend(data.salesTrend);
        if (Array.isArray(data?.recentStores)) {
          setRecentStores(
            data.recentStores.map((s) => ({
              ...s,
              createdAt: s.createdAt ? String(s.createdAt).slice(0, 10) : '',
            }))
          );
        }
      } catch {
        /* keep empty */
      }
    })();
  }, []);

  const topColumns = [
    { header: 'ID', accessor: 'id', width: '60px' },
    {
      header: 'Store',
      accessor: 'name',
      cell: (row) => (
        <Link
          to={`/admin/marketplaces/stores/edit/${row.id}`}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    {
      header: 'Earnings',
      accessor: 'earnings',
      cell: (row) => <span className="text-xs font-medium">{fmt(row.earnings)}</span>,
    },
    { header: 'Products', accessor: 'productsCount' },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {row.status}
        </span>
      ),
    },
  ];

  const recentColumns = [
    { header: 'ID', accessor: 'id', width: '60px' },
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <Link
          to={`/admin/marketplaces/stores/edit/${row.id}`}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    {
      header: 'Earnings',
      accessor: 'earnings',
      cell: (row) => <span className="text-xs">{fmt(row.earnings)}</span>,
    },
    { header: 'Created At', accessor: 'createdAt' },
    { header: 'Status', accessor: 'status' },
  ];

  return (
    <EcommerceLayout breadcrumb={['MARKETPLACE', 'REPORTS']}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-3 rounded-md border border-slate-200">
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 bg-slate-50"
        >
          <FiCalendar size={14} className="text-slate-500" />
          Marketplace performance
        </button>
        <Link
          to="/admin/marketplaces/stores"
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          Manage stores →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Gross revenue</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{fmt(summary.totalRevenue)}</div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <FiDollarSign size={12} />
            {summary.paidOrders || 0} paid orders
          </div>
        </div>
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Vendor earnings</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{fmt(summary.vendorEarnings)}</div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <FiShoppingBag size={12} />
            Across {summary.storesCount || 0} stores
          </div>
        </div>
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Platform commission</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {fmt(summary.platformCommission)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <FiPercent size={12} />
            Est. 10% of vendor earnings
          </div>
        </div>
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Vendors</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{summary.vendorsCount || 0}</div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <FiUsers size={12} />
            {summary.approvedVendors || 0} approved · {summary.pendingVendors || 0} pending
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">Sales trend</h3>
            <FiShoppingBag className="text-slate-400" size={16} />
          </div>
          <div className="h-56">
            {salesTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend}>
                  <defs>
                    <linearGradient id="mktSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#2563eb"
                    fill="url(#mktSales)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No sales data yet
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">Top stores by earnings</h3>
            <FiShoppingBag className="text-slate-400" size={16} />
          </div>
          <div className="h-56">
            {topStores.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="earnings" fill="#0f172a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No store earnings yet
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-800 mb-2">Top performing stores</h3>
        <AdminDataTable
          columns={topColumns}
          data={topStores}
          showCreate={false}
          showExport={false}
          showBulkActions={false}
          showFilters={false}
          showReload={false}
          emptyMessage="No stores to report"
        />
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-2">Recently added stores</h3>
        <AdminDataTable
          columns={recentColumns}
          data={recentStores}
          showCreate={false}
          showExport={false}
          showBulkActions={false}
          showFilters={false}
          showReload={false}
          emptyMessage="No recent stores"
        />
      </div>
    </EcommerceLayout>
  );
}
