import React, { useState } from 'react';
import VendorPage from './VendorPage';

const VendorSettings = () => {
  const [kyc] = useState('Verified');
  const [plan, setPlan] = useState('Growth');
  const [saved, setSaved] = useState('');

  return (
    <VendorPage title="Settings" hint="KYC stays verified after admin approval. Plan upgrade is immediate; downgrade waits for next billing cycle.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="admin-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Store & KYC</h2>
          <label className="admin-field"><span>Store name</span><input defaultValue="Shyam Pottery" /></label>
          <label className="admin-field"><span>Owner</span><input defaultValue="Shyam Lal" /></label>
          <label className="admin-field"><span>GST</span><input defaultValue="08ABCDE1234F1Z5" /></label>
          <p className="text-sm">KYC status: <span className="admin-badge admin-badge-success">{kyc}</span></p>
        </div>
        <div className="admin-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Verified bank (payouts)</h2>
          <label className="admin-field"><span>Account holder</span><input defaultValue="Shyam Lal" /></label>
          <label className="admin-field"><span>Bank</span><input defaultValue="SBI Jaipur" /></label>
          <label className="admin-field"><span>Account number</span><input defaultValue="XXXXXXXX4521" /></label>
          <label className="admin-field"><span>IFSC</span><input defaultValue="SBIN0003024" /></label>
        </div>
        <div className="admin-card p-4 space-y-3 lg:col-span-2">
          <h2 className="text-sm font-semibold">Vendor subscription plan</h2>
          <select className="admin-input max-w-xs" value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option>Starter</option>
            <option>Growth</option>
            <option>Premium</option>
          </select>
          <p className="text-xs text-slate-500">Plan sets commission rate, listing limit, featured credits and support priority.</p>
          <button type="button" className="admin-btn-primary" onClick={() => setSaved('Settings saved locally.')}>Save</button>
          {saved && <p className="text-sm text-emerald-700">{saved}</p>}
        </div>
      </div>
    </VendorPage>
  );
};

export default VendorSettings;
