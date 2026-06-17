'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle, CreditCard, ChevronDown, ChevronUp, Loader2, RefreshCw, ShoppingBag, MapPin, ReceiptText } from 'lucide-react';
import { getOrderHistory } from '@/app/services/orderServices';

export default function OrderHistoryPage() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const steps = [
        { key: 'PLACED', label: 'Placed' },
        { key: 'CONFIRMED', label: 'Confirmed' },
        { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
        { key: 'DELIVERED', label: 'Delivered' }
    ];


    const fetchOrders = async () => {
        try {
            setLoading(true);
            const userId = localStorage.getItem('userId');
            if (!userId) {
                router.push('/');
                return;
            }

            const response = await getOrderHistory(userId);

            if (response.status && response.data && response.data.orderHistory) {
                const orderItems = response.data.orderHistory[0] || [];

                // Group items by orderIdPk 
                const groupedOrders = orderItems.reduce((acc, item) => {
                    if (!acc[item.orderIdPk]) {
                        acc[item.orderIdPk] = {
                            orderIdPk: item.orderIdPk,
                            totalAmount: parseFloat(item.totalAmount) || 0,
                            orderStatus: item.orderStatus,
                            paymentMethod: item.paymentMethod,
                            paymentStatus: item.paymentStatus,
                            addressType: item.addressType,
                            Address: item.Address,
                            landmark: item.landmark,
                            city: item.city,
                            state: item.state,
                            pinCode: item.pinCode,
                            date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
                            items: []
                        };
                    }
                    acc[item.orderIdPk].items.push({
                        orderItemId: item.orderItemId,
                        productName: item.productName,
                        productImg: item.productImg,
                        productPrice: parseFloat(item.productPrice) || 0,
                        quantity: item.quantity,
                        totalPrice: parseFloat(item.totalPrice) || 0,
                    });
                    return acc;
                }, {});

                const ordersArray = Object.values(groupedOrders).sort((a, b) => b.orderIdPk - a.orderIdPk);
                setOrders(ordersArray);
            }
        } catch (err) {
            console.error("Error fetching orders:", err);
            setError("Failed to load order history. Please pull down to refresh.");
        } finally {
            setLoading(false);
        }
    };

    const toggleOrder = (orderId) => {
        if (expandedOrder === orderId) {
            setExpandedOrder(null);
        } else {
            setExpandedOrder(orderId);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Loader2 size={36} className="text-emerald-500 max-w-[50%]" />
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
                <p className="text-gray-500 text-sm mb-4 font-medium">{error}</p>
                <button
                    onClick={fetchOrders}
                    className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-200 active:scale-95 transition-all"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans overflow-x-hidden">
            {/* Beautiful App Header */}
            <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-emerald-50 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="p-2.5 hover:bg-gray-100 rounded-xl transition-all text-gray-700 bg-gray-50/50"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-tight">Your Orders</h1>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{orders.length} orders safely recorded</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                        <ShoppingBag size={18} className="text-emerald-600" />
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 pt-6">
                {orders.length > 0 ? (
                    <div className="space-y-5">
                        {orders.map((order, index) => {
                            const isExpanded = expandedOrder === order.orderIdPk;
                            const isDelivered = order.orderStatus?.toUpperCase() === 'DELIVERED';
                            const orderStepIndex = steps.findIndex((step) => step.key === order.orderStatus?.toUpperCase());

                            return (
                                <motion.div
                                    key={order.orderIdPk}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
                                    className="bg-white rounded-[1.5rem] border border-gray-100 overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    {/* Order Main Card - High level attractive view */}
                                    <div
                                        className="p-5 cursor-pointer relative overflow-hidden"
                                        onClick={() => toggleOrder(order.orderIdPk)}
                                    >
                                        {/* Subtle background gradient splash on delivered orders */}
                                        {isDelivered && (
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                                        )}

                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    {isDelivered ? (
                                                        <div className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-emerald-100">
                                                            <CheckCircle size={12} strokeWidth={3} className="text-emerald-600" />
                                                            Delivered
                                                        </div>
                                                    ) : (
                                                        <div className="bg-amber-50 text-amber-600 font-extrabold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-amber-100">
                                                            <Clock size={12} strokeWidth={3} />
                                                            {order.orderStatus}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs font-bold text-gray-500 mb-0.5">Order #{order.orderIdPk}</p>
                                                <p className="text-sm font-extrabold text-gray-900">
                                                    ₹{order.totalAmount.toFixed(2)} <span className="text-gray-300 mx-1">•</span> <span className="font-bold text-gray-500">{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                                                </p>
                                            </div>

                                            {/* Attractive Thumbnail Preview */}
                                            <div className="flex -space-x-3 items-center">
                                                {order.items.slice(0, 3).map((item, idx) => (
                                                    <div key={item.orderItemId || idx} className="w-14 h-14 bg-white rounded-2xl p-2 shadow-sm ring-1 ring-gray-100 flex items-center justify-center z-10 relative bg-gradient-to-br from-white to-gray-50">
                                                        {item.productImg && (item.productImg.startsWith('static') || item.productImg.startsWith('/')) ? (
                                                            <img
                                                                src={`${process.env.NEXT_PUBLIC_IMG_URL || 'http://localhost:3001'}/${item.productImg}`}
                                                                alt={item.productName}
                                                                className="w-full h-full object-contain filter drop-shadow-sm hover:scale-110 transition-transform duration-300"
                                                            />
                                                        ) : (
                                                            <span className="text-2xl">{item.productImg || '🛍️'}</span>
                                                        )}
                                                    </div>
                                                ))}
                                                {order.items.length > 3 && (
                                                    <div className="w-10 h-10 bg-gray-50 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-0 relative ml-1">
                                                        <span className="text-[10px] font-black text-gray-500">+{order.items.length - 3}</span>
                                                    </div>
                                                )}

                                            </div>

                                        </div>
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between relative">

                                                {/* Progress Line */}
                                                <div className="absolute top-3 left-0 right-0 h-[2px] bg-gray-200 z-0" />

                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: `${(orderStepIndex / (steps.length - 1)) * 100}%`
                                                    }}
                                                    transition={{ duration: 0.8, ease: "easeInOut" }}
                                                    className="absolute top-3 left-0 h-[2px] bg-emerald-500 z-0"
                                                />

                                                {steps.map((step, index) => {
                                                    const isCompleted = index <= orderStepIndex;
                                                    const isCurrent = index === orderStepIndex;

                                                    return (
                                                        <div key={step.key} className="relative z-10 flex flex-col items-center w-full">
                                                            {/* Circle */}
                                                            <motion.div
                                                                initial={{ scale: 0.8, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                transition={{ delay: index * 0.1 + 0.5 }}
                                                                className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300
                                                                    ${isCompleted
                                                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
                                                                        : 'bg-gray-200 text-gray-500'
                                                                    } ${isCurrent ? 'ring-4 ring-emerald-50' : ''}`}
                                                            >
                                                                {isCompleted ? '✓' : index + 1}
                                                            </motion.div>

                                                            {/* Label */}
                                                            <motion.p
                                                                initial={{ opacity: 0, y: 5 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: index * 0.1 + 0.6 }}
                                                                className={`text-[9px] mt-1.5 font-bold text-center leading-tight transition-colors duration-300
                                                                    ${isCompleted ? 'text-emerald-600' : 'text-gray-400'}`}
                                                            >
                                                                {step.label}
                                                            </motion.p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                                            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest transition-colors ${isExpanded ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'}">
                                                {isExpanded ? 'Hide Details' : 'View Details'}
                                                <div className={`p-1 rounded-full ${isExpanded ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                                                    {isExpanded ? <ChevronUp size={12} strokeWidth={3} /> : <ChevronDown size={12} strokeWidth={3} />}
                                                </div>
                                            </div>

                                            {isDelivered && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // implement quick reorder to cart here
                                                    }}
                                                    className="flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-5 py-2 rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-95 shadow-sm shadow-emerald-100/50"
                                                >
                                                    <RefreshCw size={14} />
                                                    REORDER
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expandable Beautiful Order Details */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                            >
                                                <div className="p-5 bg-gradient-to-b from-gray-50/50 to-white border-t border-gray-100">

                                                    {/* Items List */}
                                                    <div className="mb-6">
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                            <ReceiptText size={14} /> Bill Details
                                                        </h4>

                                                        <div className="space-y-4">
                                                            {order.items.map((item) => (
                                                                <div key={item.orderItemId} className="flex gap-4 items-center group bg-white p-3 rounded-2xl border border-gray-50 shadow-[0_2px_8px_-6px_rgba(0,0,0,0.1)] hover:border-emerald-100 transition-colors">
                                                                    <div className="w-12 h-12 bg-gray-50/50 rounded-xl p-1.5 flex items-center justify-center">
                                                                        {item.productImg && (item.productImg.startsWith('static') || item.productImg.startsWith('/')) ? (
                                                                            <img
                                                                                src={`${process.env.NEXT_PUBLIC_IMG_URL || 'http://localhost:3001'}/${item.productImg}`}
                                                                                alt={item.productName}
                                                                                className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-xl">{item.productImg || '📦'}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h3 className="text-sm font-bold text-gray-900 truncate">{item.productName}</h3>
                                                                        <p className="text-xs font-semibold text-gray-400 mt-0.5">{item.quantity} × <span className="text-gray-600">₹{item.productPrice}</span></p>
                                                                    </div>
                                                                    <p className="text-sm font-black text-gray-900">₹{item.totalPrice.toFixed(2)}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Beautiful Total and Meta Info box */}
                                                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-2xl"></div>

                                                        <div className="flex items-start justify-between mb-4 border-b border-gray-50 pb-4">
                                                            <div>
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Payment Method</p>
                                                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase">
                                                                    <CreditCard size={14} className="text-emerald-500" /> {order.paymentMethod}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Grand Total</p>
                                                                <p className="text-lg font-black text-emerald-600 leading-none">₹{order.totalAmount.toFixed(2)}</p>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-2 flex items-center gap-1.5">
                                                                <MapPin size={12} /> Delivered To
                                                                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[9px] font-extrabold">
                                                                    {order.addressType || 'HOME'}
                                                                </span>
                                                            </p>
                                                            <p className="text-xs text-gray-800 font-bold leading-relaxed max-w-[90%]">
                                                                {order.Address}{order.landmark ? `, ${order.landmark}` : ''}
                                                            </p>
                                                            <p className="text-[11px] font-medium text-gray-400 mt-1">
                                                                {order.city}, {order.state} - {order.pinCode}
                                                            </p>
                                                        </div>
                                                    </div>

                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-28 h-28 bg-white rounded-[2rem] border border-gray-100 flex items-center justify-center mb-6 shadow-xl shadow-emerald-50"
                        >
                            <ShoppingBag size={48} className="text-emerald-200" strokeWidth={1.5} />
                        </motion.div>
                        <h2 className="text-xl font-extrabold text-gray-900 mb-2 tracking-tight">No orders placed yet</h2>
                        <p className="text-sm font-medium text-gray-400 mb-8 max-w-[200px]">We will safely store your future orders right here.</p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 active:scale-95 transition-all"
                        >
                            Start Shopping
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
