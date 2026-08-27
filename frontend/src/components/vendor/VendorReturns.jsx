import React from 'react';
import ReturnFlowBoard from '../shared/ReturnFlowBoard';

const VendorReturns = () => (
  <div className="admin-app p-4 md:p-6">
    <h1 className="admin-page-title mb-4">Order Returns</h1>
    <p className="text-xs text-slate-500 mb-3">Separate workflow from Orders. Review reason + photos, then accept or reject.</p>
    <ReturnFlowBoard role="vendor" />
  </div>
);

export default VendorReturns;
