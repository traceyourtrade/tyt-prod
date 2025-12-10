"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Medal,
  TrendingUp,
  Target,
  BarChart3,
  Percent,
  ChevronUp,
  ChevronDown,
  Minus,
  Crown,
  Star,
  User,
  Settings,
  Eye,
  EyeOff,
  Check
} from "lucide-react";

type LeaderboardCategory = "consistency" | "rMultiple" | "winRate" | "profitFactor";
type LeaderboardPeriod = "weekly" | "monthly" | "allTime";

interface LeaderboardEntry {
  _id: string;
  uniqueId: string;
  displayName: string;
  avatarUrl: string | null;
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  score: number;
  rank: number;
  tradeCount: number;
  previousRank: number | null;
}

interface UserRankings {
  [category: string]: {
    [period: string]: {
      rank: number;
      score: number;
      previousRank: number | null;
      tradeCount: number;
    } | null;
  };
}

const categories = [
  { id: "consistency" as const, label: "Consistency", icon: Target, description: "Based on daily P&L variance" },
  { id: "rMultiple" as const, label: "R-Multiple", icon: TrendingUp, description: "Average risk-reward ratio" },
  { id: "winRate" as const, label: "Win Rate", icon: Percent, description: "Percentage of winning trades" },
  { id: "profitFactor" as const, label: "Profit Factor", icon: BarChart3, description: "Gross profit / gross loss" },
];

const periods = [
  { id: "weekly" as const, label: "This Week" },
  { id: "monthly" as const, label: "This Month" },
  { id: "allTime" as const, label: "All Time" },
];

