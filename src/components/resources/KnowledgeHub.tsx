"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Shield,
  BarChart2,
  Layers,
  BookOpen,
  Target,
  Zap,
  ChevronRight,
  ExternalLink,
  Search,
  Filter,
} from "lucide-react";

type Category = "all" | "technical" | "risk" | "strategy" | "fundamentals";

interface Article {
  id: string;
  title: string;
  description: string;
  category: Category;
  readTime: string;
  icon: React.ElementType;
  content: string[];
}

const articles: Article[] = [
  {
    id: "1",
    title: "Understanding Support & Resistance",
    description: "Learn how to identify key price levels where the market tends to reverse or consolidate.",
    category: "technical",
    readTime: "5 min",
    icon: TrendingUp,
    content: [
      "Support and resistance are fundamental concepts in technical analysis that identify price levels where buying or selling pressure is expected to be strong.",
      "Support levels are where the price tends to find buying interest, preventing it from falling further. Resistance levels are where selling pressure typically prevents prices from rising.",
      "Key tips: Look for multiple touches, use higher timeframes for stronger levels, and watch for breakouts with volume confirmation.",
    ],
  },
  {
    id: "2",
    title: "Risk Management Essentials",
    description: "The foundation of successful trading - protecting your capital through proper position sizing.",
    category: "risk",
    readTime: "8 min",
    icon: Shield,
    content: [
      "Never risk more than 1-2% of your trading capital on a single trade. This ensures survival through losing streaks.",
      "Use stop losses religiously. Calculate your position size based on your stop loss distance and risk tolerance.",
      "The formula: Position Size = (Account Risk %) × Account Balance ÷ Stop Loss Distance in Pips",
    ],
  },
  {
    id: "3",
    title: "Price Action Trading",
    description: "Trade using pure price movement without relying on lagging indicators.",
    category: "strategy",
    readTime: "10 min",
    icon: BarChart2,
    content: [
      "Price action trading focuses on analyzing the raw price movement of an asset to make trading decisions.",
      "Key patterns: Pin bars, engulfing candles, inside bars, and break and retest setups.",
      "Combine with market structure (higher highs/higher lows) for high-probability trades.",
    ],
  },
  {
    id: "4",
    title: "Market Structure Basics",
    description: "Understanding how markets move in trends and ranges to trade with the flow.",
    category: "technical",
    readTime: "6 min",
    icon: Layers,
    content: [
      "Markets move in trends (uptrend, downtrend) or consolidation (range-bound). Understanding this is crucial.",
      "Uptrend: Higher highs and higher lows. Downtrend: Lower highs and lower lows.",
      "Trade with the trend on higher timeframes, and look for entries on lower timeframes.",
    ],
  },
  {
    id: "5",
    title: "Building a Trading Plan",
    description: "Create a comprehensive trading plan that defines your rules, strategies, and goals.",
    category: "strategy",
    readTime: "12 min",
    icon: BookOpen,
    content: [
      "A trading plan removes emotion and provides a clear roadmap for your trading activities.",
      "Key components: Trading goals, risk parameters, entry/exit rules, position sizing, and review process.",
      "Review and update your plan regularly based on performance and market conditions.",
    ],
  },
  {
    id: "6",
    title: "Stop Loss Strategies",
    description: "Different approaches to placing and managing stop losses effectively.",
    category: "risk",
    readTime: "7 min",
    icon: Target,
    content: [
      "Fixed stops: Set at a specific pip distance or percentage from entry.",
      "Technical stops: Placed below/above key support/resistance levels or swing points.",
      "Trailing stops: Move your stop loss to lock in profits as the trade moves in your favor.",
    ],
  },
  {
    id: "7",
    title: "Reading Candlestick Patterns",
    description: "Master the art of interpreting candlestick patterns for better trade entries.",
    category: "technical",
    readTime: "9 min",
    icon: Zap,
    content: [
      "Candlesticks show the open, high, low, and close of a time period at a glance.",
      "Reversal patterns: Hammer, shooting star, doji, engulfing patterns signal potential trend changes.",
      "Continuation patterns: Three white soldiers, three black crows, and marubozu confirm trend continuation.",
    ],
  },
  {
    id: "8",
    title: "Economic Calendar Trading",
    description: "How to use economic events and news releases in your trading strategy.",
    category: "fundamentals",
    readTime: "6 min",
    icon: BookOpen,
    content: [
      "High-impact news events can cause significant volatility and price movements.",
      "Key events: Interest rate decisions, employment data, GDP reports, and inflation figures.",
      "Consider staying flat during major news or use wider stops to avoid being stopped out by volatility.",
    ],
  },
];

const categories = [
  { id: "all" as Category, label: "All Topics", count: articles.length },
  { id: "technical" as Category, label: "Technical Analysis", count: articles.filter(a => a.category === "technical").length },
  { id: "risk" as Category, label: "Risk Management", count: articles.filter(a => a.category === "risk").length },
  { id: "strategy" as Category, label: "Strategy", count: articles.filter(a => a.category === "strategy").length },
  { id: "fundamentals" as Category, label: "Fundamentals", count: articles.filter(a => a.category === "fundamentals").length },
];

const KnowledgeHub = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const filteredArticles = articles.filter((article) => {
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {cat.label}
            <span className={`ml-2 text-xs ${selectedCategory === cat.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              ({cat.count})
            </span>
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArticles.map((article) => {
          const Icon = article.icon;
          const isExpanded = expandedArticle === article.id;

          return (
            <motion.div
              key={article.id}
              layout
              className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors"
            >
              <button
                onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-foreground truncate">{article.title}</h3>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground capitalize">
                        {article.category}
                      </span>
                      <span className="text-xs text-muted-foreground">{article.readTime} read</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border"
                >
                  <div className="p-4 space-y-3">
                    {article.content.map((paragraph, idx) => (
                      <p key={idx} className="text-sm text-muted-foreground leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No articles found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default KnowledgeHub;
