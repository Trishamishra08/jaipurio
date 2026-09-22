import React, { useEffect, useState } from 'react';
import VendorPage from './VendorPage';
import { fetchPayouts, requestPayout } from '../../utils/marketplaceApi';

const VendorPayouts = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const rows = await fetchPayouts();
      setItems(Array.isArray(rows) ? rows : []);
      setError('');
    } catch (err) {
      setItems([]);
      setError(err?.parsedMessage || err?.message || 'Failed to load payouts');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const request = async () => {
    setBusy(true);
    setError('');
    try {
      const row = await requestPayout();
      setItems((prev) => [row, ...prev.filter((item) => (item.id || item._id) !== (row.id || row._id))]);
    } catch (err) {
      setError(err?.parsedMessage || err?.message || 'Payout request failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <VendorPage
      title="Payouts"
      hint="Request payout from Available balance. Admin may approve. Then payment sent to verified bank, then settlement statement."
      extra={
        <button type="button" className="admin-btn-primary" onClick={request} disabled={busy}>
          {busy ? 'Requesting…' : 'Request payout'}
        </button>
      }
    >
      {error ? <p className="text-xs text-rose-600 mb-3">{error}</p> : null}
      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Amount</th>
              <th>Fee</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-slate-400 py-6">
                  No withdrawals yet
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id || item._id}>
                  <td>{item.id}</td>
                  <td>₹{Number(item.amount || 0).toLocaleString('en-IN')}</td>
                  <td>₹{Number(item.fee || 0).toLocaleString('en-IN')}</td>
                  <td>
                    <span className="admin-badge admin-badge-warning">{item.status}</span>
                  </td>
                  <td>{item.createdAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </VendorPage>
  );
};

export default VendorPayouts;
