import React, { useState } from 'react';
import VendorPage from './VendorPage';

const VendorStorefront = () => {
  const [plan, setPlan] = useState('Growth');
  return (
    <VendorPage title="Storefront" hint="Public seller page. Products belong to this store (same as the product editor Store selector).">
      <div className="admin-card p-5 max-w-xl space-y-3">
        <label className="admin-field"><span>Store name</span><input defaultValue="Shyam Pottery" /></label>
        <label className="admin-field"><span>Store description</span><textarea rows={4} defaultValue="Handmade Jaipur jewellery and puja crafts." /></label>
        <label className="admin-field">
          <span>Plan</span>
          <select value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option>Starter</option>
            <option>Growth</option>
            <option>Premium</option>
          </select>
        </label>
        <p className="text-xs text-slate-400">Upgrade applies now. Downgrade applies next billing cycle so existing orders keep the old commission.</p>
        <button type="button" className="admin-btn-primary">Save storefront</button>
      </div>
    </VendorPage>
  );
};

export default VendorStorefront;
