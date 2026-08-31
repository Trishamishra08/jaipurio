import React from 'react';
import VendorPage from './VendorPage';

const REVIEWS = [
  { id: 1, product: 'Marble Ganesh Chowki', customer: 'Rahul Verma', rating: 5, comment: 'Beautiful carving.', date: '2026-08-18' },
  { id: 2, product: 'Kundan Bangle Set', customer: 'Aditi Sharma', rating: 4, comment: 'Rich finish, slightly tight size.', date: '2026-08-21' },
];

const VendorReviews = () => (
  <VendorPage title="Seller reviews" hint="Customer ratings on your listings. Storefront rating is calculated from these.">
    <div className="admin-card overflow-hidden">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Customer</th>
            <th>Rating</th>
            <th>Comment</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {REVIEWS.map((row) => (
            <tr key={row.id}>
              <td>{row.product}</td>
              <td>{row.customer}</td>
              <td>{row.rating} ★</td>
              <td>{row.comment}</td>
              <td>{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </VendorPage>
);

export default VendorReviews;
