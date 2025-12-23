"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";
import { Plus } from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
}

export function TrendingCarousel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCartStore();

  useEffect(() => {
    // Fetch a mix of products. 
    // Since we don't have a specific 'Best Sellers' endpoint yet, we'll fetch all and slice or categorize.
    // Ideally user 'Best Sellers' logic would be backend, but for now we pick random or first 5.
    const fetchTrending = async () => {
      try {
        const res = await axios.get('/api/products'); 
        // Simple shuffle or just slice
        const shuffled = res.data.sort(() => 0.5 - Math.random()).slice(0, 5);
        setProducts(shuffled);
      } catch (err) {
        console.error("Failed to load trending", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
      e.preventDefault(); // Prevent navigation
      e.stopPropagation();
      addToCart(product);
      toast.success("Added to Cart!");
  };

  if (loading) return null;
  if (products.length === 0) return null;

  return (
    <div className="mt-8 border-t border-white/10 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
         🔥 Trending Now
         <span className="text-xs font-normal text-muted-foreground ml-auto hover:text-primary cursor-pointer">
             <Link href="/catalog?category=Anime">View All</Link>
         </span>
      </h3>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {products.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`} className="block min-w-[140px] w-[140px] snap-start group relative">
            <div className="aspect-[2/3] rounded-lg overflow-hidden bg-neutral-800 relative mb-2 border border-white/5 group-hover:border-primary/50 transition-colors">
                {product.images[0] && (
                    <Image 
                        src={product.images[0].startsWith('http') ? product.images[0] : `/uploads/${product.images[0]}`} 
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="140px"
                    />
                )}
                
                {/* Add To Cart Overlay Button */}
                <button 
                    onClick={(e) => handleQuickAdd(e, product)}
                    className="absolute bottom-2 right-2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-lg z-10"
                    title="Add to Cart"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
            <h4 className="font-bold text-sm truncate text-white/90 group-hover:text-primary">{product.title}</h4>
            <p className="text-xs text-gray-400">₹{product.price}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
