import React from 'react';
import AdminLayout from './AdminLayout';
import { FiClock, FiSettings, FiUsers, FiImage } from 'react-icons/fi';

const AdminComingSoon = ({ title, icon }) => {
  return (
    <div className="max-w-4xl mx-auto py-20 text-center">
      <div className="flex justify-center mb-6">
         <div className="bg-admin-accent/10 p-4 rounded-3xl animate-pulse text-admin-accent">
           {icon || <FiClock size={40} />}
         </div>
      </div>
      <h1 className="text-3xl font-['Cormorant',_serif] font-bold text-admin-dark leading-none mb-2">
          {title} Feature
        </h1>
        <p className="text-gray-500 text-[13px] font-poppins">
          <span classname="w-10 h-[1px] bg-admin-accent/20" /> under development <span classname="w-10 h-[1px] bg-admin-accent/20" />
        </p>
      <button className="bg-admin-dark text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-admin-dark/20 hover:scale-105 transition-all">
        Coming Soon to Sada Bharat
      </button>
    </div>
  );
};

export default AdminComingSoon;
