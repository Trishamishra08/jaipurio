import React from 'react';
import ProfileSidebar from './ProfileSidebar';
import { useShop } from '../../context/ShopContext';

const ChangePassword = () => {
  const { user } = useShop();

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-4 md:pt-6 pb-12 font-sans selection:bg-[#054425] selection:text-white">
      <div className="w-full px-4 lg:px-8 flex flex-col lg:flex-row gap-6">
        
        <ProfileSidebar activeTab="password" />
        
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#054425] mb-1">Change Password</h1>
              <p className="text-xs text-gray-500 font-medium">Update your account password</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4 md:p-6 shadow-sm">
            <form className="max-w-md flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">Current Password</label>
                <input 
                  type="password" 
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-[#054425] focus:border-[#054425] block p-2.5 transition-colors" 
                  placeholder="••••••••" 
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">New Password</label>
                <input 
                  type="password" 
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-[#054425] focus:border-[#054425] block p-2.5 transition-colors" 
                  placeholder="••••••••" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">Confirm New Password</label>
                <input 
                  type="password" 
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-[#054425] focus:border-[#054425] block p-2.5 transition-colors" 
                  placeholder="••••••••" 
                />
              </div>

              <div className="pt-2">
                <button type="button" className="bg-[#054425] text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-[#04331c] transition-colors shadow-md">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChangePassword;
