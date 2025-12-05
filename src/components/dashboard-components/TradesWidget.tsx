'use client';

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";

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

  const formatProfit = (profit: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Math.abs(profit));
    
    if (profit < 0) return `-${formatted}`;
    if (profit > 0) return `+${formatted}`;
    return formatted;
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
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Tab Header */}
      <div className="flex border-b border-border">
        <button
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors relative",
            activeTab === "recentTrades" 
              ? "text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("recentTrades")}
        >
          Recent Trades
          {activeTab === "recentTrades" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors relative",
            activeTab === "openPositions" 
              ? "text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("openPositions")}
        >
          Open Positions
          {activeTab === "openPositions" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[280px] overflow-y-auto scrollbar-thin">
        {activeTab === "recentTrades" ? (
          recentTrades.length > 0 ? (
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    P&L
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentTrades.map((trade, index) => (
                  <tr key={index} className="hover:bg-muted/30 transition-colors">
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
                        "text-sm font-semibold flex items-center justify-end gap-1",
                        trade.Profit > 0 ? "text-profit" : 
                        trade.Profit < 0 ? "text-loss" : "text-muted-foreground"
                      )}>
                        {trade.Profit > 0 && <TrendingUp className="w-3.5 h-3.5" />}
                        {trade.Profit < 0 && <TrendingDown className="w-3.5 h-3.5" />}
                        {trade.Profit === 0 && <Minus className="w-3.5 h-3.5" />}
                        {formatProfit(trade.Profit)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="w-10 h-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No trades yet</p>
              <p className="text-xs text-muted-foreground">
                Your recent trades will appear here
              </p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No open positions</p>
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
