"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function SciFiLoader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500); // Slight delay before unmounting
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center font-mono overflow-hidden"
    >
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(0,255,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.05)_1px,transparent_1px)] bg-[size:40px_40px] perspective-1000 transform-gpu opacity-30"></div>

      {/* Central Reactor */}
      <div className="relative z-10 w-64 h-64 flex items-center justify-center">
        {/* Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-4 border-dashed border-cyan-500/30 rounded-full"
        />
        <motion.div
           animate={{ rotate: -360 }}
           transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
           className="absolute inset-2 border-2 border-dotted border-green-500/30 rounded-full"
        />

        {/* Inner Core */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-32 h-32 bg-cyan-500/10 rounded-full blur-xl border border-cyan-400/50 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.4)]"
        >
            <div className="w-20 h-20 bg-green-500/20 rounded-full animate-pulse"></div>
        </motion.div>
        
        {/* Scanning Line */}
        <motion.div
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-1 bg-green-400/50 blur-sm shadow-[0_0_20px_#4ade80]"
        />
      </div>

      {/* Text Scramble & Progress */}
      <div className="mt-12 text-center space-y-4 z-10 px-4">
        <h2 className="text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 animate-pulse">
          POSTER SHOP
        </h2>
        <p className="text-sm text-cyan-500/80 font-bold max-w-md animate-pulse">
            ELEVATING STUDENT SPACES. NO NAILS. NO DAMGE.
            <br/>
            <span className="text-xs font-normal opacity-70">Detecting Vibe... Calibrating Aesthetics...</span>
        </p>
        
        <div className="w-64 h-2 bg-neutral-900 border border-green-500/30 rounded-full overflow-hidden relative mx-auto">
            <motion.div 
                className="h-full bg-green-500 shadow-[0_0_10px_#22c55e]"
                style={{ width: `${Math.min(progress, 100)}%` }}
            />
        </div>
        
        <div className="flex justify-between w-64 mx-auto text-xs text-cyan-500/70">
            <span>LOADING ASSETS</span>
            <span>{Math.floor(progress)}%</span>
        </div>
      </div>

      {/* Decorative Corners */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-cyan-500/50"></div>
      <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-cyan-500/50"></div>
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-cyan-500/50"></div>
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-cyan-500/50"></div>

    </motion.div>
  );
}
