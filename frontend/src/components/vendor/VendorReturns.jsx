import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiSearch, FiMessageSquare } from 'react-icons/fi';
import api from '../../utils/api';

const VendorReturns = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchReturns = async () => {
        try {
            setLoading(true);
            const res = await api.get('/orders/vendor');
            // Filter orders where returnStatus is not 'Not Requested'
            const rmaOrders = (res.data?.data || []).filter(
                o => o.returnStatus && o.returnStatus !== 'Not Requested'
            );
            setOrders(rmaOrders);
        } catch (error) {
            console.error('Error fetching returns:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns();
    }, []);

    const filteredOrders = orders.filter(
        (o) =>
            o._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.returnReason?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 lg:space-y-8 pb-6 max-w-[1400px] mx-auto -mt-2">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-gray-900 leading-tight">Returns & Replacements</h1>
                    <p className="text-[12px] text-gray-500 mt-0.5 font-sans">
                        View active returns and replacements for your products.
                    </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="SEARCH BY ORDER ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-100 pl-10 pr-4 py-2.5 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-admin-accent transition-colors h-10 shadow-sm"
                        />
                    </div>
                    <button onClick={fetchReturns} className="h-10 px-4 bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-colors shadow-md rounded-md">
                        <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center bg-white border border-gray-100 shadow-sm rounded-xl">
                    <div className="w-8 h-8 rounded-full border-2 border-gray-900 border-t-transparent animate-spin"></div>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 flex items-center justify-center min-h-[200px]">
                    <p className="text-[12px] text-gray-400 font-medium">No returns to process right now.</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-100 shadow-sm overflow-hidden rounded-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#FDFCFB] border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-sans font-bold uppercase tracking-widest text-gray-400">Order ID</th>
                                    <th className="px-6 py-4 text-xs font-sans font-bold uppercase tracking-widest text-gray-400">Customer</th>
                                    <th className="px-6 py-4 text-xs font-sans font-bold uppercase tracking-widest text-gray-400">Issue Details</th>
                                    <th className="px-6 py-4 text-xs font-sans font-bold uppercase tracking-widest text-gray-400 text-center">Type</th>
                                    <th className="px-6 py-4 text-xs font-sans font-bold uppercase tracking-widest text-gray-400 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <AnimatePresence>
                                    {filteredOrders.map((order) => (
                                        <motion.tr
                                            key={order._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium font-sans text-gray-800 line-clamp-1">{order._id?.slice(-6).toUpperCase()}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-sans font-medium text-gray-800">{order.shippingAddress?.name || order.user?.name}</span>
                                                    <span className="text-xs font-medium text-gray-500 truncate max-w-[120px]">{order.shippingAddress?.phone || order.user?.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-sm">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex gap-2 items-center flex-wrap">
                                                        {order.orderItems?.map((item, idx) => (
                                                            <div key={idx} className="flex items-center gap-1.5 bg-white border border-gray-100 p-1 rounded-sm">
                                                                <img src={item.image} alt="" className="w-6 h-6 object-cover bg-gray-50" />
                                                                <span className="text-xs font-medium text-gray-700 truncate max-w-[80px]">{item.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {order.returnReason && (
                                                        <div className="mt-1 flex gap-2 items-start bg-red-50 p-2 rounded-sm border border-red-100/50">
                                                            <FiMessageSquare className="text-red-400 mt-0.5 shrink-0" size={12} />
                                                            <p className="text-sm font-['Cormorant',_serif] italic text-red-900 leading-snug break-words">"{order.returnReason}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-2.5 py-1 text-xs font-sans font-bold uppercase tracking-widest rounded-sm ${order.returnAction === 'Replace' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {order.returnAction}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-2.5 py-1 text-xs font-sans font-bold uppercase tracking-widest rounded-sm ${['Returned', 'Replaced'].includes(order.returnStatus) ? 'bg-green-100 text-green-700' :
                                                    order.returnStatus?.includes('Rejected') ? 'bg-red-100 text-red-700' :
                                                        order.returnStatus?.includes('Approved') ? 'bg-blue-100 text-blue-700' :
                                                            'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {order.returnStatus}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorReturns;
