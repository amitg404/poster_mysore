
"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Trash2, Minus, Plus, ShoppingBag, Truck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppCheckoutModal } from "@/components/whatsapp-checkout-modal";
import { useCartStore } from "@/store/cartStore";
import { TrendingCarousel } from "@/components/TrendingCarousel";

export default function CartPage() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  
  // Use Zustand Store
  const { items, removeFromCart, addToCart, fetchCart: syncCart, claimedOffer } = useCartStore();

  const [affiliateCode, setAffiliateCode] = useState("");
  // const [discount, setDiscount] = useState(0); // Removed unused state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCouponOpen, setIsCouponOpen] = useState(false);

  useEffect(() => {
    useCartStore.persist.rehydrate();
    if (token) {
        syncCart();
    }
  }, [token, syncCart]);

  const getImageUrl = (url: string) => {
    if (!url) return '/placeholder.png';
    if (url.startsWith('http://localhost:5000')) {
        return url.replace('http://localhost:5000', '');
    }
    return url;
  };

  // --- SMART PRICING ENGINE ---
  const calculatePricing = () => {
    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0);

    // Default: No Discount
    const finalMetric = { total: subtotal, discount: 0, message: "", shippingFee: 0, hasBundles: false };

    // Helper: Calculate Standard Bundle Price (3 for 249 logic)
    const getStandardBundlePrice = (qty: number) => {
        const packs = Math.floor(qty / 3);
        const remainder = qty % 3;
        return (packs * 249) + (remainder * 99);
    };

    // Helper: First Order Logic
    const getFirstOrderPrice = (qty: number) => {
        if (qty <= 0) return 0;
        
        // Tier 1: 1-3 Items
        if (qty === 1) return 99;
        if (qty === 2) return 198; 
        if (qty === 3) return 198; // Buy 2 Get 1 Free

        // Tier 2: 4 Items -> 249
        if (qty === 4) return 249;

        // Tier 3: 5+ Items
        const firstFourCost = 249;
        const remainingQty = qty - 4;
        return firstFourCost + getStandardBundlePrice(remainingQty);
    };

    // Decision Tree
    if (claimedOffer && ['BUY2_GET1_FREE', 'BUY4_AT_249', 'BUY7_AT_499'].includes(claimedOffer)) {
         // Verify Eligibility (Optimistic check on frontend, backend verifies again on order)
         const isEligible = user?.orderCount === 0 || user?.orderCount === undefined; 
         
         if (isEligible) {
             const smartTotal = getFirstOrderPrice(totalQty);
             finalMetric.total = smartTotal;
             finalMetric.discount = subtotal - smartTotal;
             finalMetric.message = "First Order Deal Applied! 🎉";
         }
    }

    // Standard Bundles
    const standardTotal = getStandardBundlePrice(totalQty);
    
    // Apply standard bundle if no specific First Order deal was applied
    if (totalQty >= 3 && !finalMetric.message) {
        finalMetric.total = standardTotal;
        finalMetric.discount = subtotal - standardTotal;
        finalMetric.message = "Bundle Savings Applied";
    }
    
    // Shipping
    finalMetric.shippingFee = finalMetric.total >= 199 ? 0 : 30; 

    return finalMetric;
  };

  const pricing = calculatePricing();
  
  // Affiliate Calculation for Display
  let finalTotal = pricing.total;
  let additionalDiscount = 0;

  if (affiliateCode.toUpperCase() === 'JUST9') {
       // Special Logic
       // Let's re order?
       // The original code:
       // 1. finalTotal = pricing.total
       // 2. discount if affiliate
       // 3. add shipping
       
       // JUST9 should probably be final final.
       // Let's apply it after shipping is added effectively? 
       // Or just force it.
       
       // Re-structure to match backend logic slightly or just visual override
       
       // Apply standard shipping first to see "real" total
       const withShipping = finalTotal + pricing.shippingFee;
       if (withShipping > 9) {
           additionalDiscount = withShipping - 9;
           // So we need `finalTotal + shipping = 9`
           // => `finalTotal = 9 - shipping`
           finalTotal = 9 - pricing.shippingFee;
       }
  } else if (affiliateCode.trim() && !pricing.message) {
      additionalDiscount = finalTotal * 0.10;
      finalTotal -= additionalDiscount;
  }
  
  // Add Shipping Fee to Final Total (Original line)
  finalTotal += pricing.shippingFee;
  
  const displayDiscount = pricing.discount + additionalDiscount;

  // Handlers
  const handleCheckout = () => {
    if (!user) {
      toast.error("Please login to checkout");
      router.push("/login?redirect=/cart");
      return;
    }
    setIsCheckoutOpen(true);
  };

  const manualApplyCode = () => {
      if (!affiliateCode.trim()) return toast.error("Enter a code");
      if (affiliateCode.toUpperCase() === 'JUST9') {
          toast.success("Special Offer Applied! Payment set to ₹9");
          return;
      }
      toast.success("Code checked!");
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDecrease = (item: any) => {
      if (item.quantity > 1) {
         const store = useCartStore.getState();
         if (store.decreaseQuantity) {
             store.decreaseQuantity(item.product!.id);
         }
      } else {
         if (item.product) removeFromCart(item.product.id);
      }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleIncrease = (item: any) => {
      addToCart(item.product);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">PosterShop.store</Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-32 md:pb-8">
        
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-6">Your Cart ({items.reduce((a,b)=>a+b.quantity,0)})</h1>
          
          {items.reduce((a,b)=>a+b.quantity,0) === 3 && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/50 rounded-xl flex items-center gap-4"
              >
                  <div className="p-2 bg-yellow-400 rounded-full text-black">
                      <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                      <h4 className="font-bold text-yellow-400">You have 1 FREE Poster! 🎉</h4>
                      <p className="text-sm text-gray-300">
                          Naughty Tip: Add <span className="text-white font-bold">1 more poster</span> to get another one for free plus <span className="text-white font-bold">50% OFF</span> the next! 😉 
                      </p>
                  </div>
              </motion.div>
          )}
          
          {items.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-white/10">
              <ShoppingBag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Your cart is empty.</p>
              <Link href="/catalog" className="text-primary hover:underline mt-2 inline-block">Browse Posters</Link>
              <div className="max-w-xl mx-auto px-4 text-left">
                  <TrendingCarousel />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <motion.div 
                  key={item.id || item.product.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="flex gap-3 md:gap-4 p-3 md:p-4 bg-card rounded-xl border border-white/10 overflow-hidden"
                >
                  <div className="w-20 h-28 md:w-24 md:h-32 bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product?.images[0] ? (
                      <Image 
                        src={getImageUrl(item.product.images[0])} 
                        alt={item.product.title} 
                        width={100} 
                        height={130} 
                        className="w-full h-full object-cover" 
                        unoptimized={item.product.images[0].includes('uploads')} 
                       />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="font-bold text-white mb-1 line-clamp-1 break-all text-sm md:text-base">{item.product?.title || 'Unknown Product'}</h3>
                        <p className="text-xs text-gray-400 mb-1">{item.product?.category}</p>
                        <p className="text-primary font-bold text-base md:text-lg">₹{item.product?.price}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 md:hidden">
                          <div className="flex items-center gap-3 bg-secondary rounded-lg p-1 border border-white/5">
                              <button onClick={() => handleDecrease(item)} className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded"><Minus className="w-3 h-3" /></button>
                              <span className="w-4 text-center font-bold text-xs">{item.quantity}</span>
                              <button onClick={() => handleIncrease(item)} className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded"><Plus className="w-3 h-3" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.product.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                  </div>

                  <div className="hidden md:flex flex-col items-end justify-between">
                    <button onClick={() => removeFromCart(item.product.id)} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 bg-secondary rounded-lg p-1.5 border border-white/5">
                      <button onClick={() => handleDecrease(item)} className="p-1 hover:bg-white/10 rounded"><Minus className="w-4 h-4" /></button>
                      <span className="w-4 text-center font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => handleIncrease(item)} className="p-1 hover:bg-white/10 rounded"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        {items.length > 0 && (
        <div className="lg:col-span-1">
          <div className="bg-card p-6 rounded-2xl border border-white/10 sticky top-24">
            <h3 className="font-bold text-lg mb-4">Order Summary</h3>

            <div className="mb-6">
              <button 
                onClick={() => setIsCouponOpen(!isCouponOpen)}
                className="text-sm text-primary hover:underline mb-2 flex items-center gap-1"
              >
                  {isCouponOpen ? 'Hide Coupon Code' : 'Have a referral code?'}
              </button>
              
              {isCouponOpen && (
                <div className="flex gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
                    <input 
                    type="text" 
                    value={affiliateCode}
                    onChange={(e) => setAffiliateCode(e.target.value.toUpperCase())}
                    placeholder="Enter Code"
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button onClick={manualApplyCode} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                    Apply
                    </button>
                </div>
              )}

              {additionalDiscount > 0 && (
                 null // Text removed as requested
              )}
            </div>

            <div className="bg-card p-6 rounded-2xl border border-white/10 h-fit sticky top-24">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>₹{pricing.total + pricing.discount}</span>
                </div>
                
                {displayDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount {pricing.message && `(${pricing.message})`}</span>
                    <span>-₹{displayDiscount}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                    <span className="text-gray-400">Shipping</span>
                    <span>{pricing.shippingFee === 0 ? "FREE" : `₹${pricing.shippingFee}`}</span>
                </div>

                <div className="border-t border-white/10 pt-3 flex justify-between font-bold text-lg text-white">
                  <span>Total</span>
                  <span>₹{finalTotal}</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                Checkout via WhatsApp <Truck className="w-4 h-4" />
              </button>
              
              <p className="text-xs text-center text-gray-500 mt-4">
                 Free Delivery on all orders above ₹199
              </p>
              <p className="text-xs text-gray-500 text-center mt-2">Pay via UPI & Track on WhatsApp</p>
            </div>
          </div>
        </div>
        )}
      </main>

      <WhatsAppCheckoutModal 
         isOpen={isCheckoutOpen} 
         onClose={() => setIsCheckoutOpen(false)}
         cartItems={items}
         totalAmount={finalTotal}
         couponCode={affiliateCode}
         user={user}
      />
    </div>
  );
}
