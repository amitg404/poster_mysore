
"use client";
import { useEffect } from "react";

import { motion } from "framer-motion";
import { Lock, Zap, Gift, CheckCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Define Offers
const OFFERS = [
  {
    id: "BUY2_GET1_FREE",
    title: "Buy 2 Get 1 FREE",
    description: "The classic starter pack. Perfect for a small wall setup.",
    tier: 1,
    requiredCount: 3,
    isFirstOrderOnly: true,
    priceLabel: "₹198",
    color: "from-blue-500 to-cyan-400",
    icon: Gift
  },
  {
    id: "BUY4_AT_249",
    title: "4 Posters @ ₹249",
    description: "Best Value! Upgrade your room instantly.",
    tier: 2,
    requiredCount: 4,
    isFirstOrderOnly: true,
    priceLabel: "₹249",
    color: "from-purple-500 to-pink-500",
    icon: Zap
  },
  {
    id: "BUY3_AT_249",
    title: "3 Posters @ ₹249",
    description: "Standard pack for returning legends.",
    tier: 1,
    requiredCount: 3,
    isFirstOrderOnly: false,
    priceLabel: "₹249",
    color: "from-green-500 to-emerald-400",
    icon: ShieldCheck
  },
  {
    id: "BUY7_AT_499",
    title: "7 Posters @ ₹499",
    description: "Mega Haul. Cover an entire wall!",
    tier: 3,
    requiredCount: 7,
    isFirstOrderOnly: true,
    priceLabel: "₹499",
    color: "from-orange-500 to-red-500",
    icon: Gift
  },
  {
    id: "BUY6_AT_499",
    title: "6 Posters @ ₹499",
    description: "Big savings for big collections.",
    tier: 3,
    requiredCount: 6,
    isFirstOrderOnly: false,
    priceLabel: "₹499",
    color: "from-yellow-400 to-orange-500",
    icon: CheckCircle
  }
];

export default function StudentOffersPage() {
  const { user } = useAuthStore();
  const { setClaimedOffer, claimedOffer } = useCartStore();
  const router = useRouter();

  // Force refresh on mount to ensure orderCount is accurate
  useEffect(() => {
     useAuthStore.getState().checkAuth();
  }, []);

  // Determine if First Order
  // Logic: User must be logged in AND orderCount must be 0 (or undefined if new schema not synced yet, safest to assume 0 if undefined for new users)
  // But wait, if orderCount is undefined in older sessions, we track via backend.
  // Actually, for guest, we block claims as per requirement "Guest user cannot order". 
  // Wait, requirement: "guest user cannot order. No ordering unless logged in". 
  // It implies they can browse, but to claim/checkout loop, they must login?
  // User check: `if (!user)` -> Show login prompt or lock offers.

  // Determine if First Order
  // Strict check: User must serve orderCount > 0 to be existing.
  // We default to 0 if undefined to be safe (users start with 0).
  const isExistingUser = user && (user.orderCount || 0) > 0;
  
  // For other logic if needed (though we rely on isExistingUser for locking)
  const isFirstOrder = !isExistingUser;

  const handleClaim = (offer: typeof OFFERS[0]) => {
      if (!user) {
          toast.error("Please Login to Claim Offers!");
          router.push("/login?redirect=/student-offers");
          return;
      }

      if (offer.isFirstOrderOnly && !isFirstOrder) {
          toast.error("This offer is for First Orders only! Check out other deals.");
          return;
      }

      setClaimedOffer(offer.id);
      toast.success(`${offer.title} Activated! Start adding posters.`);
      
      // Removed auto-redirect to prevent crash and improve UX
      // setTimeout(() => router.push("/catalog"), 500); 
  };

  const handleNavigate = () => {
      router.push("/catalog");
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      
      <main className="container mx-auto px-4 pt-24">

        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
                STUDENT LOOT 🎓
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Exclusive deals for students. Claim an offer to activate special pricing. 
                <br />
                <span className="text-xs text-gray-500">
                    *First Order deals are visible only for new accounts.
                </span>
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {OFFERS.map((offer) => {
                // Lock Logic:
                // Only lock if we KNOW they are an existing user and the offer is restricted.
                // Guests see everything unlocked to encourage sign-up.
                const isLocked = offer.isFirstOrderOnly && isExistingUser;
                const isClaimed = claimedOffer === offer.id;

                return (
                    <motion.div
                        key={offer.id}
                        whileHover={{ scale: 1.02 }}
                        className={`relative group bg-[#111] border ${isClaimed ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'border-white/10 hover:border-white/30'} rounded-3xl overflow-hidden transition-all`}
                    >
                        {/* Gradient Header */}
                        <div className={`h-24 bg-gradient-to-r ${offer.color} p-6 flex justify-between items-start`}>
                            <div className="p-2 bg-black/20 backdrop-blur-md rounded-xl text-white">
                                <offer.icon className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                                <span className="block text-2xl font-bold text-white shadow-black drop-shadow-md">{offer.priceLabel}</span>
                                <span className="text-xs text-white/80 font-medium">Total Price</span>
                            </div>
                        </div>

                        <div className="p-6 relative">
                            {/* Overlay for Locked */}
                            {isLocked && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6">
                                    <Lock className="w-8 h-8 text-gray-500 mb-2" />
                                    <h3 className="font-bold text-gray-400">Not Eligible</h3>
                                    <p className="text-xs text-gray-600">First Order Only</p>
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-white mb-2">{offer.title}</h3>
                            <p className="text-gray-400 text-sm mb-6 h-10">{offer.description}</p>

                            <button
                                onClick={() => isClaimed ? handleNavigate() : handleClaim(offer)}
                                disabled={!!isLocked}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                    isClaimed 
                                    ? 'bg-green-500 text-black cursor-default'
                                    : 'bg-white text-black hover:bg-gray-200'
                                }`}
                            >
                                {isClaimed ? (
                                    <>
                                        <CheckCircle className="w-5 h-5" /> Shop Now
                                    </>
                                ) : (
                                    <>
                                        Claim Deal <ArrowRight className="w-4 h-4 ml-1" />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                );
            })}
        </div>
      </main>
    </div>
  );
}
