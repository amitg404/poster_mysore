"use client";
import { usePathname } from "next/navigation";

export default function GlobalBackButton() {
    const pathname = usePathname();
    
    // Don't show on Home or Login/Signup (optional, but keep it clean)
    if (pathname === "/" || pathname === "/login" || pathname === "/signup") return null;

    return null;
}
