"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [coords, setCoords] = React.useState({ x: 0, y: 0 });
  const [targetText, setTargetText] = React.useState(""); // Lock text

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Get click coordinates for the ripple effect origin
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setCoords({ x, y });
    setIsTransitioning(true);

    // Determines the target theme manually
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTargetText(nextTheme === "dark" ? "Dark Mode" : "Light Mode");

    // Wait for the circle to cover the screen before switching the actual theme
    setTimeout(() => {
      setTheme(nextTheme);
    }, 400); // Trigger switch when screen is covered

    // Reset transition state
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1000);
  };

  return (
    <>
      {/* The Button */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-full bg-secondary/50 hover:bg-secondary transition-colors relative overflow-hidden z-50 border border-white/10 flex items-center justify-center"
        title="Toggle Theme"
      >
        <div className="relative w-6 h-6">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute top-0 left-0 text-orange-400" />
            <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute top-0 left-0 text-blue-400" />
        </div>
      </button>

      {/* The "Crazy" Animation Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ clipPath: `circle(0px at ${coords.x}px ${coords.y}px)` }}
            animate={{ clipPath: `circle(3000px at ${coords.x}px ${coords.y}px)` }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className={`fixed inset-0 z-[99999] pointer-events-none ${theme === 'dark' ? 'bg-white' : 'bg-neutral-950'}`} // Inverted colors
          >
             {/* Optional: Add a text or icon in the middle during transition for extra flare */}
             <motion.div 
               initial={{ opacity: 0, scale: 0.5 }}
               animate={{ opacity: 1, scale: 1.5 }}
               transition={{ delay: 0.2 }}
               className="absolute inset-0 flex items-center justify-center font-bold text-4xl"
             >
                {/* Use a fixed target theme for the text to avoid flipping mid-animation */}
                <span className={targetText === "Light Mode" ? "text-black" : "text-white"}>{targetText}</span>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
