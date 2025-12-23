"use client";

import { useUIStore } from "@/store/uiStore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function GlobalLoader() {
  const { isLoading } = useUIStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isLoading) {
      // Delay slightly to avoid synchronous setState warning
      timeout = setTimeout(() => setShow(true), 0);
    } else {
      timeout = setTimeout(() => setShow(false), 500);
    }
    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-background/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
      <span className="text-xs font-medium text-muted-foreground animate-pulse">Curating your vibe...</span>
    </div>
  );
}
