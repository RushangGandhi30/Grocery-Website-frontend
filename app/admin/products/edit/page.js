'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, X, Image as ImageIcon, IndianRupee, Layers, Package, AlignLeft, Tag, CheckCircle, Circle } from 'lucide-react';
import { getProductById, updateProduct } from '@/app/services/productsServices';
import { Suspense } from 'react';


export default function AdminEditProductPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        }>
            <EditProductContent />
        </Suspense>
    );
}


function EditProductContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlCategoryId = searchParams.get('categoryId');
    const productId = searchParams.get('productId');

    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        discountPrice: '',
        stock: '',
        categoryId: urlCategoryId || '',
        description: '',
        isActive: true,
        image: null
    });

    useEffect(() => {
        if (urlCategoryId) {
            setFormData(prev => ({ ...prev, categoryId: urlCategoryId }));
        }
    }, [urlCategoryId]);

    useEffect(() => {
        if (!productId) return;

        const fetchProduct = async () => {
            try {
                const response = await getProductById(productId);

                if (response && response.status === true) {
                    const p = response.data.getProductById[0];

                    if (p) {
                        setFormData({
                            name: p.productName || '',
                            price: p.price || '',
                            discountPrice: p.discountPrice || '',
                            stock: p.stock || '',
                            categoryId: p.categoryId || '',
                            description: p.description || '',
                            isActive: p.isActive === 1 || p.isActive === true,
                            image: null
                        });

                        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                        const imagePath = p.productImage || p.productImg;

                        if (imagePath) {
                            const imageUrl = imagePath.startsWith('http') ? imagePath : `${baseUrl}/${imagePath}`;
                            console.log("Loading image from URL:", imageUrl);
                            setImagePreview(imageUrl);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            }
        };

        fetchProduct();
    }, [productId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert("User session not found. Please login again.");
            return;
        }



        setIsLoading(true);

        try {
            const data = new FormData();
            data.append('productId', productId);
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('price', formData.price);
            data.append('discountPrice', formData.discountPrice || 0);
            data.append('stock', formData.stock);
            data.append('categoryId', formData.categoryId);
            data.append('isActive', formData.isActive ? 1 : 0);
            data.append('updatedBy', userId);
            // data.append('image', formData.image);
            if (formData.image) {
                data.append('image', formData.image);
            }


            const response = await updateProduct(data);

            if (response && response.status === true) {
                alert("Product update successfully!");
                router.push(`/admin/products?categoryId=${formData.categoryId}`);
            } else {
                alert(response?.message || "Failed to add product");
            }
        } catch (error) {
            console.error("Error adding product:", error);
            alert(error.response?.data?.message || "An error occurred while adding the product");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full font-sans pb-24">

            {/* Header section */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Edit Product</h1>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">Update your inventory</p>
                    </div>
                </div>

                {/* Desktop Actions */}
                <div className="hidden sm:flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-2.5 rounded-xl text-xs font-black text-gray-600 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                        <X size={16} /> Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 border border-emerald-600 shadow-lg shadow-emerald-200 hover:bg-emerald-700 uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <><Save size={16} /> Save Product</>
                        )}
                    </button>
                </div>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Details (Left Col) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6 md:p-8">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <AlignLeft size={16} className="text-emerald-500" /> Basic Details
                        </h2>

                        <div className="space-y-5">
                            {/* Category is pre-selected from the previous page */}

                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Farm Fresh Organic Apples"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-semibold text-gray-900 text-sm outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Description</label>
                                <textarea
                                    name="description"
                                    rows="4"
                                    required
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Brief description of the product..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-gray-900 text-sm outline-none resize-none"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6 md:p-8">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <ImageIcon size={16} className="text-emerald-500" /> Product Media
                        </h2>

                        <div
                            onClick={() => document.getElementById('productImage').click()}
                            className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 transition-colors group cursor-pointer relative overflow-hidden h-64"
                        >
                            {imagePreview ? (
                                <div className="absolute inset-0 w-full h-full p-2">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-contain rounded-xl"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <p className="text-white text-xs font-black uppercase tracking-widest">Change Image</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-white border border-gray-100 rounded-full shadow-sm flex items-center justify-center mb-4 text-emerald-500 group-hover:scale-110 transition-transform">
                                        <ImageIcon size={24} />
                                    </div>
                                    <p className="text-sm font-bold text-gray-700">Click to upload image</p>
                                    <p className="text-[11px] font-semibold text-gray-400 mt-1 uppercase tracking-widest">SVG, PNG, JPG or GIF</p>
                                </>
                            )}

                            <input
                                id="productImage"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Col: Pricing & Inventory */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <IndianRupee size={16} className="text-emerald-500" /> Pricing
                        </h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Base Price</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <IndianRupee className="text-gray-400" size={16} />
                                    </div>
                                    <input
                                        type="number"
                                        name="price"
                                        min="0"
                                        step="0.01"
                                        required
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-black text-emerald-700 text-lg outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Tag size={12} /> Discount Price
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <IndianRupee className="text-gray-400" size={16} />
                                    </div>
                                    <input
                                        type="number"
                                        name="discountPrice"
                                        min="0"
                                        step="0.01"
                                        value={formData.discountPrice}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-bold text-gray-700 text-sm outline-none"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Package size={16} className="text-emerald-500" /> Inventory
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Available Stock</label>
                                <input
                                    type="number"
                                    name="stock"
                                    min="0"
                                    required
                                    value={formData.stock}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-semibold text-gray-900 text-sm outline-none"
                                    placeholder="0"
                                />
                            </div>

                            <div className="pt-2">
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4">Product Status</label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleChange}
                                            className="sr-only"
                                        />
                                        <div className={`w-12 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                    <span className={`text-xs font-black uppercase tracking-widest ${formData.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                        {formData.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </label>
                                <p className="text-[10px] font-semibold text-gray-400 mt-2 leading-relaxed italic">Inactive products won't be visible to customers.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Float Actions */}
                <div className="fixed bottom-0 left-0 w-full sm:hidden p-4 bg-white border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] flex gap-3 z-30">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 py-3.5 rounded-xl text-xs font-black text-gray-600 bg-gray-50 border border-gray-200 uppercase tracking-widest active:scale-95 transition-all text-center"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}

                        className="flex-[2] py-3.5 rounded-xl text-xs font-black text-white bg-emerald-600 border border-emerald-600 shadow-lg shadow-emerald-200 uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <><Save size={16} /> Save Product</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
