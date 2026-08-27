import React from 'react';

const VendorStorefront = () => (
  <div className="admin-app p-4 md:p-6">
    <h1 className="admin-page-title mb-4">Storefront</h1>
    <div className="admin-card p-5 max-w-xl space-y-3">
      <label className="admin-field"><span>Store name</span><input defaultValue="Shyam Pottery" /></label>
      <label className="admin-field"><span>Store description</span><textarea rows={4} defaultValue="Handmade Jaipur crafts." /></label>
      <label className="admin-field"><span>Plan</span>
        <select defaultValue="Growth">
          <option>Starter</option>
          <option>Growth</option>
          <option>Premium</option>
        </select>
      </label>
      <p className="text-xs text-slate-400">Plan controls commission rate, listing limit, featured credits and support priority. Downgrades apply next billing cycle.</p>
      <button type="button" className="admin-btn-primary">Save storefront</button>
    </div>
  </div>
);

export default VendorStorefront;
