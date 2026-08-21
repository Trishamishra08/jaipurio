import React, { useState, useEffect, useCallback } from 'react';
import { FiUsers, FiSearch, FiMail, FiPhone, FiEye, FiShieldOff, FiRefreshCw, FiXCircle } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import api from '../../utils/api';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);

    const currentTab = location.pathname.includes('/blocked') ? 'blocked' : 'active';

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            let endpoint = '/users';
            if (currentTab === 'blocked') endpoint = '/users/blocked';
            
            const res = await api.get(endpoint);
            setUsers(res.data.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    }, [currentTab]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleStatusChange = async (id, status) => {
        const message = status === 'block' ? 'Block this customer?' : 'Unblock this customer?';
        if (window.confirm(message)) {
            try {
                await api.put(`/users/${id}/${status}`);
                // Remove the user from the current view after status change (same as vendor)
                setUsers(prev => prev.filter(u => u._id !== id));
                if (selectedUser && selectedUser._id === id) {
                    setSelectedUser(null);
                }
            } catch (err) {
                alert('Failed to update status');
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto font-sans">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-['Cormorant',_serif] font-bold text-admin-dark leading-none mb-2">
                        {currentTab === 'blocked' ? 'Blocked Customers' : 'Active Customers'}
                    </h1>
                    <p className="text-gray-500 text-[13px] font-poppins">
                        Manage customer accounts and verify identity details.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all">
                        Export List
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center animate-pulse">
                    <div className="w-10 h-10 border-4 border-admin-gold border-t-admin-accent rounded-full mx-auto mb-4 animate-spin"></div>
                    <p className="text-sm font-sans font-medium text-gray-500">Loading Customers...</p>
                </div>
            ) : users.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
                    <FiUsers className="mx-auto text-gray-200 mb-4" size={48} />
                    <h3 className="text-xl font-['Cormorant',_serif] font-bold text-admin-dark mb-2">No Customers Found</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                        There are currently no customers in this category.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-sans font-bold uppercase tracking-widest text-gray-500">CUSTOMER DETAILS</th>
                                    <th className="px-6 py-4 text-xs font-sans font-bold uppercase tracking-widest text-gray-500">GENDER</th>
                                    <th className="px-6 py-4 text-xs font-sans font-bold uppercase tracking-widest text-gray-500">JOINED DATE</th>
                                    <th className="px-6 py-4 text-xs font-sans font-bold uppercase tracking-widest text-gray-500">STATUS</th>
                                    <th className="px-6 py-4 text-xs font-sans font-bold uppercase tracking-widest text-gray-500 text-center">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map(user => (
                                    <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-admin-dark text-white flex flex-col items-center justify-center font-['Cormorant',_serif] font-bold text-lg leading-none">
                                                    {(user.name || 'C').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email || 'N/A'}</p>
                                                    <p className="text-[10px] text-gray-400">{user.mobile}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-gray-800 capitalize">{user.gender || 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                                                user.isBlocked ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                            }`}>
                                                {user.isBlocked ? 'Blocked' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-3">
                                                <button onClick={() => setSelectedUser(user)} className="p-2 bg-gray-100 hover:bg-admin-dark hover:text-white rounded-lg transition-all" title="View Details">
                                                    <FiEye size={14} />
                                                </button>
                                                {currentTab === 'active' && (
                                                    <button onClick={() => handleStatusChange(user._id, 'block')} className="p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-all" title="Block Customer">
                                                        <FiShieldOff size={14} />
                                                    </button>
                                                )}
                                                {currentTab === 'blocked' && (
                                                    <button onClick={() => handleStatusChange(user._id, 'unblock')} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-all" title="Unblock Customer">
                                                        <FiRefreshCw size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* User Details Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-xl font-['Cormorant',_serif] font-bold text-admin-dark">Customer Profile</h2>
                            <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-admin-dark">
                                <FiXCircle size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-full bg-admin-dark text-white flex flex-col items-center justify-center font-['Cormorant',_serif] font-bold text-3xl leading-none">
                                    {(selectedUser.name || 'C').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{selectedUser.name}</h3>
                                    <p className="text-sm text-gray-500">Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                                    <span className={`mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                                        selectedUser.isBlocked ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                    }`}>
                                        {selectedUser.isBlocked ? 'Blocked' : 'Active'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Contact Info</p>
                                    <p className="text-sm text-gray-800 font-medium break-all">{selectedUser.email || 'N/A'}</p>
                                    <p className="text-sm text-gray-800 font-medium">{selectedUser.mobile || 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Personal Details</p>
                                    <p className="text-sm text-gray-800 font-medium capitalize">Gender: {selectedUser.gender || 'N/A'}</p>
                                    <p className="text-sm text-gray-800 font-medium capitalize">Role: {selectedUser.role}</p>
                                </div>
                                
                                {selectedUser.addresses && selectedUser.addresses.length > 0 && (
                                    <div className="p-4 bg-gray-50 rounded-xl col-span-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Saved Addresses</p>
                                        <div className="space-y-3">
                                            {selectedUser.addresses.map((address, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100">
                                                    <p className="text-sm font-bold text-gray-800">{address.title} {address.isDefault && <span className="ml-2 text-[10px] bg-admin-gold/10 text-admin-gold px-2 py-0.5 rounded-full uppercase">Default</span>}</p>
                                                    <p className="text-sm text-gray-600 mt-1">{address.addressLine}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Phone: {address.mobile}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            {currentTab === 'active' && (
                                <button onClick={() => handleStatusChange(selectedUser._id, 'block')} className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition-all">
                                    Block Customer
                                </button>
                            )}
                            {currentTab === 'blocked' && (
                                <button onClick={() => handleStatusChange(selectedUser._id, 'unblock')} className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-all">
                                    Unblock Customer
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
