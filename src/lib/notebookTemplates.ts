import { 
  Lightbulb, 
  TrendingUp, 
  Calendar, 
  Target, 
  Brain,
  BookOpen,
  FileText,
  Zap,
  BarChart2,
  Shield
} from "lucide-react";

export interface TemplateField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "tags";
  placeholder?: string;
  options?: { value: string; label: string; color?: string }[];
  required?: boolean;
  defaultValue?: string;
}

export interface NotebookTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  fields: TemplateField[];
  category: "trading" | "analysis" | "review" | "learning";
}

export const SENTIMENT_OPTIONS = [
  { value: "bullish", label: "Bullish", color: "text-profit" },
  { value: "bearish", label: "Bearish", color: "text-loss" },
  { value: "neutral", label: "Neutral", color: "text-muted-foreground" },
];

export const TIMEFRAME_OPTIONS = [
  { value: "M1", label: "M1" },
  { value: "M5", label: "M5" },
  { value: "M15", label: "M15" },
  { value: "M30", label: "M30" },
  { value: "H1", label: "H1" },
  { value: "H4", label: "H4" },
  { value: "D1", label: "Daily" },
  { value: "W1", label: "Weekly" },
];

export const CONFIDENCE_OPTIONS = [
  { value: "1", label: "1 - Very Low" },
  { value: "2", label: "2 - Low" },
  { value: "3", label: "3 - Medium" },
  { value: "4", label: "4 - High" },
  { value: "5", label: "5 - Very High" },
];

export const TRADE_TYPE_OPTIONS = [
  { value: "scalp", label: "Scalp" },
  { value: "day", label: "Day Trade" },
  { value: "swing", label: "Swing" },
  { value: "position", label: "Position" },
];

export const SETUP_TYPE_OPTIONS = [
  { value: "breakout", label: "Breakout" },
  { value: "breakdown", label: "Breakdown" },
  { value: "reversal", label: "Reversal" },
  { value: "continuation", label: "Continuation" },
  { value: "range", label: "Range" },
  { value: "trend", label: "Trend Following" },
  { value: "pullback", label: "Pullback" },
];

