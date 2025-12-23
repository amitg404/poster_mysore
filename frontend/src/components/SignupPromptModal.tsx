
"use client";

import { useEffect, useState } from "react";
import { X, Gift, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

export function SignupPromptModal() {
  const [isOpen, setIsOpen] = useState(false);
  const items = useCartStore(state => state.items);
  const { user } = useAuthStore();

  useEffect(() => {
    // 1. Check if already seen or closed
    const hasSeen = localStorage.getItem("hasSeenSignupPrompt");
    if (hasSeen) return;

    // 2. Check logic: Cart > 0 AND (Guest OR User with 0 orders)
    if (items.length > 0) {
        // If logged in, check order count
        if (user) {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             if ((user as any).orderCount > 0) return; // Logic says "doesn't have any orders"
        }

        // Show prompt immediately (or small delay for UX) upon adding first item
        const timer = setTimeout(() => setIsOpen(true), 500);
        return () => clearTimeout(timer);
    }
  }, [items.length, user]);

  const handleClose = () => {
      setIsOpen(false);
      localStorage.setItem("hasSeenSignupPrompt", "true");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ y: 200, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="relative w-full max-w-sm sm:max-w-md bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl overflow-hidden"
          >
             {/* Decorative Gradient */}
             <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
             
             <button 
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
             >
                 <X className="w-5 h-5" />
             </button>

             <div className="p-8 flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce-slow">
                     <Gift className="w-8 h-8 text-black" />
                 </div>

                 <h2 className="text-2xl font-bold text-white mb-2">Claim Your Free Poster! 🎁</h2>
                 <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                     Join the club today and get <span className="text-yellow-400 font-bold">1 FREE Poster</span> of your choice on your first order of 2+ items.
                 </p>
                 
                 <div className="bg-white/10 border border-dashed border-white/30 rounded-lg p-3 mb-6">
                     <p className="text-xs text-gray-400 mb-1">Use Coupon Code:</p>
                     <p className="text-xl font-mono font-bold text-primary tracking-widest select-all">FIRSTFREE</p>
                 </div>

                 <div className="w-full space-y-3">
                     <Link 
                        href="/signup" 
                        onClick={handleClose}
                        className="w-full py-3 bg-white text-black font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 group"
                     >
                         <Sparkles className="w-4 h-4 text-purple-600" />
                         Create Free Account
                         <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                     </Link>
                     <button 
                        onClick={handleClose}
                        className="text-sm text-gray-500 hover:text-white transition-colors"
                     >
                         Maybe later
                     </button>
                 </div>
                 
                 <p className="fixed-bottom text-[10px] text-gray-600 mt-6">
                     *Terms & Conditions apply. Min order 2 posters.
                 </p>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
