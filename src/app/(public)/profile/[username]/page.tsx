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
  AlertCircle,
  Calendar,
  Trophy,
  Activity,
  Award,
  X,
  Copy,
  Check,
  Users
} from "lucide-react";
import Image from "next/image";
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

interface RecentTrade {
  date: string;
  symbol: string;
  pnl: number | null;
  type: string;
}

interface PublicProfileData {
  displayName: string;
  profilePicture: string | null;
  bio: string | null;
  isVerified: boolean;
  memberSince: string;
  isOwner: boolean;
  referralCode: string | null;
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
  recentTrades?: RecentTrade[];
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
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
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isProfitable = (data.stats.totalPnL || 0) > 0;
  const referralLink = data.referralCode ? `https://projournx.com/signup?ref=${data.referralCode}` : null;

  return (
    <div className="min-h-screen bg-[#050505]">
      <header className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-xl border-b border-[#2a2a2a]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image 
              src="/images/projournx-full-logo.png" 
              alt="ProJournX" 
              width={140} 
              height={32}
              className="h-8 w-auto"
            />
          </Link>
          
          <div className="flex items-center gap-3">
            {data.isVerified && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Verified Trader</span>
              </div>
            )}
            
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
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-2xl mb-8"
        >
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
              <div className={`relative p-1 rounded-full bg-gradient-to-br ${data.isVerified ? 'from-blue-500 via-blue-400 to-cyan-400' : 'from-zinc-600 to-zinc-700'}`}>
                <div className="w-28 h-28 rounded-full bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
                  {data.profilePicture ? (
                    <img src={data.profilePicture} alt={data.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-14 h-14 text-zinc-500" />
                  )}
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-3">
                  <h1 className="text-3xl font-bold text-white">{data.displayName}</h1>
                  {data.isVerified ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 rounded-full">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-400">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-700/50 rounded-full">
                      <Shield className="w-4 h-4 text-zinc-400" />
                      <span className="text-xs font-semibold text-zinc-400">Unverified</span>
                    </div>
                  )}
                </div>
                
                {data.bio && (
                  <p className="text-zinc-400 mb-3 max-w-xl">{data.bio}</p>
                )}
                
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-zinc-500">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {new Date(data.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {data.isVerified && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 rounded-xl p-4 mb-6"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-400 mb-1">Verified by ProJournX</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      This trader&apos;s performance is verified through real auto-sync broker accounts connected directly to ProJournX. All P&L data is automatically pulled from their trading platform.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {data.settings.showTotalPnL && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl px-4 py-3 min-h-[100px]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-xs font-medium text-zinc-500">Net P&L</span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className={`text-lg font-bold ${data.stats.totalPnLHidden ? 'text-zinc-500' : isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                        {data.stats.totalPnLHidden ? "Hidden" : formatCurrency(data.stats.totalPnL)}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {isProfitable ? 'Profitable' : 'In drawdown'}
                      </p>
                    </div>
                    {data.equityCurve && data.equityCurve.length > 1 && (
                      <div className="w-16 h-8">
                        <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="pnlGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor={isProfitable ? "#22c55e" : "#ef4444"} stopOpacity="0.2" />
                              <stop offset="100%" stopColor={isProfitable ? "#22c55e" : "#ef4444"} stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {(() => {
                            const values = data.equityCurve!.map(d => d.equity);
                            const min = Math.min(...values);
                            const max = Math.max(...values);
                            const range = max - min || 1;
                            const points = data.equityCurve!.map((d, i) => {
                              const x = 2 + (i / (data.equityCurve!.length - 1)) * 96;
                              const y = 38 - ((d.equity - min) / range) * 36;
                              return `${x},${y}`;
                            }).join(' ');
                            const areaPoints = `2,38 ${points} 98,38`;
                            return (
                              <>
                                <polygon points={areaPoints} fill="url(#pnlGradient)" />
                                <polyline points={points} fill="none" stroke={isProfitable ? "#22c55e" : "#ef4444"} strokeWidth="1.5" strokeLinecap="round" />
                              </>
                            );
                          })()}
                        </svg>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {data.settings.showWinRate && data.stats.winRate !== undefined && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl px-4 py-3 min-h-[100px]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10">
                      <Target className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-xs font-medium text-zinc-500">Win Rate</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-bold text-white">{data.stats.winRate.toFixed(1)}%</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{data.stats.totalTrades || 0} trades</p>
                    </div>
                    <div className="relative w-[70px] h-[40px]">
                      <svg viewBox="0 0 100 50" className="w-full h-full">
                        <path d="M10,45 A35,35 0 0,1 90,45" fill="none" stroke="#27272a" strokeWidth="8" strokeLinecap="round" />
                        <path 
                          d="M10,45 A35,35 0 0,1 90,45" 
                          fill="none" 
                          stroke="#22c55e" 
                          strokeWidth="8" 
                          strokeLinecap="round"
                          strokeDasharray={`${(data.stats.winRate / 100) * 110} 110`}
                        />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              )}

              {data.settings.showProfitFactor && data.stats.profitFactor !== undefined && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl px-4 py-3 min-h-[100px]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/10">
                        <Activity className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="text-xs font-medium text-zinc-500">Profit Factor</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                      data.stats.profitFactor >= 1.5 ? 'bg-emerald-500/20 text-emerald-400' : 
                      data.stats.profitFactor >= 1 ? 'bg-amber-500/20 text-amber-400' : 
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {data.stats.profitFactor >= 1.5 ? 'Good' : data.stats.profitFactor >= 1 ? 'Even' : 'Needs work'}
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <p className={`text-lg font-bold ${data.stats.profitFactor >= 1 ? 'text-white' : 'text-red-400'}`}>
                      {data.stats.profitFactor.toFixed(2)}
                    </p>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          data.stats.profitFactor >= 1.5 ? 'bg-emerald-500' : 
                          data.stats.profitFactor >= 1 ? 'bg-amber-500' : 
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(data.stats.profitFactor / 2 * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {data.settings.showTotalTrades && data.stats.totalTrades !== undefined && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl px-4 py-3 min-h-[100px]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-violet-500/10">
                        <BarChart3 className="w-4 h-4 text-violet-400" />
                      </div>
                      <span className="text-xs font-medium text-zinc-500">Total Trades</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{data.stats.totalTrades}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">All time</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {data.referralCode && referralLink && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Join {data.displayName}&apos;s Trading Community</h2>
            </div>
            
            <p className="text-zinc-400 text-sm mb-6">
              Sign up using this trader&apos;s referral code to get started
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 mb-2 block">Referral Code</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3">
                    <code className="text-blue-400 font-mono text-sm">{data.referralCode}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(data.referralCode!, 'code')}
                    className="flex items-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors"
                  >
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="text-sm">{copiedCode ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-2 block">Referral Link</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 overflow-hidden">
                    <code className="text-zinc-300 font-mono text-sm truncate block">{referralLink}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(referralLink, 'link')}
                    className="flex items-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="text-sm">{copiedLink ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {data.settings.showMonthlyPnL && data.monthlyPnL && data.monthlyPnL.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Monthly Performance</h2>
            </div>
            
            <div className="h-72 bg-[#1a1a1a] rounded-xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyPnL}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={formatMonth}
                    tick={{ fill: '#71717a', fontSize: 12 }}
                    axisLine={{ stroke: '#2a2a2a' }}
                  />
                  <YAxis 
                    tick={{ fill: '#71717a', fontSize: 12 }}
                    axisLine={{ stroke: '#2a2a2a' }}
                    tickFormatter={(value) => data.settings.hideDollarAmounts ? (value > 0 ? '+' : value < 0 ? '-' : '0') : `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px'
                    }}
                    cursor={{ fill: 'transparent' }}
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
            transition={{ delay: 0.4 }}
            className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Equity Curve</h2>
            </div>
            
