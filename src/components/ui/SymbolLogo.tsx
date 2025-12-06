"use client";

import { useState, useEffect } from "react";
import { getStockLogoUrl, getSymbolFallback } from "@/lib/stockLogos";

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
  const fallback = getSymbolFallback(symbol);

  useEffect(() => {
    setHasError(false);
  }, [symbol, logoUrl]);

  const sizeClasses = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-11 h-11 text-sm"
  };

  const baseClasses = `${sizeClasses[size]} rounded-lg flex items-center justify-center font-semibold overflow-hidden transition-all ${className}`;

  if (hasError || !logoUrl) {
    const colorClasses = isSelected
      ? isProfit 
        ? "bg-profit/15 text-profit" 
        : "bg-loss/15 text-loss"
      : "bg-muted text-muted-foreground";
    
    return (
      <div className={`${baseClasses} ${colorClasses}`}>
        {fallback}
      </div>
    );
  }

  return (
    <div className={baseClasses}>
      <img
        src={logoUrl}
        alt={symbol}
        className="w-full h-full object-contain"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
