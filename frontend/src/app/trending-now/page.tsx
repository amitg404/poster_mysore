import { TrendingUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Placeholder data - ideally this comes from API
const TRENDING_IMAGES = [
    "https://images.unsplash.com/photo-1578301978693-85ea9ec2a20b?q=80&w=2070",
    "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?q=80&w=2066",
    "https://images.unsplash.com/photo-1552083855-e51049d46927?q=80&w=2070",
    "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2024"
];

export default function TrendingPage() {
  return (
    <main className="min-h-screen pt-24 pb-12 px-4 container mx-auto">
      <div className="space-y-8">
         <div className="text-center space-y-4">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm font-medium border border-orange-500/20 backdrop-blur-sm">
             <TrendingUp className="w-4 h-4" /> Hot Right Now
           </div>
           <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
             Trending Now
           </h1>
           <p className="text-muted-foreground mt-2">
             The most popular picks from students across colleges this week.
           </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRENDING_IMAGES.map((src, i) => (
                <div key={i} className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 hover:border-orange-500/50 transition-colors">
                     <Image src={src} alt="Trending Poster" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                        <span className="text-orange-400 font-bold text-sm">#Tranding {i+1}</span>
                     </div>
                </div>
            ))}
        </div>
        
        <div className="text-center pt-8">
            <Link href="/catalog?sort=trending" className="px-8 py-3 bg-orange-500 text-white font-bold rounded-full text-lg hover:bg-orange-600 transition-colors inline-block">
                View All Trending
            </Link>
        </div>
      </div>
    </main>
  );
}
