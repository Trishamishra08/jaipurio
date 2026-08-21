import React, { useState, useEffect, useCallback } from 'react';
import { FiStar, FiTrash2, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import api from '../../utils/api';

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/admins/reviews');
            setReviews(res.data.data.reviews || []);
        } catch (err) {
            console.error('Failed to fetch product reviews:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this review permanently?')) return;
        try {
            await api.delete(`/admins/reviews/${id}`);
            fetchReviews();
        } catch {
            alert('Failed to delete review.');
        }
    };

    const handleToggleApproval = async (id) => {
        try {
            await api.patch(`/admins/reviews/${id}/toggle-approval`);
            fetchReviews();
        } catch {
            alert('Failed to update review status.');
        }
    };

    const getImage = (product) => {
        if (!product) return null;
        if (product.images?.length > 0) return product.images[0];
        if (product.image) return product.image;
        return null;
    };

    return (
        <div className="px-6 py-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">Feedback Ledger</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Verified product ratings & customer commentary</p>
                </div>
                <button
                    onClick={fetchReviews}
                    className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <FiRefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                    Sync Reviews
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60">
                                <th className="px-4 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Product</th>
                                <th className="px-4 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Customer</th>
                                <th className="px-4 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Rating / Comment</th>
                                <th className="px-4 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Status</th>
                                <th className="px-4 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-gray-400 text-xs animate-pulse">
                                        Loading reviews...
                                    </td>
                                </tr>
                            ) : reviews.length > 0 ? (
                                reviews.map((r) => (
                                    <tr key={r._id} className="hover:bg-gray-50/40 transition-colors">
                                        {/* Product */}
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 bg-gray-50 rounded-lg border border-gray-100 flex-shrink-0 overflow-hidden">
                                                    {getImage(r.product) ? (
                                                        <img
                                                            src={getImage(r.product)}
                                                            alt=""
                                                            className="w-full h-full object-contain mix-blend-multiply"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-100 rounded-lg" />
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-700 font-medium line-clamp-1 max-w-[130px]">
                                                    {r.product?.name || '—'}
                                                </span>
                                            </div>
                                        </td>
                                        {/* Customer */}
                                        <td className="px-4 py-2">
                                            <span className="text-xs text-gray-700">{r.user?.name || '—'}</span>
                                            {r.user?.phone && (
                                                <p className="text-[10px] text-gray-400 mt-0.5">{r.user.phone}</p>
                                            )}
                                        </td>
                                        {/* Rating + Comment */}
                                        <td className="px-4 py-2 max-w-[240px]">
                                            <div className="flex items-center gap-0.5 text-amber-400 mb-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <FiStar
                                                        key={i}
                                                        size={10}
                                                        className={i < r.rating ? 'fill-amber-400 stroke-amber-400' : 'stroke-gray-200 fill-gray-100'}
                                                    />
                                                ))}
                                                <span className="text-[10px] text-amber-500 ml-1 font-medium">{r.rating}.0</span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 line-clamp-1 italic">
                                                {r.comment ? `"${r.comment}"` : <span className="text-gray-300 not-italic">No comment</span>}
                                            </p>
                                        </td>
                                        {/* Status */}
                                        <td className="px-4 py-2">
                                            <button onClick={() => handleToggleApproval(r._id)} title="Click to toggle">
                                                {r.isApproved ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-green-50 text-green-600 border border-green-100 rounded-md hover:bg-green-100 transition-colors cursor-pointer">
                                                        <FiCheckCircle size={9} /> Approved
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-red-50 text-red-500 border border-red-100 rounded-md hover:bg-red-100 transition-colors cursor-pointer">
                                                        <FiXCircle size={9} /> Hidden
                                                    </span>
                                                )}
                                            </button>
                                        </td>
                                        {/* Actions */}
                                        <td className="px-4 py-2 text-right">
                                            <button
                                                onClick={() => handleDelete(r._id)}
                                                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <FiTrash2 size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-4 py-10 text-center text-gray-400 text-xs italic">
                                        No product reviews found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminReviews;
