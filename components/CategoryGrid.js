'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllCategory } from '../app/services/categoryServices';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CategoryGrid = () => {
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const colors = [
        'bg-green-100', 'bg-blue-100', 'bg-yellow-100',
        'bg-orange-100', 'bg-red-100', 'bg-rose-100',
        'bg-amber-100', 'bg-pink-100', 'bg-stone-100',
        'bg-orange-50', 'bg-red-50', 'bg-emerald-50'
    ];

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setIsLoading(true);
                const response = await getAllCategory();
                if (response && response.status === true) {
                    setCategories(response.data.categories || []);
                } else {
                    setError("Failed to load categories");
                }
            } catch (err) {
                console.error("Error fetching categories:", err);
                setError("Something went wrong");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={40} />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Categories...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-10 text-center">
                <p className="text-red-500 font-bold">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-emerald-600 text-sm font-bold hover:underline"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="py-6">
            <div className="flex justify-between items-center mb-6 px-1">
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">Shop by Category</h2>
                <div className="w-12 h-1 bg-emerald-500 rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                {categories.map((category, index) => (
                    <motion.div
                        key={category.categoryId}
                        whileHover={{ y: -8, scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, type: "spring", stiffness: 300 }}
                        className="flex flex-col items-center cursor-pointer group"
                        onClick={() => router.push(`/dashboard/products?categoryId=${category.categoryId}&name=${encodeURIComponent(category.categoryName)}`)}
                    >
                        <div className={`w-full aspect-square ${colors[index % colors.length]} rounded-[2rem] flex items-center justify-center mb-3 shadow-sm transition-all group-hover:shadow-xl group-hover:shadow-emerald-900/5 overflow-hidden relative border-2 border-transparent group-hover:border-white`}>
                            <img
                                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/${category.cateogryImage}`}
                                alt={category.categoryName}
                                className="w-full h-full object-cover drop-shadow-xl transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerHTML = `<span class="text-4xl">🛒</span>`;
                                }}
                            />
                            {/* Decorative glow */}
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        </div>
                        <span className="text-center text-xs sm:text-sm font-black text-gray-700 group-hover:text-emerald-600 leading-tight px-2 uppercase tracking-tight transition-colors">
                            {category.categoryName}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default CategoryGrid;