            <div className="h-72 bg-[#1a1a1a] rounded-xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.equityCurve}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis 
                    dataKey="tradeNumber"
                    tick={{ fill: '#71717a', fontSize: 12 }}
                    axisLine={{ stroke: '#2a2a2a' }}
                    label={{ value: 'Trade #', position: 'insideBottom', offset: -5, fill: '#71717a' }}
                  />
                  <YAxis 
                    tick={{ fill: '#71717a', fontSize: 12 }}
                    axisLine={{ stroke: '#2a2a2a' }}
                    tickFormatter={(value) => data.settings.hideDollarAmounts ? `${value}%` : `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
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

        {data.recentTrades && data.recentTrades.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Recent Trades</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left text-xs text-zinc-500 font-medium pb-3 uppercase tracking-wider">Date</th>
                    <th className="text-left text-xs text-zinc-500 font-medium pb-3 uppercase tracking-wider">Symbol</th>
                    <th className="text-right text-xs text-zinc-500 font-medium pb-3 uppercase tracking-wider">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTrades.map((trade, index) => {
                    const tradeDate = new Date(trade.date);
                    const formattedDate = tradeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const pnlValue = trade.pnl ?? 0;
                    const isProfitable = pnlValue >= 0;
                    
                    return (
                      <tr key={index} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#1a1a1a]/50 transition-colors">
                        <td className="py-3 text-sm text-zinc-400">{formattedDate}</td>
                        <td className="py-3 text-sm font-medium text-white">{trade.symbol}</td>
                        <td className={`py-3 text-sm font-semibold text-right ${data.settings.hideDollarAmounts ? 'text-zinc-500' : isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                          {data.settings.hideDollarAmounts ? (
                            <span className="flex items-center justify-end gap-1">
                              {isProfitable ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                              {isProfitable ? 'Profit' : 'Loss'}
                            </span>
                          ) : (
                            <span className="flex items-center justify-end gap-1">
                              {isProfitable ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                              {isProfitable ? '+' : ''}{formatCurrency(pnlValue)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        <footer className="border-t border-[#2a2a2a] pt-8 pb-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <Image 
                src="/images/projournx-full-logo.png" 
                alt="ProJournX" 
                width={100} 
                height={24}
                className="h-6 w-auto opacity-60"
              />
            </div>
            <div className="flex items-center gap-2 text-zinc-500">
              <Shield className="w-4 h-4" />
              <span className="text-sm">
                {data.isVerified 
                  ? "This trader has broker-synced accounts with verified P&L data" 
                  : "This trader uses manually entered trades - performance is not verified"}
              </span>
            </div>
            <p className="text-xs text-zinc-600">
              © {new Date().getFullYear()} ProJournX. All rights reserved.
            </p>
          </div>
        </footer>
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
