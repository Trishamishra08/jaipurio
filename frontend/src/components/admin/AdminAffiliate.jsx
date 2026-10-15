import React, { useCallback, useEffect, useState } from 'react';
import AdminPageHeader from './AdminPageHeader';
import api from '../../utils/api';
import { AFFILIATE_LINK_DEFAULTS, buildReferralLink, mergeAffiliateLink } from '../../utils/useAffiliateSettings';

const AdminAffiliate = () => {
  const [items, setItems] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Referral link format (site / landing page / parameter) — saved in settings.affiliate
  const [linkCfg, setLinkCfg] = useState(AFFILIATE_LINK_DEFAULTS);
  const [linkSaving, setLinkSaving] = useState(false);
  const [linkNotice, setLinkNotice] = useState(null);
  // Row being edited: { id, code, rate }
  const [editing, setEditing] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [affRes, payoutRes, settingsRes] = await Promise.all([
        api.get('/affiliates'),
        api.get('/affiliates/payouts').catch(() => ({ data: { data: [] } })),
        api.get('/settings').catch(() => null),
      ]);
      setItems(affRes.data?.data || []);
      setPayouts(payoutRes.data?.data || []);
      if (settingsRes) setLinkCfg(mergeAffiliateLink(settingsRes.data?.data?.settings?.affiliate));
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

  const saveLinkFormat = async () => {
    setLinkSaving(true);
    setLinkNotice(null);
    try {
      const clean = mergeAffiliateLink(linkCfg);
      await api.put('/settings', { affiliate: clean });
      setLinkCfg(clean);
      setLinkNotice({ type: 'success', text: 'Referral link format saved. New links use it within a few minutes.' });
    } catch (err) {
      setLinkNotice({ type: 'error', text: err.parsedMessage || err.message || 'Could not save.' });
    } finally {
      setLinkSaving(false);
    }
  };

  const saveAffiliateEdit = async () => {
    if (!editing) return;
    setEditSaving(true);
    setError('');
    try {
      await api.patch(`/affiliates/${editing.id}/referral`, { referralCode: editing.code, commissionRate: editing.rate });
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.parsedMessage || err.message || 'Could not save changes.');
    } finally {
      setEditSaving(false);
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

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-bold text-[#2c384e]">Referral link</h2>
        <p className="text-xs text-gray-500 mt-0.5 mb-4">
          How every affiliate's link is built: <code>site + landing page + ?parameter=code</code>. Leave the site empty to use this website's own address.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="block text-[11px] font-semibold text-gray-500 mb-1">Website address</span>
            <input
              value={linkCfg.baseUrl}
              onChange={(e) => setLinkCfg({ ...linkCfg, baseUrl: e.target.value })}
              placeholder="https://jaipurio.in  (empty = this site)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-[11px] font-semibold text-gray-500 mb-1">Landing page</span>
            <input
              value={linkCfg.landingPath}
              onChange={(e) => setLinkCfg({ ...linkCfg, landingPath: e.target.value })}
              placeholder="/home"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-[11px] font-semibold text-gray-500 mb-1">Link parameter</span>
            <input
              value={linkCfg.paramName}
              onChange={(e) => setLinkCfg({ ...linkCfg, paramName: e.target.value })}
              placeholder="ref"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Preview:{' '}
          <code className="bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 break-all">
            {buildReferralLink('SAMPLECODE', mergeAffiliateLink(linkCfg), typeof window !== 'undefined' ? window.location.origin : '')}
          </code>
        </p>
        <p className="text-[11px] text-gray-400 mt-1">
          The standard parameters (ref, referral, affiliate, refCode) keep working whatever you choose, so links already shared are not lost.
        </p>
        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            onClick={saveLinkFormat}
            disabled={linkSaving}
            className="px-4 py-2 bg-[#2c384e] text-white rounded-lg text-xs font-bold hover:bg-[#1f2a3c] disabled:opacity-60"
          >
            {linkSaving ? 'Saving…' : 'Save link format'}
          </button>
          <button
            type="button"
            onClick={() => setLinkCfg(AFFILIATE_LINK_DEFAULTS)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            Reset
          </button>
          {linkNotice && (
            <span className={`text-xs font-semibold ${linkNotice.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{linkNotice.text}</span>
          )}
        </div>
      </div>

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
                <td className="px-5 py-3">
                  {editing && editing.id === (item.id || item._id) ? (
                    <input
                      value={editing.code}
                      onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                      className="w-36 border border-gray-300 rounded-lg px-2 py-1 text-xs font-mono"
                      aria-label="Referral code"
                    />
                  ) : (
                    <>
                      <code className="text-xs">{item.referralCode || '—'}</code>
                      {item.previousCodes && item.previousCodes.length > 0 && (
                        <div className="text-[10px] text-gray-400 mt-0.5" title="Links with these earlier codes still work">
                          also works: {item.previousCodes.join(', ')}
                        </div>
                      )}
                    </>
                  )}
                </td>
                <td className="px-5 py-3">
                  {editing && editing.id === (item.id || item._id) ? (
                    <span className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.5"
                        value={editing.rate}
                        onChange={(e) => setEditing({ ...editing, rate: e.target.value })}
                        className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-xs"
                        aria-label="Commission rate"
                      />
                      %
                    </span>
                  ) : (
                    <>{item.commissionRate}%</>
                  )}
                </td>
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
                  {editing && editing.id === (item.id || item._id) ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveAffiliateEdit}
                        disabled={editSaving}
                        className="ml-2 px-3 py-1.5 bg-[#2c384e] text-white rounded-lg text-xs font-bold hover:bg-[#1f2a3c] disabled:opacity-60"
                      >
                        {editSaving ? 'Saving…' : 'Save'}
                      </button>
                    </>
                  ) : (
                    item.status !== 'Rejected' && (
                      <button
                        type="button"
                        onClick={() => setEditing({ id: item.id || item._id, code: item.referralCode || '', rate: item.commissionRate ?? 10 })}
                        className="mr-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50"
                      >
                        Edit
                      </button>
                    )
                  )}
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
