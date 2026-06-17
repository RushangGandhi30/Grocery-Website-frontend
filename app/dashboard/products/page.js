'use client';

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShoppingCart, Plus, Minus, Search, Loader2 } from "lucide-react";
import { getProductsByCategoryId } from "@/app/services/productsServices";
import { addToCart as addToCartService, getCartByUserId } from "@/app/services/cartSevices";

function ProductsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const categoryId = searchParams.get('categoryId');
    const categoryName = searchParams.get('name') || "Products";

    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdding, setIsAdding] = useState(null); // Track which product is being added

    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            await Promise.all([
                categoryId ? fetchProducts() : Promise.resolve(),
                fetchCart()
            ]);
            setIsLoading(false);
        };
        initData();
    }, [categoryId]);

    const fetchCart = async () => {
        try {
            const userId = localStorage.getItem('userId');
            if (userId) {
                const response = await getCartByUserId(userId);
                if (response.status && response.data.cart) {
                    const cartMap = {};
                    response.data.cart.forEach(item => {
                        cartMap[item.productId] = item.quantity;
                    });
                    setCart(cartMap);
                }
            }
        } catch (err) {
            console.error("Error fetching cart:", err);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await getProductsByCategoryId(categoryId);
            if (response && response.status === true) {
                setProducts(response.data.productsByCategoryId || []);
            } else {
                setError(response?.message || "Failed to load products");
            }
        } catch (err) {
            console.error("Error fetching products:", err);
            setError("Something went wrong while fetching products");
        }
    };

    const handleAddToCart = async (productId) => {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                alert("Please login to add items to cart");
                router.push('/');
                return;
            }

            setIsAdding(productId);
            const currentQty = (cart[productId] || 0) + 1;

            const response = await addToCartService(userId, productId, 1); // API seems to add quantity
            if (response.status) {
                setCart(prev => ({
                    ...prev,
                    [productId]: currentQty
                }));
            } else {
                alert(response.message || "Failed to add to cart");
            }
        } catch (err) {
            console.error("Error adding to cart:", err);
            alert("Error adding item to cart. Please try again.");
        } finally {
            setIsAdding(null);
        }
    };

    const handleRemoveFromCart = async (productId) => {
        // Implementation for removing can be added here once a delete/decrement API is available
        // For now, we'll just update the local state to reflect the UI change
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[productId] > 1) {
                newCart[productId] -= 1;
            } else {
                delete newCart[productId];
            }
            return newCart;
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-emerald-500" size={48} />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Loading {categoryName}...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6">
                    <Search size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Oops!</h2>
                <p className="text-gray-500 font-bold mb-8">{error}</p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all"
                >
                    Go Back Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-24 font-sans">
            {/* Header */}
            <header className="bg-white sticky top-0 z-40 border-b border-gray-100 shadow-sm backdrop-blur-md bg-white/80">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2.5 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
                        >
                            <ArrowLeft size={20} className="text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight capitalize">{categoryName}</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{products.length} Items Available</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2.5 hover:bg-gray-100 rounded-2xl transition-all text-gray-400">
                            <Search size={20} />
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/cart')}
                            className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl transition-all relative"
                        >
                            <ShoppingCart size={20} />
                            {Object.keys(cart).length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                                    {Object.values(cart).reduce((a, b) => a + b, 0)}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {products.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={40} className="text-gray-200" />
                        </div>
                        <h3 className="text-gray-900 font-bold text-xl">No products found</h3>
                        <p className="text-gray-500 text-sm mt-2">Check back later for fresh stock!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {products.map((product, index) => (
                            <motion.div
                                key={product.productId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-[2.5rem] border border-gray-100 p-4 flex flex-col hover:shadow-2xl hover:shadow-emerald-900/5 transition-all group border-b-4 border-b-gray-50 active:translate-y-1"
                            >
                                <div className="aspect-square bg-gray-50 rounded-[2rem] mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors" />
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/${product.productImg}`}
                                        alt={product.productName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.parentNode.innerHTML = '<span class="text-4xl">🛒</span>';
                                        }}
                                    />
                                </div>

                                <div className="flex-grow space-y-1">
                                    <h3 className="font-extrabold text-gray-900 text-sm line-clamp-1">{product.productName}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.Description || "N/A"}</p>

                                    <div className="flex items-center gap-2 pt-1">
                                        <span className="text-lg font-black text-gray-900">₹{product.price}</span>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    {cart[product.productId] ? (
                                        <div className="flex items-center justify-between bg-emerald-600 text-white rounded-2xl p-1.5 shadow-lg shadow-emerald-200">
                                            <button
                                                onClick={() => handleRemoveFromCart(product.productId)}
                                                className="p-1 hover:bg-white/20 rounded-xl transition-colors"
                                            >
                                                <Minus size={16} strokeWidth={3} />
                                            </button>
                                            <span className="font-black text-sm">{cart[product.productId]}</span>
                                            <button
                                                onClick={() => handleAddToCart(product.productId)}
                                                className="p-1 hover:bg-white/20 rounded-xl transition-colors"
                                                disabled={isAdding === product.productId}
                                            >
                                                {isAdding === product.productId ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Plus size={16} strokeWidth={3} />
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleAddToCart(product.productId)}
                                            disabled={isAdding === product.productId}
                                            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2 group/btn disabled:opacity-70"
                                        >
                                            {isAdding === product.productId ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Plus size={14} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform" />
                                            )}
                                            {isAdding === product.productId ? 'ADDING...' : 'ADD TO CART'}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>


        </div>
    );
}

export default function CategoryProductsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>}>
            <ProductsContent />
        </Suspense>
    );
}
