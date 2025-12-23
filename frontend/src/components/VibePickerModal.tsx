"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import Image from "next/image";

const VIBE_POSTERS = [
    { id: 'vp_1', src: 'https://res.cloudinary.com/dsrun1xw6/image/upload/v1766047921/postershop/anime/anime-luffygear5sungodnika2.jpg', category: 'Anime', title: 'Anime' },
    { id: 'vp_2', src: 'https://res.cloudinary.com/dsrun1xw6/image/upload/v1766044010/postershop/Cars/Cars-porsche_racecar_1.jpg', category: 'Cars', title: 'Cars' },
    { id: 'vp_3', src: 'https://res.cloudinary.com/dsrun1xw6/image/upload/v1766044066/postershop/F1/F1-max_verstappen_red_bull_rb20_number_1_poster_001.jpg', category: 'F1', title: 'F1' },
    { id: 'vp_4', src: 'https://res.cloudinary.com/dsrun1xw6/image/upload/v1766044234/postershop/gaming/gaming-valorant.jpg', category: 'Gaming', title: 'Gaming' },
    { id: 'vp_5', src: 'https://res.cloudinary.com/dsrun1xw6/image/upload/v1766044604/postershop/movie/movie-joker_movie.jpg', category: 'Movie', title: 'Movies' },
    { id: 'vp_6', src: 'https://res.cloudinary.com/dsrun1xw6/image/upload/v1766044809/postershop/music/music-eminem_poster.jpg', category: 'Music', title: 'Music' },
    { id: 'vp_7', src: 'https://res.cloudinary.com/dsrun1xw6/image/upload/v1766070152/postershop/tv_shows/tv_shows-stranger_things_upside_down_demogorgon_004.jpg', category: 'TV Shows', title: 'TV Shows' },
    { id: 'vp_8', src: 'https://res.cloudinary.com/dsrun1xw6/image/upload/v1766045196/postershop/sports/sports-virat_kohli_cricket_poster.jpg', category: 'Sports', title: 'Sports' },
    { id: 'vp_9', src: 'https://res.cloudinary.com/dsrun1xw6/image/upload/v1766044515/postershop/motivational/motivational-what_if_it_all_works_out.jpg', category: 'Motivational', title: 'Motivational' },
    { id: 'vp_10', src: 'https://res.cloudinary.com/dsrun1xw6/image/upload/v1766045256/postershop/Superheros/Superheros-spiderman_movie_3.jpg', category: 'Superheros', title: 'Superheros' },
];

export function VibePickerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [isCurating, setIsCurating] = useState(false);
  const [progress] = useState(0);

  useEffect(() => {
    // Check if user has already designed their vibe
    const hasVibe = localStorage.getItem("vibe_preferences");
    if (!hasVibe) {
        const timer = setTimeout(() => setIsOpen(true), 1500);
        return () => clearTimeout(timer);
    }

    // Listen for manual open trigger (from Homepage tile)
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open_vibe_picker', handleOpen);
    return () => window.removeEventListener('open_vibe_picker', handleOpen);
  }, []);

  const toggleSelection = (id: string) => {
      setSelectedVibes(prev => 
          prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
      );
  };

  const finishSelection = () => {
       // Save to LocalStorage
      const preferences = selectedVibes.map(id => VIBE_POSTERS.find(p => p.id === id)?.category);
      localStorage.setItem("vibe_preferences", JSON.stringify(preferences));
      
      // Set Timer for 1 minute (60000ms)
      const readyTime = Date.now() + 60000;
      localStorage.setItem("vibe_ready_time", readyTime.toString());

      // Dispatch event to notify listeners (Homepage) to lock the tile and show toast
      window.dispatchEvent(new Event('vibe_check_complete')); 
      
      setIsOpen(false);
      setIsCurating(false);
  };

  const handleConfirm = () => {
      if (selectedVibes.length < 3) return;
      finishSelection();
  };

  const handleSkip = () => {
      localStorage.setItem("vibe_preferences", "skipped");
      setIsOpen(false);
      window.dispatchEvent(new Event('vibe_check_complete'));
  };

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          {isCurating ? (
              <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0 }}
                 className="flex flex-col items-center justify-center text-center p-8 bg-[#121212] border border-white/10 rounded-3xl shadow-2xl max-w-md w-full"
              >
                  <Sparkles className="w-12 h-12 text-primary animate-spin-slow mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-2">Curating your personal designs...</h3>
                  <p className="text-gray-400 mb-6">Finding the perfect posters for your vibe.</p>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                         className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                         initial={{ width: 0 }}
                         animate={{ width: `${progress}%` }}
                         transition={{ ease: "linear" }}
                      />
                  </div>
                  <div className="mt-2 text-xs text-gray-500 font-mono">{progress}%</div>
              </motion.div>
          ) : (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-4xl bg-[#121212] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
             <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-start">
                 <div>
                     <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
                         Design Your Vibe
                     </h2>
                     <p className="text-gray-400">
                         Select at least 3 posters you love. We&apos;ll curate a &quot;For You&quot; collection.
                     </p>
                 </div>
                 <button onClick={handleSkip} className="text-sm text-gray-500 hover:text-white transition-colors">
                     Skip
                 </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 md:p-8">
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                     {VIBE_POSTERS.map((poster) => {
                         const isSelected = selectedVibes.includes(poster.id);
                         return (
                             <div 
                                key={poster.id}
                                onClick={() => toggleSelection(poster.id)}
                                className={`group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${isSelected ? 'ring-4 ring-primary scale-95' : 'hover:scale-105'}`}
                             >
                                 <Image 
                                    src={poster.src} 
                                    alt={poster.title}
                                    fill
                                    className={`object-cover transition-all ${isSelected ? 'brightness-50' : 'group-hover:brightness-75'}`}
                                    unoptimized
                                 />
                                 
                                 {/* Checkmark Overlay */}
                                 {isSelected && (
                                     <div className="absolute inset-0 flex items-center justify-center">
                                         <div className="bg-primary text-black rounded-full p-2 shadow-lg">
                                             <Check className="w-8 h-8 md:w-10 md:h-10" strokeWidth={3} />
                                         </div>
                                     </div>
                                 )}
                                 
                                 <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                     <span className="text-white text-sm font-medium">{poster.title}</span>
                                 </div>
                             </div>
                         );
                     })}
                 </div>
             </div>

             <div className="p-6 md:p-8 border-t border-white/5 bg-[#1a1a1a] flex items-center justify-between">
                 <div className="text-sm text-gray-400">
                     {selectedVibes.length} selected
                 </div>
                 <button 
                    onClick={handleConfirm}
                    disabled={selectedVibes.length < 3}
                    className={`px-8 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${
                        selectedVibes.length >= 3 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105 shadow-lg shadow-purple-500/25' 
                        : 'bg-white/10 text-gray-500 cursor-not-allowed'
                    }`}
                 >
                     <Sparkles className="w-4 h-4" />
                     Build My Feed
                 </button>
             </div>
          </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
