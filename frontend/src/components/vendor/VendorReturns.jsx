import React from 'react';
import VendorPage from './VendorPage';
import ReturnFlowBoard from '../shared/ReturnFlowBoard';

const VendorReturns = () => (
  <VendorPage
    title="Order Returns"
    hint="Own module, not mixed with Orders. Open RMA-1001: review photos → Accept or Reject → inspect → refund → commission reverse."
  >
    <ReturnFlowBoard role="vendor" />
  </VendorPage>
);

export default VendorReturns;
