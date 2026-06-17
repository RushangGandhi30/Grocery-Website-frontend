'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit3, Trash2, Package, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { deleteProduct, getProductsByCategoryId } from '@/app/services/productsServices';
import { getAllCategory } from '@/app/services/categoryServices';
import toast from 'react-hot-toast';

function ProductsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const categoryId = searchParams.get('categoryId');

    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);


    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await getAllCategory();
                if (response && response.status === true) {
                    setCategories(response.data.categories || []);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (categoryId) {
            fetchProducts(categoryId);
        } else {
            setIsLoading(false);
        }
    }, [categoryId]);

    const fetchProducts = async (catId) => {
        try {
            setIsLoading(true);
            const response = await getProductsByCategoryId(catId);
            if (response && response.status === true) {
                setProducts(response.data.productsByCategoryId || []);
            } else {
                setError(response?.message || "Failed to load products");
            }
        } catch (err) {
            console.error("Error fetching products:", err);
            setError("Something went wrong while fetching products");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (productId) => {
        setProductToDelete(productId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        setIsDeleting(true);
        const loadingToast = toast.loading("Deleting product...");

        try {
            const response = await deleteProduct(productToDelete);
            if (response && response.status === true) {
                toast.success("Product deleted successfully", { id: loadingToast });
                fetchProducts(categoryId);
                setIsDeleteModalOpen(false);
            } else {
                toast.error(response?.message || "Failed to delete product", { id: loadingToast });
            }
        } catch (error) {
            toast.error("An error occurred while deleting", { id: loadingToast });
        } finally {
            setIsDeleting(false);
            setProductToDelete(null);
        }
    };


    const filteredProducts = products.filter(product =>
        (product.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(product.productId || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/admin/categories')}
                        className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm group active:scale-95 text-gray-600"
                        title="Back to Categories"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <Package className="text-emerald-600" /> Catalog Management
                        </h1>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">
                            {products.length} Products in Inventory
                        </p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full sm:w-auto">
                        <select
                            value={categoryId || ''}
                            onChange={(e) => router.push(`/admin/products${e.target.value ? `?categoryId=${e.target.value}` : ''}`)}
                            className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-semibold text-sm outline-none shadow-sm cursor-pointer appearance-none text-gray-700"
                        >
                            <option value="" disabled>Select Category...</option>
                            {categories.map((cat) => (
                                <option key={cat.categoryId} value={cat.categoryId}>
                                    {cat.categoryName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="text-gray-400" size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-sm outline-none shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => router.push(`/admin/products/add${categoryId ? `?categoryId=${categoryId}` : ''}`)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 shadow-lg shadow-emerald-200 rounded-xl text-sm font-black text-white hover:bg-emerald-700 transition-colors uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Plus size={18} /> Add Product
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 size={40} className="animate-spin text-emerald-500" />
                </div>
            ) : error ? (
                <div className="text-center py-20">
                    <div className="text-red-500 mb-4 flex justify-center"><AlertCircle size={40} /></div>
                    <h2 className="text-lg font-black text-gray-900">{error}</h2>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {filteredProducts.map((product) => {
                                const stock = product.stock !== undefined ? product.stock : 100; // Mock stock if missing
                                const isOutOfStock = stock === 0;
                                const isLowStock = stock > 0 && stock <= 15;

                                return (
                                    <motion.div
                                        key={product.productId}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group"
                                    >
                                        <div className="p-4 bg-gray-50/50 flex items-center justify-center relative h-56 overflow-hidden">
                                            {isOutOfStock && (
                                                <div className="absolute top-3 left-3 bg-red-100 text-red-600 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-red-200 flex items-center gap-1 z-10">
                                                    <AlertCircle size={10} /> OUT OF STOCK
                                                </div>
                                            )}
                                            {isLowStock && (
                                                <div className="absolute top-3 left-3 bg-amber-100 text-amber-600 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-amber-200 flex items-center gap-1 z-10">
                                                    LOW STOCK
                                                </div>
                                            )}

                                            <img
                                                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/${product.productImg}`}
                                                alt={product.productName}
                                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-sm p-4"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.parentNode.innerHTML = '<span class="text-6xl">🛒</span>';
                                                }}
                                            />
                                        </div>

                                        <div className="p-5 flex-grow border-t border-gray-50">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 line-clamp-1">{product.Description || 'Category Product'}</p>
                                            <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 mb-3">
                                                {product.productName}
                                            </h3>

                                            <div className="flex items-end justify-between mt-auto">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-0.5">Price</p>
                                                    <p className="text-xl font-black text-gray-900 flex items-center">
                                                        ₹{Number(product.price).toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-0.5">Stock</p>
                                                    <p className={`text-base font-black ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-emerald-600'}`}>
                                                        {stock} <span className="text-xs text-gray-400 font-medium">units</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 border-t border-gray-50 flex gap-2 bg-gray-50/30">
                                            <button
                                                onClick={() => router.push(`/admin/products/edit?productId=${product.productId}&categoryId=${categoryId}`)}
                                                // onClick={() => router.push(`/admin/products/edit/${product.productId}`)}
                                                className="flex-1 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-700 uppercase tracking-widest hover:bg-gray-50 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                            >
                                                <Edit3 size={14} /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.productId)}
                                                className="py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-colors shadow-sm"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-sm">
                                <Package className="text-gray-300" size={32} />
                            </div>
                            <h2 className="text-lg font-black text-gray-900">No products found</h2>
                            <p className="text-sm font-medium text-gray-500">No products in this category yet.</p>
                        </div>
                    )}
                </>
            )}
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100"
                        >
                            <div className="p-8 text-center">
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Trash2 size={36} className="text-red-500" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-3">Confirm Deletion</h3>
                                <p className="text-sm font-medium text-gray-500 leading-relaxed mb-8">
                                    Are you sure you want to delete this product? This action cannot be undone.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        disabled={isDeleting}
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="flex-1 py-4 px-6 rounded-2xl text-xs font-black text-gray-600 bg-gray-50 hover:bg-gray-100 uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={isDeleting}
                                        onClick={confirmDelete}
                                        className="flex-1 py-4 px-6 rounded-2xl text-xs font-black text-white bg-red-500 shadow-lg shadow-red-200 hover:bg-red-600 uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isDeleting ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            'Delete'
                                        )}
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

export default function AdminProductsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>}>
            <ProductsContent />
        </Suspense>
    );
}
