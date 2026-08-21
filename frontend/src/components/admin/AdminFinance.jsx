import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiShoppingBag, FiCreditCard, FiArrowUpRight, FiMoreVertical, FiCalendar, FiClock as FiClockIcon, FiExternalLink, FiRefreshCw } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const AdminFinance = () => {
  const [data, setData] = useState({ stats: [], recentTransactions: [] });
  const [loading, setLoading] = useState(true);

  const fetchFinanceData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admins/finance-stats');
      setData(res.data.data);
    } catch (err) {
      console.error("Failed to fetch finance stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  const handleUpdateCommission = async (earningId, newRate) => {
    if (newRate < 0 || newRate > 100) return alert('Rate must be between 0 and 100');
    try {
      await api.patch(`/admins/finance/earnings/${earningId}/commission`, { commissionRate: Number(newRate) });
      fetchFinanceData();
    } catch (err) {
      alert("Failed to update commission rate");
    }
  };

  const totalRevenue = data.stats?.find(s => s._id === 'Completed')?.total || 0;
  const pendingRevenue = data.stats?.find(s => s._id === 'Pending')?.total || 0;
  
  const platformCommission = data.stats?.find(s => s._id === 'PlatformCommission')?.total || 0;
  const vendorPayouts = data.stats?.find(s => s._id === 'VendorPayout')?.total || 0;
  const platformShare = totalRevenue - vendorPayouts; // Admin's total share (direct sales + commissions)

  const financeStatsCards = [
    { title: 'Gross Revenue', value: `₹${totalRevenue.toLocaleString()}`, change: '+100%', icon: <FiDollarSign />, color: 'text-[#2E7D32]', bg: 'bg-[#E8F5E9]' },
    { title: 'Platform Share', value: `₹${platformShare.toLocaleString()}`, change: `Includes Comm.`, icon: <FiTrendingUp />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Vendor Payouts', value: `₹${vendorPayouts.toLocaleString()}`, change: 'Vendor Net', icon: <FiCreditCard />, color: 'text-[#F9A825]', bg: 'bg-[#FFF8E1]' },
    { title: 'Pending Dues', value: `₹${pendingRevenue.toLocaleString()}`, change: `${data.stats?.find(s => s._id === 'Pending')?.count || 0} items`, icon: <FiClockIcon />, color: 'text-[#C62828]', bg: 'bg-[#FFEBEE]' }
  ];

  if (loading) return <div className="h-96 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-admin-dark/20 animate-pulse">Synchronizing Ledgers...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-['Cormorant',_serif] font-bold text-admin-dark leading-none mb-1">
            Store Finance
          </h1>
          <p className="text-gray-500 text-[13px] font-poppins">Live Revenue & Transaction Audits</p>
        </div>
        <button onClick={fetchFinanceData} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-none border border-admin-accent/10 text-[8px] font-black uppercase tracking-widest shadow-sm hover:bg-admin-accent/[0.02] transition-colors active:scale-95">
          <FiRefreshCw /> REFRESH LEDGER
        </button>
      </div>

      {/* Finance Cards - Compact Style like Vendor Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {financeStatsCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: i * 0.1 }}
            className={`p-4 rounded-xl shadow-sm border border-white/50 flex flex-col justify-between ${stat.bg}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-wide mb-1 ${stat.color.replace('text-', 'text-opacity-80 text-')}`}>{stat.title}</p>
                <h3 className="text-lg font-medium text-gray-800 font-sans tracking-tight">{stat.value}</h3>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm ${stat.color}`}>
                {React.cloneElement(stat.icon, { size: 18 })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 relative overflow-hidden shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-['Cormorant',_serif] font-bold text-admin-dark leading-none mb-1">Audit Logs</h3>
            <p className="text-xs font-sans font-medium text-gray-500 capitalize tracking-normal">Financial split summary</p>
          </div>
          <div className="flex bg-admin-light/20 p-1 rounded-lg border border-admin-accent/5">
            <button className="px-3 py-1 bg-white text-admin-dark rounded-md text-xs font-medium shadow-sm">Live</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-widest text-gray-500">Txn ID</th>
                <th className="px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-widest text-gray-500">Vendor</th>
                <th className="px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-widest text-gray-500">Product</th>
                <th className="px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-widest text-gray-500">Gross Total</th>
                <th className="px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-widest text-gray-500">Platform Cut</th>
                <th className="px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-widest text-gray-500">Vendor Payout</th>
                <th className="px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-widest text-gray-500 text-right">Comm %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recentTransactions?.length > 0 ? (
                data.recentTransactions.map((tr) => (
                  <tr key={tr._id} className="hover:bg-admin-accent/[0.02] transition-colors group">
                    <td className="px-3 py-2 text-xs font-sans font-medium text-admin-dark uppercase">#{tr.orderId}</td>
                    <td className="px-3 py-2 text-xs font-sans font-medium text-gray-700">{tr.vendorName}</td>
                    <td className="px-3 py-2 text-xs font-sans font-medium text-gray-600 truncate max-w-[120px]" title={tr.productName}>{tr.productName}</td>
                    <td className="px-3 py-2 text-xs font-sans font-bold text-gray-900">₹{tr.totalAmount}</td>
                    <td className="px-3 py-2 text-xs font-sans font-medium text-blue-600">₹{tr.platformShare || 0}</td>
                    <td className="px-3 py-2 text-xs font-sans font-medium text-orange-600">₹{tr.vendorShare || 0}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {tr.isEditable ? (
                          <>
                            <input 
                              type="number" 
                              min="0" max="100"
                              defaultValue={tr.commissionRate}
                              className="w-12 px-1 py-1 border rounded text-xs text-center outline-none focus:border-admin-accent/50"
                              onBlur={(e) => {
                                if (Number(e.target.value) !== tr.commissionRate) {
                                  handleUpdateCommission(tr._id, e.target.value);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.target.blur();
                                }
                              }}
                            />
                            <span className="text-[10px] font-bold text-gray-400">%</span>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-gray-400">N/A</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-gray-400 text-sm font-sans font-medium tracking-wider capitalize italic">No Transactions Logged</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminFinance;
