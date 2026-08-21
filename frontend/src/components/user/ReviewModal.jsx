import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiStar, FiCheckCircle, FiLoader } from 'react-icons/fi';
import api from '../../utils/api';


const ReviewModal = ({ product, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!review.trim()) return setError('Please share your experience.');
    
    setError('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/reviews', {
        product: product.product || product._id, // Support both item.product and product._id
        rating,
        review
      });

      if (res.data.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'The ritual of recording feedback failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#5C2E3E]/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-md p-8 border border-gray-100 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-brand-pink transition-colors"
        >
          <FiX size={20} />
        </button>

        {success ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-brand-gold text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
              <FiCheckCircle size={32} />
            </div>
            <h3 className="text-xl font-serif italic text-[#5C2E3E]">Ritual Recorded</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Your voice has been added to our legacy vault.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-8">
              <span className="text-brand-gold font-bold uppercase tracking-[0.4em] text-[7px] mb-2 block">Voice of the Patron</span>
              <h2 className="text-2xl font-serif italic text-[#5C2E3E]">Rate Your Treasure</h2>
              <div className="w-8 h-0.5 bg-brand-gold mx-auto mt-2"></div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-100">
              <img src={product.image} alt={product.name} className="w-12 h-16 object-cover grayscale-[0.2]" />
              <div className="min-w-0">
                <p className="text-[10px] font-black text-[#5C2E3E] uppercase tracking-widest truncate">{product.name}</p>
                <p className="text-[8px] text-gray-400 font-serif italic uppercase">Asset ID: {product.product || product._id}</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#5C2E3E]/60 text-center block">
                Divine Satisfaction
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-all active:scale-90"
                  >
                    <FiStar
                      size={28}
                      className={star <= (hover || rating) ? "fill-brand-gold text-brand-gold" : "text-gray-200"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#5C2E3E]/60 block">
                Sacred Testimony
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Describe your ritual experience with this treasure..."
                rows={4}
                className="w-full bg-gray-50 border border-gray-100 p-4 text-[11px] font-medium outline-none focus:border-brand-pink/30 transition-all resize-none italic"
              />
            </div>

            {error && (
              <p className="text-red-400 text-[8px] font-black uppercase tracking-widest text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#5C2E3E] text-white py-4 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-brand-pink transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSubmitting ? <FiLoader className="animate-spin" /> : 'Record Ritual'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ReviewModal;
