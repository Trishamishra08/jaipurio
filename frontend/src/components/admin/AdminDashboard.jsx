import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Package, 
  ShoppingBag, 
  Tag, 
  TrendingUp, 
  Check, 
  X,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';

const AdminDashboard = () => {
  const { products, vendors, orders } = useShop();
  const [activeTab, setActiveTab] = useState('overview');

  const pendingVendors = [
    { id: 'v-new-1', name: 'Alwar Terracotta Pottery', owner: 'Ramesh Kumhar', location: 'Alwar, Rajasthan', specialty: 'Kagzi Pottery', status: 'Pending Review' },
    { id: 'v-new-2', name: 'Marwar Mitti Kala', owner: 'Geeta Devi', location: 'Nagaur, Rajasthan', specialty: 'Traditional Cooking Pots', status: 'Pending Review' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-[#201512] text-[#E8D4B5] p-4 flex flex-col justify-between shrink-0 border-r border-[#C69A45]/40">
        <div>
          <div className="flex items-center gap-2 pb-4 border-b border-[#E8D4B5]/20 mb-4">
            <div>
              <h2 className="font-playfair font-semibold text-lg text-white">jaipurio</h2>
              <p className="font-dm text-[10px] text-[#C69A45]">Admin Panel</p>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-semibold">
            {[
              { id: 'overview', label: 'Admin Dashboard', icon: <LayoutDashboard size={16} /> },
              { id: 'vendors', label: 'Artisans & Approvals', icon: <Store size={16} /> },
              { id: 'products', label: 'All Catalog Crafts', icon: <Package size={16} /> },
              { id: 'orders', label: 'Marketplace Orders', icon: <ShoppingBag size={16} /> },
              { id: 'customers', label: 'Registered Customers', icon: <Users size={16} /> },
              { id: 'analytics', label: 'Revenue Reports', icon: <TrendingUp size={16} /> },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                  activeTab === item.id 
                    ? 'bg-[#6F241D] text-white font-bold' 
                    : 'text-[#E8D4B5]/80 hover:bg-[#3D1E16] hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-[#E8D4B5]/20">
          <a href="/home" className="font-dm text-xs font-semibold text-[#E8D4B5]/80 hover:text-white block text-center">
            ← Back to Store
          </a>
        </div>
      </aside>

      {/* Main Admin Area */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#6F241D]">Marketplace Super Admin</h1>
              <p className="text-xs sm:text-sm text-[#70452F]">Rajasthan multi-vendor handicraft marketplace monitoring.</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl p-5 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#70452F]">Total Platform Sales</span>
                <h3 className="text-2xl font-black text-[#6F241D] mt-1">₹4,82,450</h3>
                <span className="text-[10px] text-[#354B35] font-bold flex items-center gap-1 mt-1">
                  <ArrowUpRight size={12} /> +24.8% growth
                </span>
              </div>
              <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl p-5 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#70452F]">Verified Artisans</span>
                <h3 className="text-2xl font-black text-[#6F241D] mt-1">{vendors.length}</h3>
                <span className="text-[10px] text-[#A94E2C] font-bold mt-1 block">2 pending applications</span>
              </div>
              <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl p-5 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#70452F]">Total Handicrafts</span>
                <h3 className="text-2xl font-black text-[#6F241D] mt-1">{products.length}</h3>
                <span className="text-[10px] text-gray-500 mt-1 block">Across 6 Rajasthan cities</span>
              </div>
              <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl p-5 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#70452F]">Active Buyers</span>
                <h3 className="text-2xl font-black text-[#6F241D] mt-1">1,248</h3>
                <span className="text-[10px] text-[#354B35] font-bold mt-1 block">98.4% satisfaction</span>
              </div>
            </div>

            {/* Pending Vendor Approvals */}
            <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-lg text-[#6F241D]">Pending Artisan Approvals</h3>
                <span className="text-xs bg-[#C69A45] text-white px-2.5 py-0.5 rounded-full font-bold">Action Required</span>
              </div>

              <div className="space-y-3">
                {pendingVendors.map(v => (
                  <div key={v.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#FAF4EA] border border-[#E8D4B5] rounded-2xl gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-[#2B1E1A]">{v.name}</h4>
                      <p className="text-xs text-[#70452F]">{v.owner} • {v.location} • Specialty: {v.specialty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="bg-[#354B35] hover:bg-[#202E20] text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                        <Check size={14} /> Approve
                      </button>
                      <button className="bg-white border border-red-300 text-red-600 hover:bg-red-50 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'overview' && (
          <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-3xl p-8 text-center space-y-3">
            <span className="text-3xl">👑</span>
            <h3 className="font-serif font-bold text-lg text-[#6F241D] capitalize">{activeTab} Management</h3>
            <p className="text-xs text-[#70452F]">Admin configurations and live logs are active.</p>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;
