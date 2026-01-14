"use client";

import React, { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Shield, TrendingUp, Target, Trophy, BarChart3, Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";

interface CertificateProps {
  displayName: string;
  username: string;
  profilePicture?: string | null;
  isVerified: boolean;
  stats: {
    totalTrades?: number;
    winRate?: number;
    profitFactor?: number;
    totalPnL?: number | null;
    totalPnLHidden?: boolean;
  };
  settings: {
    showWinRate?: boolean;
    showProfitFactor?: boolean;
    showTotalTrades?: boolean;
    showTotalPnL?: boolean;
    hideDollarAmounts?: boolean;
  };
  memberSince?: string;
}

export default function VerifiedCertificate({
  displayName,
  username,
  profilePicture,
  isVerified,
  stats,
  settings,
  memberSince
}: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const profileUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/profile/${username}`
    : `/profile/${username}`;

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "Hidden";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    
    setDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        backgroundColor: "#0f0f0f",
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        foreignObjectRendering: false,
        removeContainer: true
      });
      
      const link = document.createElement("a");
      link.download = `${displayName.replace(/\s+/g, "_")}_ProJournX_Certificate.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error generating certificate:", error);
      alert("Failed to generate certificate. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const isProfitable = (stats.totalPnL || 0) > 0;
  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric' 
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={certificateRef}
        className="w-[600px] bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] rounded-2xl overflow-hidden shadow-2xl border border-zinc-700/50"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        <div className={`h-2 w-full ${isVerified 
          ? "bg-gradient-to-r from-green-500 via-emerald-400 to-green-500" 
          : "bg-gradient-to-r from-gray-500 via-slate-400 to-gray-500"}`} 
        />

        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">ProJournX</h3>
                <p className="text-zinc-500 text-xs">Trading Journal Platform</p>
              </div>
            </div>
            
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              isVerified 
                ? "bg-green-500/20 border border-green-500/30" 
                : "bg-gray-500/20 border border-gray-500/30"
            }`}>
              {isVerified ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">VERIFIED TRADER</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-400">TRADER</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5 mb-8">
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-zinc-600 shadow-lg">
              <span className="text-3xl font-bold text-zinc-400">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-1">{displayName}</h1>
              <p className="text-zinc-400 text-sm">@{username}</p>
              {memberSince && (
                <p className="text-zinc-500 text-xs mt-1">
                  Member since {new Date(memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-8">
            {settings.showTotalTrades && stats.totalTrades !== undefined && (
              <div className="bg-zinc-800/60 rounded-xl p-4 text-center border border-zinc-700/50">
                <BarChart3 className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats.totalTrades}</p>
                <p className="text-xs text-zinc-500">Total Trades</p>
              </div>
            )}

            {settings.showWinRate && stats.winRate !== undefined && (
              <div className="bg-zinc-800/60 rounded-xl p-4 text-center border border-zinc-700/50">
                <Target className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className={`text-2xl font-bold ${stats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.winRate.toFixed(1)}%
                </p>
                <p className="text-xs text-zinc-500">Win Rate</p>
              </div>
            )}

            {settings.showProfitFactor && stats.profitFactor !== undefined && (
              <div className="bg-zinc-800/60 rounded-xl p-4 text-center border border-zinc-700/50">
                <Trophy className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className={`text-2xl font-bold ${stats.profitFactor >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.profitFactor.toFixed(2)}
                </p>
                <p className="text-xs text-zinc-500">Profit Factor</p>
              </div>
            )}

            {settings.showTotalPnL && (
              <div className="bg-zinc-800/60 rounded-xl p-4 text-center border border-zinc-700/50">
                <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className={`text-2xl font-bold ${
                  stats.totalPnLHidden || settings.hideDollarAmounts 
                    ? 'text-zinc-500' 
                    : isProfitable ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stats.totalPnLHidden || settings.hideDollarAmounts 
                    ? "—" 
                    : formatCurrency(stats.totalPnL)}
                </p>
                <p className="text-xs text-zinc-500">Total P&L</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between bg-zinc-800/40 rounded-xl p-5 border border-zinc-700/50">
            <div className="flex-1">
              <p className="text-zinc-400 text-sm mb-1">Scan to view full profile</p>
              <p className="text-zinc-600 text-xs break-all">{profileUrl}</p>
              <p className="text-zinc-500 text-xs mt-3">Generated on {currentDate}</p>
            </div>
            
            <div className="bg-white p-3 rounded-xl shadow-lg">
              <QRCodeSVG 
                value={profileUrl}
                size={100}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-zinc-800">
            {isVerified ? (
              <ShieldCheck className="w-4 h-4 text-green-500" />
            ) : (
              <Shield className="w-4 h-4 text-gray-500" />
            )}
            <p className="text-xs text-zinc-500">
              {isVerified 
                ? "Performance verified through broker sync integration"
                : "Performance based on manually entered trades"}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium rounded-xl transition-colors shadow-lg"
      >
        {downloading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Download Certificate
          </>
        )}
      </button>
    </div>
  );
}
