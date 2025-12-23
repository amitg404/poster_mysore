"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import { IndianRupee, TrendingUp, Users, Copy, Loader2 } from "lucide-react";
import Link from 'next/link';

interface DashboardStats {
  affiliateCode: string;
  commissionRate: number;
  walletBalance: number;
  totalOrders: number;
  recentOrders: {
      id: string;
      finalAmount: number;
      createdAt: string;
      status: string;
  }[];
}

export const dynamic = 'force-dynamic';

export default function AffiliateDashboard() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || user?.role !== 'AFFILIATE') {
        router.push('/login');
        return;
    }
    
    const fetchStats = async () => {
        try {
            const res = await axios.get("/api/affiliate/dashboard", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    fetchStats();
  }, [token, user, router]);

  const copyCode = () => {
    if (stats?.affiliateCode) {
        navigator.clipboard.writeText(stats.affiliateCode);
        alert("Code copied!");
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
       {/* Navbar Minimal */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
             <Link href="/" className="font-bold text-xl">PosterShop <span className="text-yellow-400 text-sm font-normal">Affiliate</span></Link>
             <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">Welcome, {user?.name}</span>
             </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 p-6 rounded-2xl border border-green-500/30">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-green-500/20 rounded-xl">
                        <IndianRupee className="text-green-400 w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold bg-black/30 px-2 py-1 rounded text-green-300">Available</span>
                </div>
                <h3 className="text-3xl font-bold text-white">₹{stats?.walletBalance}</h3>
                <p className="text-sm text-gray-400 mt-1">Wallet Balance</p>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-card p-6 rounded-2xl border border-white/10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                        <Users className="text-blue-400 w-6 h-6" />
                    </div>
                </div>
                <h3 className="text-3xl font-bold text-white">{stats?.totalOrders}</h3>
                <p className="text-sm text-gray-400 mt-1">Total Orders Referred</p>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-card p-6 rounded-2xl border border-white/10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                        <TrendingUp className="text-purple-400 w-6 h-6" />
                    </div>
                </div>
                <h3 className="text-3xl font-bold text-white">{(stats?.commissionRate || 0) * 100}%</h3>
                <p className="text-sm text-gray-400 mt-1">Your Commission Rate</p>
            </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Share Code Section */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-card p-6 rounded-2xl border border-white/10">
                    <h3 className="font-bold text-lg mb-4">Your Referral Code</h3>
                    <div className="flex items-center gap-2 bg-black/50 p-4 rounded-xl border border-white/5 border-dashed relative group">
                        <code className="text-2xl font-mono text-yellow-400 font-bold tracking-widest flex-1 text-center">
                            {stats?.affiliateCode}
                        </code>
                        <button onClick={copyCode} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Copy">
                            <Copy className="w-5 h-5 text-gray-400 group-hover:text-white" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-400 mt-4 leading-relaxed">
                        Share this code with your friends. They get a discount, and you earn <span className="text-white font-bold">10%</span> of every sale!
                    </p>
                </div>
            </div>

            {/* Recent Orders Table */}
            <div className="lg:col-span-2">
                <div className="bg-card p-6 rounded-2xl border border-white/10 h-full">
                    <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
                    {stats?.recentOrders.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No orders yet. Start sharing your code!
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-black/20">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Date</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 rounded-r-lg text-right">Commission</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {stats?.recentOrders.map((order) => (
                                        <tr key={order.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-4 text-gray-300">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right font-bold text-green-400">
                                                +₹{(order.finalAmount * (stats?.commissionRate || 0.1)).toFixed(0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

        </div>

      </main>
    </div>
  );
}
