"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingBag, Menu, LogOut, X, Gift } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { SettingsModal } from "@/components/SettingsModal";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuthStore();
  // Optimize selector to ensure reactivity on deep changes
  const items = useCartStore((state) => state.items);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Sync Search Term with URL
  useEffect(() => {
      const q = searchParams.get('search');
      if (q && q !== searchTerm) {
          setSearchTerm(q);
      } else if (!q && pathname === '/catalog' && searchTerm !== "") {
          setSearchTerm("");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pathname]); // Intentionally omitting searchTerm to avoid loop, using disable line to satisfy linter

  // Debounce Search Push
  useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
          if (searchTerm) {
              const currentQ = searchParams.get('search');
              if (currentQ !== searchTerm) {
                router.push(`/catalog?search=${encodeURIComponent(searchTerm)}`);
              }
          } else {
              // If search is empty, but we have a search param in URL, clear it
              if (pathname === '/catalog' && searchParams.has('search')) {
                  router.push('/catalog');
              }
          }
      }, 500); // 500ms debounce
      return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, router, pathname, searchParams]);

  useEffect(() => {
    if (user) {
        // Wrap in setTimeout to avoid synchronous setState warning (cascading render)
        setTimeout(() => {
            const localName = localStorage.getItem('custom_display_name');
            if (localName && localName !== displayName) {
                setDisplayName(localName);
            } else if (!localName && user.name !== displayName) {
                 setDisplayName(user.name);
            }
        }, 0);
    }
  }, [user, displayName]);

  const handleNameUpdate = (newName: string) => {
      setDisplayName(newName);
  };
  
  const { theme, resolvedTheme } = useTheme();
  // const isHome = pathname === '/';

  useEffect(() => {
    // Avoid synchronous setState warning - just enable on mount
    const timer = setTimeout(() => setMounted(true), 0);
    
    // Ensure hydration
    if (!useCartStore.persist.hasHydrated()) {
        useCartStore.persist.rehydrate();
    }

    return () => clearTimeout(timer);
  }, []);

  // Close menu on route change - Handled by Link onClick mostly, but ensuring clean cleanup
  // Removing synchronous effect to avoid warnings
  
  return (
    <>
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Dynamic Logo */}
        <Link href="/" onClick={() => setIsMenuOpen(false)} className="group flex items-center gap-2 z-50 relative h-12">
            <div className="relative w-12 h-12 md:w-14 md:h-14 transition-transform duration-300 group-hover:scale-110">
                 {mounted && (
                     <>
                        {/* Show Dark Logo (for Light Mode) if theme is light */}
                        {(theme === 'light' || (!theme && resolvedTheme === 'light')) && (
                            <Image src="/assets/logo_dark.png" alt="Logo" fill className="object-contain" sizes="40px" priority />
                        )}
                        {/* Show Light Logo (for Dark Mode) if theme is dark */}
                        {(theme === 'dark' || (!theme && resolvedTheme === 'dark')) && (
                            <Image src="/assets/Logo_light.png" alt="Logo" fill className="object-contain" sizes="40px" priority />
                        )}
                     </>
                 )}
            </div>
            <span className="text-lg md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                PosterShop.store
            </span>
        </Link>
        
        <div className="hidden md:flex items-center bg-secondary/50 rounded-full px-4 py-2 w-96 border border-white/5 focus-within:border-primary/50 transition-colors">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search for 'Anime', 'Motivation'..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none ml-2 w-full text-sm placeholder:text-muted-foreground/70"
          />
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {user ? (
               <div className="hidden md:flex items-center gap-3">
                  <div className="flex flex-col items-end">
                       <span className="text-sm font-medium">Hi, {displayName}</span>
                       <div className="flex gap-2 text-xs">
                          <Link href="/orders" className="text-primary hover:underline">Orders</Link>
                          <span className="text-white/20">|</span>
                          <button onClick={() => setIsSettingsOpen(true)} className="text-primary hover:underline">Settings</button>
                       </div>
                  </div>
                  
                  <button onClick={logout} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors" title="Logout">
                      <LogOut className="w-5 h-5" />
                  </button>
                  {user.role === 'AFFILIATE' && (
                      <Link href="/affiliate/dashboard" className="px-3 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded-full border border-yellow-500/50 hover:bg-yellow-500/30 transition-colors">
                          Dashboard
                      </Link>
                  )}
               </div>
          ) : (
              <Link href="/login" className="hidden md:block px-6 py-2 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform">
                Login
              </Link>
          )}

          <Link href="/cart" id="cart-icon" className="p-2 hover:bg-white/5 rounded-full relative group z-50">
            <ShoppingBag className="w-6 h-6 group-hover:text-primary transition-colors" />
            {mounted && items.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-black text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce" suppressHydrationWarning>
                    {items.reduce((total, item) => total + item.quantity, 0)}
                </span>
            )}
          </Link>
          
          {/* Hamburger Button */}
          <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-white/5 rounded-full z-50 relative"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />} 
          </button>
        </div>
      </div>
    </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
      {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 right-0 w-full md:w-80 bg-background/95 backdrop-blur-xl border-b md:border-l border-white/10 z-[60] p-6 shadow-2xl md:hidden flex flex-col gap-6 rounded-bl-2xl"
          >
               {/* Search Removed */}
               
               <div className="space-y-4">
                   <Link href="/cart" className="flex items-center gap-4 text-lg font-medium p-2 hover:bg-white/5 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                       <div className="p-2 bg-primary/20 rounded-lg text-primary relative">
                           <ShoppingBag className="w-5 h-5" />
                           {items.length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{items.length}</span>}
                       </div>
                       View Cart ({items.length} items)
                   </Link>
                   <Link href="/catalog" className="flex items-center gap-4 text-lg font-medium p-2 hover:bg-white/5 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                       <div className="p-2 bg-primary/20 rounded-lg text-primary"><Search className="w-5 h-5" /></div>
                       Navigate to Catalog
                   </Link>
                   <Link href="/student-offers" className="flex items-center gap-4 text-lg font-medium p-2 hover:bg-white/5 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                       <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Gift className="w-5 h-5" /></div>
                       Student Offers
                   </Link>
                   {user ? (
                       <>
                            <div className="flex items-center gap-4 text-lg font-medium p-2 border-b border-white/10 pb-4">
                               <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">👋</div>
                               <div className="w-full">
                                   <div>Hi, {displayName}</div>
                                   <div className="flex items-center justify-between w-full mt-1">
                                      <Link href="/orders" className="text-xs text-primary bg-primary/10 px-2 py-1 rounded" onClick={() => setIsMenuOpen(false)}>My Orders</Link>
                                      <button onClick={() => { setIsSettingsOpen(true); setIsMenuOpen(false); }} className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">Settings</button>
                                   </div>
                               </div>
                            </div>
                            <button onClick={() => { logout(); setIsMenuOpen(false); }} className="flex items-center gap-4 text-lg font-medium p-2 hover:bg-red-500/10 text-red-400 rounded-xl w-full text-left">
                               <LogOut className="w-5 h-5" /> Logout
                            </button>
                       </>
                   ) : (
                       <Link href="/login" className="flex items-center gap-4 text-lg font-medium p-2 hover:bg-white/5 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                           <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center w-9 h-9">👤</div>
                           Login / Signup
                       </Link>
                   )}
               </div>
           </motion.div>
       )}
       </AnimatePresence>

       {/* Settings Modal */}
       <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onNameUpdate={handleNameUpdate} />
       </>
  );
}

