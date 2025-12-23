"use client";

import { useEffect, useState, useMemo } from "react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Check, X, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export function OfferTracker() {
  const { items, lastCelebratedTier, setCelebratedTier, claimedOffer } = useCartStore();
  const { user } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [showNudge, setShowNudge] = useState(false);
  const [designsReady, setDesignsReady] = useState(false);

  // Hidden on specific pages - Added /orders here
  const hiddenRoutes = ['/login', '/signup', '/order-success', '/orders'];
  
  // Check for Designs Ready
  useEffect(() => {
    const checkReady = () => {
        const readyTimeStr = localStorage.getItem("vibe_ready_time");
        const seen = localStorage.getItem("vibe_notification_seen");
        
        if (readyTimeStr && !seen) {
            const readyTime = parseInt(readyTimeStr);
            if (Date.now() >= readyTime) {
                setDesignsReady(true);
            } else {
                // If not ready yet, set a timeout to check when it IS ready
                const timeLeft = readyTime - Date.now();
                if (timeLeft > 0) {
                    const timer = setTimeout(() => setDesignsReady(true), timeLeft);
                    return () => clearTimeout(timer);
                }
            }
        }
    };
    
    checkReady();
    // Poll just in case (e.g. storage updated elsewhere)
    const interval = setInterval(checkReady, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDesignsClick = () => {
      localStorage.setItem("vibe_notification_seen", "true");
      setDesignsReady(false);
      router.push("/catalog?category=For You");
      // Unlock homepage tile via event? Page does it on render/mount anyway.
      // But we might want to refresh current page if we are ON homepage?
      if (pathname === "/") {
          window.location.href = "/catalog?category=For You";
      }
  };

  // Memoize total calculation
  const totalQty = useMemo(() => items.reduce((acc, i) => acc + i.quantity, 0), [items]);

  // Smart Tier Logic - Memoized to prevent re-calcs
  const currentTier = useMemo(() => {
      // 1. Priority: Explicitly Claimed Offer
      if (claimedOffer) {
          switch (claimedOffer) {
              case 'BUY2_GET1_FREE': return { target: 3, name: '3 Pack', next: 4 };
              case 'BUY3_AT_249':    return { target: 3, name: '3 Pack', next: 4 };
              case 'BUY4_AT_249':    return { target: 4, name: '4 Pack', next: 6 };
              case 'BUY6_AT_499':    return { target: 6, name: '6 Pack', next: 7 };
              case 'BUY7_AT_499':    return { target: 7, name: 'Mega Haul', next: null };
              default: break; // Fallback to auto-detect
          }
      }

      // 2. Fallback: Auto-detect based on User Status
      const isNewUser = (user?.orderCount || 0) === 0;

      // Tier 1: 3 Items (Buy 2 Get 1) - ONLY for New Users
      if (isNewUser && totalQty <= 3) return { target: 3, name: '3 Pack', next: 4 };

      // Tier 2: 4 Items (4 @ 249)
      if (totalQty <= 4) return { target: 4, name: '4 Pack Deal', next: 7 };
      
      // Tier 3: 7 Items (7 @ 499)
      if (totalQty <= 7) return { target: 7, name: 'Mega Haul', next: null };
      
      // Top Tier
      return { target: 7, name: 'Max Offer', next: null };
  }, [totalQty, user?.orderCount, claimedOffer]);

  const progress = Math.min((totalQty / currentTier.target) * 100, 100);
  const isUnlocked = totalQty >= currentTier.target;
  
  // Confetti trigger
  useEffect(() => {
     // Only trigger if unlocked AND we haven't celebrated this specific tier target yet
     // AND we are exactly at the target (or just passed it, but typically exactly at it for the event)
     if (isUnlocked && totalQty >= currentTier.target && currentTier.target > lastCelebratedTier) {
         confetti({
             particleCount: 100,
             spread: 60,
             origin: { y: 0.8, x: 0.9 }
         });
         
         // Mark as celebrated so it doesn't fire again on refresh
         setCelebratedTier(currentTier.target);
         
         // Visual Nudge Delay
         const timer = setTimeout(() => setShowNudge(true), 1500); 
         // Auto hide nudge after 8s
         const hideTimer = setTimeout(() => setShowNudge(false), 9500);
         
         return () => {
             clearTimeout(timer);
             clearTimeout(hideTimer);
         };
     } else {
         // Avoid synchronous setState warning
         // setTimeout(() => setShowNudge(false), 0);
     }
  }, [totalQty, isUnlocked, currentTier.target, lastCelebratedTier, setCelebratedTier]);

  if (hiddenRoutes.includes(pathname)) return null;

  // Render Designs Ready Notification INSTEAD
  if (designsReady) {
      return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-[#1a1a1a] border border-green-500/30 p-2 pr-2 pl-4 rounded-full shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-400 fill-current animate-pulse" />
                <span className="text-sm font-bold text-white">Handpicked designs ready!</span>
            </div>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDesignsClick}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black text-sm font-bold rounded-full transition-colors"
            >
                View
            </motion.button>
        </div>
      );
  }

  if (totalQty === 0) return null;

  // Circular segments calculation
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      
      {/* Nudge Tooltip */}
      <AnimatePresence>
        {showNudge && currentTier.next && (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white text-black px-4 py-3 rounded-xl shadow-xl border border-neutral-200 flex items-center gap-3 w-64 mb-2"
            >
                <div className="flex-1">
                    <p className="font-bold text-sm">Offer Unlocked! 🎉</p>
                    <p className="text-xs text-neutral-600">Add {currentTier.next - totalQty} more for next tier?</p>
                </div>
                <button 
                    onClick={() => setShowNudge(false)}
                    className="p-1 hover:bg-neutral-100 rounded-full"
                >
                    <X className="w-4 h-4 text-neutral-400" />
                </button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div 
        layout
        className="relative w-16 h-16 bg-black rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform border border-white/10"
      >
        {/* Progress Circle (Background) */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
                cx="32"
                cy="32"
                r={radius}
                className="stroke-neutral-800"
                strokeWidth="4"
                fill="none"
            />
            {/* Progress Circle (Foreground) */}
            <circle
                cx="32"
                cy="32"
                r={radius}
                className={`transition-all duration-500 ease-out ${isUnlocked ? 'stroke-green-500' : 'stroke-yellow-400'}`}
                strokeWidth="4"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
            />
        </svg>

        {/* Icon / Content - Centered */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
            {isUnlocked ? (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-center"
                >
                    <Check className="w-8 h-8 text-green-500 fill-current" />
                </motion.div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-0.5">
                    <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] font-bold text-white font-mono leading-none tracking-tighter">
                        {totalQty}/{currentTier.target}
                    </span>
                </div>
            )}
        </div>

        {/* Shine Effect */}
        {isUnlocked && (
            <div className="absolute inset-0 rounded-full ring-2 ring-green-500/50 animate-ping" />
        )}
      </motion.div>
    </div>
  );
}
