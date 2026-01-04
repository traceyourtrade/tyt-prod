"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Users,
  Link2,
  Copy,
  Check,
  Gift,
  TrendingUp,
  Calendar,
  Loader2,
} from "lucide-react";

interface ReferralData {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
}

interface ReferralStats {
  total: number;
  thisMonth: number;
}

export default function ReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string>("");
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [stats, setStats] = useState<ReferralStats>({ total: 0, thisMonth: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const res = await axios.get("/api/referrals", { withCredentials: true });
      setReferralCode(res.data.referralCode);
      setReferralLink(res.data.referralLink || "");
      setReferrals(res.data.referrals || []);
      setStats(res.data.stats || { total: 0, thisMonth: 0 });
    } catch (error) {
      console.error("Failed to fetch referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Refer Friends</h1>
            <p className="text-muted-foreground text-sm">Share your link and help fellow traders</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Total Referrals</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">This Month</p>
                <p className="text-2xl font-bold text-white">{stats.thisMonth}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-emerald-400" />
            Your Referral Link
          </h2>
          
          {referralCode ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 font-mono overflow-hidden text-ellipsis">
                  {referralLink}
                </div>
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-zinc-500">
                Your code: <span className="font-mono text-emerald-400">{referralCode}</span>
              </p>
            </div>
          ) : (
            <p className="text-zinc-400 text-sm">Referral code not available. Please contact support.</p>
          )}
        </div>

        <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Friends Who Joined
          </h2>
          
          {referrals.length > 0 ? (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400 font-semibold">
                      {referral.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{referral.name}</p>
                      <p className="text-xs text-zinc-500">{referral.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(referral.joinedAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 text-sm">No referrals yet</p>
              <p className="text-zinc-500 text-xs mt-1">Share your link to get started!</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
