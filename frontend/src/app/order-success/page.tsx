"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, MessageCircle, ShoppingBag, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
// import { Button } from '@/components/ui/button'; // Removing if not exists, using standard button styled
import { useCartStore } from '@/store/cartStore';

// Simple Button Component replacement if shadcn button is missing/path wrong
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Button = ({ children, onClick, className, variant = "primary" }: any) => (
    <button 
        onClick={onClick}
        className={`px-4 py-2 rounded-xl font-medium transition-all active:scale-95 ${className} ${variant === 'outline' ? 'border' : ''}`}
    >
        {children}
    </button>
);

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const clearCart = useCartStore((state) => state.clearCart);
    const [mounted, setMounted] = useState(false);

    const orderId = searchParams.get('orderId');
    // const amount = searchParams.get('amount'); // Unused for now

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (mounted) {
             clearCart();
        }
    }, [mounted, clearCart]);

    const handleWhatsApp = () => {
        const text = `Hi, I just placed an order! Order ID: ${orderId}. Can you please confirm?`;
        window.open(`https://wa.me/919999999999?text=${encodeURIComponent(text)}`, '_blank');
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
            >
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-green-500/20 blur-[50px] rounded-full pointer-events-none" />

                <div className="flex justify-center mb-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                    >
                        <CheckCircle className="w-10 h-10 text-white" />
                    </motion.div>
                </div>

                <div className="space-y-2 relative z-10">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">Order Confirmed!</h1>
                    <p className="text-neutral-400">Thank you for your purchase.</p>
                </div>

                {orderId && (
                    <div className="bg-neutral-800/50 rounded-xl p-4 border border-white/5 space-y-1">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider">Order ID</p>
                        <p className="font-mono text-green-400">{orderId}</p>
                    </div>
                )}

                <div className="space-y-3 pt-4">
                    <Button 
                        onClick={handleWhatsApp}
                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-12 rounded-xl text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,211,102,0.2)] hover:shadow-[0_0_30px_rgba(37,211,102,0.4)] transition-all"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Send Updates on WhatsApp
                    </Button>
                    <p className="text-xs text-neutral-500">
                        Get instant tracking updates & support via WhatsApp.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                    <Button 
                        variant="outline" 
                        className="w-full border-neutral-700 bg-transparent hover:bg-neutral-800 text-neutral-300"
                        onClick={() => router.push('/orders')}
                    >
                        View Order
                    </Button>
                    <Button 
                        variant="outline" 
                        className="w-full border-neutral-700 bg-transparent hover:bg-neutral-800 text-neutral-300 gap-2"
                        onClick={() => router.push('/catalog')}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Shop More
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
