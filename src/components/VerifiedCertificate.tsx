"use client";

import React, { useRef, useState, useEffect } from "react";
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
  const [logoBase64, setLogoBase64] = useState<string>("");

  const profileUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/profile/${username}`
    : `/profile/${username}`;

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch('/images/logo-dark.png');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Error loading logo:", error);
      }
    };
    loadLogo();
  }, []);

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
        backgroundColor: "#050505",
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

  const showPnL = settings.showTotalPnL && !stats.totalPnLHidden && !settings.hideDollarAmounts;
  const pnlValue = stats.totalPnL || 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={certificateRef}
        className="w-[700px] h-[400px] relative overflow-hidden rounded-2xl"
        style={{ 
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: 'linear-gradient(145deg, #050505 0%, #0a0a0a 30%, #0f0f12 50%, #0a0a0a 70%, #050505 100%)'
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)'
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 70% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 40%)'
          }}
        />

        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-blue-400 to-blue-600" />

        <div className="absolute left-8 top-6 right-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoBase64 ? (
              <img 
                src={logoBase64} 
                alt="ProJournX" 
                className="h-10 w-10 object-contain"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
            )}
            <div>
              <h3 className="text-white font-semibold text-lg tracking-tight">ProJournX</h3>
              <p className="text-zinc-500 text-[10px]">Trading Journal Platform</p>
            </div>
          </div>
          
          {isVerified && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 tracking-wide">VERIFIED TRADER</span>
            </div>
          )}
        </div>

        <div className="absolute left-8 top-24 w-[340px]">
          <p className="text-zinc-500 text-xs mb-1 uppercase tracking-widest">Certificate of Achievement</p>
          
          <h1 
            className="text-[32px] font-bold leading-tight mb-1"
            style={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Verified Performance
          </h1>
          
          <div className="h-px w-20 bg-gradient-to-r from-blue-500 to-transparent mb-4" />

          <p className="text-zinc-500 text-xs italic mb-1">Proudly presented to</p>
          <h2 className="text-2xl font-semibold text-white mb-1">{displayName}</h2>
          <p className="text-zinc-600 text-xs">@{username}</p>
        </div>

        {showPnL && (
          <div className="absolute left-8 bottom-20">
            <p className="text-zinc-500 text-xs mb-1 uppercase tracking-wider">Total Performance</p>
            <p 
              className="text-4xl font-bold tracking-tight"
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

        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-[200px] h-[240px] flex items-center justify-center">
          <div className="relative w-full h-full">
            <div 
              className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[100px] h-[140px]"
              style={{
                background: 'linear-gradient(180deg, #1a1a1f 0%, #141418 50%, #0a0a0c 100%)',
                clipPath: 'polygon(15% 0%, 85% 0%, 100% 12%, 100% 88%, 85% 100%, 15% 100%, 0% 88%, 0% 12%)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
              }}
            >
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 60%)',
                  clipPath: 'polygon(15% 0%, 85% 0%, 100% 12%, 100% 88%, 85% 100%, 15% 100%, 0% 88%, 0% 12%)'
                }}
              />
              
              <div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.2)'
                }}
              />
              
              <div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border"
                style={{
                  borderColor: 'rgba(59, 130, 246, 0.4)',
                  boxShadow: '0 0 15px rgba(59, 130, 246, 0.3), inset 0 0 10px rgba(59, 130, 246, 0.1)'
                }}
              />
            </div>

            <div 
              className="absolute left-1/2 -translate-x-1/2 bottom-[20%] w-[60px] h-[25px]"
              style={{
                background: 'linear-gradient(180deg, #141418 0%, #0a0a0c 100%)',
                borderRadius: '3px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
              }}
            />

            <div 
              className="absolute right-[20%] top-[25%] w-2 h-2 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 70%)',
                filter: 'blur(1px)'
              }}
            />
            <div 
              className="absolute right-[30%] top-[35%] w-1 h-1 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)'
              }}
            />
          </div>
        </div>

        <div className="absolute left-8 bottom-6 flex items-center gap-6">
          <div>
            <div className="w-16 h-px bg-zinc-700 mb-1" />
            <p className="text-zinc-600 text-[10px]">{currentDate}</p>
          </div>
          
          {isVerified && (
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <p className="text-[9px] text-zinc-600">Broker sync verified</p>
            </div>
          )}
        </div>

        <div className="absolute right-6 bottom-6 flex flex-col items-end gap-2">
          <div className="bg-white p-1.5 rounded-lg shadow-lg">
            <QRCodeSVG 
              value={profileUrl}
              size={50}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-zinc-700 text-[8px]">Scan to verify</p>
        </div>

        <div 
          className="absolute right-8 top-6 text-[9px] font-medium tracking-widest"
          style={{ color: 'rgba(63, 63, 70, 0.6)' }}
        >
          #{username.toUpperCase().slice(0, 8)}
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium rounded-xl transition-all shadow-lg"
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
