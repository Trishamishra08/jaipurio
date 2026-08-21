import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { Smartphone } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { registerFCMToken } from '../../services/pushNotificationService';
import api from '../../utils/api';

const DEMO_MOBILE = '8839044030';
const DEMO_OTP = '123456';

const CAROUSEL = [
  '/login_hero_1.png',
  '/login_hero_2.png',
  '/jaipurio_banner_clean.png',
];

const resolveRedirect = (from, fallback = '/home') => {
  if (!from) return fallback;
  if (typeof from === 'string') {
    if (from === '/' || from === '/login' || from === '/splash') return fallback;
    return from;
  }
  const path = from.pathname || fallback;
  if (path === '/' || path === '/login') return fallback;
  return path;
};

const Auth = () => {
  const { isAuthenticated, setIsAuthenticated, setUser } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPath = location.pathname.includes('/admin');

  const [slide, setSlide] = useState(0);
  const [form, setForm] = useState({ mobile: '', email: '', password: '', otp: '' });
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (isAuthenticated && !isAdminPath) {
      navigate(resolveRedirect(location.state?.from, '/home'), { replace: true });
    }
  }, [isAuthenticated, isAdminPath, navigate, location.state]);

  /* Auto carousel 2.5s */
  useEffect(() => {
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % CAROUSEL.length);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (timer <= 0) return undefined;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const persistLogin = (userData) => {
    if (setUser) setUser(userData);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('jaipurio_auth', '1');
      localStorage.setItem('jaipurio_user', JSON.stringify(userData));
    } catch {
      /* ignore */
    }
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'mobile') {
      value = value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10);
    }
    if (name === 'otp') {
      value = value.replace(/\D/g, '').slice(0, 6);
    }
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSendOtp = async () => {
    const newErrors = {};
    if (!form.mobile || form.mobile.length !== 10) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    /* Demo user — local OTP */
    if (form.mobile === DEMO_MOBILE) {
      setOtpSent(true);
      setTimer(60);
      setForm((prev) => ({ ...prev, otp: DEMO_OTP }));
      showNotification(`OTP sent! (Demo OTP: ${DEMO_OTP})`);
      return;
    }

    try {
      const res = await api.post('/users/send-otp', { mobile: form.mobile });
      if (res.data.success) {
        setOtpSent(true);
        setTimer(60);
        if (res.data.devOtp) {
          setForm((prev) => ({ ...prev, otp: res.data.devOtp }));
          showNotification(`OTP sent! (Dev: ${res.data.devOtp})`);
        } else {
          showNotification('OTP sent successfully to your mobile number.');
        }
      }
    } catch {
      /* Fallback demo for any number in local UI testing */
      setOtpSent(true);
      setTimer(60);
      showNotification('OTP sent (use 123456 for demo login)', 'success');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (isAdminPath) {
      if (!form.email) newErrors.email = 'Enter your admin email';
      if (!form.password) newErrors.password = 'Enter your password';
    } else {
      if (!form.mobile || form.mobile.length !== 10) {
        newErrors.mobile = 'Enter a valid 10-digit mobile number';
      }
      if (!form.otp || form.otp.length !== 6) {
        newErrors.otp = 'Enter a valid 6-digit OTP';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      if (isAdminPath) {
        const res = await api.post('/users/login', {
          email: form.email,
          password: form.password,
        });
        if (res.data.success) {
          const { token, ...userData } = res.data.data;
          localStorage.setItem('admin_token', token);
          registerFCMToken(true).catch(console.error);
          persistLogin(userData);
          showNotification('Login Successful! Welcome to jaipurio.');
          setTimeout(() => navigate(resolveRedirect(location.state?.from, '/admin')), 800);
        }
      } else if (form.mobile === DEMO_MOBILE && form.otp === DEMO_OTP) {
        const userData = {
          name: 'Demo User',
          mobile: DEMO_MOBILE,
          phone: `+91 ${DEMO_MOBILE}`,
          email: 'demo@jaipurio.com',
          address: 'Johari Bazaar, Jaipur, Rajasthan',
        };
        localStorage.setItem('customer_token', 'demo-token-jaipurio');
        persistLogin(userData);
        showNotification('Login Successful! Welcome to jaipurio.');
        setTimeout(() => navigate(resolveRedirect(location.state?.from, '/home')), 800);
      } else if (form.otp === DEMO_OTP) {
        /* Any mobile + demo OTP for local testing */
        const userData = {
          name: 'Jaipurio Guest',
          mobile: form.mobile,
          phone: `+91 ${form.mobile}`,
          email: '',
        };
        localStorage.setItem('customer_token', 'demo-token-jaipurio');
        persistLogin(userData);
        showNotification('Login Successful! Welcome to jaipurio.');
        setTimeout(() => navigate(resolveRedirect(location.state?.from, '/home')), 800);
      } else {
        const res = await api.post('/users/verify-otp', {
          mobile: form.mobile,
          otp: form.otp,
        });
        if (res.data.success) {
          const { token, ...userData } = res.data.data;
          localStorage.setItem('customer_token', token);
          registerFCMToken(true).catch(console.error);
          persistLogin(userData);
          showNotification('Login Successful! Welcome to jaipurio.');
          setTimeout(() => navigate(resolveRedirect(location.state?.from, '/home')), 800);
        }
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Invalid credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[999] w-full h-[100dvh] bg-[#F8F1E3] font-body overflow-hidden">
        <div className="flex flex-col h-full w-full max-w-lg mx-auto md:max-w-none md:flex-row relative">

          {/* ===== HERO / CAROUSEL ===== */}
          <div className="relative w-full md:w-[48%] lg:w-[52%] h-[26vh] sm:h-[28vh] md:h-full shrink-0 overflow-hidden bg-[#EFE0C9]">
            <AnimatePresence mode="wait">
              <motion.img
                key={CAROUSEL[slide]}
                src={CAROUSEL[slide]}
                alt="jaipurio heritage"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
                draggable={false}
              />
            </AnimatePresence>

            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/25 via-black/10 to-transparent" />

            {/* Brand always on banner */}
            <div className="absolute top-3 sm:top-4 left-0 right-0 z-10 text-center px-4 md:top-6">
              <p className="font-brand text-[26px] sm:text-3xl md:text-4xl font-bold tracking-[0.05em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
                jaipurio
              </p>
              <p className="font-brand text-[10px] sm:text-xs md:text-sm italic text-white/95 mt-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
                Mitti ki khushboo, Rajasthan ki pehchaan
              </p>
            </div>

            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 md:bottom-8">
              {CAROUSEL.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlide(i)}
                  className={`rounded-full transition-all ${
                    slide === i ? 'w-5 h-2 bg-[#6F241D]' : 'w-2 h-2 bg-[#E8D4B5] border border-[#6F241D]/40'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* ===== FORM SHEET ===== */}
          <div className="flex-1 relative z-20 -mt-4 md:mt-0 rounded-t-[24px] md:rounded-none bg-[#F8F1E3] shadow-[0_-6px_20px_rgba(111,36,29,0.1)] md:shadow-none overflow-y-auto">
            <div className="px-5 pt-4 pb-8 sm:px-8 md:px-10 md:pt-12 lg:pt-16 max-w-md mx-auto w-full">

              <div className="text-center mb-4 md:mb-8 md:text-left">
                <h1 className="font-heading text-xl sm:text-2xl md:text-4xl font-bold text-[#6F241D]">
                  Welcome Back!
                </h1>
                <p className="font-body text-[12px] sm:text-sm text-[#4A3A2F]/85 mt-1 leading-snug max-w-sm mx-auto md:mx-0">
                  Login to continue shopping authentic Rajasthani products.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Mobile */}
                <div>
                  <label className="font-body text-[11px] font-semibold text-[#4A3A2F] mb-1.5 block">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Smartphone
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A94E2C]"
                    />
                    <input
                      type="tel"
                      name="mobile"
                      value={form.mobile}
                      onChange={handleInputChange}
                      placeholder="Enter your mobile number"
                      maxLength={10}
                      inputMode="numeric"
                      className={`w-full bg-[#FFFbf5] border ${
                        errors.mobile ? 'border-red-400' : 'border-[#E0D0B5]'
                      } rounded-xl pl-11 pr-[5.5rem] py-3 text-sm font-body text-[#2B1E1A] placeholder:text-gray-400 outline-none focus:border-[#6F241D] focus:ring-1 focus:ring-[#6F241D]/30 transition-all`}
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSent && timer > 0}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-[#6F241D] text-white hover:bg-[#873A24] disabled:bg-[#C9B89A] disabled:cursor-not-allowed transition-all"
                    >
                      {otpSent && timer > 0 ? `${timer}s` : 'Send OTP'}
                    </button>
                  </div>
                  {errors.mobile && (
                    <p className="text-red-500 text-[11px] mt-1 font-body">{errors.mobile}</p>
                  )}
                </div>

                {/* OTP */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-body text-[11px] font-semibold text-[#4A3A2F]">
                      OTP
                    </label>
                    <button
                      type="button"
                      className="font-body text-[10px] font-semibold text-[#A94E2C] hover:underline"
                      onClick={() => {
                        showNotification(`Demo: ${DEMO_MOBILE} / OTP ${DEMO_OTP}`);
                      }}
                    >
                      Forgot OTP?
                    </button>
                  </div>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A94E2C] text-lg" />
                    <input
                      type={showOtp ? 'text' : 'password'}
                      name="otp"
                      value={form.otp}
                      onChange={handleInputChange}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      inputMode="numeric"
                      className={`w-full bg-[#FFFbf5] border ${
                        errors.otp ? 'border-red-400' : 'border-[#E0D0B5]'
                      } rounded-xl pl-11 pr-11 py-3 text-sm font-body text-[#2B1E1A] placeholder:text-gray-400 outline-none focus:border-[#6F241D] focus:ring-1 focus:ring-[#6F241D]/30 transition-all tracking-widest`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOtp(!showOtp)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6F241D]"
                    >
                      {showOtp ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.otp && (
                    <p className="text-red-500 text-[11px] mt-1 font-body">{errors.otp}</p>
                  )}
                  <p className="mt-1.5 text-[10px] text-[#70452F]/70 font-body">
                    Demo login: <span className="font-semibold">{DEMO_MOBILE}</span> · OTP{' '}
                    <span className="font-semibold">{DEMO_OTP}</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-[#6F241D] hover:bg-[#873A24] text-white py-3.5 rounded-xl text-sm font-semibold tracking-wide shadow-md active:scale-[0.98] disabled:opacity-60 transition-all font-body"
                >
                  {loading ? 'Logging in…' : 'Login'}
                </button>
              </form>

              <p className="mt-6 text-center font-body text-sm text-[#4A3A2F]">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-bold text-[#6F241D] hover:underline">
                  Sign Up →
                </Link>
              </p>

              <p className="mt-3 text-center">
                <Link
                  to="/home"
                  className="font-body text-xs font-semibold text-[#A94E2C] hover:underline"
                >
                  Continue as Guest
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-8 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:min-w-[320px] z-[1001] bg-white border-l-4 border-[#6F241D] shadow-xl px-5 py-3.5 flex items-center gap-3 rounded-r-xl"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                notification.type === 'error'
                  ? 'bg-red-50 text-red-500'
                  : 'bg-[#F8F1E3] text-[#6F241D]'
              }`}
            >
              {notification.type === 'error' ? '!' : <FiCheckCircle size={18} />}
            </div>
            <div>
              <p className="text-sm font-bold text-[#2B1E1A] font-body">
                {notification.type === 'error' ? 'Error' : 'Success'}
              </p>
              <p className="text-xs text-[#4A3A2F] font-body">{notification.msg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Auth;
