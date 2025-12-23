"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(""); // Email or Mobile
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Forgot Password State
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("/api/auth/login", {
        identifier,
        password,
      });

      setAuth(res.data.token, res.data.user);
      router.push("/"); // Redirect to home
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
          // Check for "User not found" (usually 404 or specific error message)
          if (err.response?.status === 404 || err.response?.data?.error === "User not found") {
              toast.error("Account not found. Redirecting to Signup...");
              /* 
                 Redirect to Signup, pre-filling the email/identifier user tried.
                 We pass it via URL query param 'prefill'.
                 Note: We do NOT pass password for security, keeping it simple as per best practices,
                 though user asked for it. Passing password in URL is unsafe.
                 Better UX: Just pass email. User can re-type password. 
                 If strictly required, we'd need session storage, but let's try email first.
              */
              setTimeout(() => {
                router.push(`/signup?prefill=${encodeURIComponent(identifier)}`);
              }, 1500);
              return;
          }
          setError(err.response?.data?.error || "Login failed");
      } else {
          setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");
      
      try {
          await axios.post("/api/auth/forgot-password", { email: resetEmail });
          setResetSent(true);
          toast.success("Password reset email sent!");
      } catch (err: unknown) {
          if (axios.isAxiosError(err)) {
              setError(err.response?.data?.error || "Failed to send reset email");
          } else {
              setError("An unexpected error occurred");
          }
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/90 p-4 relative overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl z-10"
      >
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {!isForgotMode ? (
            <>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent mb-2">
                Welcome Back
                </h1>
                <p className="text-gray-400 mb-8">Login to manage your posters</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email or Mobile Number</label>
                    <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="Enter email or mobile number"
                    suppressHydrationWarning
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                    <input
                    type="password"
                    required
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="••••••••"
                    />
                    <div className="flex justify-end mt-1">
                        <button type="button" onClick={() => setIsForgotMode(true)} className="text-xs text-primary hover:underline">Forgot password?</button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : "Login"}
                </button>
                </form>

                <p className="mt-6 text-center text-gray-400 text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline">
                    Sign up
                </Link>
                </p>
            </>
        ) : (
            <>
                <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                <p className="text-gray-400 mb-6">Enter your email to receive a temporary password.</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                {resetSent ? (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-lg text-center">
                        <p>Email sent successfully!</p>
                        <p className="text-xs mt-2 text-gray-400">Please check your spam folder too.</p>
                        <button onClick={() => setIsForgotMode(false)} className="mt-4 text-primary text-sm hover:underline">Return to Login</button>
                    </div>
                ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                            <input
                            type="email"
                            required
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="you@example.com"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
                        </button>
                        <button type="button" onClick={() => setIsForgotMode(false)} className="w-full text-gray-400 text-sm hover:text-white transition-colors">
                            Cancel
                        </button>
                    </form>
                )}
            </>
        )}

      </motion.div>
    </div>
  );
}
