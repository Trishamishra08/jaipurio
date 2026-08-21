import React from 'react';
import { motion } from 'framer-motion';
import './AppPromotionBanner.css';
import logo from '../../assets/images/logo.png';

const AppPromotionBanner = () => {
  return (
    <section className="app-promo-section">
      <div className="container mx-auto px-4">
        <div className="app-promo-container">
          <div className="promo-blob blob-1"></div>
          <div className="promo-blob blob-2"></div>

          <div className="app-promo-content">
            <span className="app-promo-tag">Exclusive Mobile Experience</span>
            <motion.h2 
              className="app-promo-title"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Beauty at Your <br className="hidden md:block" /> Fingertips
            </motion.h2>
            <p className="app-promo-description">
              Experience Sada Bharat like never before. Download our app for a faster, smoother shopping experience and exclusive in-app offers specially curated for you.
            </p>
            
            <div className="app-download-buttons">
              <a href="#" className="store-button">
                <svg width="170" height="50" viewBox="0 0 216 64">
                    <defs>
                        <linearGradient id="g1" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#111"/>
                            <stop offset="100%" stopColor="#000"/>
                        </linearGradient>
                    </defs>
                    <rect width="216" height="64" rx="8" fill="url(#g1)"/>
                    <path d="M43.04 18.12c-.22-.24-.52-.38-.85-.38-.28 0-.54.12-.73.29l-11.85 11.59-1.29-1.26 12.33-12.06c.45-.44 1.1-.64 1.74-.53.64.12 1.18.57 1.44 1.18.25.61.2 1.3-.13 1.86l-3.23 5.43 2.57 2.02 0 0z" fill="#fff" opacity=".5"/>
                    <path d="M19.34 11.08c-.73-.73-1.92-.73-2.65 0l-12.91 12.91c-.73.73-.73 1.92 0 2.65l12.91 12.91c.73.73 1.92.73 2.65 0l12.91-12.91c.73-.73.73-1.92 0-2.65l-12.91-12.91z" fill="#00E676"/>
                    <path d="M11.39 12.04l13.52 13.52-13.52 13.52c-.62.62-1.63.62-2.25 0s-.62-1.63 0-2.25l11.27-11.27-11.27-11.27c-.62-.62-.62-1.63 0-2.25s1.63-.62 2.25 0z" fill="#fff"/>
                    <text x="60" y="28" fill="#fff" fontFamily="Arial" fontSize="11">GET IT ON</text>
                    <text x="60" y="48" fill="#fff" fontFamily="Arial" fontSize="20" fontWeight="bold">Google Play</text>
                </svg>
              </a>
              <a href="#" className="store-button">
                <svg width="170" height="50" viewBox="0 0 216 64">
                    <rect width="216" height="64" rx="8" fill="#000"/>
                    <path d="M37.8 33.1c-.1 4.7 4.1 6.9 4.3 7-.1.2-.7 2.2-2.2 4.4-1.3 1.9-2.6 3.8-4.8 3.8-2.1 0-2.8-1.3-5.2-1.3s-3.2 1.3-5.2 1.3c-2 0-3.5-2.1-4.8-4.1-2.7-3.9-4.8-11-2-15.8 1.4-2.4 3.8-3.9 6.4-3.9 2 0 3.9 1.4 5.1 1.4 1.1 0 3.5-1.7 6-1.4 1 .1 3.9.4 5.8 3.1-.1.1-3.5 2-3.4 5.7M33.6 22.1c1.1-1.4 1.9-3.3 1.7-5.3-1.7.1-3.7 1.1-4.9 2.6-1 1.2-2 3.1-1.8 5 1.9.1 3.8-1 5-2.3" fill="#fff"/>
                    <text x="60" y="28" fill="#fff" fontFamily="Arial" fontSize="11">Download on the</text>
                    <text x="60" y="48" fill="#fff" fontFamily="Arial" fontSize="20" fontWeight="bold">App Store</text>
                </svg>
              </a>
            </div>
          </div>

          <div className="app-mockup-wrapper">
            <div className="smartphone">
              <div className="smartphone-screen">
                <div className="mockup-app-ui">
                  <div className="mockup-header">
                    <img src={logo} alt="Logo" style={{ height: '30px', filter: 'brightness(0) invert(1)' }} />
                  </div>
                  <div className="mockup-content">
                    <div className="mockup-loader gold" style={{ width: '60%' }}></div>
                    <div className="mockup-loader" style={{ width: '40%', marginBottom: '20px' }}></div>
                    
                    <div className="mockup-item">
                       <div style={{ flex: 1, backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '10px' }}></div>
                       <div className="mockup-loader"></div>
                       <div className="mockup-loader short"></div>
                    </div>
                    
                    <div className="mockup-item">
                       <div style={{ flex: 1, backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '10px' }}></div>
                       <div className="mockup-loader"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppPromotionBanner;
