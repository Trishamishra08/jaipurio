import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiLock, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import api from '../../utils/api';

const CAROUSEL = [
  '/login_hero_1.png',
  '/login_hero_2.png',
  '/jaipurio_banner_clean.png',
];

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    gender: '',
    email: '',
    mobile: '',
    otp: '',
    agreed: false,
  });
  const [slide, setSlide] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useShop();

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

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

  const handleSendOtp = async () => {
    if (!form.mobile || !/^\d{10}$/.test(form.mobile)) {
      showNotification('Please enter a valid 10-digit mobile number first', 'error');
      return;
    }

    try {
      const response = await api.post('/users/send-register-otp', { mobile: form.mobile });
      if (response.data.success) {
        setOtpSent(true);
        setTimer(60);
        if (response.data.devOtp) {
          setForm((prev) => ({ ...prev, otp: response.data.devOtp }));
          showNotification(`OTP sent! (Dev mode: ${response.data.devOtp})`, 'success');
        } else {
          showNotification('OTP sent successfully to your mobile number.', 'success');
        }
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to send OTP', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let nextValue = type === 'checkbox' ? checked : value;
    if (name === 'mobile') {
      nextValue = value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10);
    }
    if (name === 'otp') {
      nextValue = value.replace(/\D/g, '').slice(0, 6);
    }
    setForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const isFormComplete =
    form.name.trim() !== '' &&
    form.gender !== '' &&
    form.email.trim() !== '' &&
    form.mobile.trim() !== '' &&
    form.otp.trim() !== '' &&
    form.agreed;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.agreed) {
      showNotification('Please agree to the Terms & Conditions', 'error');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }
    if (!/^\d{10}$/.test(form.mobile)) {
      showNotification('Please enter a valid 10-digit mobile number', 'error');
      return;
    }
    if (!form.otp || form.otp.length !== 6) {
      showNotification('Please enter a valid 6-digit OTP', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/users/register', {
        name: form.name,
        gender: form.gender,
        email: form.email,
        mobile: form.mobile,
        otp: form.otp,
      });

      if (response.data.success) {
        const token = response.data.data.token;
        const userData = response.data.data;

        localStorage.setItem('customer_token', token);
        try {
          localStorage.setItem('jaipurio_auth', '1');
          localStorage.setItem('jaipurio_user', JSON.stringify(userData));
        } catch {
          /* ignore */
        }
        if (setUser && setIsAuthenticated) {
          setUser(userData);
          setIsAuthenticated(true);
        }

        showNotification('Account created successfully! Welcome to jaipurio.', 'success');
        setTimeout(() => navigate('/home'), 1200);
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-[#FFFbf5] border border-[#E0D0B5] rounded-xl pl-11 pr-4 py-2.5 text-sm font-body text-[#2B1E1A] placeholder:text-gray-400 outline-none focus:border-[#6F241D] focus:ring-1 focus:ring-[#6F241D]/30 transition-all';

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
            <div className="px-5 pt-4 pb-8 sm:px-8 md:px-10 md:pt-12 lg:pt-14 max-w-md mx-auto w-full">

              <div className="text-center mb-4 md:mb-6 md:text-left">
                <img
                  src="/jaipurio_logo_bg.png"
                  alt="jaipurio"
                  className="h-14 sm:h-16 md:h-[4.25rem] w-auto mx-auto md:mx-0 object-contain select-none mb-3 rounded-lg"
                  draggable={false}
                />
                <h1 className="font-heading text-xl sm:text-2xl md:text-4xl font-bold text-[#6F241D]">
                  Create Account
                </h1>
                <p className="font-body text-[12px] sm:text-sm text-[#4A3A2F]/85 mt-1 leading-snug max-w-sm mx-auto md:mx-0">
                  Join jaipurio and shop authentic Rajasthani crafts.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-2.5">
                {/* Name */}
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A94E2C] text-lg" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    required
                    className={inputClass}
                  />
                </div>

                {/* Gender */}
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A94E2C] text-lg z-10 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                    className={`${inputClass} text-left flex items-center justify-between pr-3 ${
                      form.gender ? 'text-[#2B1E1A]' : 'text-gray-400'
                    }`}
                  >
                    <span>
                      {form.gender
                        ? form.gender.charAt(0).toUpperCase() + form.gender.slice(1)
                        : 'Select Gender'}
                    </span>
                    <svg
                      className={`w-4 h-4 text-[#A94E2C] transition-transform ${
                        isGenderDropdownOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {isGenderDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 mt-1.5 bg-white border border-[#E0D0B5] rounded-xl shadow-lg z-50 overflow-hidden"
                      >
                        {['female', 'male', 'other'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, gender: g });
                              setIsGenderDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm font-body text-[#4A3A2F] hover:bg-[#F8F1E3] hover:text-[#6F241D] transition-colors"
                          >
                            {g.charAt(0).toUpperCase() + g.slice(1)}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Email */}
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A94E2C] text-lg" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="Email Address"
                    required
                    className={inputClass}
                  />
                </div>

                {/* Mobile */}
                <div className="relative">
                  <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A94E2C] text-lg" />
                  <input
                    type="tel"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleInputChange}
                    placeholder="10-digit Mobile Number"
                    maxLength={10}
                    inputMode="numeric"
                    required
                    className={`${inputClass} pr-[5.5rem]`}
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

                {/* OTP */}
                <div>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A94E2C] text-lg" />
                    <input
                      type="text"
                      name="otp"
                      value={form.otp}
                      onChange={handleInputChange}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      inputMode="numeric"
                      disabled={!otpSent}
                      className={`${inputClass} tracking-widest disabled:bg-[#F0E6D4] disabled:cursor-not-allowed`}
                    />
                  </div>
                  <AnimatePresence>
                    {otpSent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex justify-end mt-1.5"
                      >
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={timer > 0}
                          className={`font-body text-[10px] font-semibold ${
                            timer > 0
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-[#A94E2C] hover:underline'
                          }`}
                        >
                          {timer > 0
                            ? `Resend OTP in 00:${timer < 10 ? '0' : ''}${timer}`
                            : 'Resend OTP'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    name="agreed"
                    id="agreed"
                    checked={form.agreed}
                    onChange={handleInputChange}
                    className="mt-0.5 shrink-0 accent-[#6F241D] rounded"
                  />
                  <label htmlFor="agreed" className="font-body text-[10px] sm:text-xs text-[#4A3A2F] leading-tight">
                    I agree to the{' '}
                    <span className="font-semibold text-[#6F241D]">Terms & Conditions</span> and{' '}
                    <span className="font-semibold text-[#6F241D]">Privacy Policy</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!isFormComplete || loading}
                  className="w-full mt-1 bg-[#6F241D] hover:bg-[#873A24] text-white py-3 rounded-xl text-sm font-semibold tracking-wide shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-body"
                >
                  {loading ? 'Creating account…' : 'Sign Up'}
                </button>
              </form>

              <p className="mt-5 text-center font-body text-sm text-[#4A3A2F]">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-[#6F241D] hover:underline">
                  Sign In →
                </Link>
              </p>

              <p className="mt-2.5 text-center">
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

export default Register;
