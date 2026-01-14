"use client";

import React, { useRef, useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Loader2 } from "lucide-react";
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
        const response = await fetch('/images/projournx-full-logo.png');
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
            background: 'radial-gradient(ellipse at 50% 30%, rgba(59, 130, 246, 0.06) 0%, transparent 50%)'
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 80% 70%, rgba(139, 92, 246, 0.04) 0%, transparent 40%)'
          }}
        />

        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-blue-600" />

        <div className="absolute inset-x-12 top-8 flex items-center justify-between">
          {logoBase64 ? (
            <img 
              src={logoBase64} 
              alt="ProJournX" 
              className="h-8 object-contain"
            />
          ) : (
            <div className="h-8 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-white font-semibold text-lg">ProJournX</span>
            </div>
          )}
          
          {isVerified && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 text-sm">&#x2714;</span>
              <span className="text-xs font-semibold text-emerald-400 tracking-wide">VERIFIED TRADER</span>
            </div>
          )}
        </div>

        <div className="absolute inset-x-12 top-24 flex justify-between items-start">
          <div className="flex-1 max-w-[380px]">
            <p className="text-zinc-500 text-[10px] mb-1 uppercase tracking-[0.2em]">Certificate of Achievement</p>
            
            <h1 
              className="text-[36px] font-bold leading-tight mb-4"
              style={{ 
                background: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Verified Performance
            </h1>
            
            <div className="h-px w-16 bg-gradient-to-r from-blue-500 via-purple-500 to-transparent mb-5" />

            <p className="text-zinc-500 text-xs italic mb-1">Proudly presented to</p>
            <h2 className="text-2xl font-semibold text-white mb-0.5">{displayName}</h2>
            <p className="text-zinc-600 text-sm">@{username}</p>
          </div>

          <div className="w-[180px] h-[180px] flex items-center justify-center">
            <div className="relative w-full h-full">
              <div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90px] h-[130px]"
                style={{
                  background: 'linear-gradient(180deg, #1a1a1f 0%, #141418 50%, #0a0a0c 100%)',
                  clipPath: 'polygon(15% 0%, 85% 0%, 100% 12%, 100% 88%, 85% 100%, 15% 100%, 0% 88%, 0% 12%)',
                  boxShadow: '0 15px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)'
                }}
              >
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, transparent 60%)',
                    clipPath: 'polygon(15% 0%, 85% 0%, 100% 12%, 100% 88%, 85% 100%, 15% 100%, 0% 88%, 0% 12%)'
                  }}
                />
                
                <div 
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
                    boxShadow: '0 0 25px rgba(59, 130, 246, 0.15)'
                  }}
                />
                
                <div 
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border"
                  style={{
                    borderColor: 'rgba(59, 130, 246, 0.35)',
                    boxShadow: '0 0 12px rgba(59, 130, 246, 0.2)'
                  }}
                />
              </div>

              <div 
                className="absolute left-1/2 -translate-x-1/2 bottom-[10%] w-[50px] h-[20px]"
                style={{
                  background: 'linear-gradient(180deg, #141418 0%, #0a0a0c 100%)',
                  borderRadius: '2px',
                  boxShadow: '0 6px 15px rgba(0,0,0,0.3)'
                }}
              />
            </div>
          </div>
        </div>

        <div className="absolute inset-x-12 bottom-8 flex items-end justify-between">
          <div className="flex items-center gap-8">
            {showPnL && (
              <div>
                <p className="text-zinc-500 text-[10px] mb-1 uppercase tracking-wider">Total Performance</p>
                <p 
                  className="text-3xl font-bold tracking-tight"
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

            <div className="flex items-center gap-4">
              <div>
                <div className="w-14 h-px bg-zinc-700 mb-1" />
                <p className="text-zinc-600 text-[10px]">{currentDate}</p>
              </div>
              
              {isVerified && (
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500 text-[10px]">&#x2714;</span>
                  <p className="text-[9px] text-zinc-600">Broker sync verified</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="bg-white p-1.5 rounded-lg shadow-lg">
              <QRCodeCanvas 
                value={profileUrl}
                size={55}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-zinc-700 text-[8px]">Scan to verify</p>
          </div>
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
