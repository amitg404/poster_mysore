"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ShoppingBag, ArrowLeft, Truck, ShieldCheck, Heart, Share2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

import { useCartStore } from "@/store/cartStore";

const getImageUrl = (url: string) => {
    if (!url) return '/placeholder.png';
    if (url.startsWith('http://localhost:5000')) {
        return url.replace('http://localhost:5000', '');
    }
    return url;
};

// Mockup Types
type ViewMode = 'standard' | 'wall' | 'human' | 'desk' | 'size';

interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    stock: number;
}

// Helper to beautify filenames for the UI buttons
const getCleanNameFromUrl = (url: string, index: number) => {
    try {
        const filename = url.split('/').pop() || '';
        let name = filename.split('.')[0]; // remove extension
        
        // Remove common junk
        name = name.replace(/_Nero_AI_.*$/i, '');
        name = name.replace(/_799Rs/i, '');
        name = name.replace(/_479rs/i, '');
        name = name.replace(/_199Rs/i, '');
        
        // Replace underscores with spaces
        name = name.replace(/_/g, ' ');
        
        // Capitalize Words
        name = name.replace(/\b\w/g, c => c.toUpperCase());
        
        // Fallback if empty or too short
        if (name.length < 2) return `Poster ${index + 1}`;
        
        return name;
    } catch {
        return `Poster ${index + 1}`;
    }
};

