import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios, { AxiosError } from 'axios';
import { useAuthStore } from './authStore';

interface CartItem {
    id: string; // Product ID for local, CartItem ID for backend (handled via mapping if needed, but simple product ID is easier for local)
    quantity: number;
    product: {
        id: string;
        title: string;
        price: number;
        images: string[];
        category: string;
        customImage?: string;
    }
}
import { toast } from 'sonner';

interface CartState {
  items: CartItem[];
  isAnimating: boolean;
  flyingImage: string | null;
  startPos: { x: number; y: number } | null;
  
  addToCart: (product: CartItem['product']) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  fetchCart: () => Promise<void>;
  clearCart: () => void;
  
  triggerAnimation: (x: number, y: number, image: string) => void;
  resetAnimation: () => void;
  decreaseQuantity: (productId: string) => void;
  claimedOffer: string | null;
  setClaimedOffer: (offerId: string | null) => void;
  lastCelebratedTier: number;
  setCelebratedTier: (tier: number) => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
          items: [],
          isAnimating: false,
          flyingImage: null,
          startPos: null,
          claimedOffer: null,
          lastCelebratedTier: 0,
          
          setCelebratedTier: (tier) => set({ lastCelebratedTier: tier }),
          setClaimedOffer: (offerId) => set({ claimedOffer: offerId }),
          
          addToCart: async (product) => {
              const { token } = useAuthStore.getState();
              
              // Optimistic UI Update (or Local Add)
              set((state) => {
                  const existing = state.items.find(i => i.product.id === product.id);
                  if (existing) {
                      return {
                          items: state.items.map(i => 
                              i.product.id === product.id 
                                  ? { ...i, quantity: i.quantity + 1 } 
                                  : i
                          )
                      };
                  }
                  return { items: [...state.items, { id: product.id, quantity: 1, product }] };
              });
              
              const isCustom = product.category.toLowerCase() === 'custom';
              if(isCustom) toast.success("Added Custom Poster to Cart!");
              else toast.success("Added to Cart!");

              // If logged in, sync with backend
              if (token) {
                  try {
                       const res = await axios.post('/api/cart/add', { 
                           productId: product.id,
                           customImage: product.customImage 
                       }, {
                           headers: { Authorization: `Bearer ${token}` }
                       });
                       
                       // Critical: Update local item ID with real backend ID
                       if (res.data.cartItem) {
                           set((state) => ({
                               items: state.items.map(i => 
                                   i.product.id === product.id 
                                       ? { ...i, id: res.data.cartItem.id } // Sync ID
                                       : i
                               )
                           }));
                       }
                  } catch (err) {
                      const error = err as AxiosError<{ error: string }>;
                      console.error("Failed to sync cart", error);
                      const msg = error.response?.data?.error || error.message || "Failed to sync with server";
                      if (error.response?.status === 401) {
                         toast.error("Session expired. Please login again.");
                         // Optional: logout()
                      } else {
                         toast.error(`Sync Error: ${msg}`); 
                      }
                      
                      // Rollback optimistic update if strictly necessary? 
                      // For now, keeping local state is "safer" for user experience unless it's critical.
                  }
              }
          },
          
          decreaseQuantity: async (productId) => {
              const { token } = useAuthStore.getState();
              set((state) => {
                  const existing = state.items.find(i => i.product.id === productId);
                  if (existing && existing.quantity > 1) {
                        return {
                            items: state.items.map(i => 
                                i.product.id === productId 
                                    ? { ...i, quantity: i.quantity - 1 } 
                                    : i
                            )
                        };
                  }
                  return state;
              });

              if (token) {
                   const item = get().items.find(i => i.product.id === productId);
                   if (item) {
                       try {
                           await axios.put(`/api/cart/${item.id}`, { quantity: item.quantity }, {
                                headers: { Authorization: `Bearer ${token}` }
                           });
                       } catch (e) { 
                            console.error(e);
                            const error = e as AxiosError<{ error: string }>;
                            const msg = error.response?.data?.error || "Failed to update quantity";
                            toast.error(msg);
                       }
                   }
              }
          },

          removeFromCart: async (productId) => {
              const { token } = useAuthStore.getState();
              const item = get().items.find(i => i.product.id === productId);
              
              set((state) => ({
                  items: state.items.filter(i => i.product.id !== productId)
              }));
              toast.info("Removed from Cart");
              
              if (token && item) {
                   try {
                       await axios.delete(`/api/cart/${item.id}`, {
                           headers: { Authorization: `Bearer ${token}` }
                       });
                   } catch (err) {
                       const error = err as AxiosError;
                       console.error("Failed to remove item from backend", error);
                       toast.error("Failed to remove from server. Refresh to sync.");
                   }
              }
          },
          
          fetchCart: async () => {
              const { token } = useAuthStore.getState();
              if (token) {
                  try {
                      const res = await axios.get('/api/cart', {
                          headers: { Authorization: `Bearer ${token}` }
                      });
                      set({ items: res.data.items || [] });
                  } catch (error) {
                      const err = error as AxiosError;
                      console.error("Failed to fetch cart", err);
                      if (err.response?.status !== 404) { // Don't toast for empty cart 404
                          // toast.error("Could not load cart");
                      }
                  }
              }
              // If guest, do nothing, rely on persisted state
          },

          clearCart: () => set({ items: [] }),

          triggerAnimation: (x, y, image) => set({ 
              isAnimating: true, 
              startPos: { x, y }, 
              flyingImage: image 
          }),
          resetAnimation: () => set({ 
              isAnimating: false, 
              flyingImage: null, 
              startPos: null 
          }),
        }),
        {
            name: 'poster-cart-storage',
            partialize: (state) => ({ 
                items: state.items,
                claimedOffer: state.claimedOffer,
                lastCelebratedTier: state.lastCelebratedTier
            }), 
            skipHydration: true, 
        }
    )
);
