"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Package, X, MessageCircle, Mail, ChevronLeft } from "lucide-react";
import { Loader2 } from "lucide-react";

interface Order {
  id: string;
  totalAmount: number;
  finalAmount: number;
  status: string;
  paymentId?: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    customImage?: string;
    product: {
      title: string;
      images: string; // JSON string from DB
    }
  }[];
}

export default function MyOrdersPage() {
  const { token, hasHydrated } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.push("/login?redirect=/orders");
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await axios.get("/api/orders/my-orders", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Fetch orders error:", err);
        // Robust 401 check
        if (err.response?.status === 401 || err.status === 401) {
            console.log("Unauthorized access, redirecting to login...");
            useAuthStore.getState().logout();
            router.replace("/login?redirect=/orders");
            return;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, router, hasHydrated]);

  const getProductImage = (item: { customImage?: string; product: { images: string } }) => {
      if (item.customImage) return item.customImage;
      try {
          const imgs = JSON.parse(item.product.images);
          return imgs[0] || '/placeholder.png';
      } catch {
        return '/placeholder.png';
      }
  };

  if (!hasHydrated || loading) return (
     <div className="min-h-screen bg-black flex items-center justify-center">
         <Loader2 className="animate-spin text-green-500 w-8 h-8" />
     </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24 md:pb-8">
      <nav className="flex items-center gap-4 mb-8 sticky top-0 bg-black/80 backdrop-blur-md z-10 py-4">
        <Link href="/" className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
            Past Orders
        </h1>
      </nav>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center">
                <Package className="w-10 h-10 text-neutral-500" />
            </div>
            <h2 className="text-xl font-semibold">No orders yet</h2>
            <Link href="/catalog" className="text-green-400 hover:underline">Start Shopping</Link>
        </div>
      ) : (
        <div className="grid gap-4 max-w-2xl mx-auto">
            {orders.map((order) => (
                <motion.div 
                    key={order.id}
                    layoutId={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 cursor-pointer hover:border-neutral-700 transition-colors group relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <p className="text-sm text-neutral-400 font-mono">#{order.id.slice(0,8)}</p>
                            <p className="text-xs text-neutral-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${order.status.includes('PAID') ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                            {order.status}
                        </div>
                    </div>

                    {/* Thumbnail Preview Stack */}
                    <div className="flex items-center gap-2 relative z-10">
                        {order.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="w-12 h-16 relative bg-neutral-800 rounded-md overflow-hidden border border-white/5">
                                <Image 
                                    src={getProductImage(item)} 
                                    alt="Thumb" 
                                    fill 
                                    className="object-cover" 
                                />
                            </div>
                        ))}
                        {order.items.length > 3 && (
                            <div className="w-12 h-16 flex items-center justify-center bg-neutral-800 rounded-md text-xs text-neutral-400 font-bold">
                                +{order.items.length - 3}
                            </div>
                        )}
                        <div className="ml-auto text-right">
                           <p className="text-lg font-bold">₹{order.finalAmount}</p>
                           <p className="text-xs text-neutral-500">{order.items.length} Items</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
      )}

      {/* Details Modal */}
      <AnimatePresence>
          {selectedOrder && (
              <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 md:p-8">
                  <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedOrder(null)}
                      className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                  />
                  <motion.div 
                      layoutId={selectedOrder.id}
                      className="bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-3xl p-6 relative z-10 max-h-[85vh] overflow-y-auto pb-24"
                  >
                      <button 
                        onClick={() => setSelectedOrder(null)}
                        className="absolute top-4 right-4 p-2 bg-neutral-800 rounded-full hover:bg-neutral-700"
                      >
                          <X className="w-5 h-5" />
                      </button>

                      <div className="mb-6">
                        <h2 className="text-2xl font-bold mb-1">Order Details</h2>
                        <p className="text-neutral-400 text-sm">#{selectedOrder.id}</p>
                      </div>

                      <div className="space-y-6">
                          {/* Items List */}
                          <div className="space-y-4">
                              <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Items</h3>
                              {selectedOrder.items.map(item => (
                                  <div key={item.id} className="flex gap-4 items-center">
                                      <div className="w-16 h-20 relative bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0">
                                          <Image src={getProductImage(item)} alt="" fill className="object-cover" />
                                      </div>
                                      <div>
                                          <p className="font-semibold line-clamp-2">{item.product?.title || "Custom Poster"}</p>
                                          <p className="text-sm text-neutral-400">Qty: {item.quantity} × ₹{item.price}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>

                          {/* Payment Info */}
                          <div className="bg-neutral-800/50 rounded-xl p-4 space-y-2">
                              <div className="flex justify-between text-sm">
                                  <span className="text-neutral-400">Status</span>
                                  <span className="font-bold text-green-400">{selectedOrder.status}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-neutral-400">Payment ID</span>
                                  <span className="font-mono text-xs">{selectedOrder.paymentId || "N/A"}</span>
                              </div>
                              <div className="border-t border-white/5 my-2 pt-2 flex justify-between font-bold text-lg">
                                  <span>Total</span>
                                  <span>₹{selectedOrder.finalAmount}</span>
                              </div>
                          </div>

                          {/* Support Section */}
                          <div className="space-y-3 pt-4 border-t border-neutral-800">
                             <p className="text-sm font-semibold text-neutral-400">Need Help?</p>
                             <div className="grid grid-cols-2 gap-3">
                                 <a 
                                    href={`https://wa.me/917975206988?text=Hi, I need help with Order #${selectedOrder.id}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#128C7E] transition-colors"
                                 >
                                     <MessageCircle className="w-5 h-5" />
                                     WhatsApp
                                 </a>
                                 <a 
                                    href="mailto:postershop.store@gmail.com" 
                                    className="flex items-center justify-center gap-2 bg-white text-black font-bold py-3 rounded-xl hover:bg-neutral-200 transition-colors"
                                 >
                                     <Mail className="w-5 h-5" />
                                     Email
                                 </a>
                             </div>
                          </div>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
}
