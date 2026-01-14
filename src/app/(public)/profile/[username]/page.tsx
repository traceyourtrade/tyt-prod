"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  User,
  ArrowLeft,
  AlertCircle,
  Calendar,
  Trophy,
  Activity,
  Award,
  X
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid
} from "recharts";
import VerifiedCertificate from "@/components/VerifiedCertificate";

interface PublicProfileData {
  displayName: string;
  profilePicture: string | null;
  bio: string | null;
  isVerified: boolean;
  memberSince: string;
  isOwner: boolean;
  settings: {
    showEquityCurve: boolean;
    showMonthlyPnL: boolean;
    showWinRate: boolean;
    showProfitFactor: boolean;
    showTotalTrades: boolean;
    showTotalPnL: boolean;
    hideDollarAmounts: boolean;
  };
  stats: {
    totalTrades?: number;
    winRate?: number;
    profitFactor?: number;
    totalPnL?: number | null;
    totalPnLHidden?: boolean;
  };
  monthlyPnL?: Array<{ month: string; pnl: number }>;
  equityCurve?: Array<{ tradeNumber: number; equity: number; date: string }>;
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/public-profile?username=${encodeURIComponent(username)}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch profile");
      }

      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "Hidden";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
          <p className="text-zinc-400 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isProfitable = (data.stats.totalPnL || 0) > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-500/10 to-transparent" />

      <div className="relative max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Trading Journal</span>
          </Link>
          
          {data.isOwner && (
            <button
              onClick={() => setShowCertificate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors"
            >
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">Get Certificate</span>
            </button>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl mb-6"
        >
          <div className={`h-2 ${data.isVerified ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gradient-to-r from-gray-500 to-slate-500"}`} />

          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-zinc-700">
                {data.profilePicture ? (
                  <img src={data.profilePicture} alt={data.displayName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-zinc-500" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-white">{data.displayName}</h1>
                  {data.isVerified ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full">
                      <ShieldCheck className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-medium text-green-400">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-500/20 rounded-full">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-400">Unverified</span>
                    </div>
                  )}
                </div>
                
                {data.bio && (
                  <p className="text-zinc-400 mb-2">{data.bio}</p>
                )}
                
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {new Date(data.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.settings.showTotalTrades && data.stats.totalTrades !== undefined && (
                <div className="p-4 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-xs">Total Trades</span>
                  </div>
                  <p className="text-xl font-bold text-white">{data.stats.totalTrades}</p>
                </div>
              )}

              {data.settings.showWinRate && data.stats.winRate !== undefined && (
                <div className="p-4 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Target className="w-4 h-4" />
                    <span className="text-xs">Win Rate</span>
                  </div>
                  <p className={`text-xl font-bold ${data.stats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {data.stats.winRate.toFixed(1)}%
                  </p>
                </div>
              )}

              {data.settings.showProfitFactor && data.stats.profitFactor !== undefined && (
                <div className="p-4 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Trophy className="w-4 h-4" />
                    <span className="text-xs">Profit Factor</span>
                  </div>
                  <p className={`text-xl font-bold ${data.stats.profitFactor >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                    {data.stats.profitFactor.toFixed(2)}
                  </p>
                </div>
              )}

              {data.settings.showTotalPnL && (
                <div className="p-4 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    {isProfitable ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="text-xs">Total P&L</span>
                  </div>
                  <p className={`text-xl font-bold ${data.stats.totalPnLHidden ? 'text-zinc-500' : isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                    {data.stats.totalPnLHidden ? "Hidden" : formatCurrency(data.stats.totalPnL)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {data.settings.showMonthlyPnL && data.monthlyPnL && data.monthlyPnL.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-zinc-400" />
              <h2 className="text-lg font-semibold text-white">Monthly Performance</h2>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyPnL}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={formatMonth}
                    tick={{ fill: '#888', fontSize: 12 }}
                    axisLine={{ stroke: '#444' }}
                  />
                  <YAxis 
                    tick={{ fill: '#888', fontSize: 12 }}
                    axisLine={{ stroke: '#444' }}
                    tickFormatter={(value) => data.settings.hideDollarAmounts ? (value > 0 ? '+' : value < 0 ? '-' : '0') : `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                    labelFormatter={formatMonth}
                    formatter={(value: number) => [
                      data.settings.hideDollarAmounts ? (value > 0 ? 'Profit' : value < 0 ? 'Loss' : 'Break Even') : formatCurrency(value),
                      'P&L'
                    ]}
                  />
                  <Bar 
                    dataKey="pnl" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {data.settings.showEquityCurve && data.equityCurve && data.equityCurve.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-zinc-400" />
              <h2 className="text-lg font-semibold text-white">Equity Curve</h2>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.equityCurve}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="tradeNumber"
                    tick={{ fill: '#888', fontSize: 12 }}
                    axisLine={{ stroke: '#444' }}
                    label={{ value: 'Trade #', position: 'insideBottom', offset: -5, fill: '#888' }}
                  />
                  <YAxis 
                    tick={{ fill: '#888', fontSize: 12 }}
                    axisLine={{ stroke: '#444' }}
                    tickFormatter={(value) => data.settings.hideDollarAmounts ? `${value}%` : `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [
                      data.settings.hideDollarAmounts ? `${value}%` : formatCurrency(value),
                      'Equity'
                    ]}
                    labelFormatter={(label) => `Trade #${label}`}
                  />
                  <Area 
                    type="monotone"
                    dataKey="equity"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#equityGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-center gap-2 mt-8 text-zinc-500">
          <Shield className="w-4 h-4" />
          <span className="text-sm">
            {data.isVerified 
              ? "This trader has broker-synced accounts with verified P&L" 
              : "This trader uses manually entered trades"}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {showCertificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowCertificate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-[650px] max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowCertificate(false)}
                className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <VerifiedCertificate
                displayName={data.displayName}
                username={username}
                profilePicture={data.profilePicture}
                isVerified={data.isVerified}
                stats={data.stats}
                settings={data.settings}
                memberSince={data.memberSince}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
