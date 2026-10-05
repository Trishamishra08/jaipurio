import React, { useCallback, useEffect, useState } from 'react';
import ProfileSidebar from './ProfileSidebar';
import api from '../../utils/api';
import { ensureCustomerAuth } from '../../utils/customerAuth';
import { FiShare2, FiCopy, FiCheck } from 'react-icons/fi';

import { formatInr } from '../../utils/storefrontProduct';

const Affiliate = () => {
  const [affiliate, setAffiliate] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [bankForm, setBankForm] = useState({ accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '', upiId: '' });
  const [savingBank, setSavingBank] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await ensureCustomerAuth();
      const res = await api.get('/affiliates/me');
      const aff = res.data?.data;
      setAffiliate(aff);
      if (aff) {
        setBankForm({
          accountHolderName: aff.accountHolderName || '',
          bankName: aff.bankName || '',
          accountNumber: aff.accountNumber || '',
          ifscCode: aff.ifscCode || '',
          upiId: aff.upiId || '',
        });
      }
      if (aff?.status === 'Approved') {
        const earnRes = await api.get('/affiliates/earnings');
        setEarnings(earnRes.data?.data);
      }
    } catch {
      setAffiliate(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApply = async () => {
    setApplying(true);
    setMessage('');
    try {
      await ensureCustomerAuth();
      await api.post('/affiliates/apply');
      await load();
    } catch (err) {
      setMessage(err.parsedMessage || err.message || 'Failed to apply.');
    } finally {
      setApplying(false);
    }
  };

  const handleRequestPayout = async () => {
    setRequesting(true);
    setMessage('');
    try {
      await ensureCustomerAuth();
      await api.post('/affiliates/payouts/request', {});
      setMessage('Payout requested — an admin will review it shortly.');
      await load();
    } catch (err) {
      setMessage(err.parsedMessage || err.message || 'Failed to request payout.');
    } finally {
      setRequesting(false);
    }
  };

  const siteBase =
    (typeof window !== 'undefined' &&
     window.location.origin &&
     !window.location.origin.includes('localhost') &&
     !window.location.origin.includes('127.0.0.1'))
      ? window.location.origin
      : (import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://jaipurio-one.vercel.app'));

  const referralLink = affiliate?.referralCode
    ? `${siteBase}/home?ref=${affiliate.referralCode}`
    : '';

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard?.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasBankDetails = affiliate?.accountNumber && affiliate?.ifscCode;

  const handleSaveBank = async () => {
    setSavingBank(true);
    setMessage('');
    try {
      await ensureCustomerAuth();
      await api.put('/affiliates/me', bankForm);
      setMessage('Bank details saved.');
      await load();
    } catch (err) {
      setMessage(err.parsedMessage || err.message || 'Failed to save bank details.');
    } finally {
      setSavingBank(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-6 pb-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-6">
        <ProfileSidebar activeTab="affiliate" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-6">
            <FiShare2 className="text-[#6F241D]" size={22} />
            <h1 className="text-2xl font-black text-[#6F241D]">Affiliate Program</h1>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>
          ) : !affiliate ? (
            <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl p-8 text-center space-y-3">
              <h3 className="font-serif font-bold text-lg text-[#6F241D]">Earn commission promoting Jaipurio</h3>
              <p className="text-sm text-[#70452F] max-w-md mx-auto">
                Share your unique link. When someone buys through it within 30 days, you earn a commission on the order.
              </p>
              <button type="button" onClick={handleApply} disabled={applying} className="bg-[#6F241D] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#873A24] disabled:opacity-60">
                {applying ? 'Applying…' : 'Apply now'}
              </button>
              {message && <p className="text-xs text-red-600">{message}</p>}
            </div>
          ) : affiliate.status === 'Pending' ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
              <h3 className="font-serif font-bold text-lg text-amber-800">Application under review</h3>
              <p className="text-sm text-amber-700 mt-1">We'll notify you once an admin approves your affiliate application.</p>
            </div>
          ) : affiliate.status === 'Rejected' ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <h3 className="font-serif font-bold text-lg text-red-800">Application not approved</h3>
              <p className="text-sm text-red-700 mt-1">Contact support if you'd like to re-apply.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wide text-[#8A6A68] font-semibold mb-2">Your referral link</p>
                <div className="flex items-center gap-2">
                  <input readOnly value={referralLink} className="flex-1 bg-white border border-[#E8D4B5] rounded-lg px-3 py-2 text-sm text-[#3F261B]" />
                  <button type="button" onClick={copyLink} className="shrink-0 bg-[#6F241D] text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                    {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-[11px] text-[#8A6A68] mt-2">Attribution window: 30 days from click. Commission rate: {affiliate.commissionRate}%.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-[#E8D4B5] rounded-xl p-4">
                  <p className="text-xs text-[#8A6A68] uppercase tracking-wide">Pending</p>
                  <p className="text-xl font-black text-[#6F241D] mt-1">{formatInr(earnings?.pending)}</p>
                </div>
                <div className="bg-white border border-[#E8D4B5] rounded-xl p-4">
                  <p className="text-xs text-[#8A6A68] uppercase tracking-wide">Available</p>
                  <p className="text-xl font-black text-[#6F241D] mt-1">{formatInr(earnings?.available)}</p>
                </div>
              </div>

              {!hasBankDetails ? (
                <div className="bg-white border border-[#E8D4B5] rounded-xl p-4 space-y-2.5">
                  <h3 className="text-sm font-bold text-[#3F261B]">Add bank details to request payouts</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input placeholder="Account holder name" value={bankForm.accountHolderName} onChange={(e) => setBankForm((f) => ({ ...f, accountHolderName: e.target.value }))} className="border border-[#E8D4B5] rounded-lg px-3 py-2 text-sm" />
                    <input placeholder="Bank name" value={bankForm.bankName} onChange={(e) => setBankForm((f) => ({ ...f, bankName: e.target.value }))} className="border border-[#E8D4B5] rounded-lg px-3 py-2 text-sm" />
                    <input placeholder="Account number" value={bankForm.accountNumber} onChange={(e) => setBankForm((f) => ({ ...f, accountNumber: e.target.value }))} className="border border-[#E8D4B5] rounded-lg px-3 py-2 text-sm" />
                    <input placeholder="IFSC code" value={bankForm.ifscCode} onChange={(e) => setBankForm((f) => ({ ...f, ifscCode: e.target.value }))} className="border border-[#E8D4B5] rounded-lg px-3 py-2 text-sm" />
                    <input placeholder="UPI ID (optional)" value={bankForm.upiId} onChange={(e) => setBankForm((f) => ({ ...f, upiId: e.target.value }))} className="border border-[#E8D4B5] rounded-lg px-3 py-2 text-sm sm:col-span-2" />
                  </div>
                  <button type="button" onClick={handleSaveBank} disabled={savingBank} className="bg-[#6F241D] text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-60">
                    {savingBank ? 'Saving…' : 'Save bank details'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestPayout}
                  disabled={requesting || !earnings?.available}
                  className="bg-[#354B35] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#2A3C2A] disabled:opacity-50"
                >
                  {requesting ? 'Requesting…' : 'Request payout'}
                </button>
              )}
              {message && <p className="text-xs text-[#6F241D]">{message}</p>}

              <div>
                <h3 className="text-sm font-bold text-[#3F261B] mb-2">Commission history</h3>
                {!earnings?.rows?.length ? (
                  <p className="text-xs text-gray-400">No referred orders yet.</p>
                ) : (
                  <div className="border border-[#E8D4B5] rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-[#FCF8F2]">
                        <tr>
                          <th className="text-left px-3 py-2">Order</th>
                          <th className="text-left px-3 py-2">Commission</th>
                          <th className="text-left px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earnings.rows.map((row) => (
                          <tr key={row.id} className="border-t border-[#E8D4B5]">
                            <td className="px-3 py-2">#{row.order}</td>
                            <td className="px-3 py-2">{formatInr(row.commissionAmount)}</td>
                            <td className="px-3 py-2">{row.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Affiliate;
