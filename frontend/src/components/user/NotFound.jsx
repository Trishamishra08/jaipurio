import React from 'react';
import { Link } from 'react-router-dom';
import { usePageSeo } from '../../utils/seo';

/**
 * Shown for any URL that doesn't exist (instead of silently redirecting to
 * /home, which search engines treat as a "soft 404"). Marked noindex so the
 * wrong URL never gets indexed.
 */
const NotFound = ({ title = 'Page not found', message }) => {
  usePageSeo({ title, noindex: true, description: 'The page you are looking for does not exist.' });

  return (
    <section className="min-h-[60vh] flex items-center justify-center px-4 py-16 bg-white">
      <div className="text-center max-w-md">
        <p className="font-playfair text-6xl font-semibold text-[#6F241D]">404</p>
        <h1 className="mt-3 text-xl font-bold text-[#2B1E1A]">{title}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {message || 'The page you were looking for has moved or no longer exists.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/home" className="rounded-full bg-[#6F241D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#873A24]">
            Go to home
          </Link>
          <Link to="/shop" className="rounded-full border border-[#6F241D] px-5 py-2.5 text-sm font-semibold text-[#6F241D] hover:bg-[#FCF8F2]">
            Browse the shop
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
