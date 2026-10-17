import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiStar } from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { fetchAdminReviews, approveReview, deleteReview } from '../../../utils/reviewApi';

export const AdminEcommerceReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('all'); // all | pending

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await fetchAdminReviews();
      setReviews(rows);
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (row) => {
    try {
      await approveReview(row.id);
      await load();
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to approve review.');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteReview(row.id);
      await load();
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to delete review.');
    }
  };

  const pending = reviews.filter((r) => r.status !== 'Approved');
  const shown = filter === 'pending' ? pending : reviews;

  const columns = [
    { header: 'ID', accessor: 'id', width: '70px' },
    {
      header: 'Product',
      accessor: 'product',
      cell: (row) => <span className="font-semibold text-slate-800">{row.product}</span>,
    },
    { header: 'Customer', accessor: 'customer' },
    {
      header: 'Star',
      accessor: 'rating',
      cell: (row) => (
        <div className="flex items-center text-amber-500 font-bold gap-1">
          <span>{row.rating}</span>
          <FiStar size={13} className="fill-amber-400 text-amber-500" />
        </div>
      ),
    },
    {
      header: 'Comment',
      accessor: 'comment',
      cell: (row) => <span className="text-slate-600 line-clamp-1 max-w-[280px]">{row.comment}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
            row.status === 'Approved'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    { header: 'Created At', accessor: 'createdAt' },
    {
      header: 'Operations',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'Approved' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleApprove(row);
              }}
              className="text-amber-600 hover:underline text-[11px] font-medium"
              title="Hide this review from the product page"
            >
              Hide
            </button>
          )}
          {row.status !== 'Approved' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleApprove(row);
              }}
              className="text-blue-600 hover:underline text-[11px] font-medium"
            >
              Approve
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            className="text-red-500 hover:underline text-[11px] font-medium"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <EcommerceLayout breadcrumb={['REVIEWS']}>
      {loadError && (
        <div className="mb-3 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {loadError}
        </div>
      )}
      {pending.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 px-3 py-2.5 rounded-md bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
          <span>
            <strong>{pending.length}</strong> {pending.length === 1 ? 'review is' : 'reviews are'} waiting for your approval. Customers do not see them (and they do not count towards ratings) until you approve.
          </span>
          <span className="ml-auto inline-flex rounded-md overflow-hidden border border-amber-300 bg-white">
            {[['all', `All (${reviews.length})`], ['pending', `Pending (${pending.length})`]].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-3 py-1 text-[11px] font-semibold ${filter === key ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-100'}`}
              >
                {label}
              </button>
            ))}
          </span>
        </div>
      )}
      {!loading && reviews.length === 0 ? (
        <div className="bg-white rounded-md border border-slate-200 shadow-2xs px-6 py-14 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
            <FiMessageSquare size={28} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-800 mb-1">Manage customer reviews</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
            Customer reviews will be shown here and you can manage it to show/hide in product detail
            page.
          </p>
          <Link
            to="/admin/ecommerce/reviews/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            Create Review
          </Link>
        </div>
      ) : (
        <AdminDataTable
          columns={columns}
          data={shown}
          createLabel="Create Review"
          onCreate={() => navigate('/admin/ecommerce/reviews/create')}
          searchPlaceholder="Search reviews..."
          showExport={false}
          showReload
          onReload={load}
        />
      )}
    </EcommerceLayout>
  );
};

export default AdminEcommerceReviews;
