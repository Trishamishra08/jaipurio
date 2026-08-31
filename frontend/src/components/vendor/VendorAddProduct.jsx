import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductEditorForm from '../shared/ProductEditorForm';
import VendorPage from './VendorPage';

const VendorAddProduct = () => {
  const [params] = useSearchParams();
  const id = params.get('id') || undefined;
  return (
    <VendorPage
      title={id ? 'Edit product' : 'Add product'}
      hint="Required: Title, SKU, Category, Price, Stock, and at least one image. Save draft or submit for admin review."
      extra={<Link to="/vendor/products" className="admin-btn-light">Back to products</Link>}
    >
      <ProductEditorForm role="vendor" productId={id} />
    </VendorPage>
  );
};

export default VendorAddProduct;
