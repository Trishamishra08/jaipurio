import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSmartphone, FiArrowRight } from 'react-icons/fi';
import { useShop } from '../../context/ShopContext';

import logoPink from '../../assets/images/logo_pink.png';

const AuthModal = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, setIsAuthenticated } = useShop();
  const [step, setStep] = useState(1); // 1 = Phone input, 2 = OTP input
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setTimeout(() => {
      setStep(1);
      setPhone('');
      setOtp(['', '', '', '']);
    }, 300);
  };

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (phone.length === 10) {
      setStep(2);
    }
  };

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto focus next input
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (otp.join('').length === 4) {
      setIsAuthenticated(true);
      handleClose();
      // Optionally fire a toast notification that login was successful
    }
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header Banner - Like Myntra */}
          <div className="bg-[#FFEFEF] p-8 text-center relative border-b border-brand-pink/20">
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-[#5C2E3E] hover:bg-white rounded-full transition-all"
            >
              <FiX className="w-5 h-5" />
            </button>

            <img src={logoPink} alt="Logo" className="h-12 mx-auto mb-4" />
            <h2 className="text-xl font-serif font-black text-[#5C2E3E] uppercase tracking-widest leading-none">
              Welcome to the <br/> World of Sada Bharat
            </h2>
          </div>

          <div className="p-8">
            {step === 1 ? (
              <motion.form 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handlePhoneSubmit}
              >
                <div className="mb-6">
                  <h3 className="font-bold text-lg text-brand-dark mb-1">Login <span className="text-sm font-normal text-gray-400">or</span> Signup</h3>
                  <p className="text-xs text-gray-500 font-medium">Please enter your mobile number to continue</p>
                </div>
                
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none border-r border-gray-200 pr-3">
                    <span className="text-gray-500 font-bold text-sm">+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength="10"
                    placeholder="Enter Mobile Number"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-20 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink outline-none transition-all placeholder:font-normal"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={phone.length !== 10}
                  className="w-full bg-[#5C2E3E] text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue <FiArrowRight />
                </button>
                
                <p className="text-[10px] text-center text-gray-400 mt-6 leading-relaxed">
                  By continuing, I agree to the <br/>
                  <a href="#" className="text-brand-pink font-bold hover:underline">Terms of Use</a> & <a href="#" className="text-brand-pink font-bold hover:underline">Privacy Policy</a>
                </p>
              </motion.form>
            ) : (
              <motion.form 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleLogin}
              >
                <div className="mb-6">
                  <h3 className="font-bold text-lg text-brand-dark mb-1">Verify with OTP</h3>
                  <p className="text-xs text-gray-500 font-medium">Sent to +91 {phone}</p>
                </div>
                
                <div className="flex justify-between gap-3 mb-6">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength="1"
                      required
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                      className="w-12 h-12 text-center border border-gray-200 rounded-xl text-lg font-black focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink outline-none transition-all text-[#5C2E3E]"
                    />
                  ))}
                </div>

                <button 
                  type="submit"
                  disabled={otp.join('').length !== 4}
                  className="w-full bg-[#5C2E3E] text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify <FiArrowRight />
                </button>
                
                <p className="text-[10px] text-center text-gray-500 mt-6">
                  Didn't receive the OTP? <button type="button" className="text-brand-pink font-bold hover:underline ml-1 uppercase tracking-wider">Resend Now</button>
                </p>
              </motion.form>
            )}
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
