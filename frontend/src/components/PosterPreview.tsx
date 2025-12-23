"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PosterPreviewProps {
  imageSrc: string;
}

export function PosterPreview({ imageSrc }: PosterPreviewProps) {
  const [mode, setMode] = useState<'standard' | 'human' | 'wall' | 'desk' | 'size'>('standard');
  
  const modes = ['standard', 'human', 'wall', 'desk', 'size'] as const;

  const nextMode = () => {
    const idx = modes.indexOf(mode);
    setMode(modes[(idx + 1) % modes.length]);
  };

  const prevMode = () => {
    const idx = modes.indexOf(mode);
    setMode(modes[(idx - 1 + modes.length) % modes.length]);
  };

  return (
    <div className="space-y-4">
       {/* Preview Area */}
       <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden border border-white/10 bg-neutral-900 shadow-2xl transition-all duration-500 group">
           
           {/* Navigation Arrows */}
           <button onClick={prevMode} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100">
               <ArrowLeft className="w-5 h-5" />
           </button>
           <button onClick={nextMode} className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100">
               <ArrowRight className="w-5 h-5" />
           </button>

           {/* Mode Indicator */}
            <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono text-white/70 border border-white/10 pointer-events-none">
                {mode.toUpperCase()}
            </div>

           {/* Layers */}
           
           {/* STANDARD */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${mode === 'standard' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                <div className="relative w-full h-full p-8 flex items-center justify-center bg-neutral-900">
                     <img src={imageSrc} alt="Preview" className="w-full h-full object-contain shadow-2xl" />
                </div>
            </div>

            {/* HUMAN */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${mode === 'human' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                <Image src="/assets/scale-reference.jpg" alt="Human Scale" fill className="object-cover" unoptimized />
                <div className="absolute top-[26.5%] left-[50%] transform -translate-x-1/2 w-[28%] aspect-[0.7/1] shadow-sm bg-white p-[1px] rotate-[-1deg]">
                        <img src={imageSrc} alt="Poster" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none mix-blend-multiply"></div>
                </div>
            </div>

            {/* WALL */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${mode === 'wall' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                <Image src="/mockups/wall-mockup-v2.png" alt="Wall" fill className="object-cover" unoptimized />
                <div className="absolute top-[20%] left-[50%] transform -translate-x-1/2 -translate-y-[10%] w-[27%] aspect-[2/3] shadow-2xl bg-white p-[2px]">
                        <img src={imageSrc} alt="Poster" className="w-full h-full object-cover" />
                </div>
            </div>
            
            {/* DESK */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${mode === 'desk' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                <Image src="/mockups/desk-mockup.png" alt="Desk" fill className="object-cover" unoptimized />
                <div className="absolute top-[5%] left-[50%] transform -translate-x-1/2 w-[33%] aspect-[2/3] shadow-md bg-white p-[1px]">
                    <img src={imageSrc} alt="Poster" className="w-full h-full object-cover" />
                </div>
            </div>

            {/* SIZE */}
            <div className={`absolute inset-0 flex items-center justify-center bg-white transition-opacity duration-300 ${mode === 'size' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <Image src="/mockups/size-guide.png" alt="Size" fill className="object-contain p-8" unoptimized />
            </div>

       </div>

       {/* Mode Toggles */}
       <div className="flex justify-center gap-2">
           {modes.map((m) => (
               <button 
                  key={m} 
                  onClick={() => setMode(m)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${mode === m ? 'bg-primary text-black border-primary' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'}`}
               >
                   {m.charAt(0).toUpperCase() + m.slice(1)}
               </button>
           ))}
       </div>
    </div>
  );
}
