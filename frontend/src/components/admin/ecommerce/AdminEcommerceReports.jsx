import React, { useState } from 'react';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import {
  FiCalendar,
  FiTrendingUp,
  FiShoppingBag,
  FiUsers,
  FiDollarSign,
  FiBox,
  FiArrowUpRight,
  FiCheckCircle,
  FiClock
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';

const salesData = [
  { date: '14 Aug', sales: 0, orders: 0 },
  { date: '16 Aug', sales: 0, orders: 1 },
  { date: '18 Aug', sales: 0, orders: 0 },
  { date: '20 Aug', sales: 0, orders: 0 },
  { date: '22 Aug', sales: 0, orders: 1 },
  { date: '24 Aug', sales: 0, orders: 0 },
  { date: '26 Aug', sales: 0, orders: 0 },
  { date: '28 Aug', sales: 0, orders: 0 },
  { date: '30 Aug', sales: 0, orders: 0 },
  { date: '01 Sep', sales: 0, orders: 2 },
  { date: '03 Sep', sales: 0, orders: 1 },
  { date: '05 Sep', sales: 0, orders: 2 },
  { date: '07 Sep', sales: 0, orders: 0 },
  { date: '09 Sep', sales: 0, orders: 0 },
  { date: '11 Sep', sales: 0, orders: 1 },
];

const customerGrowthData = [
  { date: '01 Sep', customers: 1 },
  { date: '02 Sep', customers: 2 },
  { date: '05 Sep', customers: 4 },
  { date: '06 Sep', customers: 5 },
  { date: '11 Sep', customers: 7 },
];

const trendingProducts = [
  { id: '860', name: 'Shakha with Blue Chudiyan | Traditional Bengali Jewelry Set', views: 249 },
  { id: '7463', name: 'Pure Brass Standing Trishul Carved - Sacred Shiva Trident Temple Art | Jaipurio', views: 216 },
  { id: '7872', name: 'Surya Marble Mandir Hexa - Buy Compact Hexagonal Sun Temple Online | Jaipurio', views: 188 },
  { id: '1265', name: 'Rajasthani Bur Bangles | Traditional Lac Chudiya | Heritage Design | Ethnic Craft', views: 183 },
  { id: '7431', name: 'Pure Brass Standing Nandi 14" Fully Engraved - Sacred Temple Sculpture | Jaipurio', views: 174 },
  { id: '7878', name: 'White Marble Tulsi Pot 33 Inch - Buy Premium Handcrafted Sacred Kyara | Jaipurio', views: 168 },
  { id: '5184', name: "Personalized Premium Men's Classic Taupe Breeches - Buy Custom Riding Pants", views: 168 },
  { id: '5992', name: 'Lehariya Kesariya Traditional Safa - Buy Premium Wave Pattern Groom Headgear', views: 166 },
  { id: '5983', name: 'Golden Check Silk Safa Opulent Turban Men - Luxury Rajasthani Pagri', views: 166 },
  { id: '7559', name: 'Brass Radha Krishna Arch Idol 4.5 Inches - Temple Grade Divine Love Murti', views: 165 },
];

const AdminEcommerceReports = () => {
  const [dateRange, setDateRange] = useState('From 2026-08-14 to 2026-09-12');

  return (
    <EcommerceLayout breadcrumb={['REPORT']}>
      {/* Top filter date bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-3 rounded-md border border-slate-200">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100">
            <FiCalendar size={14} className="text-slate-500" />
            <span>{dateRange}</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Revenue</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">₹0.0</div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <FiDollarSign size={12} />
            <span>0% from last month</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Products</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">0</div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <FiBox size={12} />
            <span>Active catalog items</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Customers</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">7</div>
          <div className="mt-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <FiArrowUpRight size={12} />
            <span>7 increase</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Orders</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">0</div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <FiShoppingBag size={12} />
            <span>Completed orders</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Customers Growth */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <h4 className="text-sm font-semibold text-slate-800 mb-4">Customers</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={customerGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Area type="monotone" dataKey="customers" stroke="#3b82f6" fill="#93c5fd" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Bar Chart */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <h4 className="text-sm font-semibold text-slate-800 mb-4">Orders</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sales Reports & Earnings Breakdown */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs mb-6">
        <h4 className="text-sm font-semibold text-slate-800 mb-4">Sales Reports</h4>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col justify-center border-l border-slate-100 pl-6 space-y-4 text-xs">
            <div>
              <div className="text-slate-400">Total Earnings</div>
              <div className="text-2xl font-bold text-slate-800">₹0.0</div>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <FiCheckCircle className="text-emerald-500" /> Completed
              </span>
              <span className="font-semibold text-slate-700">₹0.0</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <FiClock className="text-amber-500" /> Pending
              </span>
              <span className="font-semibold text-slate-700">₹0.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Products & Recent Orders Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div>
          <h4 className="text-sm font-semibold text-slate-800 mb-3">Recent Orders</h4>
          <AdminDataTable
            showCreate={false}
            showExport={false}
            showReload={false}
            showBulkActions={false}
            columns={[
              { header: 'ID', accessor: 'id' },
              { header: 'Customer', accessor: 'customer' },
              { header: 'Amount', accessor: 'amount' },
              { header: 'Payment status', accessor: 'paymentStatus' },
              { header: 'Status', accessor: 'status' },
              { header: 'Created At', accessor: 'createdAt' },
            ]}
            data={[]}
            emptyMessage="No data to display"
          />
        </div>

        {/* Trending Products */}
        <div>
          <h4 className="text-sm font-semibold text-slate-800 mb-3">Trending Products</h4>
          <AdminDataTable
            showCreate={false}
            showExport={false}
            showReload={false}
            showBulkActions={false}
            columns={[
              { header: 'ID', accessor: 'id', width: '60px' },
              { 
                header: 'Product name', 
                accessor: 'name',
                cell: (row) => (
                  <a href={`/product/${row.id}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium line-clamp-1">
                    {row.name}
                  </a>
                )
              },
              { 
                header: 'Views', 
                accessor: 'views', 
                width: '70px',
                cell: (row) => <span className="font-semibold text-slate-800">{row.views}</span>
              },
            ]}
            data={trendingProducts}
          />
        </div>
      </div>
    </EcommerceLayout>
  );
};

export default AdminEcommerceReports;