export default function LeaderboardPage() {
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>("consistency");
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>("weekly");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRankings, setUserRankings] = useState<UserRankings | null>(null);
  const [optedIn, setOptedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [useAnonymous, setUseAnonymous] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
    fetchUserRank();
  }, [activeCategory, activePeriod]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(
        `/api/leaderboard/get?apiName=getLeaderboard&category=${activeCategory}&period=${activePeriod}`
      );
      const data = await response.json();
      if (response.ok) {
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRank = async () => {
    try {
      const response = await fetch("/api/leaderboard/get?apiName=getUserRank", {
        credentials: "include"
      });
      
      if (response.status === 401) {
        return;
      }
      
      const data = await response.json();
      if (response.ok) {
        setOptedIn(data.optedIn);
        if (data.rankings) {
          setUserRankings(data.rankings);
        }
        if (data.settings) {
          setDisplayName(data.settings.displayName || "");
          setUseAnonymous(data.settings.useAnonymousName || false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch user rank:", error);
    }
  };

  const handleOptIn = async () => {
    setSavingSettings(true);
    try {
      const response = await fetch("/api/leaderboard/post?apiName=updateLeaderboardSettings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          optedIn: true,
          displayName,
          useAnonymousName: useAnonymous
        })
      });

      if (response.ok) {
        setOptedIn(true);
        setShowSettings(false);
        fetchLeaderboard();
        fetchUserRank();
      }
    } catch (error) {
      console.error("Failed to opt in:", error);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleOptOut = async () => {
    setSavingSettings(true);
    try {
      const response = await fetch("/api/leaderboard/post?apiName=updateLeaderboardSettings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ optedIn: false })
      });

      if (response.ok) {
        setOptedIn(false);
        fetchLeaderboard();
      }
    } catch (error) {
      console.error("Failed to opt out:", error);
    } finally {
      setSavingSettings(false);
    }
  };

  const getRankChange = (current: number, previous: number | null) => {
    if (previous === null) return { icon: Star, color: "text-yellow-400", text: "New" };
    const diff = previous - current;
    if (diff > 0) return { icon: ChevronUp, color: "text-green-400", text: `+${diff}` };
    if (diff < 0) return { icon: ChevronDown, color: "text-red-400", text: `${diff}` };
    return { icon: Minus, color: "text-muted-foreground", text: "-" };
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Crown, color: "text-yellow-400", bg: "bg-yellow-500/20" };
    if (rank === 2) return { icon: Medal, color: "text-gray-300", bg: "bg-gray-500/20" };
    if (rank === 3) return { icon: Medal, color: "text-amber-600", bg: "bg-amber-600/20" };
    return null;
  };

  const formatScore = (score: number, category: LeaderboardCategory) => {
    if (category === "winRate" || category === "consistency") {
      return `${score.toFixed(1)}%`;
    }
    return score.toFixed(2);
  };

  const currentUserRank = userRankings?.[activeCategory]?.[activePeriod];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-orange-500/20 border border-amber-500/30 rounded-2xl p-8 mb-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-full blur-3xl" />
          
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
                  <p className="text-muted-foreground">Compete with traders worldwide</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {optedIn && currentUserRank && (
            <div className="mt-6 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <p className="text-sm text-muted-foreground mb-2">Your Rank</p>
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold text-amber-400">#{currentUserRank.rank}</span>
                <div className="text-sm">
                  <p className="text-foreground">Score: {formatScore(currentUserRank.score, activeCategory)}</p>
                  <p className="text-muted-foreground">{currentUserRank.tradeCount} trades</p>
                </div>
              </div>
            </div>
          )}

          {!optedIn && (
            <div className="mt-6 p-4 bg-amber-500/10 backdrop-blur-sm rounded-xl border border-amber-500/30">
              <p className="text-amber-200 mb-3">Join the leaderboard to compete with other traders!</p>
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium rounded-lg transition-all"
              >
                Join Leaderboard
              </button>
            </div>
          )}
        </motion.div>

        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => setActivePeriod(period.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activePeriod === period.id
                  ? "bg-foreground text-background"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl overflow-hidden"
        >
          <div className="p-4 border-b border-border">
            <div className="grid grid-cols-12 text-sm text-muted-foreground font-medium">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-5">Trader</div>
              <div className="col-span-2 text-center">Score</div>
              <div className="col-span-2 text-center">Trades</div>
              <div className="col-span-2 text-center">Change</div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading rankings...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No rankings yet</p>
              <p className="text-muted-foreground">Be the first to join the leaderboard!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {entries.map((entry, index) => {
                const rankBadge = getRankBadge(entry.rank);
                const rankChange = getRankChange(entry.rank, entry.previousRank);
                const RankChangeIcon = rankChange.icon;

                return (
                  <motion.div
                    key={entry._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`grid grid-cols-12 items-center p-4 hover:bg-muted/30 transition-colors ${
                      index < 3 ? "bg-gradient-to-r from-amber-500/5 to-transparent" : ""
                    }`}
                  >
                    <div className="col-span-1 flex justify-center">
                      {rankBadge ? (
                        <div className={`w-10 h-10 rounded-full ${rankBadge.bg} flex items-center justify-center`}>
                          <rankBadge.icon className={`w-5 h-5 ${rankBadge.color}`} />
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">{entry.rank}</span>
                      )}
                    </div>

                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {entry.avatarUrl ? (
                          <img src={entry.avatarUrl} alt={entry.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-medium text-foreground">{entry.displayName}</span>
                    </div>

                    <div className="col-span-2 text-center">
                      <span className="text-lg font-bold text-amber-400">
                        {formatScore(entry.score, activeCategory)}
                      </span>
                    </div>

                    <div className="col-span-2 text-center">
                      <span className="text-muted-foreground">{entry.tradeCount}</span>
                    </div>

                    <div className="col-span-2 flex justify-center items-center gap-1">
                      <RankChangeIcon className={`w-4 h-4 ${rankChange.color}`} />
                      <span className={`text-sm ${rankChange.color}`}>{rankChange.text}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowSettings(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10 w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="h-1 bg-gradient-to-r from-amber-500 to-yellow-500" />
              
              <div className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Leaderboard Settings</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                      className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>

                  <label className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {useAnonymous ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                      <div>
                        <span className="text-sm text-foreground">Use anonymous name</span>
                        <p className="text-xs text-muted-foreground">Show as "TraderXXXX" instead</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={useAnonymous}
                      onChange={(e) => setUseAnonymous(e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                    />
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  {optedIn ? (
                    <>
                      <button
                        onClick={handleOptOut}
                        disabled={savingSettings}
                        className="flex-1 py-2.5 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        Leave Leaderboard
                      </button>
                      <button
                        onClick={handleOptIn}
                        disabled={savingSettings}
                        className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {savingSettings ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleOptIn}
                      disabled={savingSettings}
                      className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {savingSettings ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Trophy className="w-4 h-4" />
                          Join Leaderboard
                        </>
                      )}
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full mt-3 py-2.5 px-4 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
