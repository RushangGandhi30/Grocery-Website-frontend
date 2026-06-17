'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, Truck, CheckCircle, Search, Navigation, ArrowRight, Loader2, MapPin } from 'lucide-react';
import { getAllAvailableOrders, updateOrderStatus, getAllDeliveryBoys, AssignDeliveryBoy } from '@/app/services/orderServices';
import { X, User, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';



export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [deliveryBoys, setDeliveryBoys] = useState([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [orderToAssign, setOrderToAssign] = useState(null);
    const [selectedBoyId, setSelectedBoyId] = useState('');

    useEffect(() => {
        fetchOrders();
        fetchDeliveryBoys();
    }, []);



    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await getAllAvailableOrders();
            if (response && response.status && response.data && response.data.availableOrders) {
                // Map API fields to UI fields
                const formattedOrders = response.data.availableOrders.map(order => ({
                    orderId: String(order.order_id_pk),
                    totalAmount: parseFloat(order.total_amount) || 0,
                    orderStatus: order.order_status,
                    date: new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
                    items: [], // Current API does not provide item-level details yet
                    addressType: order.addressType || order.address_type,
                    fullAddress: order.fullAddress || order.full_address,
                    city: order.city,
                    state: order.state,
                    pincode: order.pincode || order.pinCode
                }));
                // Sort newer orders first
                formattedOrders.sort((a, b) => parseInt(b.orderId) - parseInt(a.orderId));
                setOrders(formattedOrders);
            }
        } catch (error) {
            console.error("Failed fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDeliveryBoys = async () => {
        try {
            const response = await getAllDeliveryBoys();
            if (response && response.status && response.data && response.data.deliveryBoys) {
                // The API returns a nested array: [ [ { ... } ] ]
                const boys = response.data.deliveryBoys.flat();
                setDeliveryBoys(boys);
            }
        } catch (error) {
            console.error("Failed fetching delivery boys:", error);
        }
    };

    const handleAssign = async () => {

        debugger
        if (!selectedBoyId) {
            toast.error("Please select a delivery partner");
            return;
        }

        try {
            await AssignDeliveryBoy({
                orderId: parseInt(orderToAssign),
                deliveryBoyId: parseInt(selectedBoyId),
                updatedBy: parseInt(localStorage.getItem('userId'))
            });

            // After successful assignment, move status to OUT_FOR_DELIVERY
            await handleUpdateOrderStatus(orderToAssign, 'OUT_FOR_DELIVERY');

            setIsAssignModalOpen(false);
            setOrderToAssign(null);
            setSelectedBoyId('');
        } catch (err) {
            console.error("Assignment failed:", err);
            toast.error("Failed to assign delivery partner");
        }
    };

    const handleUpdateOrderStatus = async (orderId, status) => {
        const userId = localStorage.getItem('userId');

        try {
            const payload = {
                orderId: parseInt(orderId),
                status: status,
                updatedBy: userId
            };

            await updateOrderStatus(payload);

            toast.success("Order status updated successfully");

            fetchOrders(); // reload data

        } catch (err) {
            console.error("Failed updating order status:", err);
            toast.error("Failed to update order");
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'PLACED':
                return {
                    color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
                    icon: <Clock size={14} />,
                    nextAction: 'Confirm Order',
                    nextStatus: 'CONFIRMED',
                    actionClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                };
            case 'CONFIRMED':
                return {
                    color: 'text-blue-700 bg-blue-50 border-blue-200',
                    icon: <CheckCircle size={14} />,
                    nextAction: 'Assign Delivery Boy',
                    nextStatus: 'OUT_FOR_DELIVERY',
                    actionType: 'ASSIGN_DELIVERY',
                    actionClass: 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200'
                };
            case 'OUT_FOR_DELIVERY':
                return {
                    color: 'text-orange-700 bg-orange-50 border-orange-200',
                    icon: <Truck size={14} />,
                    nextAction: 'Mark as Delivered',
                    nextStatus: 'DELIVERED',
                    actionClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200'
                };
            case 'DELIVERED':
                return {
                    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                    icon: <Package size={14} />,
                    nextAction: null,
                    nextStatus: null,
                    actionClass: ''
                };
            default:
                return {
                    color: 'text-gray-700 bg-gray-50 border-gray-200',
                    icon: <Package size={14} />,
                    nextAction: null
                };
        }
    };

    const filteredOrders = orders.filter(order =>
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderStatus.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full w-full py-32">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Loader2 size={40} className="text-emerald-500" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Navigation className="text-emerald-600" /> Dispatch Center
                    </h1>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">
                        {orders.length} Active Orders
                    </p>
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="text-gray-400" size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-sm outline-none shadow-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                    {filteredOrders.map((order) => {
                        const statusConf = getStatusConfig(order.orderStatus);

                        return (
                            <motion.div
                                key={order.orderId}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group"
                            >
                                {/* Card Header */}
                                <div className="p-5 border-b border-gray-50 relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${statusConf.color}`}>
                                            {statusConf.icon}
                                            {order.orderStatus.replace(/_/g, ' ')}
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.date}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold text-gray-400 mb-0.5">Order {order.orderId}</p>
                                        <p className="text-2xl font-black text-gray-900 tracking-tight">₹{order.totalAmount.toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Ordered Items Preview */}
                                <div className="p-5 bg-gray-50/50 flex flex-col flex-grow">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                                        {order.items.length} Items to pack
                                    </h4>
                                    <div className="space-y-3">
                                        {order.items.slice(0, 3).map((item) => (
                                            <div key={item.id} className="flex gap-3 items-center">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-lg flex-shrink-0 relative">
                                                    {item.productImg && (item.productImg.startsWith('static') || item.productImg.startsWith('/')) ? (
                                                        <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/${item.productImg}`} alt={item.name} className="w-full h-full object-contain p-1" />
                                                    ) : (
                                                        <span>{item.productImg}</span>
                                                    )}
                                                    <div className="absolute -bottom-1 -right-1 bg-gray-900 w-4 h-4 rounded-full flex items-center justify-center border border-white">
                                                        <span className="text-[8px] font-black text-white">{item.quantity}</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-bold text-gray-800 leading-tight line-clamp-2">
                                                    {item.name}
                                                </p>
                                            </div>
                                        ))}
                                        {order.items.length > 3 && (
                                            <p className="text-[10px] font-black text-gray-400 pt-1 uppercase tracking-widest">
                                                + {order.items.length - 3} more items
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Delivery Address */}
                                <div className="p-5 border-t border-gray-50 flex items-start gap-3 bg-white">
                                    <div className="bg-blue-50 text-blue-600 p-2 rounded-lg flex-shrink-0">
                                        <MapPin size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">
                                            Delivery Address • <span className="text-blue-500">{order.addressType || 'Home'}</span>
                                        </p>
                                        <p className="text-xs font-semibold text-gray-900 leading-snug">
                                            {order.fullAddress || 'N/A'}
                                        </p>
                                        <p className="text-[10px] font-medium text-gray-500 mt-1">
                                            {order.city ? `${order.city}, ${order.state} - ${order.pincode}` : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Dynamic Action Button Footer */}
                                <div className="p-5 bg-white mt-auto">
                                    {statusConf.nextAction ? (
                                        <button
                                            onClick={() => {
                                                if (statusConf.actionType === 'ASSIGN_DELIVERY') {
                                                    setOrderToAssign(order.orderId);
                                                    setIsAssignModalOpen(true);
                                                } else {
                                                    handleUpdateOrderStatus(order.orderId, statusConf.nextStatus);
                                                }
                                            }}
                                            className={`w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${statusConf.actionClass}`}
                                        >
                                            {statusConf.nextAction} <ArrowRight size={14} />
                                        </button>
                                    ) : (
                                        <div className="w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 bg-gray-50 text-emerald-600 border border-emerald-100">
                                            <CheckCircle size={14} /> Order Complete
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {filteredOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-sm">
                        <Search className="text-gray-300" size={32} />
                    </div>
                    <h2 className="text-lg font-black text-gray-900">No orders found</h2>
                    <p className="text-sm font-medium text-gray-500">Try adjusting your search criteria</p>
                </div>
            )}

            {/* Assignment Modal */}
            <AnimatePresence>
                {isAssignModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAssignModalOpen(false)}
                            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Assign Partner</h2>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Order #{orderToAssign}</p>
                                    </div>
                                    <button
                                        onClick={() => setIsAssignModalOpen(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">
                                        Select Delivery Personnel
                                    </label>
                                    <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {deliveryBoys.map((boy) => (
                                            <button
                                                key={boy.userId}
                                                onClick={() => setSelectedBoyId(String(boy.userId))}
                                                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedBoyId === String(boy.userId)
                                                    ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100'
                                                    : 'border-gray-50 bg-gray-50 hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedBoyId === String(boy.userId) ? 'bg-emerald-500 text-white' : 'bg-white text-gray-400'
                                                        }`}>
                                                        <User size={18} />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className={`text-sm font-bold ${selectedBoyId === String(boy.userId) ? 'text-emerald-900' : 'text-gray-900'}`}>
                                                            {boy.userName}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Partner</p>
                                                    </div>
                                                </div>
                                                {selectedBoyId === String(boy.userId) && (
                                                    <CheckCircle size={20} className="text-emerald-500" />
                                                )}
                                            </button>
                                        ))}
                                        {deliveryBoys.length === 0 && (
                                            <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                                <p className="text-xs font-bold text-gray-400">No active delivery boys found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <button
                                        onClick={handleAssign}
                                        disabled={!selectedBoyId}
                                        className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${selectedBoyId
                                            ? 'bg-gray-900 text-white shadow-gray-200 active:scale-95'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                            }`}
                                    >
                                        Confirm Assignment <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
