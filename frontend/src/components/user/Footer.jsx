import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full bg-[#2B1E1A] text-[#E8D4B5] pt-5 pb-14 md:pb-5 border-t border-[#C69A45]/40">
      <div className="max-w-7xl mx-auto px-3 sm:px-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="font-playfair font-semibold text-lg text-white tracking-wide">jaipurio</p>
              <p className="font-playfair text-[10px] italic text-[#E8D4B5]/80 mt-0.5">
                Mitti ki khushboo, Rajasthan ki pehchaan
              </p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 font-dm text-[10px]">
              <Link to="/shop" className="hover:text-white transition-colors">Shop</Link>
              <Link to="/orders" className="hover:text-white transition-colors">Orders</Link>
              <Link to="/wishlist" className="hover:text-white transition-colors">Wishlist</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Support</Link>
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 font-dm text-[9px] sm:text-[10px]">
            <div>
              <p className="text-[#C69A45] font-semibold uppercase tracking-wider mb-1">Shop</p>
              <ul className="space-y-0.5 text-[#E8D4B5]/75">
                <li><Link to="/shop?category=Matkas" className="hover:text-white">Matkas</Link></li>
                <li><Link to="/shop?category=Kulhads" className="hover:text-white">Kulhads</Link></li>
                <li><Link to="/shop?category=Planters" className="hover:text-white">Planters</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[#C69A45] font-semibold uppercase tracking-wider mb-1">Help</p>
              <ul className="space-y-0.5 text-[#E8D4B5]/75">
                <li><Link to="/orders" className="hover:text-white">Track order</Link></li>
                <li><Link to="/return-policy" className="hover:text-white">Returns</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[#C69A45] font-semibold uppercase tracking-wider mb-1">Account</p>
              <ul className="space-y-0.5 text-[#E8D4B5]/75">
                <li><Link to="/profile" className="hover:text-white">Profile</Link></li>
                <li><Link to="/wishlist" className="hover:text-white">Wishlist</Link></li>
                <li><Link to="/terms-conditions" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 font-dm text-[9px] text-[#E8D4B5]/55">
            <p>© 2026 jaipurio · Made in Rajasthan</p>
            <p>namaste@jaipurio.com</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
