import { Zap, Clock, Truck, CheckCircle2 } from "lucide-react";

export default function DailyDropPage() {
  return (
    <main className="min-h-screen pt-24 pb-12 px-4 container mx-auto">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium border border-primary/20 backdrop-blur-sm">
             <Zap className="w-4 h-4" /> Daily Drop System
           </div>
           <h1 className="text-4xl md:text-5xl font-bold text-foreground">
             How Delivery Works
           </h1>
           <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
             Our unique Daily Drop system ensures you get the freshest posters delivered to your campus rapidly. Here is how it works.
           </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
           {/* Connecting Line (Desktop) */}
           <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0"></div>

           {/* Step 1 */}
           <div className="relative pt-8 text-center space-y-4">
              <div className="w-16 h-16 bg-card border border-primary/50 rounded-full flex items-center justify-center mx-auto relative z-10 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                 <Clock className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-xl font-bold text-foreground">1. Order Before 12 PM</h3>
                 <p className="text-sm text-muted-foreground">Place your order before noon today to be eligible for tomorrow&apos;s drop.</p>
              </div>
           </div>

           {/* Step 2 */}
           <div className="relative pt-8 text-center space-y-4">
              <div className="w-16 h-16 bg-card border border-primary/50 rounded-full flex items-center justify-center mx-auto relative z-10 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                 <Truck className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-xl font-bold text-foreground">2. We Pack & Ship</h3>
                 <p className="text-sm text-muted-foreground">We process and pack all orders overnight. Your posters are carefully rolled in protective tubes.</p>
              </div>
           </div>

           {/* Step 3 */}
           <div className="relative pt-8 text-center space-y-4">
              <div className="w-16 h-16 bg-card border border-primary/50 rounded-full flex items-center justify-center mx-auto relative z-10 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                 <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-xl font-bold text-foreground">3. Drop by 4 PM</h3>
                 <p className="text-sm text-muted-foreground">Your order arrives at your designated campus drop point by 4 PM tomorrow.</p>
              </div>
           </div>
        </div>

        {/* Info Card */}
        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
            <div className="flex-1 space-y-4">
                <h3 className="text-2xl font-bold text-card-foreground">Why Daily Drop?</h3>
                <p className="text-muted-foreground">
                    By batching orders, we save on logistics costs and pass those savings directly to you. This is how we offer premium A3 posters at student-friendly prices.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Free delivery to Campus Drop Points</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Secure Packaging</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Real-time status updates via WhatsApp</li>
                </ul>
            </div>
            <div className="w-full md:w-64 aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden relative shadow-inner">
                 <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3897.669865882664!2d76.61869831481546!3d12.338167991273957!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3baf7a5fd7d5e4a3%3A0x629577747045050f!2sVidyavardhaka%20College%20of%20Engineering!5e0!3m2!1sen!2sin!4v1675845678901!5m2!1sen!2sin" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                 ></iframe>
            </div>
        </div>
      </div>
    </main>
  );
}
