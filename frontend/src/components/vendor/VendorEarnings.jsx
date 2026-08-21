import React, { useState, useEffect } from 'react';
import { IndianRupee, CreditCard, TrendingUp, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const VendorEarnings = () => {
  const [data, setData] = useState({
    todayEarning: 0,
    weeklyEarning: 0,
    monthlyEarning: 0,
    totalCommission: 0,
    chartData: [],
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await api.get('/vendors/earnings');
        setData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch earnings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  if (loading) return <div className="h-96 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 animate-pulse">Loading Earnings...</div>;

  return (
    <div className="space-y-4 pb-6 max-w-[1400px] mx-auto -mt-2">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 leading-tight">Earnings & Revenue</h1>
          <p className="text-[12px] text-gray-500 mt-0.5 font-sans">Track your sales revenue and platform commissions.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[12px] font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
          <Download size={14} /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Today's Earnings", value: `₹${data.todayEarning.toLocaleString()}`, icon: IndianRupee, color: 'text-[#2E7D32]', bg: 'bg-[#E8F5E9]' },
          { title: 'Weekly Earnings', value: `₹${data.weeklyEarning.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Monthly Earnings', value: `₹${data.monthlyEarning.toLocaleString()}`, icon: CreditCard, color: 'text-[#F9A825]', bg: 'bg-[#FFF8E1]' },
          { title: 'Commission (15%)', value: `₹${data.totalCommission.toLocaleString()}`, icon: TrendingUp, color: 'text-[#C62828]', bg: 'bg-[#FFEBEE]', invert: true },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: i * 0.1 }}
            className={`${stat.bg} p-4 rounded-xl shadow-sm border border-white/50 flex flex-col justify-between`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-wide mb-1 ${stat.invert ? 'text-red-700' : 'text-gray-700'}`}>{stat.title}</p>
                <h3 className="text-lg font-medium text-gray-800 font-sans tracking-tight">{stat.value}</h3>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm ${stat.color}`}>
                <stat.icon size={18} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Details Table (Moved UP) */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 mt-4">
        <h3 className="font-bold text-gray-900 mb-4 text-[13px]">Revenue Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Order ID</th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Product</th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Gross Total</th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Comm (15%)</th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Net Earning</th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recentTransactions?.length > 0 ? (
                data.recentTransactions.map((tr, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-xs text-gray-500">{tr.date}</td>
                    <td className="px-3 py-3 text-xs font-medium text-gray-900">#{tr.orderId}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 truncate max-w-[150px]">{tr.productName}</td>
                    <td className="px-3 py-3 text-xs font-bold text-gray-900">₹{tr.totalAmount}</td>
                    <td className="px-3 py-3 text-xs text-red-600">-₹{tr.commissionAmount}</td>
                    <td className="px-3 py-3 text-xs font-medium text-green-600">₹{tr.netEarning}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        tr.status === 'Cleared' ? 'bg-green-50 text-green-700' : 
                        tr.status === 'Refunded' ? 'bg-red-50 text-red-700' : 
                        'bg-orange-50 text-orange-700'
                      }`}>
                        {tr.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-400 text-xs italic">No revenue generated yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Chart (Moved DOWN and Compacted) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className="bg-white p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col w-full">
          <h3 className="font-bold text-gray-900 mb-3 text-[13px]">Revenue Chart</h3>
          <div className="flex-1 relative h-32 bg-indigo-50/40 border border-indigo-100/50 rounded-xl overflow-hidden flex items-end pt-2 pr-4">
            <svg viewBox="0 0 500 150" className="w-full h-full preserve-3d" preserveAspectRatio="none">
              <defs>
                <linearGradient id="earningsGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
              {(() => {
                const maxVal = Math.max(...(data.chartData?.map(d => d.value) || [0]), 1000);
                const getX = (i) => (i / Math.max(data.chartData?.length - 1 || 1, 1)) * 500;
                const getY = (val) => 150 - ((val / maxVal) * 120); // slightly more compact inside
                
                let pathStr = "M0,150 L500,150 Z";
                let lineStr = "M0,150 L500,150";

                if (data.chartData && data.chartData.length > 0) {
                  const points = data.chartData.map((d, i) => `${getX(i)},${getY(d.value)}`);
                  pathStr = `M0,150 L0,${getY(data.chartData[0].value)} L${points.join(' L')} L500,150 Z`;
                  lineStr = `M0,${getY(data.chartData[0].value)} L${points.join(' L')}`;
                }

                return (
                  <>
                    <motion.path 
                      d={pathStr}
                      fill="url(#earningsGradient)" 
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 1.5, delay: 0.2 }}
                    />
                    <motion.path 
                      d={lineStr}
                      fill="none" 
                      stroke="#6366f1" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      transition={{ duration: 3, ease: "linear" }}
                    />
                  </>
                );
              })()}

              {/* Data points */}
              {data.chartData.map((point, index) => {
                const maxVal = Math.max(...data.chartData.map(d => d.value), 1000);
                const x = (index / Math.max(data.chartData.length - 1, 1)) * 500;
                const y = 150 - ((point.value / maxVal) * 120);

                return (
                  <motion.circle
                    key={index}
                    cx={x} cy={y} r="2.5"
                    fill="white" stroke="#6366f1" strokeWidth="1.5"
                    className="cursor-pointer hover:stroke-[3px] hover:r-[3.5px] transition-all"
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1 + (index * 0.1), type: "spring" }}
                  >
                    <title>₹{point.value.toLocaleString()} on {point.date}</title>
                  </motion.circle>
                );
              })}
            </svg>
            <div className="absolute left-2 top-0 h-full flex flex-col justify-between text-[8px] text-gray-400 pb-4 pt-1 font-medium">
              <span>₹30K</span>
              <span>₹20K</span>
              <span>₹10K</span>
              <span>₹0</span>
            </div>
            <div className="absolute bottom-1 left-10 right-4 flex justify-between text-[8px] text-gray-400 font-medium">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorEarnings;
