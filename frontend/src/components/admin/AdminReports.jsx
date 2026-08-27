import React, { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AdminPageHeader from './AdminPageHeader';
import { useShop } from '../../context/ShopContext';

const AdminReports = () => {
  const { products, orders, vendors, reviews } = useShop();

  const chartData = [
    { name: 'Mar', sales: 42000 },
    { name: 'Apr', sales: 51000 },
    { name: 'May', sales: 46800 },
    { name: 'Jun', sales: 61200 },
    { name: 'Jul', sales: 58000 },
    { name: 'Aug', sales: 72450 },
  ];

  const cards = useMemo(
    () => [
      { label: 'Revenue', value: '₹72,450' },
      { label: 'Orders', value: String(orders?.length || 0) },
      { label: 'Products', value: String(products?.length || 0) },
      { label: 'Stores', value: String(vendors?.length || 0) },
      { label: 'Reviews', value: String(reviews?.length || 0) },
    ],
    [orders, products, vendors, reviews]
  );

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Reports" hideAction />
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="admin-card p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">{card.label}</div>
            <div className="text-xl font-semibold mt-1">{card.value}</div>
          </div>
        ))}
      </div>
      <div className="admin-card p-4">
        <h2 className="text-sm font-semibold mb-4">Sales this year</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#206bc4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#206bc4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eef5" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="sales" stroke="#206bc4" fill="url(#salesFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
