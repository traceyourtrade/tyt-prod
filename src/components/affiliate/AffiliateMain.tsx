"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Users,
  Link2,
  Copy,
  Check,
  Gift,
  ArrowRight,
  Sparkles,
  MousePointerClick,
  UserPlus,
  CreditCard,
  Ticket,
  UserCheck,
  UserX,
} from "lucide-react";

interface AffiliateData {
  uniqueId: string;
  referralCode: string;
  status: string;
  tier: string;
  commissionRate: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  totalReferrals: number;
  activeReferrals: number;
  createdAt: string;
}

interface ReferralData {
  uniqueId: string;
  referredUserId: string;
  status: string;
  createdAt: string;
}

interface CommissionData {
  uniqueId: string;
  amount: number;
  status: string;
  transactionType: string;
  createdAt: string;
}

interface CouponData {
  uniqueId: string;
  code: string;
  discountPercent: number;
  usageCount: number;
  status: string;
}

interface StatsData {
  totalClicks: number;
  totalSignups: number;
  totalConversions: number;
  pendingCommissions: number;
  paidCommissions: number;
}

export default function AffiliateMain() {
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  useEffect(() => {
    fetchAffiliateData();
  }, []);

  const fetchAffiliateData = async () => {
    try {
      const res = await axios.get("/api/affiliate", { withCredentials: true });
      if (res.data.isAffiliate) {
        setIsAffiliate(true);
        setAffiliate(res.data.affiliate);
        setReferrals(res.data.referrals || []);
        setCommissions(res.data.commissions || []);
        setCoupons(res.data.coupons || []);
        setStats(res.data.stats || null);
      }
    } catch (error) {
      console.error("Failed to fetch affiliate data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinProgram = async () => {
    setJoining(true);
    try {
      const res = await axios.post("/api/affiliate", {}, { withCredentials: true });
      if (res.data.success) {
        await fetchAffiliateData();
      }
    } catch (error: any) {
      console.error("Failed to join:", error);
    } finally {
      setJoining(false);
    }
  };

  const copyReferralLink = () => {
    if (affiliate) {
      const link = `${window.location.origin}/signup?ref=${affiliate.referralCode}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#4EBF94] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAffiliate) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1222] to-[#0f1729] border border-[#4EBF94]/20 p-8 md:p-12"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#4EBF94]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[100px]" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4EBF94] to-emerald-600 flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Affiliate Program</h1>
                <p className="text-muted-foreground">Earn money by referring traders</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
                  <Link2 className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">Share Your Link</h3>
                <p className="text-sm text-muted-foreground">Get a unique referral link to share with traders</p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">Refer Traders</h3>
                <p className="text-sm text-muted-foreground">When they sign up using your link, they become your referral</p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-[#4EBF94]/20 flex items-center justify-center mb-3">
                  <CreditCard className="w-5 h-5 text-[#4EBF94]" />
                </div>
                <h3 className="font-semibold text-white mb-1">Track Conversions</h3>
                <p className="text-sm text-muted-foreground">See who subscribed from your referral links</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#4EBF94]/10 to-emerald-500/5 rounded-xl p-6 border border-[#4EBF94]/20 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#4EBF94]" />
                <h3 className="font-semibold text-white">Program Benefits</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4EBF94]" />
                  Unique referral link to share with traders
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4EBF94]" />
                  Personal coupon codes for your audience
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4EBF94]" />
                  Real-time tracking dashboard
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4EBF94]" />
                  Track sign-ups and subscription conversions
                </li>
              </ul>
            </div>

            <motion.button
              onClick={handleJoinProgram}
              disabled={joining}
              className="w-full md:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-[#4EBF94] to-emerald-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#4EBF94]/20 transition-all disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {joining ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Join Affiliate Program
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Affiliate Dashboard</h1>
          <p className="text-muted-foreground">Track your referrals</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#4EBF94]/10 to-emerald-500/5 rounded-xl p-4 border border-[#4EBF94]/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Your Referral Link</p>
            <p className="text-sm font-mono text-foreground break-all">
              {typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${affiliate?.referralCode}` : ''}
            </p>
          </div>
          <motion.button
            onClick={copyReferralLink}
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-[#4EBF94] text-white font-medium flex items-center gap-2 text-sm"
            whileTap={{ scale: 0.95 }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Link"}
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-muted-foreground">Total Sign Ups</span>
          </div>
          <p className="text-2xl font-bold">{stats?.totalSignups || 0}</p>
        </div>
        
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-4 h-4 text-[#4EBF94]" />
            <span className="text-sm text-muted-foreground">Subscribed</span>
          </div>
          <p className="text-2xl font-bold text-[#4EBF94]">{stats?.totalConversions || 0}</p>
        </div>
        
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <UserX className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-muted-foreground">Not Subscribed</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{(stats?.totalSignups || 0) - (stats?.totalConversions || 0)}</p>
        </div>
        
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <MousePointerClick className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-muted-foreground">Clicks</span>
          </div>
          <p className="text-2xl font-bold">{stats?.totalClicks || 0}</p>
        </div>
      </div>

      {coupons.length > 0 && (
        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Ticket className="w-5 h-5 text-violet-400" />
            <h2 className="font-semibold">Your Coupon Codes</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {coupons.map((coupon) => (
              <div key={coupon.uniqueId} className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-[#4EBF94]">{coupon.code}</span>
                  <motion.button
                    onClick={() => copyCouponCode(coupon.code)}
                    className="p-1.5 rounded-md hover:bg-foreground/10 transition-colors"
                    whileTap={{ scale: 0.9 }}
                  >
                    {copiedCoupon === coupon.code ? (
                      <Check className="w-4 h-4 text-[#4EBF94]" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </motion.button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{coupon.discountPercent}% off</span>
                  <span className="text-muted-foreground">{coupon.usageCount} uses</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {referrals.length > 0 && (
        <div className="bg-card rounded-xl p-5 border border-border">
          <h2 className="font-semibold mb-4">Recent Referrals</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">User ID</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {referrals.slice(0, 10).map((ref) => (
                  <tr key={ref.uniqueId} className="border-b border-border/50 last:border-0">
                    <td className="py-3 font-mono text-xs">{ref.referredUserId?.slice(0, 8) || '---'}...</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ref.status === 'converted' ? 'bg-[#4EBF94]/20 text-[#4EBF94]' :
                        ref.status === 'signed_up' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {ref.status}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
