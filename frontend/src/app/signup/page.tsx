"use client";

import axios from "axios";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft } from "lucide-react";

export default function SignupPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen bg-black" />}>
            <SignupContent />
        </React.Suspense>
    );
}

function SignupContent() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isAffiliate = false; // const [isAffiliate, setIsAffiliate] = useState(false); - unused
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();

  const searchParams = useSearchParams();

  // Load from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem('signup_backup_name');
    const savedEmail = localStorage.getItem('signup_backup_email');
    const savedMobile = localStorage.getItem('signup_backup_mobile');

    if (savedName) setName(savedName);
    if (savedEmail) setEmail(savedEmail);
    if (savedMobile) setMobile(savedMobile);

    const prefill = searchParams.get('prefill');
    if (prefill) {
        if (prefill.includes('@')) {
            setEmail(prefill);
            localStorage.setItem('signup_backup_email', prefill);
        } else {
            setMobile(prefill);
            localStorage.setItem('signup_backup_mobile', prefill);
        }
    }
  }, [searchParams]);

  // Update localStorage helpers
  const updateName = (val: string) => {
      setName(val);
      localStorage.setItem('signup_backup_name', val);
  };
  const updateEmail = (val: string) => {
      setEmail(val);
      localStorage.setItem('signup_backup_email', val);
  };
  const updateMobile = (val: string) => {
      setMobile(val);
      localStorage.setItem('signup_backup_mobile', val);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!mobile && !email) {
        setError("Please provide either a Mobile Number or an Email Address.");
        setLoading(false);
        return;
    }

    try {
      await axios.post("/api/auth/signup", {
        name,
        mobile,
        email,
        password,
        role: isAffiliate ? "AFFILIATE" : "USER",
      });

      toast.success("Account created! Please login.");
      // Clear persistence on success
      localStorage.removeItem('signup_backup_name');
      localStorage.removeItem('signup_backup_email');
      localStorage.removeItem('signup_backup_mobile');
      
      router.push("/login?registered=true"); 
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
          setError(err.response?.data?.error || "Signup failed");
      } else {
          setError("Signup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/90 p-4 relative overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl z-10"
      >
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">
          Join the Vibe
        </h1>
        <p className="text-gray-400 mb-8">Create an account to start shopping or selling.</p>

        {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">
                {error}
            </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => updateName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="John Doe"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Email Field (First) */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                type="email"
                value={email}
                onChange={(e) => updateEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="you@email.com"
                />
            </div>
            
            {/* Mobile Field (Second) */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Mobile</label>
                <input
                type="tel"
                value={mobile}
                onChange={(e) => updateMobile(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="9876543210"
                />
            </div>
          </div>
          <p className="text-xs text-gray-500 -mt-2">Provide at least one contact method.</p>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="••••••••"
            />
          </div>

          {/* Affiliate Toggle (HIDDEN for now) */}
          {/* 
          <div 
            onClick={() => setIsAffiliate(!isAffiliate)}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${isAffiliate ? 'bg-primary/20 border-primary' : 'bg-black/20 border-white/10 hover:bg-white/5'}`}
          >
             <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isAffiliate ? 'border-primary bg-primary' : 'border-gray-500'}`}>
                {isAffiliate && <div className="w-2 h-2 bg-black rounded-full" />}
             </div>
             <div>
                 <h4 className="font-bold text-white flex items-center gap-2">Become an Affiliate <Sparkles className="w-4 h-4 text-yellow-400" /></h4>
                 <p className="text-xs text-gray-400">Earn money by selling posters to your friends.</p>
             </div>
          </div>
          */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>


      </motion.div>
    </div>
  );
}
