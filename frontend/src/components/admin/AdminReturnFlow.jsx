import React from 'react';
import AdminPageHeader from './AdminPageHeader';
import ReturnFlowBoard from '../shared/ReturnFlowBoard';

const AdminReturnFlow = () => (
  <div>
    <AdminPageHeader title="Order Returns" hideAction extra={<p className="text-xs text-slate-400">Separate module from Orders</p>} />
    <ReturnFlowBoard role="admin" />
  </div>
);

export default AdminReturnFlow;
