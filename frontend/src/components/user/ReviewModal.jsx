import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiStar, FiCheckCircle, FiLoader } from 'react-icons/fi';
import api from '../../utils/api';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/**
 * "Write a review" form. Needs a logged-in customer who has received the
 * product (the server checks this). The review is shown on the product after
 * an admin approves it.
 */
const ReviewModal = ({ product, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const productId = product.product || product._id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (review.trim().length < 3) return setError('Please share a few words about your experience.');

    setError('');
    setIsSubmitting(true);
    try {
      const res = await api.post('/reviews', { product: productId, rating, review });
      if (res.data?.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2400);
      }
    } catch (err) {
      setError(
        err.response?.status === 401
          ? 'Please log in to write a review.'
          : err.response?.data?.message || 'Could not save your review. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const shown = hover || rating;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden" role="dialog" aria-modal="true" aria-label="Write a review">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl font-mulish"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-[#6F241D] transition-colors" aria-label="Close">
          <FiX size={20} />
        </button>

        {success ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <FiCheckCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-[#3F261B]">Thank you!</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your review has been received. It will appear on the product once it has been approved.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#3F261B]">Write a review</h2>
              <p className="text-xs text-gray-500 mt-0.5">Tell other shoppers what you think.</p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#FAF6EE] border border-[#EADFCF] rounded-xl">
              {product.image && <img src={product.image} alt={product.name} className="w-12 h-12 object-contain bg-white rounded-lg border border-[#EADFCF]" />}
              <p className="text-sm font-semibold text-[#3F261B] line-clamp-2">{product.name}</p>
            </div>

            <div>
              <span className="block text-xs font-semibold text-gray-600 mb-2">Your rating</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform active:scale-90"
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  >
                    <FiStar size={30} className={star <= shown ? 'fill-[#F5B82E] text-[#F5B82E]' : 'text-gray-300'} />
                  </button>
                ))}
                <span className="ml-2 text-sm font-semibold text-[#6F241D]">{LABELS[shown]}</span>
              </div>
            </div>

            <label className="block">
              <span className="block text-xs font-semibold text-gray-600 mb-2">Your review</span>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="What did you like or dislike? How was the quality and packaging?"
                rows={4}
                maxLength={2000}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#6F241D]/50 transition-colors resize-none"
              />
            </label>

            {error && <p className="text-red-600 text-xs font-semibold text-center">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#6F241D] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#5A1C17] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <FiLoader className="animate-spin" /> : 'Submit review'}
            </button>
            <p className="text-[11px] text-gray-400 text-center">Only customers who received this product can review it.</p>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ReviewModal;
