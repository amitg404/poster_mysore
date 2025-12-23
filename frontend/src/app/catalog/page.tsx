"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
// import { motion } from "framer-motion";
import { Search, Loader2, ShoppingCart, X } from "lucide-react";
import axios from "axios";
import { useCartStore } from "@/store/cartStore";
import { useSearchParams, useRouter } from "next/navigation";

interface FetchParams {
    page: number;
    limit: number;
    category?: string;
    search?: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
}

const categories = [
  "For You",
  "All", 
  "Anime",
  "Movie",
  "TV Shows",
  "F1",
  "Cars",
  "Superheros",
  "Nature",
  "Abstract", 
  "Band", 
  "Gaming", 
  "Geometric Art", 
  "Japanese Art", 
  "Minimalist", 
  "Motivational", 
  "Music", 
  "Retro", 
  "Sci-Fi", 
  "Space", 
  "Sports", 
  "Vintage"
];

import { Suspense } from "react";

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "All";

  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [vibeLoading, setVibeLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userVibes, setUserVibes] = useState<string[] | null>(null);

  // Check for User Vibes
  useEffect(() => {
     const vibes = localStorage.getItem("vibe_preferences");
     if (vibes && vibes !== "skipped") {
         try {
             setUserVibes(JSON.parse(vibes));
         } catch (e) {
             console.error("Failed to parse vibes", e);
         }
     }
     setVibeLoading(false);
  }, []);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearch(search);
    }, 400); // 400ms delay
    return () => clearTimeout(timer);
  }, [search]);

  // Sync URL search param
  useEffect(() => {
      const q = searchParams.get("search") || "";
      const cat = searchParams.get("category") || "All";
      if (q !== search) setSearch(q);
      if (cat !== activeCategory) setActiveCategory(cat);
  }, [searchParams, search, activeCategory]);

  // Reset when Category or Search changes
  useEffect(() => {
    // Prevent fetching For You until vibes are loaded check is complete
    if (activeCategory === "For You" && vibeLoading) return;

    setProducts([]);
    setPage(1);
    setHasMore(true);
    fetchProducts(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, debouncedSearch, userVibes, vibeLoading]);

  const fetchProducts = async (currentPage: number, reset: boolean = false) => {
    setLoading(true);
    try {
      const params: FetchParams & { vibes?: string } = {
        page: currentPage,
        limit: 50 // Fetch 50 at a time
      };

      if (activeCategory !== "All") {
          params.category = activeCategory; 
      }
      
      // Handle "For You" Logic
      if (activeCategory === "For You" && userVibes) {
          params.vibes = userVibes.join(",");
      }

      if (debouncedSearch) params.search = debouncedSearch;

      const res = await axios.get("/api/products", { params });
      let newProducts = res.data;

      // Filter out Bundles if viewing "All"
      // User Request: "when user click the bundles button in the homepage, these deals should come, not in the catalogue."
      if (activeCategory === "All") {
          newProducts = newProducts.filter((p: Product) => !p.category?.toLowerCase().includes('bundle'));
      }

      if (newProducts.length < 50) {
        setHasMore(false);
      }

      setProducts(prev => {
          if (reset) return newProducts;
          
          // Deduplicate by ID to prevent key errors
          const ids = new Set(prev.map(p => p.id));
          const uniqueNew = newProducts.filter((p: Product) => !ids.has(p.id));
          return [...prev, ...uniqueNew];
      });
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage);
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return '/placeholder.png';
    if (url.startsWith('http://localhost:5000')) {
        return url.replace('http://localhost:5000', '');
    }
    return url;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // Note: We don't trigger fetch immediately, useEffect handles it
  };

  const clearSearch = () => {
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-4xl font-bold mb-8">Catalogue</h1>

        {/* Mobile Search & Filter (Visible only on Mobile) */}
        <div className="md:hidden flex flex-col gap-3 mb-6">
            <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <input 
                   type="text" 
                   value={search}
                   onChange={handleSearchChange}
                   placeholder="Search posters..." 
                   className="w-full bg-secondary border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary outline-none"
                 />
                 {search && (
                    <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-white/10 rounded-full">
                        <X className="w-3 h-3" />
                    </button>
                 )}
            </div>
            
            <select 
               value={activeCategory} 
               onChange={(e) => setActiveCategory(e.target.value)}
               className="w-full bg-secondary border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:ring-1 focus:ring-primary outline-none appearance-none"
            >
                {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
        </div>

        {/* Desktop Category Filter (Hidden on Mobile) */}
        <div className="hidden md:flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => {
                if (cat === "For You" && !userVibes) return null;
                
                return (
                <button
                    key={cat}
                    onClick={() => router.push(`/catalog?category=${cat}`)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        activeCategory === cat 
                        ? 'bg-primary text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]' 
                        : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-white'
                    }`}
                >
                    {cat}
                </button>
            )})}
        </div>

        {/* Product Grid */}
        {(loading && products.length === 0) ? (
            <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        ) : products.length === 0 ? (
            (activeCategory === "For You" && vibeLoading) ? (
                 <div className="flex justify-center py-20">
                     <Loader2 className="w-10 h-10 animate-spin text-primary" />
                 </div>
            ) : (
                <div className="text-center py-20 text-muted-foreground">
                    No posters found. Try a different category.
                </div>
            )
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <div 
                        key={product.id}
                        className="group relative bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all shadow-lg"
                    >
                        <Link href={`/product/${product.id}`} className="block">
                         <div className="aspect-[2/3] relative overflow-hidden bg-neutral-900">
                              <Image 
                                 src={getImageUrl(product.images[0])} 
                                 alt={product.title}
                                 fill
                                 className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                                 unoptimized 
                              />
                             {/* Mobile Add to Cart Button */}
                             <button
                                onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    // Animation
                                    const { triggerAnimation, addToCart } = useCartStore.getState();
                                    const imgTarget = e.currentTarget.closest('.group')?.querySelector('img') as HTMLImageElement;
                                    if (imgTarget) {
                                        const rect = imgTarget.getBoundingClientRect();
                                        triggerAnimation(rect.left + rect.width/2, rect.top + rect.height/2, product.images[0]);
                                    }

                                    // Add to cart
                                    await addToCart({
                                        id: product.id,
                                        title: product.title,
                                        price: product.price,
                                        images: product.images,
                                        category: product.category
                                    });
                                }}
                                className="md:hidden absolute bottom-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm text-black rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform z-20"
                             >
                                <ShoppingCart className="w-5 h-5" />
                             </button>
                         </div>
                         <div className="p-4">
                            {/* Title REMOVED as per user request */}
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground line-through text-sm">₹199</span>
                                    <span className="text-primary font-bold">₹{product.price}</span>
                                </div>
                                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">{product.category}</span>
                            </div>
                         </div>
                    </Link>
                    {/* Floating Add to Cart Button (Outside Link to avoid nesting clickable issues) */}
                    <div className="absolute inset-x-0 bottom-24 p-4 pointer-events-none">
                         <button 
                            onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Animation
                                const { triggerAnimation, addToCart } = useCartStore.getState();
                                const imgTarget = e.currentTarget.closest('.group')?.querySelector('img') as HTMLImageElement;
                                if (imgTarget) {
                                    const rect = imgTarget.getBoundingClientRect();
                                    triggerAnimation(rect.left + rect.width/2, rect.top + rect.height/2, product.images[0]);
                                }

                                    // Add to cart
                                    await addToCart({
                                        id: product.id,
                                        title: product.title,
                                        price: product.price,
                                        images: product.images,
                                        category: product.category
                                    });
                                // toast.success("Added to cart");
                            }}
                            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-lg pointer-events-auto transform translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 duration-300"
                        >
                            <ShoppingCart className="w-5 h-5" /> Add to Cart
                        </button>
                    </div>
                    </div>
                ))}
            </div>
        )}
        {/* Load More Button */}
        {hasMore && (
          <div className="mt-12 flex justify-center">
             <button 
               onClick={loadMore} 
               disabled={loading}
               className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 disabled:opacity-50"
             >
               {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Load More Posters"}
             </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <CatalogContent />
    </Suspense>
  );
}
