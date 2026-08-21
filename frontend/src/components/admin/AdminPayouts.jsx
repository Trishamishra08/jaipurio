import React, { useState, useEffect } from 'react';
import { IndianRupee, CreditCard, ExternalLink, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';

const AdminPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, vendorId: null, amount: 0, vendorName: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admins/payouts');
      if (res.data.success) {
        setPayouts(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch payouts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const initiateMarkAsPaid = (vendorId, amount, vendorName) => {
    setConfirmModal({ isOpen: true, vendorId, amount, vendorName });
  };

  const handleConfirmMarkAsPaid = async () => {
    const { vendorId } = confirmModal;
    setConfirmModal({ isOpen: false, vendorId: null, amount: 0, vendorName: '' });
    
    try {
      setProcessingId(vendorId);
      const res = await api.post(`/admins/payouts/${vendorId}/clear`);
      if (res.data.success) {
        showToast("Settlement marked as Paid successfully!");
        fetchPayouts(); // Refresh the list
      }
    } catch (err) {
      console.error("Failed to clear payouts", err);
      showToast("Failed to clear payouts. Please try again.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="h-96 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 animate-pulse">Loading Payouts...</div>;

  return (
    <div className="space-y-4 pb-6 max-w-[1400px] mx-auto -mt-2 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 leading-tight">Vendor Payouts</h1>
          <p className="text-[12px] text-gray-500 mt-0.5 font-sans">Manage and clear pending settlements for your vendors.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-5 mt-4">
        <h3 className="font-bold text-gray-900 mb-4 text-[13px]">Settlement Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Vendor / Store</th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Bank Details</th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Cleared</th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-red-600">Pending Dues</th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payouts.length > 0 ? (
                payouts.map((payout, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3">
                      <p className="text-xs font-bold text-gray-900">{payout.storeName}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{payout.vendorName}</p>
                    </td>
                    <td className="px-3 py-3">
                      {payout.bankDetails ? (
                        <div className="text-xs text-gray-600 space-y-0.5">
                          <p><span className="font-medium text-gray-400">A/C:</span> {payout.bankDetails.accountNumber}</p>
                          <p><span className="font-medium text-gray-400">IFSC:</span> {payout.bankDetails.ifscCode}</p>
                          <p className="text-[10px]">{payout.bankDetails.bankName} - {payout.bankDetails.accountHolderName}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] italic text-red-400">Bank details not provided</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-green-600">
                      ₹{payout.totalCleared.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-red-600">
                      ₹{payout.totalPending.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {payout.totalPending > 0 ? (
                        <button
                          onClick={() => initiateMarkAsPaid(payout.vendorId, payout.totalPending, payout.storeName)}
                          disabled={processingId === payout.vendorId}
                          className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 rounded text-[11px] font-bold uppercase tracking-wide transition-colors flex items-center justify-end gap-1.5 ml-auto border border-green-200"
                        >
                          {processingId === payout.vendorId ? (
                            <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckCircle size={14} />
                          )}
                          {processingId === payout.vendorId ? 'Processing...' : 'Mark as Paid'}
                        </button>
                      ) : (
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-400 flex items-center justify-end gap-1 w-max ml-auto">
                          <CheckCircle size={12} /> Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-400 text-xs italic">No vendors have generated revenue yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <AlertCircle size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">Confirm Payout</h3>
                </div>
                <p className="text-[13px] text-gray-600 mb-6 leading-relaxed">
                  Are you sure you want to mark <span className="font-bold text-gray-900">₹{confirmModal.amount.toLocaleString()}</span> as paid for <span className="font-bold text-gray-900">{confirmModal.vendorName}</span>?
                  <br /><br />
                  <span className="text-red-500 italic">Please ensure you have already transferred the funds to their bank account. This action cannot be undone.</span>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmModal({ isOpen: false, vendorId: null, amount: 0, vendorName: '' })}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmMarkAsPaid}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={14} /> Mark as Paid
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border ${
              toast.type === 'error' 
                ? 'bg-red-50 border-red-100 text-red-800' 
                : 'bg-green-50 border-green-100 text-green-800'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={18} className="text-red-600" /> : <CheckCircle size={18} className="text-green-600" />}
            <p className="text-xs font-bold">{toast.message}</p>
            <button onClick={() => setToast({ show: false, message: '', type: 'success' })} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPayouts;
