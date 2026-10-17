import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiStar } from 'react-icons/fi';
import ProfileSidebar from './ProfileSidebar';
import ReviewModal from './ReviewModal';
import ThumbImg from '../shared/ThumbImg';
import { getCustomerToken } from '../../utils/customerAuth';
import { fetchMyReviews } from '../../utils/reviewApi';

const Stars = ({ value }) => (
  <span className="inline-flex text-[#F5B82E]" aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <FiStar key={n} size={14} className={n <= value ? 'fill-current' : 'text-gray-300'} />
    ))}
  </span>
);

const MyReviews = () => {
  const loggedIn = Boolean(getCustomerToken());
  const [data, setData] = useState({ reviews: [], toReview: [] });
  const [loading, setLoading] = useState(loggedIn);
  const [error, setError] = useState('');
  const [writing, setWriting] = useState(null); // product being reviewed

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchMyReviews());
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your reviews right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) load();
  }, [loggedIn, load]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-4 md:pt-6 pb-12 font-mulish">
      <div className="w-full px-4 lg:px-8 flex flex-col lg:flex-row gap-6">
        <ProfileSidebar activeTab="reviews" />

        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="mb-2">
            <h1 className="text-3xl font-serif font-bold text-[#3F261B] mb-1">My Reviews</h1>
            <p className="text-xs text-gray-500 font-medium">Rate the products you have received. Your review appears after approval.</p>
          </div>

          {!loggedIn ? (
            <div className="bg-white border border-gray-100 rounded-xl p-10 text-center shadow-sm">
              <p className="text-sm text-gray-600">
                Please <Link to="/login" className="font-semibold text-[#8B2E3A] underline">log in</Link> to see and write your reviews.
              </p>
            </div>
          ) : loading ? (
            <p className="text-sm text-gray-500">Loading your reviews…</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <>
              {data.toReview.length > 0 && (
                <section className="bg-white border border-gray-100 rounded-xl p-4 md:p-5 shadow-sm">
                  <h2 className="text-sm font-bold text-[#3F261B] mb-3">Waiting for your review ({data.toReview.length})</h2>
                  <div className="space-y-2.5">
                    {data.toReview.map((item) => (
                      <div key={item.productId} className="flex items-center gap-3 p-2.5 rounded-xl border border-[#EADFCF] bg-[#FAF6EE]">
                        <div className="w-14 h-14 rounded-lg bg-white border border-[#EADFCF] overflow-hidden shrink-0">
                          {item.image && <ThumbImg src={item.image} width={200} alt={item.name} className="w-full h-full object-contain" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#3F261B] line-clamp-2">{item.name}</p>
                          {item.orderNumber && <p className="text-[11px] text-gray-500">Order {item.orderNumber}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => setWriting({ _id: item.productId, name: item.name, image: item.image })}
                          className="shrink-0 px-4 py-2 rounded-lg bg-[#6F241D] hover:bg-[#5A1C17] text-white text-xs font-bold transition-colors"
                        >
                          Write a review
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="bg-white border border-gray-100 rounded-xl p-4 md:p-5 shadow-sm min-h-[220px]">
                <h2 className="text-sm font-bold text-[#3F261B] mb-3">Your reviews ({data.reviews.length})</h2>
                {data.reviews.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-14 h-14 bg-[#FAF6EE] rounded-full flex items-center justify-center mx-auto mb-3 text-[#C69A45]">
                      <FiStar className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">No reviews yet</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Once you receive an order, the products will show up above so you can review them.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.reviews.map((r) => (
                      <article key={r.id} className="p-3 rounded-xl border border-gray-200">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg bg-white border border-gray-100 overflow-hidden shrink-0">
                            {r.image && <ThumbImg src={r.image} width={200} alt={r.productName} className="w-full h-full object-contain" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link to={`/product/${r.productId}`} className="text-sm font-semibold text-[#3F261B] hover:text-[#8B2E3A] line-clamp-1">
                                {r.productName}
                              </Link>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                  r.status === 'Approved'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {r.status === 'Approved' ? 'Published' : 'Waiting for approval'}
                              </span>
                            </div>
                            <Stars value={r.rating} />
                            <p className="text-sm text-gray-700 mt-1.5 break-words">{r.comment}</p>
                            {r.adminReply && (
                              <p className="mt-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                                <strong className="text-[#6F241D]">Reply from Jaipurio:</strong> {r.adminReply}
                              </p>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {writing && <ReviewModal product={writing} onClose={() => setWriting(null)} onSuccess={load} />}
    </div>
  );
};

export default MyReviews;
