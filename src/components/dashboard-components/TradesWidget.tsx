'use client';

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import useCurrencyStore, { formatCurrencyValue, currencySymbols } from "@/store/currencyStore";

interface TradeData {
  date: string;
  Profit: number;
  Item: string;
  Type?: string;
}

interface TradesWidgetProps {
  data: TradeData[];
}

const TradesWidget: React.FC<TradesWidgetProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<"recentTrades" | "openPositions">("recentTrades");
  const { currency, exchangeRate } = useCurrencyStore();

  const formatProfit = (profit: number) => {
    let displayValue = profit;
    if (currency === "INR") {
      displayValue = profit * exchangeRate;
    }
    
    const symbol = currencySymbols[currency];
    const absValue = Math.abs(displayValue);
    
    let formatted: string;
    if (currency === "INR") {
      if (absValue >= 100000) {
        formatted = `${(absValue / 100000).toFixed(2)}L`;
      } else if (absValue >= 1000) {
        formatted = `${(absValue / 1000).toFixed(1)}K`;
      } else {
        formatted = absValue.toFixed(2);
      }
    } else {
      formatted = absValue.toFixed(2);
    }
    
    if (profit < 0) return `-${symbol}${formatted}`;
    if (profit > 0) return `+${symbol}${formatted}`;
    return `${symbol}${formatted}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
    });
  };

  const recentTrades = [...data].slice(-10).reverse();

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden">
      <div className="flex border-b border-border/50">
        <button
          className={cn(
            "flex-1 px-4 py-3.5 text-sm font-medium transition-all relative",
            activeTab === "recentTrades" 
              ? "text-foreground" 
              : "text-muted-foreground hover:text-foreground/70"
          )}
          onClick={() => setActiveTab("recentTrades")}
        >
          Recent Trades
          {activeTab === "recentTrades" && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground/50" />
          )}
        </button>
        <button
          className={cn(
            "flex-1 px-4 py-3.5 text-sm font-medium transition-all relative",
            activeTab === "openPositions" 
              ? "text-foreground" 
              : "text-muted-foreground hover:text-foreground/70"
          )}
          onClick={() => setActiveTab("openPositions")}
        >
          Open Positions
          {activeTab === "openPositions" && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground/50" />
          )}
        </button>
      </div>

      <div className="max-h-[260px] overflow-y-auto scrollbar-thin">
        {activeTab === "recentTrades" ? (
          recentTrades.length > 0 ? (
            <table className="w-full">
              <thead className="bg-muted/20 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    P&L
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {recentTrades.map((trade, index) => (
                  <tr key={index} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(trade.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-foreground">
                        {trade.Item}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "text-sm font-semibold flex items-center justify-end gap-1.5",
                        trade.Profit > 0 ? "text-profit" : 
                        trade.Profit < 0 ? "text-loss" : "text-muted-foreground"
                      )}>
                        {trade.Profit > 0 && <TrendingUp className="w-3 h-3" />}
                        {trade.Profit < 0 && <TrendingDown className="w-3 h-3" />}
                        {trade.Profit === 0 && <Minus className="w-3 h-3" />}
                        {formatProfit(trade.Profit)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 rounded-xl bg-muted/30 mb-3">
                <Clock className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground/70 mb-1">No trades yet</p>
              <p className="text-xs text-muted-foreground">
                Your recent trades will appear here
              </p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 rounded-xl bg-muted/30 mb-3">
              <TrendingUp className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground/70 mb-1">No open positions</p>
            <p className="text-xs text-muted-foreground">
              Your active trades will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradesWidget;
