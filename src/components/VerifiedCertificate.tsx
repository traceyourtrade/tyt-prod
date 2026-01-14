"use client";

import React, { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Download, Loader2 } from "lucide-react";
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
    if (value === null || value === undefined) return "$0";
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (absValue >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    
    setDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        backgroundColor: "#0a0a0a",
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
    day: '2-digit',
    month: '2-digit',
    year: 'numeric' 
  });

  const showPnL = settings.showTotalPnL && !stats.totalPnLHidden && !settings.hideDollarAmounts;
  const pnlValue = stats.totalPnL || 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={certificateRef}
        className="w-[700px] h-[400px] relative overflow-hidden rounded-2xl"
        style={{ 
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1410 30%, #0f0a08 60%, #0a0a0a 100%)'
        }}
      >
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 70% 50%, rgba(180, 140, 100, 0.15) 0%, transparent 60%)'
          }}
        />
        
        <div 
          className="absolute top-0 right-0 w-1/2 h-full opacity-20"
          style={{
            background: 'radial-gradient(ellipse at 80% 40%, rgba(200, 160, 120, 0.2) 0%, transparent 50%)'
          }}
        />

        <div className="absolute left-8 top-8 bottom-8 w-[340px] flex flex-col">
          <div className="mb-1">
            <h1 
              className="text-[28px] font-light tracking-wide"
              style={{ 
                background: 'linear-gradient(135deg, #e8dcc8 0%, #c4b39a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Verified Performance
            </h1>
            <h2 
              className="text-[32px] font-bold -mt-1"
              style={{ 
                background: 'linear-gradient(135deg, #f5ede0 0%, #d4c4a8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Certificate
            </h2>
          </div>

          <div className="flex items-center gap-2 mb-6">
            {isVerified && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                VERIFIED
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              PERFORMANCE
            </span>
          </div>

          <div className="mb-4">
            <p className="text-zinc-500 text-xs italic mb-1">Proudly presented to:</p>
            <h3 
              className="text-2xl font-semibold"
              style={{ color: '#f5ede0' }}
            >
              {displayName}
            </h3>
          </div>

          <p className="text-zinc-500 text-xs leading-relaxed mb-4">
            We hereby recognize this trader for demonstrating 
            {isVerified ? " verified" : ""} trading performance on{" "}
            <span className="text-zinc-400 font-medium">ProJournX</span>.
          </p>

          {showPnL && (
            <div className="mb-4">
              <p className="text-zinc-500 text-xs mb-1">Total Performance:</p>
              <p 
                className="text-4xl font-bold"
                style={{ 
                  background: isProfitable 
                    ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)' 
                    : 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {isProfitable ? '+' : ''}{formatCurrency(pnlValue)}
              </p>
            </div>
          )}

          <div className="mt-auto flex items-end justify-between">
            <div>
              <div className="w-24 h-[1px] bg-zinc-600 mb-2"></div>
              <p className="text-zinc-600 text-[10px]">{currentDate}</p>
              <p className="text-zinc-700 text-[9px]">Date</p>
            </div>
            
            <div className="text-right">
              <p 
                className="text-lg italic"
                style={{ 
                  fontFamily: 'Georgia, serif',
                  color: '#c4b39a'
                }}
              >
                ProJournX
              </p>
              <p className="text-zinc-600 text-[9px]">Trading Journal Platform</p>
            </div>
          </div>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[280px] h-[320px] flex items-center justify-center">
          <div className="relative w-full h-full">
            <div 
              className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-[140px] h-[200px]"
              style={{
                background: 'linear-gradient(180deg, #2a2520 0%, #1a1815 50%, #0f0d0b 100%)',
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 15%, 100% 85%, 80% 100%, 20% 100%, 0% 85%, 0% 15%)',
                boxShadow: 'inset 0 0 40px rgba(180, 140, 100, 0.1), 0 20px 60px rgba(0,0,0,0.5)'
              }}
            >
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(200, 160, 120, 0.15) 0%, transparent 50%)',
                  clipPath: 'polygon(20% 0%, 80% 0%, 100% 15%, 100% 85%, 80% 100%, 20% 100%, 0% 85%, 0% 15%)'
                }}
              />
              
              <div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(180, 140, 100, 0.3) 0%, transparent 70%)',
                  boxShadow: '0 0 40px rgba(180, 140, 100, 0.2)'
                }}
              />
              
              <div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2"
                style={{
                  borderColor: 'rgba(200, 160, 120, 0.4)',
                  boxShadow: '0 0 20px rgba(180, 140, 100, 0.3), inset 0 0 20px rgba(180, 140, 100, 0.1)'
                }}
              />
            </div>

            <div 
              className="absolute left-1/2 -translate-x-1/2 bottom-[15%] w-[80px] h-[35px]"
              style={{
                background: 'linear-gradient(180deg, #1a1815 0%, #0f0d0b 100%)',
                borderRadius: '4px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
              }}
            />

            <div 
              className="absolute right-[15%] top-[25%] w-3 h-3 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(200, 180, 140, 0.6) 0%, transparent 70%)',
                filter: 'blur(1px)'
              }}
            />
            <div 
              className="absolute right-[25%] top-[35%] w-1.5 h-1.5 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(200, 180, 140, 0.4) 0%, transparent 70%)',
                filter: 'blur(0.5px)'
              }}
            />
          </div>
        </div>

        <div className="absolute right-6 bottom-6 flex flex-col items-end gap-2">
          <div className="bg-white p-2 rounded-lg shadow-lg">
            <QRCodeSVG 
              value={profileUrl}
              size={60}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-zinc-600 text-[8px]">Scan to verify</p>
        </div>

        {isVerified && (
          <div className="absolute left-8 bottom-6 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-[9px] text-zinc-500">Broker sync verified</p>
          </div>
        )}

        <div 
          className="absolute bottom-0 right-0 text-[10px] font-medium px-3 py-1.5"
          style={{ color: 'rgba(200, 180, 140, 0.3)' }}
        >
          PROJOURNX
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:from-amber-700/50 disabled:to-amber-800/50 text-white font-medium rounded-xl transition-all shadow-lg"
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