export const NOTEBOOK_TEMPLATES: NotebookTemplate[] = [
  {
    id: "trade-idea",
    name: "Trade Idea",
    description: "Document potential trade setups with entry, target, and risk",
    icon: Lightbulb,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    category: "trading",
    fields: [
      { id: "symbol", label: "Symbol", type: "text", placeholder: "e.g., EUR/USD, AAPL", required: true },
      { id: "sentiment", label: "Bias", type: "select", options: SENTIMENT_OPTIONS, required: true },
      { id: "timeframe", label: "Timeframe", type: "select", options: TIMEFRAME_OPTIONS },
      { id: "setupType", label: "Setup Type", type: "select", options: SETUP_TYPE_OPTIONS },
      { id: "entry", label: "Entry Price", type: "text", placeholder: "1.0850" },
      { id: "stopLoss", label: "Stop Loss", type: "text", placeholder: "1.0780" },
      { id: "takeProfit", label: "Take Profit", type: "text", placeholder: "1.0950" },
      { id: "riskReward", label: "Risk:Reward", type: "text", placeholder: "1:2" },
      { id: "confidence", label: "Confidence", type: "select", options: CONFIDENCE_OPTIONS },
      { id: "reasoning", label: "Trade Reasoning", type: "textarea", placeholder: "Why is this a good setup? What confirms your bias?" },
      { id: "keyLevels", label: "Key Levels", type: "textarea", placeholder: "Support: 1.0800\nResistance: 1.0900" },
      { id: "notes", label: "Additional Notes", type: "textarea", placeholder: "Any other observations..." },
    ],
  },
  {
    id: "market-analysis",
    name: "Market Analysis",
    description: "Comprehensive technical and fundamental analysis",
    icon: BarChart2,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    category: "analysis",
    fields: [
      { id: "market", label: "Market/Asset", type: "text", placeholder: "e.g., Forex, S&P 500, Gold", required: true },
      { id: "date", label: "Analysis Date", type: "text", placeholder: "Today's date" },
      { id: "overallBias", label: "Overall Bias", type: "select", options: SENTIMENT_OPTIONS },
      { id: "technicalAnalysis", label: "Technical Analysis", type: "textarea", placeholder: "Price action, indicators, chart patterns..." },
      { id: "fundamentalAnalysis", label: "Fundamental Analysis", type: "textarea", placeholder: "Economic data, news events, central bank policy..." },
      { id: "keyEvents", label: "Upcoming Events", type: "textarea", placeholder: "NFP Friday, FOMC Wednesday..." },
      { id: "watchlist", label: "Watchlist", type: "textarea", placeholder: "Pairs/assets to watch today" },
      { id: "levels", label: "Key Levels", type: "textarea", placeholder: "Major support/resistance zones" },
      { id: "tradePlan", label: "Trade Plan", type: "textarea", placeholder: "What setups are you looking for?" },
    ],
  },
  {
    id: "weekly-review",
    name: "Weekly Review",
    description: "Analyze your weekly trading performance",
    icon: Calendar,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    category: "review",
    fields: [
      { id: "weekOf", label: "Week Of", type: "text", placeholder: "Dec 2-6, 2024", required: true },
      { id: "totalTrades", label: "Total Trades", type: "number", placeholder: "8" },
      { id: "winRate", label: "Win Rate %", type: "text", placeholder: "62.5%" },
      { id: "netPnL", label: "Net P&L", type: "text", placeholder: "+$1,250" },
      { id: "bestTrade", label: "Best Trade", type: "textarea", placeholder: "Describe your best trade this week" },
      { id: "worstTrade", label: "Worst Trade", type: "textarea", placeholder: "Describe your worst trade this week" },
      { id: "rulesFollowed", label: "Rules Followed?", type: "select", options: [
        { value: "yes", label: "Yes, all rules followed" },
        { value: "mostly", label: "Mostly, minor deviations" },
        { value: "no", label: "No, broke rules" },
      ]},
      { id: "lessonsLearned", label: "Lessons Learned", type: "textarea", placeholder: "What did you learn this week?" },
      { id: "improvements", label: "Areas to Improve", type: "textarea", placeholder: "What will you focus on next week?" },
      { id: "goals", label: "Next Week Goals", type: "textarea", placeholder: "Specific goals for next week" },
    ],
  },
  {
    id: "strategy-doc",
    name: "Strategy Documentation",
    description: "Document your trading strategy with clear rules",
    icon: Target,
    color: "text-profit",
    bgColor: "bg-profit/10",
    borderColor: "border-profit/20",
    category: "learning",
    fields: [
      { id: "strategyName", label: "Strategy Name", type: "text", placeholder: "London Breakout Strategy", required: true },
      { id: "tradeType", label: "Trade Type", type: "select", options: TRADE_TYPE_OPTIONS },
      { id: "markets", label: "Best Markets", type: "text", placeholder: "EUR/USD, GBP/USD" },
      { id: "timeframes", label: "Timeframes", type: "text", placeholder: "H1, H4" },
      { id: "entryRules", label: "Entry Rules", type: "textarea", placeholder: "1. Wait for price to break above resistance\n2. Confirm with volume\n3. Enter on pullback" },
      { id: "exitRules", label: "Exit Rules", type: "textarea", placeholder: "1. Take profit at 2R\n2. Trail stop after 1R\n3. Exit before major news" },
      { id: "stopLossRules", label: "Stop Loss Rules", type: "textarea", placeholder: "Place stop below swing low\nMax 1% account risk" },
      { id: "riskManagement", label: "Risk Management", type: "textarea", placeholder: "Risk per trade, max daily loss, position sizing..." },
      { id: "bestConditions", label: "Best Conditions", type: "textarea", placeholder: "When does this strategy work best?" },
      { id: "avoidConditions", label: "When to Avoid", type: "textarea", placeholder: "Conditions to avoid trading this strategy" },
    ],
  },
  {
    id: "psychology",
    name: "Trading Psychology",
    description: "Track your mental state and emotional patterns",
    icon: Brain,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
    category: "learning",
    fields: [
      { id: "date", label: "Date", type: "text", placeholder: "Today's date", required: true },
      { id: "mood", label: "Overall Mood", type: "select", options: [
        { value: "excellent", label: "Excellent - Focused & Calm" },
        { value: "good", label: "Good - Ready to Trade" },
        { value: "neutral", label: "Neutral - Average Day" },
        { value: "stressed", label: "Stressed - Feeling Pressure" },
        { value: "anxious", label: "Anxious - Worried" },
        { value: "frustrated", label: "Frustrated - After Losses" },
      ]},
      { id: "sleepQuality", label: "Sleep Quality", type: "select", options: [
        { value: "excellent", label: "Excellent (7+ hours)" },
        { value: "good", label: "Good (6-7 hours)" },
        { value: "fair", label: "Fair (5-6 hours)" },
        { value: "poor", label: "Poor (< 5 hours)" },
      ]},
      { id: "emotionalTriggers", label: "Emotional Triggers Today", type: "textarea", placeholder: "What emotions came up while trading?" },
      { id: "mistakes", label: "Emotional Mistakes", type: "textarea", placeholder: "Did emotions cause any trading mistakes?" },
      { id: "successes", label: "Emotional Wins", type: "textarea", placeholder: "Times you stayed disciplined despite emotions" },
      { id: "patterns", label: "Patterns Noticed", type: "textarea", placeholder: "Any recurring emotional patterns?" },
      { id: "actionPlan", label: "Action Plan", type: "textarea", placeholder: "How will you handle these emotions better?" },
    ],
  },
  {
    id: "blank",
    name: "Blank Note",
    description: "Start with a blank page for free-form notes",
    icon: FileText,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-border",
    category: "trading",
    fields: [
      { id: "content", label: "Content", type: "textarea", placeholder: "Write your notes here..." },
    ],
  },
];

export const getTemplateById = (id: string): NotebookTemplate | undefined => {
  return NOTEBOOK_TEMPLATES.find(t => t.id === id);
};

export const getTemplatesByCategory = (category: string): NotebookTemplate[] => {
  return NOTEBOOK_TEMPLATES.filter(t => t.category === category);
};
