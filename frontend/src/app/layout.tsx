import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import GlobalBackButton from "@/components/global-back-button";
import Navbar from "@/components/Navbar";
import CartAnimator from "@/components/cart-animator";
import { Toaster } from "sonner";
import { OfferTracker } from "@/components/OfferTracker";
import { GlobalLoader } from "@/components/global-loader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PosterShop - Premium A3 Posters",
  description: "High-quality posters for your space",
};

import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <GlobalBackButton />
            <CartAnimator />
            <GlobalLoader />
            <Suspense fallback={<div className="h-16 w-full fixed top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10" />}>
              <Navbar />
            </Suspense>
            {children}
            <OfferTracker />
            <Toaster position="bottom-center" toastOptions={{
              className: 'bg-neutral-900 border border-white/10 text-white',
              actionButtonStyle: { background: 'white', color: 'black' }
            }} />
            <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
