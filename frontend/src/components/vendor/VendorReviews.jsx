import React, { useEffect, useState } from 'react';
import VendorPage from './VendorPage';
import api from '../../utils/api';

const VendorReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/vendors/reviews')
      .then((res) => {
        if (!cancelled) setReviews(Array.isArray(res.data?.data?.reviews) ? res.data.data.reviews : []);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.parsedMessage || err?.message || 'Failed to load reviews');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <VendorPage title="Seller reviews" hint="Customer ratings on your listings. Storefront rating is calculated from these.">
      {loading ? (
        <p className="text-xs text-slate-400 py-6 text-center">Loading reviews…</p>
      ) : loadError ? (
        <p className="text-xs text-red-600 py-6 text-center">{loadError}</p>
      ) : !reviews.length ? (
        <p className="text-xs text-slate-400 py-6 text-center">No reviews on your products yet.</p>
      ) : (
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
              {reviews.map((row) => (
                <tr key={row._id}>
                  <td>{row.product?.name || '—'}</td>
                  <td>{row.user?.name || 'Guest'}</td>
                  <td>{row.rating} ★</td>
                  <td>{row.comment || row.review || '—'}</td>
                  <td>{row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </VendorPage>
  );
};

export default VendorReviews;
