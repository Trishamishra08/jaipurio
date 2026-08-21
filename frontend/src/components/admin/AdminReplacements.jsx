import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiSearch, FiCheck, FiX, FiMessageSquare } from 'react-icons/fi';

import api from '../../utils/api';

const AdminReplacements = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchReplacements = async () => {
        try {
            setLoading(true);
            const res = await api.get('/orders/admin');
            // Filter orders where returnAction is Replace
            const replacementOrders = (res.data?.data || []).filter(
                o => o.returnAction === 'Replace' && o.returnStatus !== 'Not Requested'
            );
            setOrders(replacementOrders);
        } catch (error) {
            console.error('Error fetching replacements:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReplacements();
    }, []);

    const updateReturnStatus = async (id, newStatus) => {
        try {
            await api.patch(`/orders/${id}/admin-update-return`, { returnStatus: newStatus });
            fetchReplacements();
        } catch (error) {
            alert("Failed to update status: " + (error.response?.data?.message || error.message));
        }
    };

    const filteredOrders = orders.filter(
        (o) =>
            o._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.returnReason?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-['Cormorant',_serif] text-[#5C2E3E] font-black uppercase tracking-tighter flex items-center gap-3">
                        <FiRefreshCw className="text-admin-accent" /> Product <span className="text-admin-gold italic">Replacements</span>
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#5C2E3E]/40 mt-2">
                        Manage Product Exchange and Replacement Tickets
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="SEARCH TICKET OR REASON..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-100 pl-10 pr-4 py-2.5 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-admin-accent transition-colors h-10 shadow-sm"
                        />
                    </div>
                    <button onClick={fetchReplacements} className="h-10 px-4 bg-[#5C2E3E] text-white flex items-center justify-center hover:bg-admin-accent transition-colors shadow-md">
                        <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center bg-white border border-gray-100 shadow-sm">
                    <div className="w-8 h-8 rounded-full border-2 border-admin-accent border-t-transparent animate-spin"></div>
                </div>
            ) : orders.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center bg-white border border-gray-100 shadow-sm">
                    <FiRefreshCw className="text-4xl text-gray-200 mb-3" />
                    <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">No Active Replacement Requests</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#FDFCFB] border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-sans font-bold uppercase tracking-widest text-gray-400">Order ID</th>
                                    <th className="px-6 py-4 text-xs font-sans font-bold uppercase tracking-widest text-gray-400">Customer</th>
                                    <th className="px-6 py-4 text-xs font-sans font-bold uppercase tracking-widest text-gray-400">Issue Details (Replacements)</th>
                                    <th className="px-6 py-4 text-xs font-sans font-bold uppercase tracking-widest text-gray-400 text-center">Status</th>
                                    <th className="px-6 py-4 text-xs font-sans font-bold uppercase tracking-widest text-gray-400 text-right">Approval Actions</th>
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
                                            className={`group hover:bg-admin-accent/5 transition-colors ${order.returnStatus === 'Replacement Requested' ? 'bg-[#5C2E3E]/5' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-black text-[#5C2E3E] tracking-widest uppercase">{order._id?.slice(-6).toUpperCase()}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-gray-800">{order.shippingAddress?.name || order.user?.name}</span>
                                                    <span className="text-[9px] text-gray-500 truncate max-w-[120px]">{order.shippingAddress?.phone || order.user?.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-sm">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex gap-2 items-center flex-wrap">
                                                        {order.orderItems?.slice(0, 2).map((item, idx) => (
                                                            <div key={idx} className="flex items-center gap-1.5 bg-white border border-gray-100 p-1 rounded-sm">
                                                                <img src={item.image} alt="" className="w-6 h-6 object-cover bg-gray-50" />
                                                                <span className="text-[8px] font-bold truncate max-w-[60px]">{item.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {order.returnReason && (
                                                        <div className="mt-1 flex gap-2 items-start bg-orange-50 p-2 rounded-sm border border-orange-100/50">
                                                            <FiMessageSquare className="text-orange-400 mt-0.5 shrink-0" size={10} />
                                                            <p className="text-[10px] font-['Cormorant',_serif] italic text-orange-900 leading-snug break-words">"{order.returnReason}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-sm ${order.returnStatus === 'Replaced' ? 'bg-green-100 text-green-700' :
                                                    order.returnStatus === 'Replacement Rejected' ? 'bg-red-100 text-red-700' :
                                                        order.returnStatus === 'Replacement Approved' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {order.returnStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {order.returnStatus === 'Replacement Requested' && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => updateReturnStatus(order._id, 'Replacement Approved')}
                                                            className="p-1.5 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-md transition-all border border-green-200 hover:border-green-500 shadow-sm"
                                                            title="Approve Replacement"
                                                        >
                                                            <FiCheck size={12} strokeWidth={3} />
                                                        </button>
                                                        <button
                                                            onClick={() => updateReturnStatus(order._id, 'Replacement Rejected')}
                                                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-md transition-all border border-red-200 hover:border-red-500 shadow-sm"
                                                            title="Reject Replacement"
                                                        >
                                                            <FiX size={12} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                )}

                                                {order.returnStatus === 'Replacement Approved' && (
                                                    <button
                                                        onClick={() => updateReturnStatus(order._id, 'Replaced')}
                                                        className="px-3 py-1.5 bg-admin-dark text-white text-[8px] font-black uppercase tracking-widest rounded-md hover:bg-green-600 shadow-md transition-colors"
                                                    >
                                                        Dispatch Exchange
                                                    </button>
                                                )}

                                                {['Replaced', 'Replacement Rejected'].includes(order.returnStatus) && (
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-300">Resolved</span>
                                                )}
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

export default AdminReplacements;
