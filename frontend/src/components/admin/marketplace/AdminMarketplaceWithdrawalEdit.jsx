import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiSave } from 'react-icons/fi';
import EcommerceLayout from '../ecommerce/EcommerceLayout';
import {
  fetchPayoutById,
  updatePayout,
} from '../../../utils/marketplaceApi';

const STATUSES = ['Pending', 'Processing', 'Completed', 'Canceled', 'Refused'];

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}.0`;

export default function AdminMarketplaceWithdrawalEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState(null);
  const [status, setStatus] = useState('Pending');
  const [transactionId, setTransactionId] = useState('');
  const [description, setDescription] = useState('');
  const [fee, setFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchPayoutById(id);
        if (cancelled || !data) return;
        setRow(data);
        setStatus(data.status || 'Pending');
        setTransactionId(data.transactionId || '');
        setDescription(data.description || data.settlementNote || '');
        setFee(Number(data.fee) || 0);
      } catch (err) {
        if (!cancelled) setSaveError(err?.parsedMessage || err?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async (andExit = false) => {
    if (!row) return;
    setSaving(true);
    setSaveError('');
    try {
      const saved = await updatePayout(row._id || row.id, {
        status,
        transactionId,
        description,
        settlementNote: description,
        fee: Number(fee) || 0,
      });
      setRow(saved);
      setStatus(saved.status || status);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (andExit) navigate('/admin/marketplaces/withdrawals');
      }, 700);
    } catch (err) {
      setSaveError(err?.parsedMessage || err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const bank = row?.bankSnapshot || {};

  return (
    <EcommerceLayout
      breadcrumb={['MARKETPLACE', 'WITHDRAWALS', row ? `EDIT #${row.id}` : 'EDIT']}
    >
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading withdrawal…</div>
      ) : !row ? (
        <div className="py-16 text-center text-sm text-rose-600">{saveError || 'Not found'}</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-9 space-y-4">
            <div className="bg-white border border-slate-200 rounded-md p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase text-slate-500">Vendor</div>
                  <div className="text-sm font-semibold text-slate-800 mt-1">
                    {row.vendorName || row.vendor}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase text-slate-500">Payout #</div>
                  <div className="text-sm font-mono text-slate-700 mt-1">{row.payoutNumber}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase text-slate-500">Amount</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">{fmt(row.amount)}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase text-slate-500">
                    Balance at request
                  </div>
                  <div className="text-sm font-medium text-slate-700 mt-1">
                    {fmt(row.balanceAtRequest)}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
                  Bank details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-400">Holder:</span> {bank.accountHolderName || '—'}
                  </div>
                  <div>
                    <span className="text-slate-400">Bank:</span> {bank.bankName || '—'}
                  </div>
                  <div>
                    <span className="text-slate-400">A/C:</span> {bank.accountNumber || '—'}
                  </div>
                  <div>
                    <span className="text-slate-400">IFSC:</span> {bank.ifscCode || '—'}
                  </div>
                  <div>
                    <span className="text-slate-400">UPI:</span> {bank.upiId || '—'}
                  </div>
                  <div>
                    <span className="text-slate-400">Method:</span> {row.paymentMethod || 'Bank transfer'}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fee</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="w-full max-w-xs border border-slate-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Transaction ID
                  </label>
                  <input
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                    placeholder="UTR / reference"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Description / notes
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Payment proof notes or refusal reason"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-3 space-y-4">
            <div className="bg-white border border-slate-200 rounded-md p-3 space-y-2">
              <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wide">Publish</div>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(false)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-md disabled:opacity-60"
              >
                <FiSave size={14} />
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="w-full bg-slate-800 hover:bg-black text-white text-sm font-semibold py-2 rounded-md disabled:opacity-60"
              >
                Save &amp; Exit
              </button>
              {saveSuccess ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <FiCheck size={14} /> Saved
                </div>
              ) : null}
              {saveError ? <div className="text-xs text-rose-600">{saveError}</div> : null}
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-3 space-y-2">
              <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wide">Status</div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Pending → Processing → Completed. Use Refused to reject and restore vendor balance.
              </p>
            </div>

            <Link
              to="/admin/marketplaces/withdrawals"
              className="block text-center text-xs text-blue-600 hover:underline"
            >
              ← Back to withdrawals
            </Link>
          </div>
        </div>
      )}
    </EcommerceLayout>
  );
}
