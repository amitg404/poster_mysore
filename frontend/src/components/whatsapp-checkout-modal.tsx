"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";

interface WhatsAppCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cartItems: any[];
  totalAmount: number;
  couponCode?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
}

export function WhatsAppCheckoutModal({ isOpen, onClose, cartItems, totalAmount, user, couponCode }: WhatsAppCheckoutModalProps) {
  const [dropZone, setDropZone] = useState("SJCE");
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();
  const { clearCart } = useCartStore();
  const router = useRouter();

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      // Check if Razorpay is already loaded
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      
      // Check if script is already in the DOM
      const existingScript = document.querySelector('script[src*="razorpay"]');
      if (existingScript) {
        // Wait for it to load
        existingScript.addEventListener('load', () => resolve(true));
        // If it's already loaded but Razorpay isn't defined, give it a moment
        setTimeout(() => {
          if ((window as any).Razorpay) resolve(true);
          else resolve(false);
        }, 500);
        return;
      }
      
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);

    const res = await loadRazorpay();

    if (!res) {
      toast.error("Razorpay SDK failed to load. Are you online?");
      setLoading(false);
      return;
    }

    try {
      // 0. Fetch Key
      const keyRes = await axios.get("/api/payment/key", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 1. Create Order
      const result = await axios.post("/api/payment/order", 
        { amount: totalAmount, couponCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!result) {
        toast.error("Server error. Are you online?");
        setLoading(false);
        return;
      }

      const { amount, id: order_id, currency } = result.data;

      // 2. Open Razorpay Checkout
      const options = {
        key: keyRes.data.key, // From Backend
        amount: amount.toString(),
        currency: currency,
        name: "PosterShop Mysore",
        description: "Premium Posters",
        image: "https://postershop.store/logo.png", // Replace with your logo URL
        order_id: order_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async function (response: any) {
          const data = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            items: cartItems, // Pass items for DB creation
            amount: totalAmount,
            dropZone: dropZone,
            email: email // Pass collected email to backend
          };

          // 3. Verify Payment
          try {
             const verifyRes = await axios.post("/api/payment/verify", data, {
                 headers: { Authorization: `Bearer ${token}` }
             });

             if (verifyRes.status === 200) {
                 toast.success("Payment Successful! Order Placed.");
                 handleSuccessOrder(response.razorpay_payment_id);
             }
          } catch (error) {
             console.error(error);
             toast.error("Payment Verification Failed");
          }
        },
        prefill: {
          name: user?.name || "",
          email: email || "",
          contact: phoneNumber || "",
        },
        notes: {
          address: dropZone,
        },
        theme: {
          color: "#22c55e", // Green
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error) {
        console.error("Payment Error:", error);
        toast.error("Something went wrong with payment init.");
    } finally {
        setLoading(false);
    }
  };

  const handleSuccessOrder = (paymentId: string) => {
      // 1. Clear Cart & specific User Sync
      clearCart();
      
      // IMMEDIATE SYNC: Fetch fresh user data to update orderCount
      // This ensures the "First Order" offers are locked immediately
      useAuthStore.getState().checkAuth(); 
      
      onClose();
      
      // 2. Redirect to Success Page
      // Pass details for the page to render
      router.push(`/order-success?orderId=${paymentId}&amount=${totalAmount}`);
  };
  
  const [phoneNumber, setPhoneNumber] = useState(user?.mobile || "");
  const [email, setEmail] = useState(user?.email || "");

  const validateAndPay = () => {
      if (!phoneNumber || phoneNumber.length < 10) {
          toast.error("Please enter a valid phone number.");
          return;
      }
      if (!email || !email.includes("@")) {
          toast.error("Please enter a valid email address.");
          return;
      }
      handlePayment();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card w-full max-w-md rounded-3xl border border-white/10 overflow-hidden relative z-10 shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-primary/20 to-emerald-500/20 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Complete Order</h2>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 space-y-6">
                
                {/* Step 1: Contact Info */}
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground block mb-2">Mobile Number <span className="text-red-500">*</span></label>
                        <input 
                            type="tel" 
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="Enter your mobile number"
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground block mb-2">Email Address <span className="text-red-500">*</span></label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com (For Recovery)"
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                {/* Step 2: Drop Zone */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Select Drop Zone (Delivery Tomorrow 4 PM)</label>
                    <div className="grid grid-cols-2 gap-3">
                        {["SJCE", "VidyaVardhaka"].map((zone) => (
                            <button
                                key={zone}
                                onClick={() => setDropZone(zone)}
                                className={`py-3 px-4 rounded-xl border transition-all font-medium ${
                                    dropZone === zone 
                                    ? "bg-primary text-black border-primary" 
                                    : "bg-secondary/50 border-transparent hover:border-white/20"
                                }`}
                            >
                                {zone}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-white/5 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total Amount</span>
                        <span className="font-bold text-white text-lg">₹{totalAmount}</span>
                    </div>
                    <p className="text-xs text-green-400">Secure Payment by Razorpay</p>
                </div>

                {/* Pay Button */}
                <button 
                    onClick={validateAndPay}
                    disabled={loading}
                    className="w-full py-4 bg-primary hover:bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Pay Now"}
                </button>
                
                <p className="text-xs text-center text-muted-foreground">
                    UPI, Cards, Netbanking Accepted.
                </p>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
