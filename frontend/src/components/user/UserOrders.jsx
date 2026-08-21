import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { Package, Truck, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserOrders = () => {
  const { orders } = useShop();

  return (
    <div className="min-h-screen bg-white py-6 pb-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="border-b border-[#E8D4B5] pb-4 mb-6">
          <h1 
            className="text-2xl sm:text-3xl font-black text-[#6F241D]"
          >
            My Mitti Orders ({orders.length})
          </h1>
          <p className="text-xs text-[#70452F] mt-1">Track handcrafted pottery shipments from Jaipur workshops.</p>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {orders.map((ord) => (
            <div 
              key={ord.id}
              className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-3xl p-6 shadow-sm space-y-4"
            >
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#E8D4B5] gap-2">
                <div>
                  <span className="text-xs font-extrabold text-[#6F241D] block">Order #{ord.id}</span>
                  <span className="text-[11px] text-gray-500">Placed on: {ord.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-[#82977A]/20 text-[#354B35] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Truck size={13} />
                    <span>{ord.status}</span>
                  </span>
                  <span className="text-sm font-black text-[#6F241D]">₹{ord.total}</span>
                </div>
              </div>

              {/* Items in Order */}
              <div className="space-y-3">
                {ord.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-[#FAF4EA] p-3 rounded-2xl border border-[#E8D4B5]/60">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#2B1E1A] truncate">{item.name}</h4>
                      <p className="text-[10px] text-gray-500">{item.vendor}</p>
                    </div>
                    <span className="text-xs font-bold text-[#6F241D]">Qty: {item.quantity} • ₹{item.price}</span>
                  </div>
                ))}
              </div>

              {/* Shipping Address */}
              <div className="pt-2 text-xs text-[#70452F]">
                <span className="font-semibold text-gray-500 block text-[10px] uppercase">Delivering To:</span>
                <p className="text-[11px] mt-0.5">{ord.shippingAddress}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default UserOrders;
