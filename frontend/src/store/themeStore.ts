import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeColor = 'default' | 'stranger-things' | 'one-piece' | 'demon-slayer';

interface ThemeState {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeColor: 'default',
      setThemeColor: (color) => {
        set({ themeColor: color });
        // Update the data-attribute on the document root
        if (typeof window !== 'undefined') {
          document.documentElement.setAttribute('data-theme-color', color);
        }
      },
    }),
    {
      name: 'theme-color-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydrate
         if (state && typeof window !== 'undefined') {
            document.documentElement.setAttribute('data-theme-color', state.themeColor);
         }
      }
    }
  )
);
