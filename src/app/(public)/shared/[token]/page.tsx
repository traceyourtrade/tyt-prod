"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Target,
  DollarSign,
  BarChart3,
  MessageCircle,
  Send,
  Eye,
  User,
  ArrowLeft,
  Shield,
  AlertCircle,
  Image as ImageIcon
} from "lucide-react";
import Link from "next/link";

interface TradeComment {
  commentId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface SharedTradeData {
  trade: any;
  owner: {
    displayName: string;
    profilePicture: string | null;
  };
  comments: TradeComment[];
  viewCount: number;
  hideAccountSize: boolean;
  hideDollarAmounts: boolean;
}

export default function SharedTradePage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<SharedTradeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchSharedTrade();
  }, [token]);

  const fetchSharedTrade = async () => {
    try {
      const response = await fetch(`/api/shared-trade/get?apiName=getSharedTrade&token=${token}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch trade");
      }

      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) return;

    setSubmittingComment(true);

    try {
      const response = await fetch("/api/shared-trade/post?apiName=addComment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareToken: token,
          authorName: commentName,
          content: commentText
        })
      });

      if (response.ok) {
        setCommentText("");
        fetchSharedTrade();
      }
    } catch (err) {
      console.error("Failed to submit comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "Hidden";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading trade...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Trade Not Found</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
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

  const { trade, owner, comments, viewCount, hideDollarAmounts } = data;
  const isProfitable = (trade.pnl || 0) > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-500/10 to-transparent" />

      <div className="relative max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Trading Journal</span>
          </Link>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span className="text-sm">{viewCount} views</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl overflow-hidden shadow-xl mb-6"
        >
          <div className={`h-2 ${isProfitable ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gradient-to-r from-red-500 to-rose-500"}`} />

          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  isProfitable ? "bg-green-500/20" : "bg-red-500/20"
                }`}>
                  {isProfitable ? (
                    <TrendingUp className="w-7 h-7 text-green-400" />
                  ) : (
                    <TrendingDown className="w-7 h-7 text-red-400" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{trade.symbol || "Unknown"}</h1>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      trade.direction === "Long" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {trade.direction || "N/A"}
                    </span>
                    <span className="text-sm">{trade.strategy || "No strategy"}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className={`text-3xl font-bold ${isProfitable ? "text-green-400" : "text-red-400"}`}>
                  {hideDollarAmounts ? "Hidden" : formatCurrency(trade.pnl)}
                </div>
                <p className="text-sm text-muted-foreground">P&L</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">Date</span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {trade.closeDate ? formatDate(trade.closeDate) : trade.date ? formatDate(trade.date) : "N/A"}
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-xs">Entry</span>
                </div>
                <p className="text-sm font-medium text-foreground">{trade.entryPrice || "N/A"}</p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-xs">Exit</span>
                </div>
                <p className="text-sm font-medium text-foreground">{trade.exitPrice || "N/A"}</p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-xs">Size</span>
                </div>
                <p className="text-sm font-medium text-foreground">{trade.lotSize || trade.quantity || "N/A"}</p>
              </div>
            </div>

            {trade.notes && (
              <div className="p-4 bg-muted/20 rounded-lg border border-border mb-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                <p className="text-foreground">{trade.notes}</p>
              </div>
            )}

            {(trade.screenshots?.length > 0 || trade.entryImage || trade.exitImage) && (
              <div className="mb-6">
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Screenshots
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {trade.entryImage && (
                    <img 
                      src={trade.entryImage} 
                      alt="Entry screenshot" 
                      className="rounded-lg border border-border w-full"
                    />
                  )}
                  {trade.exitImage && (
                    <img 
                      src={trade.exitImage} 
                      alt="Exit screenshot" 
                      className="rounded-lg border border-border w-full"
                    />
                  )}
                  {trade.screenshots?.map((url: string, idx: number) => (
                    <img 
                      key={idx}
                      src={url} 
                      alt={`Screenshot ${idx + 1}`} 
                      className="rounded-lg border border-border w-full"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {owner.profilePicture ? (
                  <img src={owner.profilePicture} alt={owner.displayName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{owner.displayName}</p>
                <p className="text-xs text-muted-foreground">Shared this trade</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Feedback</h2>
            <span className="text-sm text-muted-foreground">({comments.length})</span>
          </div>

          <form onSubmit={handleSubmitComment} className="mb-6">
            <div className="flex gap-3 mb-3">
              <input
                type="text"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                placeholder="Your name"
                className="flex-1 px-4 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Leave feedback on this trade..."
                className="flex-1 px-4 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
              <button
                type="submit"
                disabled={submittingComment || !commentName.trim() || !commentText.trim()}
                className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No feedback yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.commentId} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{comment.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-foreground ml-10">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <div className="flex items-center justify-center gap-2 mt-8 text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span className="text-sm">Shared via Trading Journal</span>
        </div>
      </div>
    </div>
  );
}