// Separate Component to handle complex swipe logic
function GalleryComponent({ product, setActiveImageIndex }: { product: Product, setActiveImageIndex: React.Dispatch<React.SetStateAction<number>> }) {
    // Interleaved Bundle Logic (Requested by User)
    // Poster 1 (S) -> Poster 1 (H) -> Poster 1 (W) -> ... -> Poster N (S/H/W) -> Size Guide
    
    const isBundle = product.images.length > 1;
    // Assumption: All images in the array are posters. Size chart is separate code.
    const numPosters = product.images.length;
    
    const [globalIndex, setGlobalIndex] = useState(0);

    // Derived State
    let currentMode: ViewMode = 'standard';
    let currentImgIdx = 0;

    // Total Slides: (3 views per poster) + 1 Size Guide
    const totalSlides = (numPosters * 3) + 1;

    if (isBundle) {
        if (globalIndex < numPosters * 3) {
             currentImgIdx = Math.floor(globalIndex / 3);
             const viewCycle = globalIndex % 3;
             if (viewCycle === 0) currentMode = 'standard';
             else if (viewCycle === 1) currentMode = 'human';
             else currentMode = 'wall';
        } else {
             currentMode = 'size';
             currentImgIdx = 0;
        }
    } else {
        // Single Poster: Standard -> Human -> Wall -> Desk -> Size
        if (globalIndex === 0) { currentMode = 'standard'; }
        else if (globalIndex === 1) { currentMode = 'human'; }
        else if (globalIndex === 2) { currentMode = 'wall'; }
        else if (globalIndex === 3) { currentMode = 'desk'; } 
        else { currentMode = 'size'; }
    }

    // Effect to sync parent state
    useEffect(() => {
         setActiveImageIndex(currentImgIdx);
    }, [currentImgIdx, setActiveImageIndex]);

    const nextSlide = () => {
        if (isBundle) {
            setGlobalIndex(prev => (prev + 1) % totalSlides);
        } else {
             setGlobalIndex(prev => (prev + 1) % 5);
        }
    };

    const prevSlide = () => {
        if (isBundle) {
            setGlobalIndex(prev => (prev === 0 ? totalSlides - 1 : prev - 1));
        } else {
             setGlobalIndex(prev => (prev === 0 ? 5 - 1 : prev - 1));
        }
    };
    
    // Swipe Logic
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
    const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (distance > 50) nextSlide();
        if (distance < -50) prevSlide();
        setTouchStart(0); // Reset touch state
        setTouchEnd(0);
    };

    const currentImage = getImageUrl(product.images[currentImgIdx]);

    return (
        <div className="space-y-6">
             {/* Main Viewport */}
             <div 
                className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden border border-white/10 bg-neutral-900 shadow-2xl transition-all duration-500 touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Navigation Arrows */}
                <button 
                    onClick={prevSlide}
                    className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full items-center justify-center text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <button 
                    onClick={nextSlide}
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full items-center justify-center text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
                
                {/* Mode Indicator Overlay */}
                <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono text-white/70 border border-white/10 pointer-events-none">
                    {currentMode.toUpperCase()} {isBundle && currentMode !== 'size' ? `${currentImgIdx + 1}/${numPosters}` : ''}
                </div>

                {/* 1. STANDARD VIEW */}
                <div className={`absolute inset-0 transition-opacity duration-300 ${currentMode === 'standard' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <div className="relative w-full h-full p-4">
                        <Image 
                            src={currentImage} alt={product.title} 
                            fill className="object-contain" priority unoptimized
                        />
                    </div>
                </div>

                {/* 2. HUMAN SCALE */}
                <div className={`absolute inset-0 transition-opacity duration-300 ${currentMode === 'human' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <Image src="/assets/scale-reference.jpg" alt="Human Scale" fill className="object-cover" unoptimized />
                    <div className="absolute top-[26.5%] left-[50%] transform -translate-x-1/2 w-[28%] aspect-[0.7/1] shadow-sm bg-white p-[1px] rotate-[-1deg]">
                         <Image src={currentImage} alt="Poster" fill className="object-cover" unoptimized />
                         <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none mix-blend-multiply"></div>
                    </div>
                </div>

                {/* 3. WALL MOCKUP */}
                <div className={`absolute inset-0 transition-opacity duration-300 ${currentMode === 'wall' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <Image src="/mockups/wall-mockup-v2.png" alt="Wall" fill className="object-cover" unoptimized />
                    <div className="absolute top-[20%] left-[50%] transform -translate-x-1/2 -translate-y-[10%] w-[27%] aspect-[2/3] shadow-2xl bg-white p-[2px]">
                         <Image src={currentImage} alt="Poster" fill className="object-cover" unoptimized />
                    </div>
                </div>

                {/* 4. DESK MOCKUP (Single Only) */}
                {!isBundle && (
                    <div className={`absolute inset-0 transition-opacity duration-300 ${currentMode === 'desk' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                        <Image src="/mockups/desk-mockup.png" alt="Desk" fill className="object-cover" unoptimized />
                        <div className="absolute top-[5%] left-[50%] transform -translate-x-1/2 w-[33%] aspect-[2/3] shadow-md bg-white p-[1px]">
                            <Image src={currentImage} alt="Poster" fill className="object-cover" unoptimized />
                        </div>
                    </div>
                )}

                 {/* 5. SIZE GUIDE */}
                 <div className={`absolute inset-0 flex items-center justify-center bg-white transition-opacity duration-300 ${currentMode === 'size' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                     <Image src="/mockups/size-guide.png" alt="Size" fill className="object-contain p-8" unoptimized />
                </div>
             </div>

             {/* Quick Jumps for Bundles */}
             <div className="bg-white/5 rounded-2xl p-2 flex justify-center gap-1 overflow-x-auto">
                 {isBundle && (
                    <>
                    {product.images.slice(0, numPosters).map((url, idx) => (
                         <button 
                            key={idx} 
                            onClick={() => setGlobalIndex(idx * 3)} // Jump to Standard View of this image
                            className={`px-3 py-1 text-xs rounded-lg transition-colors whitespace-nowrap ${currentImgIdx === idx && currentMode !== 'size' ? 'bg-primary text-black font-bold' : 'text-gray-400 hover:text-white'}`}
                         >
                             {getCleanNameFromUrl(url, idx)}
                         </button>
                    ))}
                    <button onClick={() => setGlobalIndex(totalSlides - 1)} className={`px-3 py-1 text-xs rounded-lg transition-colors whitespace-nowrap ${currentMode === 'size' ? 'bg-primary text-black font-bold' : 'text-gray-400 hover:text-white'}`}>Size Guide</button>
                    </>
                 )}
                 {!isBundle && (
                     ['Standard', 'Human', 'Wall', 'Desk', 'Size'].map((m, i) => (
                        <button key={m} onClick={() => setGlobalIndex(i)} className={`px-3 py-1 text-xs rounded-lg transition-colors ${globalIndex === i ? 'bg-primary text-black' : 'text-gray-400'}`}>
                            {m}
                        </button>
                     ))
                 )}
             </div>
        </div>
    );
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { triggerAnimation, addToCart } = useCartStore();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (params?.id) {
       // Use relative path so it goes through Next.js rewrite (works on phone)
       axios.get(`/api/products/${params.id}`)
        .then(res => setProduct(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [params?.id]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product) return;
    
    // 1. Trigger Animation
    const currentImage = getImageUrl(product.images[activeImageIndex]);
    triggerAnimation(e.clientX, e.clientY, currentImage);

    // 2. Add to Cart (Global Store handles Guest/Auth logic)
    await addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        images: product.images,
        category: product.category
    });
    
    toast.success("Added to cart");
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-mono">LOADING DATA...</div>;
  if (!product) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500">PRODUCT NOT FOUND</div>;



  return (
    <div className="min-h-screen bg-background text-foreground pt-20 pb-10">
      <div className="container mx-auto px-4">
        
        {/* Breadcrumb / Back */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* LEFT COLUMN: IMMERSIVE GALLERY */}
            <GalleryComponent product={product} setActiveImageIndex={setActiveImageIndex} />
            
            {/* RIGHT COLUMN: DETAILS */}
            <div className="space-y-8">
                <div>
                     <div className="flex items-center gap-2 text-primary mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-xs font-bold border border-primary/20">{product.category}</span>
                        {product.stock < 10 && <span className="text-xs font-bold text-red-500 animate-pulse">Low Stock</span>}
                     </div>
                     <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">{product.title}</h1>
                     <div className="flex items-baseline gap-4">
                        <span className="text-3xl font-bold">₹{product.price}</span>
                        {product.price === 99 && (
                            <>
                            <span className="text-xl text-muted-foreground line-through">₹199</span>
                            <span className="text-sm font-bold text-green-500">50% OFF</span>
                            </>
                        )}
                     </div>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <p className="text-gray-300 leading-relaxed">
                        {product.description || "High-quality A3 poster printed on premium 300GSM matte paper. Perfect for adding personality to your space."}
                    </p>
                    <ul className="text-sm space-y-2 text-gray-400">
                        <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Premium 300GSM Paper</li>
                        <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Fade-Resistant Ink</li>
                        <li className="flex items-center gap-2"><Truck className="w-4 h-4 text-primary" /> Secure Packaging</li>
                    </ul>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={handleAddToCart}
                        className="flex-1 bg-primary text-black font-bold h-14 rounded-full text-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all flex items-center justify-center gap-2"
                    >
                        <ShoppingBag className="w-5 h-5" /> Add to Cart
                    </button>
                    <button className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <Heart className="w-6 h-6" />
                    </button>
                     <button className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <Share2 className="w-6 h-6" />
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}

