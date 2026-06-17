'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit2, Trash2, Package, Image as ImageIcon, X, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllCategory, API_URL, addCategory, updateCategory, deleteCategory } from '@/app/services/categoryServices';
import { getProductsByCategoryId } from '@/app/services/productsServices';
import toast from 'react-hot-toast';



export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '' });
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setIsLoading(true);

            const response = await getAllCategory();
            if (!response?.status) return;

            const categoriesData = response.data.categories;

            const finalData = [];

            // ✅ simple loop (no Promise.all, no tricks)
            for (let i = 0; i < categoriesData.length; i++) {
                const c = categoriesData[i];

                let count = 0;

                try {
                    const prodRes = await getProductsByCategoryId(c.categoryId);
                    count = prodRes?.data?.productsByCategoryId?.length || 0;
                } catch (err) {
                    count = 0;
                }

                finalData.push({
                    id: c.categoryId,
                    name: c.categoryName,
                    image: c.cateogryImage ? `${API_URL}/${c.cateogryImage}` : '',
                    items: count
                });
            }

            setCategories(finalData);

        } catch (error) {
            console.error("Error:", error);
            toast.error("Failed to load categories");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle form change
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Handle image selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (editingCategory) {
            handleEditCategory();
        } else {
            handleAddCategory();
        }
    };

    // Save or update
    const handleAddCategory = async () => {
        const categoryData = new FormData();

        categoryData.append('categoryName', formData.name);
        categoryData.append('createdBy', 1);

        if (imageFile) {
            categoryData.append('categoryImage', imageFile);
        }

        try {
            await toast.promise(addCategory(categoryData), {
                loading: 'Creating category...',
                success: 'Category created!',
                error: (err) => err.response?.data?.message || 'Error'
            });

            resetForm();
            fetchCategories();

        } catch (err) {
            console.error(err);
        }
    };

    const handleEditCategory = async () => {
        const categoryData = new FormData();

        categoryData.append('categoryId', editingCategory.id);
        categoryData.append('categoryName', formData.name);
        categoryData.append('updatedBy', 1);

        if (imageFile) {
            categoryData.append('categoryImage', imageFile);
        }

        try {
            await toast.promise(updateCategory(categoryData), {
                loading: 'Updating category...',
                success: 'Category updated!',
                error: (err) => err.response?.data?.message || 'Error'
            });

            resetForm();
            fetchCategories();

        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setIsAddModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '' });
        setImageFile(null);
        setPreviewUrl('');
    };
    // Open Edit Modal
    const openEditModal = (cat) => {
        setEditingCategory(cat);
        setFormData({ name: cat.name });
        setPreviewUrl(cat.image); // Show current image in preview
        setImageFile(null); // Reset file selection
        setIsAddModalOpen(true);
    };

    // Delete
    const handleDelete = (cat) => {
        setCategoryToDelete(cat);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!categoryToDelete) return;

        try {
            await toast.promise(deleteCategory(categoryToDelete.id), {
                loading: 'Deleting category...',
                success: 'Category deleted successfully!',
                error: 'Failed to delete category'
            });
            setIsDeleteModalOpen(false);
            setCategoryToDelete(null);
            fetchCategories(); // Simple refresh
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="p-6 md:p-8 w-full max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Food Categories</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Manage product categories and navigation</p>
                </div>
                <button
                    onClick={() => {
                        setEditingCategory(null);
                        setFormData({ name: '' });
                        setImageFile(null);
                        setPreviewUrl('');
                        setIsAddModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-200"
                >
                    <Plus size={18} strokeWidth={2.5} />
                    Add Category
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="pl-3 text-gray-400">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none outline-none py-2 text-sm font-semibold text-gray-800 placeholder-gray-400"
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20 w-full">
                    <Loader2 size={40} className="animate-spin text-emerald-500" />
                </div>
            ) : (
                <>
                    {/* Categories Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {filteredCategories.map((cat) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    key={cat.id}
                                    className="bg-white group rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all duration-300 flex flex-col"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-emerald-100/50 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                                            {cat.image && (cat.image.startsWith('http') || cat.image.startsWith('/')) ? (
                                                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                                            ) : (
                                                cat.image || <ImageIcon className="text-emerald-300" size={24} />
                                            )}
                                        </div>
                                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditModal(cat)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(cat)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{cat.name}</h3>
                                    <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-4 flex-1">{cat.description}</p>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                                            <Package size={14} />
                                            {cat.items} Items
                                        </div>
                                    </div>

                                    {/* View Products Button */}
                                    <Link href={`/admin/products?categoryId=${cat.id}`} className="mt-4 block text-center w-full bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 font-bold py-2.5 rounded-xl border border-gray-100 hover:border-emerald-200 transition-all text-sm group/btn flex justify-center items-center gap-2">
                                        Manage Products
                                        <Package size={16} className="group-hover/btn:scale-110 transition-transform" />
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {filteredCategories.length === 0 && (
                        <div className="text-center py-20 w-full">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-4">
                                <Search size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">No categories found</h3>
                            <p className="text-gray-500 mt-2 font-medium">Try adjusting your search criteria or add a new category.</p>
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                        {editingCategory ? 'Edit Category' : 'New Category'}
                                    </h2>
                                    <p className="text-sm font-medium text-gray-500 mt-1">
                                        {editingCategory ? 'Update the details below' : 'Add a new product category'}
                                    </p>
                                </div>
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-full transition-all shadow-sm border border-gray-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-col flex h-full max-h-[80vh] overflow-y-auto">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Category Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-gray-800"
                                        placeholder="e.g. Fresh Drinks"
                                    />
                                </div>                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Category Image</label>
                                    <div className="relative group overflow-hidden">
                                        <div className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group-hover:bg-gray-100 transition-colors cursor-pointer">
                                            {previewUrl ? (
                                                <>
                                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => document.getElementById('imageInput').click()}
                                                            className="p-3 bg-white text-gray-900 rounded-full hover:scale-110 transition-transform"
                                                        >
                                                            <Edit2 size={20} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setImageFile(null);
                                                                setPreviewUrl('');
                                                            }}
                                                            className="p-3 bg-red-600 text-white rounded-full hover:scale-110 transition-transform"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center" onClick={() => document.getElementById('imageInput').click()}>
                                                    <div className="w-16 h-16 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 text-emerald-500 group-hover:scale-110 transition-transform">
                                                        <ImageIcon size={28} />
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-900">Choose Image</p>
                                                    <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-widest">SVG, PNG, JPG (MAX. 800x400px)</p>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            id="imageInput"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3 mt-4 border-t border-gray-50">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1 px-5 py-3 rounded-xl font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-5 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-200"
                                    >
                                        {editingCategory ? 'Save Changes' : 'Create Category'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm relative z-10 overflow-hidden border border-red-50"
                        >
                            <div className="p-8 text-center">
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 animate-pulse">
                                    <AlertCircle size={40} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2 uppercase italic">Are you sure?</h2>
                                <p className="text-gray-500 font-medium mb-6 italic">
                                    You are about to delete <span className="font-bold text-red-600">"{categoryToDelete?.name}"</span>. This action cannot be undone.
                                </p>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={confirmDelete}
                                        className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-[0.98] uppercase tracking-widest text-xs italic"
                                    >
                                        Yes, delete it
                                    </button>
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl transition-all uppercase tracking-widest text-xs italic"
                                    >
                                        Cancel
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
