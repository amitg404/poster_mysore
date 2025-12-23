"use client";

import { Package, Loader2, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";

interface Product {
    id: string;
    title: string;
    price: number;
    description: string;
    images: string[];
}

const getPricing = (price: number) => {
    if (price === 799) return { original: 990, discount: 191 }; // Luffy
    if (price === 479) return { original: 594, discount: 115 }; // Others
    return { original: Math.round(price * 1.3), discount: Math.round(price * 0.3) }; // Fallback
};

const BundleCard = ({ product }: { product: Product }) => {
    const [imgIndex, setImgIndex] = useState(0);
    const { original, discount } = getPricing(product.price);

    // Auto-scroll images
    useEffect(() => {
        if (!product.images || product.images.length <= 1) return;
        
        const interval = setInterval(() => {
            setImgIndex((prev) => (prev + 1) % product.images.length);
        }, 2000); // 2 seconds

        return () => clearInterval(interval);
    }, [product.images]);

    const getImageUrl = (url: string) => {
        if (!url) return '/placeholder.png';
        if (url.startsWith('http://localhost:5000')) {
            return url.replace('http://localhost:5000', '');
        }
        return url;
    };

    const currentImg = getImageUrl(product.images[imgIndex] || "");

    return (
        <Link href={`/product/${product.id}`} className="block group">
            <div className="bg-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all shadow-lg hover:-translate-y-1">
                {/* Image Area */}
                <div className="aspect-[2/3] relative bg-neutral-900 overflow-hidden">
                    <Image 
                        src={currentImg} 
                        alt={product.title} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        unoptimized
                    />
                    
                    {/* Overlay Info */}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 flex flex-col items-end">
                        <span className="text-xs text-green-400 font-bold">SAVE ₹{discount}</span>
                    </div>

                    <div className="absolute bottom-3 right-3 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg transform translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <ShoppingCart className="w-5 h-5" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                    <h3 className="font-bold text-lg leading-tight truncate">{product.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{product.images.length} Premium Posters Included</p>
                    
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground line-through">₹{original}</span>
                            <span className="text-xl font-bold text-primary">₹{product.price}</span>
                        </div>
                        <div className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-md border border-primary/20">
                            {Math.round((discount/original)*100)}% OFF
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default function BundleOfferPage() {
  const [bundles, setBundles] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBundles() {
        try {
            const res = await axios.get('/api/products?category=Bundles');
            setBundles(res.data);
        } catch (e) {
            console.error("Failed to fetch bundles", e);
        } finally {
            setLoading(false);
        }
    }
    fetchBundles();
  }, []);

  return (
    <main className="min-h-screen pt-24 pb-12 px-4 container mx-auto">
      <div className="space-y-12">
         {/* Header */}
         <div className="text-center space-y-4">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium border border-green-500/20 backdrop-blur-sm">
             <Package className="w-4 h-4" /> Value Packs
           </div>
           <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
             Bundle & Save
           </h1>
           <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
             Curated collections. Complete your wall in one go.
           </p>
        </div>

        {/* Grid */}
        {loading ? (
            <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {bundles.map((bundle) => (
                    <BundleCard key={bundle.id} product={bundle} />
                ))}
            </div>
        )}
        
        {!loading && bundles.length === 0 && (
            <p className="text-center text-muted-foreground">No active bundles right now. Check back later!</p>
        )}
      </div>
    </main>
  );
}
