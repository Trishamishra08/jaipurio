import React, { useState, useEffect } from 'react';
import { CreditCard, History, ArrowRightCircle } from 'lucide-react';
import api from '../../utils/api';

const VendorPayouts = () => {
  const [data, setData] = useState({
    pendingBalance: 0,
    clearedBalance: 0,
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarningsData = async () => {
      try {
        const res = await api.get('/vendors/earnings');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch payout data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarningsData();
  }, []);

  if (loading) return <div className="h-96 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 animate-pulse">Loading Payouts...</div>;

  return (
    <div className="space-y-4 pb-6 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 leading-tight">Payouts</h1>
          <p className="text-[12px] text-gray-500 mt-0.5 font-sans">Manage your withdrawable balance and payout history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-[#054425] text-white p-5 rounded-xl shadow-md relative overflow-hidden flex flex-col justify-between h-48">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
           <div>
             <p className="text-white/70 text-[11px] font-bold mb-1 uppercase tracking-wide">Pending Balance</p>
             <h2 className="text-3xl font-medium font-sans tracking-tight">₹{data.pendingBalance.toLocaleString()}</h2>
             <p className="text-white/60 text-[10px] mt-2">Total Cleared: ₹{data.clearedBalance.toLocaleString()}</p>
           </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 text-[13px] flex items-center gap-2"><History size={16} className="text-gray-400" /> Payout History</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Transaction ID / Order</th>
                  <th className="px-4 py-3 font-semibold">Net Earning</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-800">
                {data.recentTransactions.length > 0 ? (
                  data.recentTransactions.map((tx, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 font-medium">{tx.date}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {tx.orderId}
                        <div className="text-[10px] text-gray-400 mt-0.5">{tx.productName.substring(0, 30)}...</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-green-700">₹{tx.netEarning.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          tx.status === 'Cleared' ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]' : 'bg-[#FFF8E1] text-[#F9A825] border border-[#FFECB3]'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                   <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-400 text-xs italic">No transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPayouts;
