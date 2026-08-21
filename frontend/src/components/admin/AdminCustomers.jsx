import React from 'react';
import AdminLayout from './AdminLayout';
import { FiSearch, FiFilter, FiExternalLink, FiTruck, FiCheckCircle, FiClock } from 'react-icons/fi';

const AdminCustomers = () => {
  const dummyCustomers = [
    {
      id: 'CUST-001',
      name: 'Aditi Sharma',
      email: 'aditi@example.com',
      lastOrder: 'Rose Water + Lakme Face Powder',
      totalSpent: '₹1,250',
      status: 'Delivered',
      date: '20 Mar 2024'
    },
    {
      id: 'CUST-002',
      name: 'Rahul Verma',
      email: 'rahul.v@example.com',
      lastOrder: 'TIRTIR Cushion (Pink) x2',
      totalSpent: '₹3,400',
      status: 'In Transit',
      date: '19 Mar 2024'
    },
    {
      id: 'CUST-003',
      name: 'Priya Singh',
      email: 'priyas@example.com',
      lastOrder: 'Royal Jhumkas + Lip Gloss',
      totalSpent: '₹2,100',
      status: 'Processing',
      date: '19 Mar 2024'
    },
    {
      id: 'CUST-004',
      name: 'Suresh Kumar',
      email: 'suresh.k@example.com',
      lastOrder: 'Men\'s Grooming Kit',
      totalSpent: '₹850',
      status: 'Delivered',
      date: '18 Mar 2024'
    },
    {
      id: 'CUST-005',
      name: 'Neha Gupta',
      email: 'neha.g@example.com',
      lastOrder: 'Handmade Soap Set of 5',
      totalSpent: '₹1,500',
      status: 'Shipped',
      date: '18 Mar 2024'
    }
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-700';
      case 'In Transit': return 'bg-blue-100 text-blue-700';
      case 'Shipped': return 'bg-purple-100 text-purple-700';
      case 'Processing': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered': return <FiCheckCircle />;
      case 'In Transit': return <FiTruck />;
      case 'Processing': return <FiClock />;
      default: return null;
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-['Cormorant',_serif] font-bold text-admin-dark leading-none mb-2">
          Customer Orders
        </h1>
        <p className="text-gray-500 text-[13px] font-poppins">
          Real-time booking & delivery tracking
        </p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-admin-accent/10 w-80 shadow-sm">
             <FiSearch className="text-gray-300" size={14} />
             <input type="text" placeholder="Search customers..." className="bg-transparent border-none outline-none text-[10px] font-bold uppercase w-full" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-admin-accent/10 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-admin-light/20">
                  <th className="px-6 py-4 text-[8px] font-black uppercase tracking-widest text-admin-dark opacity-60">Customer</th>
                  <th className="px-6 py-4 text-[8px] font-black uppercase tracking-widest text-admin-dark opacity-60">Last Booking (What's Booked)</th>
                  <th className="px-6 py-4 text-[8px] font-black uppercase tracking-widest text-admin-dark opacity-60">Value</th>
                  <th className="px-6 py-4 text-[8px] font-black uppercase tracking-widest text-admin-dark opacity-60">Date</th>
                  <th className="px-6 py-4 text-[8px] font-black uppercase tracking-widest text-admin-dark opacity-60">Delivery Status</th>
                  <th className="px-6 py-4 text-[8px] font-black uppercase tracking-widest text-admin-dark opacity-60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-accent/5">
                {dummyCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-admin-accent/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-sans font-medium text-gray-800 line-clamp-1">{c.name}</p>
                        <p className="text-[8px] text-gray-400 font-bold tracking-tighter">{c.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[9px] font-bold text-gray-600 truncate max-w-[200px]">{c.lastOrder}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-black text-admin-dark">{c.totalSpent}</p>
                    </td>
                    <td className="px-6 py-4 text-[9px] font-bold text-gray-400">
                      {c.date}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest ${getStatusStyle(c.status)}`}>
                        {getStatusIcon(c.status)}
                        {c.status}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <button className="text-admin-accent p-2 hover:bg-admin-accent/5 rounded-lg transition-all flex items-center gap-1.5 text-[8px] font-black uppercase">
                          Details <FiExternalLink size={10} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCustomers;
