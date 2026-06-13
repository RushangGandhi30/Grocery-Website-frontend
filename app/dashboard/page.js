'use client';

import React, { useState, useEffect } from "react";
import CategoryGrid from "../../components/CategoryGrid";
import { Search, MapPin, User, ShoppingCart, LogOut, Edit, ChevronDown, X, Phone, User as UserIcon, Save, Mail, Package } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getUserProfile, updateUser } from "../services/userServices";
import EditProfileModal from "../../components/EditProfileModal";
import { Suspense } from 'react';



function DashboardContent() {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Extract address details from query parameters
    const typeParam = searchParams.get('type');
    const addressParam = searchParams.get('address');


    useEffect(() => {
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const id = localStorage.getItem("userId");
        if (id) {
            setUserId(id);
        }
        setIsLoading(false);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        router.push('/');
    };




    return (
        <div className="min-h-screen bg-gray-50 pb-20 relative">
            {/* Background Blur Overlay when modal is active */}
            {/* Profile Update Modal */}
            <EditProfileModal 
                isOpen={showProfileModal} 
                onClose={() => setShowProfileModal(false)} 
                userId={userId} 
            />

            {/* Header */}
            <header className="bg-white sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col gap-4">
                        {/* Top Row: Location & Profile */}
                        <div className="flex items-center justify-between">
                            <div
                                onClick={() => router.push('/dashboard/addresses')}
                                className="flex items-start gap-2 max-w-[70%] cursor-pointer hover:bg-gray-100 p-1.5 rounded-xl transition-all"
                            >
                                <MapPin className="text-emerald-600 mt-1 flex-shrink-0" size={20} />
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-900 leading-none capitalize">
                                        {typeParam || "Home"}
                                    </h3>
                                    <p className="text-xs text-gray-500 truncate">
                                        {addressParam || "123, Green Street, Grocery Town, India"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Profile Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors relative flex items-center gap-1"
                                    >
                                        <div className="bg-gray-100 p-1 rounded-full">
                                            <UserIcon size={20} className="text-gray-700" />
                                        </div>
                                        <ChevronDown size={14} className="text-gray-500" />
                                    </button>

                                    {isProfileOpen && (
                                        <>
                                            {/* Click outside overlay */}
                                            <div
                                                className="fixed inset-0 z-40 cursor-default"
                                                onClick={() => setIsProfileOpen(false)}
                                            />
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50 origin-top-right">
                                                <div className="px-4 py-3 border-b border-gray-100">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {"My Account"}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setShowProfileModal(true);
                                                        setIsProfileOpen(false);
                                                    }}
                                                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600"
                                                >
                                                    <Edit size={16} className="mr-3" />
                                                    Edit Profile
                                                </button>

                                                <button
                                                    onClick={() => router.push('/dashboard/addresses')}
                                                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 outline-none"
                                                >
                                                    <MapPin size={16} className="mr-3" />
                                                    Addresses
                                                </button>

                                                <button
                                                    onClick={() => router.push('/dashboard/orders')}
                                                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 outline-none"
                                                >
                                                    <Package size={16} className="mr-3" />
                                                    Order History
                                                </button>

                                                <button
                                                    onClick={handleLogout}
                                                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    <LogOut size={16} className="mr-3" />
                                                    Log Out
                                                </button>
                                            </div>
                                        </>
                                    )}

                                </div>

                                <button
                                    onClick={() => router.push('/dashboard/cart')}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors relative bg-emerald-100/50"
                                >
                                    <ShoppingCart size={24} className="text-emerald-700" />
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="text-gray-400" size={18} />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-3 border-none rounded-xl bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                placeholder="Search 'milk'"
                            />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
                {/* Hero / Promotional Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg">
                    <div className="px-6 py-8 sm:px-10 text-white relative z-10">
                        <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-3 backdrop-blur-sm">
                            Free Delivery
                        </span>
                        <h2 className="text-3xl font-extrabold tracking-tight mb-2">
                            Fresh Vegetables <br />
                            <span className="text-emerald-100">Upto 40% OFF</span>
                        </h2>
                        <button className="mt-6 bg-white text-emerald-600 font-bold py-2 px-6 rounded-lg shadow-md hover:bg-gray-50 transition-colors">
                            Shop Now
                        </button>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-black/10 blur-2xl"></div>
                </div>

                {/* Category Grid */}
                <CategoryGrid />

                {/* Optional: Trending / Best Sellers Section */}
                <div>
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h2 className="text-xl font-bold text-gray-800">Best Sellers</h2>
                        <a href="#" className="text-emerald-600 text-sm font-medium hover:underline">See all</a>
                    </div>
                    {/* Placeholder for Product Cards */}
                    <div className="flex gap-4 overflow-x-auto hide-scrollbar">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="min-w-[160px] bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col">
                                <div className="h-28 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-4xl">🥦</div>
                                <h4 className="font-medium text-gray-900 text-sm truncate">Fresh Broccoli</h4>
                                <p className="text-xs text-gray-500 mb-2">500g</p>
                                <div className="mt-auto flex justify-between items-center">
                                    <span className="font-bold text-gray-900">₹45</span>
                                    <button className="text-emerald-600 text-xs font-bold border border-emerald-200 bg-emerald-50 px-3 py-1 rounded-md uppercase">ADD</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}