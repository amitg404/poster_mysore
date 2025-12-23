import { Gift } from "lucide-react";
import Link from "next/link";

export default function StudentOfferPage() {
  return (
    <main className="min-h-screen pt-24 pb-12 px-4 container mx-auto">
      <div className="max-w-4xl mx-auto space-y-8">
         <div className="text-center space-y-4">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium border border-primary/20 backdrop-blur-sm">
             <Gift className="w-4 h-4" /> Student Exclusive
           </div>
           {/* Fixed: Use foreground color instead of white for heading */}
           <h1 className="text-4xl md:text-5xl font-bold text-foreground">
             Student Offers
           </h1>
           <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
             Unlock special discounts and free shipping for your dorm room makeover.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fixed: Use bg-card and text-card-foreground */}
            <div className="p-8 rounded-3xl bg-card border border-border hover:border-primary/50 transition-colors shadow-sm">
                <h3 className="text-2xl font-bold mb-2 text-card-foreground">Free Shipping</h3>
                <p className="text-muted-foreground mb-6">On all orders above ₹199. No code required.</p>
                <div className="text-4xl font-bold text-primary">₹0 <span className="text-sm text-muted-foreground font-normal">delivery fee</span></div>
            </div>
            
             <div className="p-8 rounded-3xl bg-card border border-border hover:border-primary/50 transition-colors shadow-sm">
                <h3 className="text-2xl font-bold mb-2 text-card-foreground">Bulk Discount</h3>
                <p className="text-muted-foreground mb-6">Buy 4 Get 1 Free on all A3 Posters.</p>
                <div className="inline-block px-4 py-2 bg-foreground text-background font-bold rounded-lg transform rotate-[-2deg]">
                    CODE: SQUAD5
                </div>
            </div>
        </div>
        
        <div className="text-center pt-8">
            <Link href="/catalog" className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-full text-lg hover:scale-105 transition-transform inline-block">
                Start Shopping
            </Link>
        </div>
      </div>
    </main>
  );
}
