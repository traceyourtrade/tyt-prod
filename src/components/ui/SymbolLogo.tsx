"use client";

import { useState, useEffect } from "react";
import { getStockLogoUrl } from "@/lib/stockLogos";

interface SymbolLogoProps {
  symbol: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  isProfit?: boolean;
  isSelected?: boolean;
}

export function SymbolLogo({ 
  symbol, 
  size = "md", 
  className = "",
  isProfit = true,
  isSelected = false
}: SymbolLogoProps) {
  const [hasError, setHasError] = useState(false);
  const logoUrl = getStockLogoUrl(symbol);
  
  // Smart fallback: 2 chars for sm, 3 chars for md, 4 chars for lg
  const getFallback = () => {
    if (!symbol) return '?';
    const maxChars = size === 'sm' ? 2 : size === 'md' ? 3 : 4;
    return symbol.slice(0, maxChars).toUpperCase();
  };

  useEffect(() => {
    setHasError(false);
  }, [symbol, logoUrl]);

  const sizeClasses = {
    sm: "w-8 h-8 text-[9px]",
    md: "w-10 h-10 text-[10px]",
    lg: "w-12 h-12 text-xs"
  };

  const baseClasses = `${sizeClasses[size]} rounded-xl flex items-center justify-center font-bold overflow-hidden transition-all ${className}`;

  if (hasError || !logoUrl) {
    const colorClasses = isSelected
      ? isProfit 
        ? "bg-profit/15 text-profit border border-profit/20" 
        : "bg-loss/15 text-loss border border-loss/20"
      : "bg-white/[0.06] text-muted-foreground border border-white/[0.08]";
    
    return (
      <div className={`${baseClasses} ${colorClasses}`}>
        {getFallback()}
      </div>
    );
  }

  return (
    <div className={`${baseClasses} bg-white/[0.06] border border-white/[0.08]`}>
      <img
        src={logoUrl}
        alt={symbol}
        className="w-full h-full object-contain"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
