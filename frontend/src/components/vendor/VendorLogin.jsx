import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mediaUrl } from '../../data/cloudinaryMedia';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { registerFCMToken } from '../../services/pushNotificationService';
import api from '../../utils/api';

const DEMO_EMAIL = 'vendor@jaipurio.com';
const DEMO_PASSWORD = '123456';

const finishLogin = (token, navigate) => {
  localStorage.setItem('vendor_token', token);
  localStorage.setItem('vendor_auth', 'true');
  registerFCMToken(true).catch(() => {});
  if (window.showVendorToast) {
    window.showVendorToast('Logged in successfully!', 'success');
  }
  navigate('/vendor');
};

const VendorLogin = () => {
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) return setError('Email Required');
    if (!password) return setError('Password Required');

    setIsSubmitting(true);
    try {
      const res = await api.post('/vendors/login', { email, password }, { timeout: 5000 });
      if (res.data.success) {
        finishLogin(res.data.data.token, navigate);
        return;
      }
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        finishLogin('demo-vendor-token', navigate);
        return;
      }
      setError(res.data.message || 'Invalid Credentials');
    } catch (err) {
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        finishLogin('demo-vendor-token', navigate);
        return;
      }
      setError(err.response?.data?.message || err.parsedMessage || 'Invalid Credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] w-full h-[100dvh] bg-white font-dm overflow-hidden !m-0 !p-0">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col md:flex-row w-full h-full relative"
      >
        <div className="relative w-full md:w-[50%] lg:w-[55%] h-[32vh] sm:h-[40vh] md:h-full shrink-0">
          <img
            src={mediaUrl('/jaipurio_banner_clean.png')}
            alt="jaipurio artisan"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = mediaUrl('/matka.png');
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#3D1E16]/92 via-[#6F241D]/55 to-transparent z-10" />

          <div className="hidden md:block absolute top-0 -right-[2px] h-full w-[250px] z-20">
            <svg viewBox="0 0 250 1000" preserveAspectRatio="none" className="w-full h-full text-white fill-current">
              <path d="M250,0 L250,1000 L0,1000 C180,920 60,680 120,450 C180,220 80,80 250,0 Z" />
            </svg>
          </div>

          <div className="block md:hidden absolute bottom-0 left-0 w-full h-[80px] z-20">
            <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="w-full h-full text-white fill-current">
              <path d="M0,100 L1000,100 L1000,40 C800,120 400,0 0,60 Z" />
            </svg>
          </div>

          <div className="absolute inset-0 p-4 pt-4 md:p-12 flex flex-col z-30 text-white">
            <div className="flex items-center gap-3 md:gap-4">
              <img
                src={mediaUrl('/jaipurio_logo_bg.png')}
                alt="jaipurio"
                className="h-12 md:h-16 w-auto object-contain rounded-md shrink-0"
                style={{ mixBlendMode: 'screen' }}
              />
              <div className="flex flex-col">
                <p className="text-[10px] md:text-xs font-medium tracking-widest text-white/90 uppercase">
                  Artisan Seller
                </p>
              </div>
            </div>

            <div className="mt-4 md:mt-28">
              <h2 className="text-2xl md:text-4xl font-playfair font-semibold text-white mb-2">
                Welcome Back!
              </h2>
              <p className="text-xs md:text-base text-white/95 font-medium max-w-[220px] md:max-w-sm leading-snug">
                Sign in to manage your mitti crafts, orders, and earnings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-6 py-4 md:px-12 md:py-8 relative z-20 bg-white overflow-y-auto">
          <div className="w-full max-w-md md:-translate-x-6 lg:-translate-x-10 relative z-10 pt-2">
            <div className="text-center mb-5">
              <img
                src={mediaUrl('/jaipurio_logo_bg.png')}
                alt="jaipurio"
                className="h-14 md:h-16 w-auto mx-auto object-contain mb-3 rounded-lg"
                draggable={false}
              />
              <h2 className="text-3xl md:text-4xl font-playfair font-semibold text-[#6F241D]">Sign In</h2>
              <p className="text-[11px] text-[#806653] mt-2">Demo: {DEMO_EMAIL} / {DEMO_PASSWORD}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address *"
                  className="w-full bg-white border border-[#E8E2D9] focus:border-[#6F241D] pl-11 pr-4 py-3 rounded-xl text-sm font-medium outline-none text-[#3F261B]"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password *"
                  className="w-full bg-white border border-[#E8E2D9] focus:border-[#6F241D] pl-11 pr-12 py-3 rounded-xl text-sm font-medium outline-none text-[#3F261B]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-[#6F241D]" />
                  <span className="text-xs text-[#806653] font-medium">Remember Me</span>
                </label>
                <span className="text-xs font-semibold text-[#6F241D]">Forgot Password?</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full text-white py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${
                  isSubmitting ? 'bg-gray-400' : 'bg-[#6F241D] hover:bg-[#3D1E16]'
                }`}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'} {!isSubmitting && <ArrowRight size={16} />}
              </button>
            </form>

            <p className="text-center text-xs text-[#806653] mt-5">
              Don&apos;t have a seller account?{' '}
              <Link to="/vendor/register" className="font-semibold text-[#6F241D]">
                Register as Vendor
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VendorLogin;
