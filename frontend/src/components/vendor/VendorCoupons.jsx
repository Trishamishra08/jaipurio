import React, { useState, useEffect, useCallback } from 'react';
import { Tag } from 'lucide-react';
import api from '../../utils/api';

const VendorCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = useCallback(async () => {
      try {
          setLoading(true);
          const res = await api.get('/coupons');
          const fetched = res.data?.data?.coupons;
          if (fetched && fetched.length > 0) {
              setCoupons(fetched);
          } else {
              setCoupons([]);
          }
      } catch (err) {
          console.error("Failed to fetch coupons:", err);
      } finally {
          setLoading(false);
      }
  }, []);

  useEffect(() => {
      fetchCoupons();
  }, [fetchCoupons]);

  return (
    <div className="space-y-4 pb-6 max-w-[1400px] mx-auto -mt-2">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 leading-tight">Coupons</h1>
          <p className="text-[12px] text-gray-500 mt-0.5 font-sans">Manage your discount codes and promotions.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Discount</th>
                <th className="px-4 py-3 font-semibold">Usage</th>
                <th className="px-4 py-3 font-semibold">Expiry Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-800">
              {loading ? (
                  <tr><td colSpan="5" className="px-4 py-10 text-center text-gray-400 font-medium">Loading coupons...</td></tr>
              ) : coupons.length > 0 ? (
                  coupons.map((c) => (
                    <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                           <Tag size={14} className="text-[#388E3C]" />
                           <span className="font-medium text-gray-800">{c.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">
                          {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT`}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 font-medium">
                          {c.usedCount} <span className="text-gray-400">/ {c.usageLimit || '∞'}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 font-medium">
                          {new Date(c.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          c.isActive ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]' : 'bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]'
                        }`}>
                          {c.isActive ? 'Active' : 'Paused'}
                        </span>
                      </td>
                    </tr>
                  ))
              ) : (
                  <tr><td colSpan="5" className="px-4 py-10 text-center text-gray-400 font-medium">No coupons available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VendorCoupons;
