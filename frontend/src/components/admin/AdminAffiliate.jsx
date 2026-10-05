import React, { useCallback, useEffect, useState } from 'react';
import AdminPageHeader from './AdminPageHeader';
import api from '../../utils/api';

const AdminAffiliate = () => {
  const [items, setItems] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [affRes, payoutRes] = await Promise.all([
        api.get('/affiliates'),
        api.get('/affiliates/payouts').catch(() => ({ data: { data: [] } })),
      ]);
      setItems(affRes.data?.data || []);
      setPayouts(payoutRes.data?.data || []);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to load affiliates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id, status) => {
    try {
      await api.put(`/affiliates/${id}`, { status });
      await load();
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to update status.');
    }
  };

  const advancePayout = async (id, status) => {
    try {
      await api.put(`/affiliates/payouts/${id}/advance`, status ? { status } : {});
      await load();
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to update payout.');
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Affiliate Program" hideAction />
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h2 className="text-sm font-bold text-[#2c384e]">Applications</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-400">
              <th className="text-left px-5 py-2.5 font-semibold">Applicant</th>
              <th className="text-left px-5 py-2.5 font-semibold">Email</th>
              <th className="text-left px-5 py-2.5 font-semibold">Referral Code</th>
              <th className="text-left px-5 py-2.5 font-semibold">Commission</th>
              <th className="text-left px-5 py-2.5 font-semibold">Status</th>
              <th className="px-5 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id || item._id} className="border-t border-gray-100">
                <td className="px-5 py-3">{item.name}</td>
                <td className="px-5 py-3">{item.email}</td>
                <td className="px-5 py-3"><code className="text-xs">{item.referralCode || '—'}</code></td>
                <td className="px-5 py-3">{item.commissionRate}%</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    item.status === 'Approved' ? 'bg-green-50 text-green-600'
                      : item.status === 'Rejected' ? 'bg-red-50 text-red-600'
                      : 'bg-orange-50 text-orange-600'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  {item.status === 'Pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setStatus(item.id || item._id, 'Rejected')}
                        className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-all"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(item.id || item._id, 'Approved')}
                        className="ml-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-all"
                      >
                        Approve
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-6">No affiliate applications yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h2 className="text-sm font-bold text-[#2c384e]">Payout Requests</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-400">
              <th className="text-left px-5 py-2.5 font-semibold">Payout #</th>
              <th className="text-left px-5 py-2.5 font-semibold">Affiliate</th>
              <th className="text-left px-5 py-2.5 font-semibold">Amount</th>
              <th className="text-left px-5 py-2.5 font-semibold">Status</th>
              <th className="px-5 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p._id} className="border-t border-gray-100">
                <td className="px-5 py-3">{p.payoutNumber}</td>
                <td className="px-5 py-3">{p.affiliate?.name || '—'}</td>
                <td className="px-5 py-3">₹{Number(p.amount || 0).toLocaleString('en-IN')}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    p.status === 'Completed' ? 'bg-green-50 text-green-600'
                      : ['Refused', 'Rejected'].includes(p.status) ? 'bg-red-50 text-red-600'
                      : 'bg-orange-50 text-orange-600'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  {!['Completed', 'Refused', 'Rejected'].includes(p.status) && (
                    <>
                      <button
                        type="button"
                        onClick={() => advancePayout(p._id, 'Refused')}
                        className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-all"
                      >
                        Refuse
                      </button>
                      <button
                        type="button"
                        onClick={() => advancePayout(p._id)}
                        className="ml-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-all"
                      >
                        Advance
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!loading && payouts.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-6">No payout requests yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAffiliate;
