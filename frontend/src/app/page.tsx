"use client";

import { Zap, Gift, Package, Search, Sparkles, Clock } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useUIStore } from "@/store/uiStore";
import { toast } from "sonner";
import Link from "next/link";
import NextImage from "next/image";
import { VibePickerModal } from "@/components/VibePickerModal";
import { SignupPromptModal } from "@/components/SignupPromptModal";

interface CategoryPreview {
  name: string;
  images: string[];
}

// --- Constants ---
const HERO_SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1578301978693-85ea9ec2a20b?q=80&w=2070&auto=format&fit=crop",
    title: "Transform Your Walls.",
    subtitle: "Premium A3 posters for your dorm, room, or workspace.",
    badge: "Flash Sale: 50% OFF on all A3 Posters"
  },
  {
    id: 2,
    image: "/assets/hero-collage.jpg",
    title: "Unleash Your Passion.",
    subtitle: "From Anime to Abstract, find the art that speaks to you.",
    badge: "New Arrivals: Explore the Collection"
  }
];

import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const { setLoading } = useUIStore();
  
  const [previews, setPreviews] = useState<CategoryPreview[]>([]);
  const [forYouPreview, setForYouPreview] = useState<CategoryPreview | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Check Lock State
  useEffect(() => {
      const checkLock = () => {
          const readyTimeStr = localStorage.getItem("vibe_ready_time");
          // Only lock if we have a time AND we haven't seen the notification yet (meaning it's fresh)
          // Actually, lock should persist until time is up, regardless of notification seen state
          if (readyTimeStr) {
              const readyTime = parseInt(readyTimeStr);
              if (Date.now() < readyTime) {
                  setIsLocked(true);
              } else {
                  setIsLocked(false);
              }
          }
      };
      
      checkLock();
      const interval = setInterval(checkLock, 1000); 
      return () => clearInterval(interval);
  }, []);

  // Auto-Rotate Slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const getImageUrl = (url: string) => {
    if (!url) return '/placeholder.png';
    if (url.startsWith('http://localhost:5000')) {
        return url.replace('http://localhost:5000', '');
    }
    return url;
  };

  const fetchForYou = useCallback(() => {
      const vibes = localStorage.getItem("vibe_preferences");
      if (vibes && vibes !== "skipped") {
          try {
              const parsedVibes = JSON.parse(vibes);
              // Fetch preview images for these vibes
              axios.get('/api/products', { 
                  params: { 
                      category: 'For You', 
                      vibes: parsedVibes.join(','),
                      limit: 4 
                  } 
              }).then(res => {
                  if (res.data && res.data.length > 0) {
                      // Extract images
                       const images: string[] = [];
                       res.data.forEach((p: { images: string[] }) => {
                           if (p.images && p.images.length > 0) images.push(p.images[0]);
                       });
                       setForYouPreview({ name: 'For You', images: images.slice(0, 4) });
                  }
              }).catch(err => console.error("Failed for you fetch", err));
          } catch (e) {
              console.error("Parse error", e);
          }
      } else {
          setForYouPreview(null);
      }
  }, []);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/products/previews')
      .then(res => setPreviews(res.data))
      .catch(err => console.error("Failed to load previews", err))
      .finally(() => setLoading(false));
    
    // Initial For You check
    setTimeout(() => fetchForYou(), 0);

    // Listen for Vibe Completion
    const handleVibeComplete = () => {
        toast.message("Curating your feed...", {
             description: "Your designs will be ready in <1 min.",
             icon: <Clock className="w-4 h-4 text-blue-500" />,
             duration: 5000,
        });
        setTimeout(fetchForYou, 500); 
    };
    window.addEventListener('vibe_check_complete', handleVibeComplete);
    return () => window.removeEventListener('vibe_check_complete', handleVibeComplete);
  }, [setLoading, fetchForYou]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <VibePickerModal />
      <SignupPromptModal />
      {/* Hero Section */} 
      <main className="pt-24 pb-12 px-4 container mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-black border border-white/10 min-h-[500px] flex items-center justify-center p-6 md:p-8 group">
            
            <AnimatePresence mode="wait">
                <motion.div 
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 z-0"
                >
                    {/* Background Image */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:scale-105 transition-transform duration-[2000ms]"
                        style={{ backgroundImage: `url('${HERO_SLIDES[currentSlide].image}')` }}
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </motion.div>
            </AnimatePresence>

            <div className="relative z-10 text-center space-y-6 max-w-3xl w-full">
              <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                  >
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs md:text-sm font-medium border border-primary/20 backdrop-blur-sm whitespace-nowrap">
                        <Zap className="w-3 h-3 md:w-4 md:h-4" /> {HERO_SLIDES[currentSlide].badge}
                      </div>
                      <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 leading-tight">
                        {HERO_SLIDES[currentSlide].title}
                      </h1>
                      <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto px-4">
                        {HERO_SLIDES[currentSlide].subtitle}
                      </p>
                  </motion.div>
              </AnimatePresence>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 w-full sm:w-auto px-4 sm:px-0">
                <Link href="/catalog" className="px-8 py-3 bg-primary text-black font-bold rounded-full text-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-shadow w-full sm:w-auto text-center">
                  Shop Now
                </Link>
                <Link href="/create" className="px-8 py-3 bg-white/10 backdrop-blur-md text-white font-semibold rounded-full text-lg hover:bg-white/20 transition-colors inline-block w-full sm:w-auto text-center">
                  Create Your Own
                </Link>
              </div>
            </div>

            {/* Carousel Indicators */}
            <div className="absolute bottom-6 flex gap-2 z-20">
                {HERO_SLIDES.map((_, idx) => (
                    <button 
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${currentSlide === idx ? 'w-8 bg-primary' : 'bg-white/30 hover:bg-white/50'}`}
                    />
                ))}
            </div>
        </div>

        {/* Smart Banners / Tickers */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
           {/* Banner 1: Bundle Offer Pack (Full Width on Mobile) */}
           <Link href="/bundle-offer" className="col-span-2 md:col-span-1 p-4 md:p-6 rounded-2xl bg-gradient-to-br from-green-900/50 to-teal-900/50 border border-white/5 flex flex-col md:flex-row items-center gap-2 md:gap-4 hover:border-green-500/50 transition-colors cursor-pointer group text-center md:text-left">
              <div className="p-2 md:p-3 bg-green-500/20 rounded-xl group-hover:scale-110 transition-transform flex-shrink-0">
                <Package className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-lg">Bundles</h3>
                <p className="text-[10px] md:text-sm text-muted-foreground">Save with Combos</p>
              </div>
           </Link>

           {/* Banner 2: Student Offer */}
           <Link href="/student-offers" className="p-4 md:p-6 rounded-2xl bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border border-white/5 flex flex-col md:flex-row items-center gap-2 md:gap-4 hover:border-purple-500/50 transition-colors cursor-pointer group text-center md:text-left">
              <div className="p-2 md:p-3 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform flex-shrink-0">
                <Gift className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-lg">Student Offer</h3>
                <p className="text-[10px] md:text-sm text-muted-foreground">Free Shipping &gt; ₹199</p>
              </div>
           </Link>
           
           {/* Banner 3: Daily Drop */}
           <Link href="/daily-drop" className="p-4 md:p-6 rounded-2xl bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border border-white/5 flex flex-col md:flex-row items-center gap-2 md:gap-4 hover:border-blue-500/50 transition-colors cursor-pointer group text-center md:text-left">
              <div className="p-2 md:p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform flex-shrink-0">
                <Zap className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-lg">Daily Drop</h3>
                <p className="text-[10px] md:text-sm text-muted-foreground">Order before 12 PM</p>
              </div>
           </Link>

           {/* Banner 4: Create Own (Replacing Trending as filler if needed, or just leave 3 items? 
               Grid is 4 cols. We have Bundle (2 cols mobile, 1 col desktop), Student (1), Daily (1).
               On Desktop: Bundle, Student, Daily, [Need 4th].
               Let's keep Create Own or something useful to fill the 4th slot on desktop.
               Or make Bundles col-span-2 on Desktop too for emphasis?
               Let's make Bundles col-span-2 on Mobile, and Col-span-1 on desktop.
               We have 3 items now. Logic:
               Mobile: 
                 Row 1: Bundle (col-span-2)
                 Row 2: Student (col-span-1), Daily (col-span-1)
               Desktop (grid-cols-4):
                 Bundle (1), Student (1), Daily (1), [Need 4th].
               Re-adding Trending but hiding on mobile? Or adding "Explore"?
               User said "Remove trending", so maybe completely.
               If we have 3 items on a 4-col grid, it looks lopsided on desktop.
               Let's make the "Bundles" banner span 2 columns on desktop too? Or "Flash Sale"?
               Let's just leave 3 items and maybe center them or stretch?
               Grid cols-2 md:grid-cols-3?
           */}
        </div>
        {/* Adjusted Grid for 3 items on desktop if we change grid definition above. 
            Let's change parent grid to `grid-cols-2 md:grid-cols-3` 
        */}

        {/* Categories Grid (Collages) */}
        <div className="mt-16">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-3xl font-bold">Shop by Vibe</h2>
            <Link href="/catalog" className="text-primary hover:underline">View All</Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
            {/* For You / Design Vibe Tile */}
            {forYouPreview ? (
                isLocked ? (
                    // LOCKED STATE
                    <div className="group block cursor-not-allowed grayscale">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-700 relative">
                             {/* Collage (Blurred) */}
                             <div className="grid grid-cols-2 grid-rows-2 h-full w-full opacity-30 blur-sm">
                                {forYouPreview.images.slice(0, 4).map((img, idx) => (
                                    <div key={idx} className="relative w-full h-full overflow-hidden">
                                        <NextImage 
                                            src={getImageUrl(img)} 
                                            alt="For You"
                                            className="object-cover" 
                                            fill
                                            unoptimized
                                        />
                                    </div>
                                ))}
                             </div>
                             {/* Lock Overlay */}
                             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-4">
                                <div className="p-4 bg-neutral-800 rounded-full mb-3 shadow-xl">
                                    <Clock className="w-8 h-8 text-neutral-400 animate-pulse" />
                                </div>
                                <span className="text-xl font-bold text-neutral-300">Curating...</span>
                                <span className="text-xs text-neutral-500 mt-1">Ready in &lt;1 min</span>
                             </div>
                        </div>
                    </div>
                ) : (
                    // UNLOCKED STATE
                     <Link href="/catalog?category=For You" className="group block">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-900 border border-green-500/30 hover:border-green-500 transition-all relative">
                             {/* Collage */}
                             <div className="grid grid-cols-2 grid-rows-2 h-full w-full opacity-80 group-hover:opacity-60 transition-opacity">
                                {forYouPreview.images.slice(0, 4).map((img, idx) => (
                                    <div key={idx} className="relative w-full h-full overflow-hidden">
                                        <NextImage 
                                            src={getImageUrl(img)} 
                                            alt="For You" 
                                            className="object-cover blur-[1px] scale-110" 
                                            fill
                                            unoptimized
                                        />
                                    </div>
                                ))}
                             </div>
                             {/* Label */}
                             <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/90 via-black/20 to-transparent p-2">
                                <div className="text-center">
                                    <div className="inline-block p-2 bg-green-500 rounded-full mb-2 shadow-lg shadow-green-500/20">
                                        <Sparkles className="w-5 h-5 text-black fill-current" />
                                    </div>
                                    <span className="block text-xl md:text-3xl font-extrabold text-white tracking-wide uppercase drop-shadow-lg scale-100 group-hover:scale-110 transition-transform">
                                        FOR YOU
                                    </span>
                                </div>
                             </div>
                        </div>
                   </Link>
                )
            ) : (
                <div onClick={() => window.dispatchEvent(new Event('open_vibe_picker'))} className="group block cursor-pointer">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-900 border border-purple-500/30 hover:border-purple-500 transition-all relative flex flex-col items-center justify-center text-center p-4">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-pink-900/20 group-hover:bg-purple-900/30 transition-colors" />
                        <div className="relative z-10 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:scale-110 transition-transform">
                             <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="relative z-10 text-xl md:text-2xl font-bold text-white mb-2">Design Vibe</h3>
                        <p className="relative z-10 text-xs md:text-sm text-gray-400">Curate your personal feed</p>
                    </div>
                </div>
            )}

            {previews.map((cat) => (
               <Link href={`/catalog?category=${cat.name}`} key={cat.name} className="group block">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-900 border border-white/5 hover:border-primary/50 transition-all relative">
                         {/* 2x2 Collage with Blur */}
                         <div className="grid grid-cols-2 grid-rows-2 h-full w-full opacity-60 group-hover:opacity-40 transition-opacity">
                            {cat.images.slice(0, 4).map((img, idx) => (
                                <div key={idx} className="relative w-full h-full overflow-hidden">
                                    <NextImage 
                                        src={getImageUrl(img)} 
                                        alt={`${cat.name} poster`} 
                                        className="object-cover blur-[2px] scale-110" 
                                        fill
                                        unoptimized
                                    />
                                </div>
                            ))}
                         </div>
                         
                         {/* Label */}
                         <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/90 via-black/20 to-transparent p-2">
                            <span className="text-xl md:text-3xl font-extrabold text-white tracking-wide uppercase drop-shadow-lg scale-100 group-hover:scale-110 transition-transform text-center break-words leading-tight">
                                {cat.name === 'SuperHeros' ? 'SUPERHEROES' : cat.name === 'Movie' ? 'MOVIES' : cat.name}
                            </span>
                         </div>
                    </div>
               </Link>
            ))}

            <Link href="/catalog" className="group block">
                 <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-800 border border-white/5 hover:border-primary/50 transition-all relative flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                            <Search className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                      </div>
                      <h3 className="text-lg md:text-2xl font-bold text-white mb-2">Explore All</h3>
                      <p className="text-xs md:text-sm text-gray-400 mb-4">Browse 2000+ Posters</p>
                      <div className="px-6 py-3 bg-white text-black rounded-full text-xs md:text-sm font-bold hover:bg-gray-200 transition-colors shadow-lg">
                        View Catalog &rarr;
                      </div>
                 </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
