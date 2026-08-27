import React from 'react';
import ProductEditorForm from '../shared/ProductEditorForm';
import { Link } from 'react-router-dom';

const VendorAddProduct = () => (
  <div className="admin-app p-4 md:p-6">
    <div className="flex items-center justify-between mb-4">
      <h1 className="admin-page-title">Add / Edit Product</h1>
      <Link to="/vendor/products" className="admin-btn-light">Back to products</Link>
    </div>
    <ProductEditorForm role="vendor" />
  </div>
);

export default VendorAddProduct;
