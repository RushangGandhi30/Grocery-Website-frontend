'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, ChevronRight, CreditCard, Truck, Loader2 } from 'lucide-react';
import { deleteCartItem, getCartByUserId, updateCart } from '@/app/services/cartSevices';
import { createOrder } from '@/app/services/orderServices';
import { generateRazorpayOrder } from '@/app/services/paymentServicess';
import AddressSelectionModal from '@/components/AddressSelectionModal';

export default function CartPage() {
    const router = useRouter();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const userId = localStorage.getItem('userId');

            const response = await getCartByUserId(userId);
            if (response.status && response.data.cart) {
                // Map API data to component requirements
                const mappedItems = response.data.cart.map(item => ({
                    cartItemId: item.cartItemId,
                    cartId: item.cartId, // Include cartId for order creation
                    name: item.productname,
                    weight: "Unit",
                    price: parseFloat(item.price),
                    image: item.productImg,
                    quantity: item.quantity,
                    totalPrice: parseFloat(item.total_price)
                }));
                setCartItems(mappedItems);
            }
        } catch (err) {
            console.error("Error fetching cart:", err);
            setError("Failed to load cart items. Please try again.");
        } finally {
            setLoading(false);
        }
    };


    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const MIN_ORDER_AMOUNT = 1;

    const getDeliveryFee = (subtotal) => {
        if (subtotal >= 500) return 0;
        if (subtotal >= 200) return 15;
        if (subtotal >= 1) return 25;
        return 0;
    }
    const deliveryFee = subtotal > 0 ? getDeliveryFee(subtotal) : 0;
    // const tax = subtotal * 0.05;
    const total = subtotal + deliveryFee;
    // Minimum check
    const isMinimumMet = subtotal >= MIN_ORDER_AMOUNT;

    // Free delivery helper
    const remainingForFree = subtotal < 500 ? 500 - subtotal : 0;

    const updateQuantity = async (cartItemId, delta) => {
        try {
            // Find current item to calculate new quantity
            const item = cartItems.find(i => i.cartItemId === cartItemId);
            if (!item) return;

            const newQty = item.quantity + delta;

            // If new quantity is 0 or less, we should probably remove the item
            if (newQty <= 0) {
                await removeItem(cartItemId);
                return;
            }

            const userId = localStorage.getItem('userId');

            // Optimistic update for better UX
            setCartItems(prev => prev.map(i =>
                i.cartItemId === cartItemId ? { ...i, quantity: newQty } : i
            ));

            const response = await updateCart(cartItemId, newQty, userId);

            if (!response.status) {
                // Revert optimistic update if API fails
                fetchCart();
                alert("Failed to update quantity. Please try again.");
            }
        } catch (err) {
            console.error("Error updating quantity:", err);
            // Revert optimistic update on error
            fetchCart();
        }
    };

    const removeItem = async (cartItemId) => {
        try {
            console.log(cartItemId);
            await deleteCartItem(cartItemId);
            fetchCart();
        } catch (error) {
            console.log(error);
        }
    };

    const handlePayment = async () => {

        if (!isMinimumMet) {
            alert(`Minimum order should be ₹${MIN_ORDER_AMOUNT}`);
            return;
        }
        if (!selectedAddress) {
            alert("Please select a delivery address.");
            setIsAddressModalOpen(true);
            return;
        }

        try {
            setIsProcessing(true);
            const userId = localStorage.getItem('userId');

            // Assuming cartId is tied to items or we need to pass it
            // From the image, cartId: 1 was used. Let's try to get it from the first item if available
            // or just pass the userId if the backend handles it.
            // Looking at the cartItems mapping: cartItemId is item.cartItemId

            const orderData = {
                userId: parseInt(userId),
                addressId: selectedAddress.address_id_pk || selectedAddress.addressId,
                totalAmount: total,
                paymentMethod: "ONLINE",
                cartId: cartItems[0]?.cartId || 1 // Fallback or logic to get cartId
            };

            const response = await createOrder(orderData);
            console.log("Create Order Response:", response);

            if (response.status && response.data) {
                // Step 2: Generate Razorpay Order
                const razorpayResponse = await generateRazorpayOrder({
                    userId: parseInt(userId),
                    orderId: response.data.orderId || response.data.id || response.data.order_id,
                    amount: total
                });
                console.log("Generate Razorpay Response:", razorpayResponse);

                if (razorpayResponse.status && razorpayResponse.data) {
                    const options = {
                        key: razorpayResponse.data.razorpayKey || "rzp_test_SPqQ4f2Y0bWgYn",
                        amount: razorpayResponse.data.amount, // Should be in paise
                        currency: razorpayResponse.data.currency || "INR",
                        name: "Grocery Store",
                        description: "Order Payment",
                        order_id: razorpayResponse.data.razorpayOrderId,
                        handler: function (response) {
                            console.log("Payment Success Handler:", response);
                            alert("Order placed successfully!");
                            router.push('/dashboard/orders');
                        },
                        prefill: {
                            name: localStorage.getItem('userName') || "",
                            email: localStorage.getItem('userEmail') || "",
                        },
                        theme: {
                            color: "#059669",
                        },
                    };

                    console.log("Razorpay Options:", options);

                    if (options.key === "rzp_test_your_key") {
                        alert("Razorpay UI nahi khul raha kyunki Key ID 'rzp_test_your_key' ek placeholder hai. Please apni real Razorpay Test Key use kariye.");
                        setIsProcessing(false);
                        return;
                    }

                    const rzp = new window.Razorpay(options);
                    rzp.on('payment.failed', function (response) {
                        console.error("Payment Failed Callback:", response.error);
                        alert("Payment failed: " + response.error.description);
                    });
                    rzp.open();
                } else {
                    alert(razorpayResponse.message || "Failed to generate Razorpay order.");
                }
            } else {
                alert(response.message || "Failed to initiate payment.");
            }
        } catch (err) {
            console.error("Payment error:", err);
            alert("An error occurred during payment initiation.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 size={40} className="text-emerald-600" />
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
                <p className="text-red-500 font-bold mb-4">{error}</p>
                <button
                    onClick={fetchCart}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
                <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-90 bg-gray-50 text-gray-700"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Your Basket</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cartItems.length} Items Selected</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 pt-8">
                {cartItems.length > 0 ? (
                    <div className="space-y-6">
                        {/* Cart Items List */}
                        <div className="space-y-4">
                            {cartItems.map((item, index) => (
                                <motion.div
                                    key={item.cartItemId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-xl hover:shadow-emerald-900/5 transition-all group"
                                >
                                    <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                        {item.image.startsWith('static') || item.image.startsWith('/') ? (
                                            <img
                                                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/${item.image}`}
                                                alt={item.name}
                                                className="w-full h-full object-contain p-2"
                                            />
                                        ) : (
                                            <span className="text-5xl">{item.image}</span>
                                        )}
                                    </div>

                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-extrabold text-gray-900 text-lg">{item.name}</h3>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.weight}</p>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.cartItemId)}
                                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-end mt-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-400">₹{item.price} × {item.quantity}</span>
                                                <span className="text-xl font-black text-emerald-600">₹{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>

                                            <div className="flex items-center gap-4 bg-gray-900 text-white rounded-2xl p-1 shadow-lg shadow-gray-200">
                                                <button
                                                    onClick={() => updateQuantity(item.cartItemId, -1)}
                                                    className="p-1 px-2 hover:bg-white/10 rounded-xl transition-colors"
                                                >
                                                    <Minus size={16} strokeWidth={3} />
                                                </button>
                                                <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.cartItemId, 1)}
                                                    className="p-1 px-2 hover:bg-white/10 rounded-xl transition-colors"
                                                >
                                                    <Plus size={16} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Delivery Details Section */}
                        <div
                            onClick={() => setIsAddressModalOpen(true)}
                            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm cursor-pointer hover:shadow-lg hover:shadow-emerald-900/5 transition-all group active:scale-[0.98]"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4 text-emerald-600">
                                    <Truck size={24} />
                                    <h3 className="font-black text-gray-900 uppercase tracking-tight">Delivery Details</h3>
                                </div>
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-widest group-hover:bg-emerald-600 group-hover:text-white transition-colors">Change</span>
                            </div>

                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                                        {selectedAddress ? (
                                            (selectedAddress.address_type || selectedAddress.addressType || "").toLowerCase() === 'home' ? '🏠' :
                                                (selectedAddress.address_type || selectedAddress.addressType || "").toLowerCase() === 'office' ? '💼' : '📍'
                                        ) : '📍'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-gray-900 uppercase">
                                            {selectedAddress ? (selectedAddress.address_type || selectedAddress.addressType) : 'Select Address'}
                                        </p>
                                        <p className="text-[10px] text-gray-500 font-bold line-clamp-1 truncate">
                                            {selectedAddress ? (selectedAddress.full_address || selectedAddress.fullAddress) : 'No address selected. Tap to choose one.'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-emerald-300 flex-shrink-0" />
                            </div>
                        </div>

                        {/* Address Selection Modal */}
                        <AddressSelectionModal
                            isOpen={isAddressModalOpen}
                            onClose={() => setIsAddressModalOpen(false)}
                            onSelect={(address) => setSelectedAddress(address)}
                            selectedAddressId={selectedAddress?.address_id_pk || selectedAddress?.addressId}
                        />

                        {/* Bill Summary */}
                        <div className="bg-gray-900 text-white p-8 rounded-[3rem] shadow-2xl shadow-gray-300 space-y-4">
                            <div className="flex justify-between items-center opacity-60">
                                <span className="font-bold text-sm uppercase tracking-widest">Subtotal</span>
                                <span className="font-black">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center opacity-60">
                                <span className="font-bold text-sm uppercase tracking-widest">Delivery Fee</span>
                                <span className="font-black text-emerald-400">₹{deliveryFee.toFixed(2)}</span>
                            </div>
                            {/* <div className="flex justify-between items-center opacity-60 border-b border-white/10 pb-4">
                                <span className="font-bold text-sm uppercase tracking-widest">Taxes (5%)</span>
                                <span className="font-black">₹{tax.toFixed(2)}</span>
                            </div> */}
                            {remainingForFree > 0 && (
                                <p className="text-xs text-emerald-300 font-bold">
                                    Add ₹{remainingForFree} more for FREE delivery 🚚
                                </p>
                            )}

                            {!isMinimumMet && (
                                <p className="text-xs text-red-400 font-bold">
                                    Minimum order should be ₹{MIN_ORDER}
                                </p>
                            )}
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xl font-black uppercase tracking-tighter">Grand Total</span>
                                <span className="text-3xl font-black tracking-tighter text-emerald-400">₹{total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center text-7xl mb-6 grayscale opacity-30">
                            <ShoppingBag />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Empty Basket!</h2>
                        <p className="text-gray-400 font-medium mb-8 max-w-[200px]">Looks like you haven't added anything yet.</p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-10 py-4 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-200 transition-all active:scale-95"
                        >
                            Start Shopping
                        </button>
                    </div>
                )}
            </main>

            {/* Bottom Checkout Action */}
            <AnimatePresence>
                {cartItems.length > 0 && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50"
                    >
                        <div className="max-w-3xl mx-auto">
                            <button
                                onClick={handlePayment}
                                disabled={isProcessing || !isMinimumMet}
                                className="w-full bg-gray-900 text-white p-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl flex items-center justify-between group overflow-hidden relative disabled:opacity-70"
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="bg-white/10 p-2.5 rounded-2xl group-hover:bg-emerald-500 transition-colors">
                                        {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <CreditCard size={20} />}
                                    </div>
                                    <span>{isProcessing ? 'Processing...' : 'Proceed to Payment'}</span>
                                </div>
                                <ArrowLeft size={20} className="relative z-10 rotate-180 group-hover:translate-x-2 transition-transform" />
                                <div className="absolute inset-0 bg-emerald-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
