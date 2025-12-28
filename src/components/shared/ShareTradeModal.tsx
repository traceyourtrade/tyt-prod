"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Globe, 
  Lock, 
  Eye, 
  EyeOff,
  Link2,
  Clock,
  Users
} from "lucide-react";

interface ShareTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId: string;
  accountId: string;
  tradeSummary?: {
    symbol?: string;
    pnl?: number;
    date?: string;
  };
}

export default function ShareTradeModal({
  isOpen,
  onClose,
  tradeId,
  accountId,
  tradeSummary
}: ShareTradeModalProps) {
  const [isPublic, setIsPublic] = useState(true);
  const [hideAccountSize, setHideAccountSize] = useState(false);
  const [hideDollarAmounts, setHideDollarAmounts] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [allowedEmails, setAllowedEmails] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateLink = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/shared-trade/post?apiName=createShareLink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tradeId,
          accountId,
          isPublic,
          allowedEmails: allowedEmails.split(",").map(e => e.trim()).filter(e => e),
          hideAccountSize,
          hideDollarAmounts,
          expiresInDays
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create share link");
      }

      const fullUrl = `${window.location.origin}${data.shareUrl}`;
      setShareUrl(fullUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleClose = () => {
    setShareUrl(null);
    setError(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Share Trade</h2>
                  {tradeSummary && (
                    <p className="text-sm text-muted-foreground">
                      {tradeSummary.symbol} • {tradeSummary.date}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {!shareUrl ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPublic(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all ${
                      isPublic
                        ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                        : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span className="text-sm font-medium">Public</span>
                  </button>
                  <button
                    onClick={() => setIsPublic(false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all ${
                      !isPublic
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                        : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span className="text-sm font-medium">Private</span>
                  </button>
                </div>

                {!isPublic && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      <Users className="w-4 h-4 inline mr-2" />
                      Allowed Emails (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={allowedEmails}
                      onChange={(e) => setAllowedEmails(e.target.value)}
                      placeholder="email1@example.com, email2@example.com"
                      className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Privacy Options</p>
                  
                  <label className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {hideDollarAmounts ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                      <span className="text-sm text-foreground">Hide dollar amounts</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={hideDollarAmounts}
                      onChange={(e) => setHideDollarAmounts(e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {hideAccountSize ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                      <span className="text-sm text-foreground">Hide account size</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={hideAccountSize}
                      onChange={(e) => setHideAccountSize(e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Link Expiration
                  </label>
                  <select
                    value={expiresInDays || ""}
                    onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">Never expires</option>
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleGenerateLink}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      Generate Share Link
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <p className="text-sm font-medium text-green-400">Share link created!</p>
                  </div>
                  <p className="text-xs text-green-300/80">
                    Anyone with this link can view your trade{!isPublic && " (restricted to allowed emails)"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground text-sm font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      copied
                        ? "bg-green-500/20 text-green-400 border border-green-500/50"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
