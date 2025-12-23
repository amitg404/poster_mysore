'use client';

import { useCartStore } from '@/store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function CartAnimator() {
    const { isAnimating, startPos, flyingImage, resetAnimation } = useCartStore();
    const [targetPos, setTargetPos] = useState<{ x: number, y: number } | null>(null);

    useEffect(() => {
        // Locate the cart icon in the DOM
        const cartIcon = document.getElementById('cart-icon');
        if (cartIcon) {
            const rect = cartIcon.getBoundingClientRect();
             // Avoid synchronous setState warning
            setTimeout(() => {
                setTargetPos({ 
                    x: rect.left + rect.width / 2, 
                    y: rect.top + rect.height / 2 
                });
            }, 0);
        }
    }, [isAnimating]); // Re-calculate when animation starts

    return (
        <AnimatePresence>
            {isAnimating && startPos && targetPos && flyingImage && (
                <motion.img
                    src={flyingImage}
                    initial={{ 
                        position: 'fixed',
                        left: startPos.x,
                        top: startPos.y,
                        width: 150, // Start slightly smaller than full card
                        height: 200,
                        opacity: 1,
                        zIndex: 9999,
                        pointerEvents: 'none',
                        scale: 1,
                        rotate: 0
                    }}
                    animate={{
                        left: targetPos.x,
                        top: targetPos.y,
                        width: 20, // Shrink to dot size
                        height: 20,
                        opacity: 0.5,
                        scale: 0.1,
                        rotate: 360 // Spin!
                    }}
                    transition={{ 
                        duration: 0.8, 
                        ease: "easeInOut" // Or "anticipate" for swirl feel
                    }}
                    onAnimationComplete={() => {
                        resetAnimation();
                        // Optional: Trigger a "shake" on the cart icon here via another store action
                        const cartIcon = document.getElementById('cart-icon');
                        if (cartIcon) {
                            cartIcon.classList.add('animate-bump');
                            setTimeout(() => cartIcon.classList.remove('animate-bump'), 300);
                        }
                    }}
                    className="rounded-lg shadow-2xl border-2 border-primary"
                />
            )}
        </AnimatePresence>
    );
}
