import React from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingBag,
  Users,
  Star,
  ArrowUpRight,
  Package,
  PlusCircle,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';

const VendorHome = () => {
  const { products, orders } = useShop();

  const stats = [
    {
      label: 'Total Sales',
      value: '₹1,48,920',
      hint: '+18.4% this month',
      tone: 'bg-[#F3EDE6] text-[#6F241D]',
      icon: IndianRupee,
    },
    {
      label: 'Total Orders',
      value: String(orders?.length || 342),
      hint: '12 pending shipment',
      tone: 'bg-[#EAF0F8] text-[#1E3A5F]',
      icon: ShoppingBag,
    },
    {
      label: 'Customers',
      value: '1,284',
      hint: '+42 new this week',
      tone: 'bg-[#F0EAF6] text-[#4A2F6A]',
      icon: Users,
    },
    {
      label: 'Store Rating',
      value: '4.9 ★',
      hint: '340 verified reviews',
      tone: 'bg-[#EEF5EA] text-[#2F4A2F]',
      icon: Star,
    },
  ];

  const recentOrders = [
    { id: 'ORD-JM-8921', customer: 'Priya Sharma', date: '19 Aug', amount: '₹897', status: 'In Transit' },
    { id: 'ORD-JM-8910', customer: 'Aman Verma', date: '18 Aug', amount: '₹1,249', status: 'Confirmed' },
    { id: 'ORD-JM-8898', customer: 'Neha Gupta', date: '17 Aug', amount: '₹399', status: 'Delivered' },
    { id: 'ORD-JM-8882', customer: 'Rohit Singh', date: '16 Aug', amount: '₹2,150', status: 'Packed' },
  ];

  const topProducts = (products || []).slice(0, 4);

  return (
    <div className="space-y-5 font-dm">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-playfair text-2xl font-semibold text-[#3F261B]">Artisan Dashboard</h1>
          <p className="text-xs text-[#806653] mt-0.5">
            Monitor mitti sales, inventory, and workshop orders.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/vendor/add-product"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#6F241D] text-white text-[12px] font-semibold"
          >
            <PlusCircle size={14} /> Add Craft
          </Link>
          <Link
            to="/vendor/products"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E2D9] text-[#3F261B] text-[12px] font-semibold bg-white"
          >
            <Package size={14} /> Products
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-[#E8E2D9] rounded-xl p-3.5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9A8B7A]">
                  {s.label}
                </p>
                <p className="font-playfair text-xl font-semibold text-[#3F261B] mt-1">{s.value}</p>
                <p className="text-[10px] text-[#354B35] font-medium flex items-center gap-0.5 mt-1">
                  <ArrowUpRight size={11} /> {s.hint}
                </p>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.tone}`}>
                <s.icon size={16} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-white border border-[#E8E2D9] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-dm text-[13px] font-semibold text-[#3F261B]">Recent Orders</h2>
            <Link to="/vendor/orders" className="text-[11px] font-semibold text-[#6F241D]">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-[#9A8B7A] border-b border-[#F0EBE4]">
                  <th className="pb-2 font-medium">Order</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium hidden sm:table-cell">Date</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-[#F7F3EE] last:border-0">
                    <td className="py-2.5 font-semibold text-[#3F261B]">{o.id}</td>
                    <td className="py-2.5 text-[#5B4638]">{o.customer}</td>
                    <td className="py-2.5 text-[#806653] hidden sm:table-cell">{o.date}</td>
                    <td className="py-2.5 font-semibold text-[#3F261B]">{o.amount}</td>
                    <td className="py-2.5">
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-[#F3EDE6] text-[#6F241D] text-[10px] font-semibold">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-white border border-[#E8E2D9] rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9A8B7A]">
              Available Balance
            </p>
            <p className="font-playfair text-2xl font-semibold text-[#3F261B] mt-1">₹42,680</p>
            <p className="text-[10px] text-[#806653] mt-1">Next payout window: Fri</p>
            <Link
              to="/vendor/payouts"
              className="mt-3 inline-flex w-full justify-center py-2 rounded-xl bg-[#6F241D] text-white text-[12px] font-semibold"
            >
              Request Payout
            </Link>
          </div>

          <div className="bg-white border border-[#E8E2D9] rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-dm text-[13px] font-semibold text-[#3F261B]">Top Selling</h2>
              <Link to="/vendor/products" className="text-[11px] font-semibold text-[#6F241D]">
                Catalog
              </Link>
            </div>
            <ul className="space-y-2">
              {topProducts.length === 0 && (
                <li className="text-[11px] text-[#806653]">No products yet — add your first craft.</li>
              )}
              {topProducts.map((p) => (
                <li key={p._id} className="flex items-center gap-2">
                  <img
                    src={p.image}
                    alt=""
                    className="w-9 h-9 rounded-lg object-cover border border-[#EFEAE3]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-[#3F261B] truncate">{p.name}</p>
                    <p className="text-[10px] text-[#806653]">₹{p.price}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorHome;
