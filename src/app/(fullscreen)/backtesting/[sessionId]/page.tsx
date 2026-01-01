"use client"
import React, {
  use,
  useEffect,
  useRef,
  useState,
  useReducer,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import "./backtesting.css";
import { widget as TradingViewWidget } from "../../../../../public/charting_library";
import { makeApiRequest, parseFullSymbol } from "@/lib/custom-datafeed/helpers";
import * as DrawingManager from "@/lib/drawing-persistence-manager";
import { useTimeframeSwitchController } from "@/hooks/useTimeframeSwitchController";

type MarketType = 'FOREX' | 'CRYPTO' | 'INDIAN_INDICES' | 'INDIAN_STOCK';

interface SessionData {
  sessionId: number;
  name: string;
  market?: MarketType;
  symbol: string;
  fromDate: string;
  toDate: string;
  initialBalance: number;
  currentBalance: number;
  progressPointer: number;
  replayTimestamp?: number;
  status: 'active' | 'completed';
  trades: any[];
  timeInvested: number;
}

const saveChartLayout = async (sessionId: number, layoutData: any) => {
  try {
    const response = await fetch('/api/backtest-sessions/chart-layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        type: 'chart',
        ...layoutData
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to save chart layout:', error);
    return { success: false };
  }
};

const loadChartLayouts = async (sessionId: number) => {
  try {
    const response = await fetch(`/api/backtest-sessions/chart-layout?sessionId=${sessionId}`);
    const result = await response.json();
    return result.success ? result.data : { chartLayouts: [], studyTemplates: {}, drawingTemplates: {} };
  } catch (error) {
    console.error('Failed to load chart layouts:', error);
    return { chartLayouts: [], studyTemplates: {}, drawingTemplates: {} };
  }
};

const deleteChartLayout = async (sessionId: number, layoutId: string) => {
  try {
    const response = await fetch(`/api/backtest-sessions/chart-layout?sessionId=${sessionId}&type=chart&layoutId=${layoutId}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to delete chart layout:', error);
    return { success: false };
  }
};

const saveStudyTemplate = async (sessionId: number, name: string, content: string) => {
  try {
    const response = await fetch('/api/backtest-sessions/chart-layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, type: 'studyTemplate', name, content })
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to save study template:', error);
    return { success: false };
  }
};

const saveDrawingTemplate = async (sessionId: number, toolName: string, content: string) => {
  try {
    const response = await fetch('/api/backtest-sessions/chart-layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, type: 'drawingTemplate', name: toolName, content })
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to save drawing template:', error);
    return { success: false };
  }
};

const subMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  const targetMonth = result.getMonth() - months;
  result.setMonth(targetMonth);
  if (result.getMonth() !== ((12 + targetMonth % 12) % 12)) {
    result.setDate(0);
  }
  return result;
};

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  const originalDay = result.getDate();
  result.setMonth(result.getMonth() + months);
  if (result.getDate() !== originalDay) {
    result.setDate(0);
  }
  return result;
};

// Resolution-based window sizing - larger for higher timeframes, centered on session date
const getWindowMonths = (resolution: string): number => {
  const numericRes = parseInt(resolution, 10);
  if (!isNaN(numericRes) && numericRes < 1440) {
    // 1 min: 3 months each side (6 months total)
    if (numericRes === 1) return 3;
    // 5 min: 6 months each side (12 months total)
    if (numericRes <= 5) return 6;
    // 15-30 min: 12 months each side (24 months total)
    if (numericRes <= 30) return 12;
    // 1H-4H: 24 months each side (48 months total)
    return 24;
  }
  // Daily, Weekly, Monthly: 120 months (10 years) each side for full history
  return 120;
};

const symbolToChartFormat = (symbol: string, market?: MarketType): string => {
  if (market === 'CRYPTO') {
    return `ProJournX:${symbol}`;
  }
  if (market === 'INDIAN_INDICES' || market === 'INDIAN_STOCK') {
    return `ProJournX:${symbol}`;
  }
  const forexMapping: Record<string, string> = {
    'EURUSD': 'ProJournX:EUR/USD',
    'GBPUSD': 'ProJournX:GBP/USD',
    'USDJPY': 'ProJournX:USD/JPY',
    'AUDUSD': 'ProJournX:AUD/USD',
    'USDCAD': 'ProJournX:USD/CAD',
    'USDCHF': 'ProJournX:USD/CHF',
    'NZDUSD': 'ProJournX:NZD/USD',
    'EURJPY': 'ProJournX:EUR/JPY',
    'GBPJPY': 'ProJournX:GBP/JPY',
    'EURGBP': 'ProJournX:EUR/GBP',
    'XAUUSD': 'ProJournX:XAU/USD',
    'XAGUSD': 'ProJournX:XAG/USD',
  };
  return forexMapping[symbol] || `ProJournX:${symbol}`;
};

// Get decimal places for price display based on symbol type
// Gold/Silver: 2-3 decimals, JPY pairs: 3 decimals, Most forex: 5 decimals, Crypto: 2 decimals
const getDecimalPlaces = (symbol: string, market?: string): number => {
  if (!symbol || symbol.trim() === '') {
    return 5; // Default for forex
  }
  
  const upperSymbol = symbol.toUpperCase();
  
  // Gold - 3 decimals (e.g., 2375.000)
  if (upperSymbol.includes('XAU') || upperSymbol.includes('GOLD')) {
    return 3;
  }
  
  // Silver - typically 3-4 decimals
  if (upperSymbol.includes('XAG') || upperSymbol.includes('SILVER')) {
    return 3;
  }
  
  // JPY pairs - 3 decimals (e.g., 156.789)
  if (upperSymbol.includes('JPY')) {
    return 3;
  }
  
  // Crypto - 2 decimals for most (BTC, ETH), 4 for smaller coins
  if (market === 'CRYPTO') {
    return 2;
  }
  
  // Indian indices/stocks - 2 decimals
  if (market === 'INDIAN_INDICES' || market === 'INDIAN_STOCK') {
    return 2;
  }
  
  // Standard forex pairs - 5 decimals (e.g., 1.08123)
  return 5;
};

// Get contract size (lot multiplier) based on symbol type
// Forex pairs: 100,000 units per lot
// Gold (XAU): 100 troy ounces per lot  
// Silver (XAG): 5,000 ounces per lot
// Crypto: 1 unit per lot (BTC, ETH, etc.)
const getContractSize = (symbol: string, market?: string): number => {
  // Safeguard: if symbol is empty, return a placeholder that forces recalculation
  // The caller should ensure sessionData is available before computing P&L
  if (!symbol || symbol.trim() === '') {
    console.warn('getContractSize called with empty symbol - using forex default');
    return 100000;
  }
  
  const upperSymbol = symbol.toUpperCase();
  
  // Gold - 100 oz per lot
  if (upperSymbol.includes('XAU') || upperSymbol.includes('GOLD')) {
    return 100;
  }
  
  // Silver - 5000 oz per lot
  if (upperSymbol.includes('XAG') || upperSymbol.includes('SILVER')) {
    return 5000;
  }
  
  // Crypto - 1 unit per lot (actual crypto units)
  if (market === 'CRYPTO') {
    return 1;
  }
  
  // Standard forex pairs - 100,000 units per lot
  return 100000;
};

const tradingReducer = (state, action) => {
  switch (action.type) {
    case "ADD_OPEN_TRADE":
      return { ...state, openTrades: [...state.openTrades, action.payload] };
    case "UPDATE_OPEN_TRADE":
      return {
        ...state,
        openTrades: state.openTrades.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      };
    case "CLOSE_OPEN_TRADE":
      return {
        ...state,
        openTrades: state.openTrades.filter((t) => t.id !== action.payload),
      };
    case "SET_OPEN_TRADES":
      return { ...state, openTrades: action.payload };
    case "SET_POTENTIAL_TRADE":
      return { ...state, potentialTrade: action.payload };
    case "SET_LIMIT_ORDERS":
      return { ...state, limitOrders: action.payload };
    case "ADD_LIMIT_ORDER":
      return { ...state, limitOrders: [...state.limitOrders, action.payload] };
    case "REMOVE_LIMIT_ORDER":
      return {
        ...state,
        limitOrders: state.limitOrders.filter(
          (order) => order.id !== action.payload
        ),
      };
    case "SET_BALANCE":
      return { ...state, balance: action.payload };
    case "SET_UNREALISED_PL":
      return { ...state, unrealisedPL: action.payload };
    case "SET_REALISED_PL":
      return { ...state, realisedPL: action.payload };
    case "ADD_TRADE_HISTORY":
      return {
        ...state,
        tradeHistory: [...state.tradeHistory, action.payload],
      };
    case "SET_TRADE_HISTORY":
      return { ...state, tradeHistory: action.payload };
    case "RESET_SESSION":
      return {
        ...state,
        openTrades: [],
        potentialTrade: null,
        limitOrders: [],
        unrealisedPL: 0,
        realisedPL: 0,
        tradeHistory: [],
      };
    default:
      return state;
  }
};

export default function FullscreenBacktesting({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const initialInterval = "60";
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tvWidgetRef = useRef<any>(null);
  // Store callbacks per resolution - TradingView may subscribe to multiple resolutions
  const realtimeCallbacksRef = useRef<Map<string, any>>(new Map());
  // Legacy single callback ref - will be set to the callback for current resolution
  const onRealtimeCallbackRef = useRef<any>(null);
  const subscribedResolutionRef = useRef<string | null>(null); // Track which resolution is subscribed
  const autoPlayIntervalRef = useRef<any>(null);
  const currentBarIndexRef = useRef(5);
  const autoSaveIntervalRef = useRef<any>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const totalBalanceRef = useRef<number>(10000);
  const sessionDataRef = useRef<SessionData | null>(null);
  const pendingOpenTradeRef = useRef<any>(null);
  const targetTimestampRef = useRef<number | null>(null);
  const barsCacheRef = useRef<Record<string, any[]>>({});
  const loadedRangeRef = useRef<Record<string, { from: number; to: number }>>({});
  const pendingCallbacksRef = useRef<Record<string, Array<{ callback: any; periodParams: any }>>>({});
  const fetchingRangeRef = useRef<Record<string, boolean>>({});
  const isChangingResolutionRef = useRef(false);
  const currentIntervalRef = useRef(initialInterval);
  const lastSessionKeyRef = useRef<string>("");
  const hasLoadedLayoutRef = useRef(false);
  const hasScrolledToStartRef = useRef(false);
  const replayTimestampRef = useRef<number>(0); // Tracks replay position as timestamp for consistent drawing anchors
  const replayIntervalRef = useRef<string>(initialInterval); // Tracks which interval the replayTimestamp was recorded from
  const pendingTimeframeSwitchRef = useRef<{ fromInterval: string; fromTimestamp: number } | null>(null); // Captures source interval at switch initiation
  const pendingAnchorTimestampRef = useRef<number | null>(null); // Set BEFORE resolution change so getBars can use correct anchor even when called early
  const pendingDrawingsRef = useRef<any[]>([]); // Stores drawings before resolution change for restoration
  const drawingSwitchIdRef = useRef<number>(0); // Unique ID for each timeframe switch to prevent race conditions
  const pendingVisibleRangeRef = useRef<{ from: number; to: number } | null>(null); // Stores visible range before resolution change
  const pendingVisibleRangeAppliedRef = useRef<boolean>(false); // Prevents double-application of visible range
  const favoriteDrawingToolsRef = useRef<string[]>([]); // Stores favorite drawing tools
  const lastSavedDrawingsCountRef = useRef<number>(0); // Tracks drawing count to prevent empty overwrites
  const userDeletedAllDrawingsRef = useRef<boolean>(false); // Tracks if user explicitly deleted all drawings
  const initialRestoreCompleteRef = useRef<boolean>(false); // Tracks if initial chart restore is complete
  const isRestoringDrawingsRef = useRef<boolean>(false); // Guards capture/save during drawing restoration
  const lastTfSwitchTimeRef = useRef<number>(0); // Timestamp of last TF switch completion - prevents auto-save from capturing TradingView-adjusted coords
  const allBarsRef = useRef<any[]>([]); // Ref for bars data to avoid widget recreation on data changes
  const widgetInitializedRef = useRef<boolean>(false); // Track if widget has been created
  const fetchingResolutionsRef = useRef<Set<string>>(new Set()); // Track in-flight resolution fetches
  const dataReadyForLayoutRef = useRef<boolean>(false); // Signal when bars are loaded and ready for layout restoration
  const isUnmountingRef = useRef<boolean>(false); // Track if component is unmounting to prevent empty saves
  const callbacksReadyRef = useRef<boolean>(false); // Gate handleNext until subscribeBars fires on current widget
  const replayReadyRef = useRef<boolean>(false); // TRANSACTIONAL GATE: blocks ALL replay advancement during TF switches
  const fastPathActiveRef = useRef<boolean>(false); // Prevents effect from enabling replayReady during fast-path TF switch

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [allBars, setAllBars] = useState<any[]>([]);
  const [currentBarIndex, setCurrentBarIndexState] = useState(5);
  const tradeLinesRef = useRef<Record<string, { entry: any; tp: any; sl: any }>>({});
  const openTradesRef = useRef<any[]>([]);
  
  // Options for setCurrentBarIndex
  type SetBarIndexOptions = {
    preserveTimestamp?: boolean;
    // During a timeframe switch, pass the source interval to keep replayIntervalRef stable
    // until the switch is finalized by the caller
    pendingSwitch?: { fromInterval: string };
  };
  
  // Helper to convert interval to milliseconds (inline to avoid dependency on useCallback)
  const intervalToMs = (interval: string): number => {
    // Handle Daily: TradingView sends both "D" and "1D"
    if (interval === "1D" || interval === "D") return 1440 * 60 * 1000;
    // Handle Weekly: TradingView sends both "W" and "1W"
    if (interval === "1W" || interval === "W") return 10080 * 60 * 1000;
    return (parseInt(interval) || 1) * 60 * 1000;
  };
  
  // Normalize resolution for cache key consistency
  // TradingView sends both "1D" and "D" for daily, "1W" and "W" for weekly
  // We normalize to a single key to prevent cache misses
  const normalizeCacheKey = (resolution: string): string => {
    if (resolution === "1D" || resolution === "D") return "D";
    if (resolution === "1W" || resolution === "W") return "W";
    if (resolution === "1M" || resolution === "M") return "M";
    return resolution;
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TIME-DRIVEN REPLAY SYSTEM (per FX Replay Spec)
  // replayTime is the ONLY source of truth. Candle index is ALWAYS derived.
  // ═══════════════════════════════════════════════════════════════════════════
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TIME-DRIVEN: Derive bar index from replayTime
  // Per FX Replay spec: A candle is "completed" when its close time <= replayTime
  // candle.closeTime = candle.openTime + interval
  // ═══════════════════════════════════════════════════════════════════════════
  const deriveBarIndexFromTime = (bars: any[], replayTime: number, interval: string): number => {
    if (!bars || bars.length === 0) return 0;
    
    const intervalMs = intervalToMs(interval);
    
    // Find last bar where bar.closeTime <= replayTime (candle has completed)
    // bar.closeTime = bar.time + intervalMs
    for (let i = bars.length - 1; i >= 0; i--) {
      const barCloseTime = bars[i].time + intervalMs;
      if (barCloseTime <= replayTime) {
        return i;
      }
    }
    
    // If no candle has completed yet, return 0
    return 0;
  };
  
  // Advance replayTime by one candle duration and derive new index
  // SMART SKIP: If we land in a gap (weekend/market closure), jump to next available bar
  const advanceReplayTime = (intervalMs: number): { newReplayTime: number; newIndex: number } => {
    const bars = allBarsRef.current;
    const currentReplayTime = replayTimestampRef.current;
    const currentIndex = currentBarIndexRef.current;
    const resolution = currentIntervalRef.current;
    const resolutionMs = intervalToMs(resolution); // Use resolution interval, not caller's interval
    
    // First, try advancing by the requested amount
    let newReplayTime = currentReplayTime + intervalMs;
    let newIndex = deriveBarIndexFromTime(bars, newReplayTime, resolution);
    
    // GUARD: Bypass smart skip during timeframe switches to preserve replayTime exactly
    // This prevents time drift when switching between 1H/15m/5m etc.
    const isSwitching = tfController.getIsSwitching();
    const callbacksNotReady = !callbacksReadyRef.current;
    
    // SMART SKIP: Check if we're in a gap by comparing against next bar's close time
    // This works for any step size (1 candle, skip forward, accelerated playback)
    // BUT: Only run when NOT switching timeframes
    if (!isSwitching && !callbacksNotReady && bars && bars.length > 0 && newIndex < bars.length - 1) {
      const nextBarIndex = newIndex + 1;
      const nextBar = bars[nextBarIndex];
      const nextBarCloseTime = nextBar.time + resolutionMs;
      
      // If our new time hasn't reached the next bar's close, but the next bar exists
      // and there's a significant gap (more than 2x the resolution), smart skip to it
      const timeSinceCurrentBarClose = newReplayTime - (bars[newIndex].time + resolutionMs);
      const timeToNextBarClose = nextBarCloseTime - newReplayTime;
      
      // Detect gap: if time since current bar close is positive (we're past it)
      // but next bar's close is still far away (more than 1 resolution interval ahead)
      if (timeSinceCurrentBarClose > 0 && timeToNextBarClose > resolutionMs) {
        // We're in a gap - jump directly to the next bar's close time
        const gapHours = Math.round(timeToNextBarClose / (1000 * 60 * 60));
        
        // Only log and skip if it's a significant gap (more than 2 hours for any timeframe)
        if (timeToNextBarClose > 2 * 60 * 60 * 1000) {
          console.log('advanceReplayTime: SMART SKIP over gap (weekend/holiday)', {
            skippedFrom: new Date(newReplayTime).toISOString(),
            skippedTo: new Date(nextBarCloseTime).toISOString(),
            gapHours,
          });
          
          newReplayTime = nextBarCloseTime;
          newIndex = nextBarIndex;
        }
      }
    }
    
    replayTimestampRef.current = newReplayTime;
    
    console.log('advanceReplayTime:', {
      oldTime: new Date(currentReplayTime).toISOString(),
      newTime: new Date(newReplayTime).toISOString(),
      intervalMs,
      derivedIndex: newIndex,
    });
    
    return { newReplayTime, newIndex };
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TIME-DRIVEN: Set replayTime first, then derive and update index
  // This is the ONLY way to update replay state - index is never set directly
  // ═══════════════════════════════════════════════════════════════════════════
  const setReplayTimeAndDeriveIndex = (newReplayTime: number, interval?: string) => {
    const currentInterval = interval || currentIntervalRef.current;
    const bars = allBarsRef.current;
    
    // Set replayTime first (the SINGLE source of truth)
    replayTimestampRef.current = newReplayTime;
    replayIntervalRef.current = currentInterval;
    
    // Derive index from replayTime
    const newIndex = bars && bars.length > 0 
      ? deriveBarIndexFromTime(bars, newReplayTime, currentInterval)
      : 0;
    
    // Update index state (purely derived)
    currentBarIndexRef.current = newIndex;
    setCurrentBarIndexState(newIndex);
    
    console.log('setReplayTimeAndDeriveIndex:', {
      replayTime: new Date(newReplayTime).toISOString(),
      interval: currentInterval,
      derivedIndex: newIndex,
      barTime: bars?.[newIndex] ? new Date(bars[newIndex].time).toISOString() : 'N/A',
    });
    
    return newIndex;
  };
  
  // Legacy wrapper for timeframe switches ONLY - routes through time-driven setter
  // DEPRECATED: Use setReplayTimeAndDeriveIndex for all new code
  const setCurrentBarIndex = (newIndex: number, bars?: any[], options: SetBarIndexOptions | boolean = false) => {
    const opts: SetBarIndexOptions = typeof options === 'boolean' 
      ? { preserveTimestamp: options }
      : options;
    const { preserveTimestamp = false, pendingSwitch } = opts;
    
    if (preserveTimestamp) {
      // During TF switch: just update index state, don't touch replayTime
      // This is the ONLY valid use case for this function
      currentBarIndexRef.current = newIndex;
      setCurrentBarIndexState(newIndex);
      if (pendingSwitch) {
        replayIntervalRef.current = pendingSwitch.fromInterval;
      }
    } else {
      // TIME-DRIVEN: Calculate replayTime from bar close time, then derive index
      const barsToUse = bars || allBarsRef.current;
      if (barsToUse && barsToUse[newIndex]) {
        const intervalMs = intervalToMs(currentIntervalRef.current);
        const newReplayTime = barsToUse[newIndex].time + intervalMs;
        setReplayTimeAndDeriveIndex(newReplayTime, currentIntervalRef.current);
      } else {
        // NO FALLBACK: If bars aren't available, log warning and skip
        // This prevents index-only updates that could desync from replayTime
        console.warn('setCurrentBarIndex: bars not available, cannot update state');
      }
    }
  };
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [decimalPlaces, setDecimalPlaces] = useState(0);
  const [currentInterval, setCurrentInterval] = useState(initialInterval);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(500);
  
  const tfController = useTimeframeSwitchController({
    onStateChange: (state) => {
      if (state !== 'IDLE') {
        setIsPlaying(false);
      }
    },
    onSwitchComplete: (targetInterval) => {
      console.log('[TF Controller] Switch complete:', targetInterval);
    },
    onSwitchError: (error) => {
      console.error('[TF Controller] Switch error:', error);
    },
  });
  const [lotSize, setLotSize] = useState(1);
  const [showPanel, setShowPanel] = useState(false);
  const [drawerHeight, setDrawerHeight] = useState(250);
  const [isDrawerResizing, setIsDrawerResizing] = useState(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(true);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'open' | 'pending' | 'closed'>('open');
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const drawerMinHeight = 150;
  const drawerMaxHeight = 500;
  const drawerCollapsedHeight = 64;

  const symbol = sessionData ? symbolToChartFormat(sessionData.symbol, sessionData.market) : '';
  const fromDate = sessionData?.fromDate || '';
  const toDate = sessionData?.toDate || '';
  const initialBalance = sessionData?.initialBalance || 10000;
  
  // Memoize contract size based on session symbol/market to ensure consistent P&L calculations
  const contractSize = useMemo(() => {
    if (!sessionData?.symbol) return 100000; // Default until session loads
    return getContractSize(sessionData.symbol, sessionData.market);
  }, [sessionData?.symbol, sessionData?.market]);
  const [showModifyTradePopup, setShowModifyTradePopup] = useState(false);
  const [modifyTradeData, setModifyTradeData] = useState({ newTP: "", newSL: "" });
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showQuickOrderDialog, setShowQuickOrderDialog] = useState(false);
  const [quickOrderData, setQuickOrderData] = useState({
    side: 'buy' as 'buy' | 'sell',
    lotSize: '1',
    takeProfit: '',
    stopLoss: '',
  });
  const [showSpeedDropdown, setShowSpeedDropdown] = useState(false);
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const [showSkipDurationDropdown, setShowSkipDurationDropdown] = useState(false);
  const [skipDuration, setSkipDuration] = useState("1"); // Skip duration in minutes (matches chart candle = 1 candle forward)
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [barPosition, setBarPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  
  const [orderFormData, setOrderFormData] = useState({
    balanceType: 'initial' as 'initial' | 'current',
    riskPercent: 1,
    side: 'buy' as 'buy' | 'sell',
    orderType: 'market' as 'market' | 'limit',
    entryPrice: '',
    positionSize: '',
    stopLossEnabled: true,
    stopLoss: '',
    stopLossTicks: '',
    takeProfitEnabled: true,
    takeProfit: '',
    takeProfitTicks: '',
    restrictedPositionSize: false,
  });

  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const bar = document.querySelector('.bt-floating-bar') as HTMLElement;
      const barWidth = bar?.offsetWidth || 600;
      const barHeight = bar?.offsetHeight || 50;
      
      // Calculate new position
      let newX = e.clientX - dragOffsetRef.current.x;
      let newY = e.clientY - dragOffsetRef.current.y;
      
      // Constrain within viewport bounds with 10px padding
      const padding = 10;
      newX = Math.max(padding, Math.min(newX, window.innerWidth - barWidth - padding));
      newY = Math.max(padding, Math.min(newY, window.innerHeight - barHeight - padding));
      
      setBarPosition({ x: newX, y: newY });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!isDrawerResizing) return;
    
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const newHeight = window.innerHeight - e.clientY;
      setDrawerHeight(Math.min(Math.max(newHeight, drawerMinHeight), drawerMaxHeight));
    };
    
    const handleMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setIsDrawerResizing(false);
    };
    
    const handleMouseLeave = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setIsDrawerResizing(false);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isDrawerResizing]);

  // Update TradingView chart theme when theme changes
  useEffect(() => {
    if (!tvWidgetRef.current) return;
    
    const applyTheme = () => {
      try {
        const newTheme = isDarkTheme ? 'dark' : 'light';
        const result = tvWidgetRef.current?.changeTheme(newTheme);
        // changeTheme returns a promise
        if (result && typeof result.then === 'function') {
          result.then(() => {
            console.log('Chart theme changed to:', newTheme);
          }).catch((e: any) => {
            console.log('Theme change failed:', e);
          });
        }
      } catch (e) {
        console.log('Could not change chart theme:', e);
      }
    };
    
    // Use onChartReady to ensure widget is ready
    try {
      tvWidgetRef.current.onChartReady(() => {
        applyTheme();
      });
    } catch (e) {
      // If onChartReady fails (widget already ready), try direct call
      applyTheme();
    }
  }, [isDarkTheme]);

  const handleDrawerResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDrawerResizing(true);
  };

  const handleBarDragStart = (e: React.MouseEvent) => {
    const bar = e.currentTarget.parentElement as HTMLElement;
    const rect = bar.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setBarPosition({ x: rect.left, y: rect.top });
    setIsDragging(true);
  };

  const [customTfInput, setCustomTfInput] = useState("");
  const [showCustomTfInput, setShowCustomTfInput] = useState(false);
  
  const timeframeOptions = [
    { value: "1", label: "1m" },
    { value: "3", label: "3m" },
    { value: "5", label: "5m" },
    { value: "15", label: "15m" },
    { value: "30", label: "30m" },
    { value: "60", label: "1H" },
    { value: "120", label: "2H" },
    { value: "240", label: "4H" },
    { value: "1D", label: "1D" },
    { value: "1W", label: "1W" },
  ];
  
  // Skip duration options - how much time to skip per forward click
  const skipDurationOptions = [
    { value: "1", label: "1 bar" },
    { value: "5", label: "5m" },
    { value: "15", label: "15m" },
    { value: "30", label: "30m" },
    { value: "60", label: "1H" },
    { value: "240", label: "4H" },
    { value: "1440", label: "1D" },
  ];
  
  // Helper to convert interval string to minutes
  const intervalToMinutes = useCallback((interval: string): number => {
    // Handle Daily: TradingView sends both "D" and "1D"
    if (interval === "1D" || interval === "D") return 1440;
    // Handle Weekly: TradingView sends both "W" and "1W"
    if (interval === "1W" || interval === "W") return 10080;
    return parseInt(interval) || 1;
  }, []);
  
  // ============================================================================
  // GET VALID ANCHOR - finds the most reliable timestamp for timeframe switching
  // CRITICAL: replayTimestampRef is the SINGLE SOURCE OF TRUTH for replay position
  // Per FX Replay spec: Time is absolute, index is derived
  // NOTE: replayTimestampRef now stores bar CLOSE time (elapsed time)
  // REMOVED: Index-based fallbacks that violated the time-driven spec
  // ============================================================================
  const getValidAnchor = useCallback((sourceIntervalMinutes: number): { barEndTime: number; source: string } => {
    // PRIORITY 1: replayTimestampRef - THE SINGLE SOURCE OF TRUTH
    // This is the absolute elapsed time in the replay (bar CLOSE time)
    const replayTs = replayTimestampRef.current;
    if (replayTs > 0) {
      return {
        barEndTime: replayTs,
        source: 'replayTimestamp'
      };
    }
    
    // Priority 2: Session progressPointer (saved position from database)
    if (sessionDataRef.current?.progressPointer) {
      const progressTs = new Date(sessionDataRef.current.progressPointer).getTime();
      if (progressTs > 0) {
        return {
          barEndTime: progressTs,
          source: 'progressPointer'
        };
      }
    }
    
    // Priority 3: fromDate prop (session start date) + one candle (last resort for fresh sessions)
    if (fromDate) {
      const startTs = new Date(fromDate).getTime();
      if (startTs > 0) {
        return {
          barEndTime: startTs + (sourceIntervalMinutes * 60 * 1000),
          source: 'fromDate'
        };
      }
    }
    
    // No valid anchor found - caller should block the operation
    return { barEndTime: 0, source: 'none' };
  }, [fromDate]);
  
  // ============================================================================
  // UNIFIED TIMEFRAME SWITCH HELPER
  // This single function handles all timeframe switching logic for both:
  // - handleTimeframeChange (custom dropdown)
  // - onIntervalChanged (TradingView native buttons)
  // ============================================================================
  const processTimeframeSwitch = useCallback((
    targetInterval: string,
    options: { 
      hideDropdown?: boolean; 
      triggerSymbolSwitch?: boolean;
      captureDrawings?: boolean;
    } = {}
  ) => {
    const { hideDropdown = false, triggerSymbolSwitch = true, captureDrawings = true } = options;
    
    // 1. CAPTURE SOURCE STATE (must be done first, before any mutations)
    const sourceInterval = currentIntervalRef.current;
    
    console.log('==== UNIFIED TIMEFRAME SWITCH ====');
    console.log('From:', sourceInterval, 'To:', targetInterval);
    console.log('[TF Controller] State:', tfController.state);
    
    // Skip if same interval
    if (sourceInterval === targetInterval) {
      if (hideDropdown) setShowTimeframeDropdown(false);
      return;
    }
    
    // CONTROLLER GATE: If already switching, queue this request and return
    if (tfController.getIsSwitching()) {
      console.log('[TF Controller] Already switching, queueing:', targetInterval);
      tfController.requestSwitch(targetInterval);
      if (hideDropdown) setShowTimeframeDropdown(false);
      return;
    }
    
    // START THE SWITCH via controller
    tfController.requestSwitch(targetInterval);
    setIsPlaying(false); // HARD PAUSE
    
    // 2. GET VALID ANCHOR - this is critical for correct positioning
    const sourceIntervalMinutes = intervalToMinutes(sourceInterval);
    const targetIntervalMinutes = intervalToMinutes(targetInterval);
    const { barEndTime: rawAnchor, source } = getValidAnchor(sourceIntervalMinutes);
    
    console.log('Anchor source:', source, 'rawAnchor:', rawAnchor > 0 ? new Date(rawAnchor).toISOString() : 'N/A');
    
    // 2a. HTF BOUNDARY SNAP: When switching from larger TF to smaller TF,
    // snap anchor to the actual HTF candle close time (not epoch-aligned)
    // This ensures 1H close price = 5m close price when switching from 1H to 5m
    // Uses actual bar data to handle session offsets (e.g., FX daily closes at 17:00 NY)
    let barEndTime = rawAnchor;
    if (sourceIntervalMinutes > targetIntervalMinutes && rawAnchor > 0) {
      const sourceIntervalMs = sourceIntervalMinutes * 60 * 1000;
      const bars = allBarsRef.current;
      
      if (bars && bars.length > 0) {
        // Find the last completed bar in the source timeframe
        // A bar is completed when its closeTime <= rawAnchor
        let lastCompletedBarCloseTime: number | null = null;
        for (let i = bars.length - 1; i >= 0; i--) {
          const barCloseTime = bars[i].time + sourceIntervalMs;
          if (barCloseTime <= rawAnchor) {
            lastCompletedBarCloseTime = barCloseTime;
            break;
          }
        }
        
        // Only snap if we found a different anchor (we're not already on a boundary)
        if (lastCompletedBarCloseTime && lastCompletedBarCloseTime !== rawAnchor) {
          console.log('HTF BOUNDARY SNAP: Switching to smaller TF, snapping to actual bar close');
          console.log('  From:', new Date(rawAnchor).toISOString());
          console.log('  To:  ', new Date(lastCompletedBarCloseTime).toISOString());
          barEndTime = lastCompletedBarCloseTime;
          
          // CRITICAL: Also update the source of truth (replayTimestampRef)
          // so subsequent switches use the snapped value
          replayTimestampRef.current = lastCompletedBarCloseTime;
        }
      }
    }
    
    // 3. BLOCK SWITCH only if no valid anchor exists at all
    if (barEndTime <= 0 || source === 'none') {
      console.error('Cannot switch timeframe: no valid anchor available, source:', source);
      tfController.abort('No valid anchor');
      // Show notification to user
      if (typeof window !== 'undefined') {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-amber-500 text-black px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = 'Please wait for data to load before switching timeframes';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
      if (hideDropdown) setShowTimeframeDropdown(false);
      return;
    }
    
    // CRITICAL: Use barEndTime directly as the anchor - it represents elapsed replay time
    // Per FX Replay spec: replayTime is the SINGLE SOURCE OF TRUTH
    // getBars filters bars where bar.time <= anchor, so using barEndTime ensures all
    // completed candles up to this point are shown in the target timeframe
    pendingAnchorTimestampRef.current = barEndTime;
    console.log('Set pendingAnchorTimestampRef (elapsed time):', new Date(barEndTime).toISOString());
    
    // 4. STOP AUTO-PLAY to prevent timestamp drift during switch
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }
    setIsPlaying(false);
    
    // 4a. CRITICAL: Reset callback state to prevent stale callbacks from being used
    // This forces handleNext to wait until TradingView calls subscribeBars with fresh callback
    callbacksReadyRef.current = false;
    onRealtimeCallbackRef.current = null;
    console.log('Reset callback state for timeframe switch');
    
    console.log('Bar end time (replay elapsed):', new Date(barEndTime).toISOString());
    
    // 5. STORE PENDING SWITCH INFO for async callbacks
    // Use barEndTime as the anchor - it represents elapsed replay time
    pendingTimeframeSwitchRef.current = { 
      fromInterval: sourceInterval, 
      fromTimestamp: barEndTime
    };
    
    // 5a. CAPTURE VISIBLE RANGE before resolution change (for zoom preservation)
    if (tvWidgetRef.current) {
      try {
        const chart = tvWidgetRef.current.activeChart();
        const visibleRange = chart.getVisibleRange();
        if (visibleRange && visibleRange.from != null && visibleRange.to != null) {
          pendingVisibleRangeRef.current = visibleRange;
          pendingVisibleRangeAppliedRef.current = false; // Reset flag for new capture
          console.log('Captured visible range:', visibleRange);
        }
      } catch (e) {
        console.warn('Could not capture visible range:', e);
      }
    }
    
    // 5b. Drawing switch tracking (for legacy compatibility, but drawings now handled by TradingView natively)
    // Increment switch ID for logging
    drawingSwitchIdRef.current += 1;
    const currentSwitchId = drawingSwitchIdRef.current;
    console.log('Timeframe switch ID:', currentSwitchId, '(drawings handled by TradingView natively)');
    
    // 6. CHECK CACHE and determine fast/slow path
    const targetCacheKey = normalizeCacheKey(targetInterval);
    const cachedBars = barsCacheRef.current[targetCacheKey];
    let useFastPath = false;
    
    if (cachedBars && cachedBars.length > 0) {
      const firstBarTime = cachedBars[0].time;
      const lastBarTime = cachedBars[cachedBars.length - 1].time;
      
      // Use fast path if bar end time is within cached range
      if (barEndTime >= firstBarTime && barEndTime <= lastBarTime + (intervalToMinutes(targetInterval) * 60 * 1000)) {
        useFastPath = true;
      } else {
        console.log('Cache invalid for target position - using slow path');
        delete barsCacheRef.current[targetCacheKey];
        delete loadedRangeRef.current[targetCacheKey];
      }
    }
    
    // 7. UPDATE INTERVAL REFS (do this before async operations)
    currentIntervalRef.current = targetInterval;
    
    if (useFastPath && cachedBars) {
      fastPathActiveRef.current = true; // Prevent effect from enabling replayReady
      console.log('Using FAST PATH with', cachedBars.length, 'cached bars');
      
      // Set flag to prevent data fetch effect from running
      isChangingResolutionRef.current = true;
      
      // Update refs immediately
      allBarsRef.current = cachedBars;
      subscribedResolutionRef.current = targetInterval;
      
      // Check for cached callback - if exists, store it; otherwise clear it
      // CRITICAL: Do NOT set callbacksReadyRef true until AFTER setReplayTimeAndDeriveIndex
      const cachedCallback = realtimeCallbacksRef.current.get(targetInterval);
      if (cachedCallback) {
        onRealtimeCallbackRef.current = cachedCallback;
      } else {
        onRealtimeCallbackRef.current = null;
        console.log('Fast-path: No cached callback for', targetInterval, '- waiting for TradingView to resubscribe');
      }
      
      // CRITICAL: Block handleNext during the switch to prevent stale state access
      callbacksReadyRef.current = false;
      
      // ═══════════════════════════════════════════════════════════════════════════
      // TIME-DRIVEN APPROACH: replayTime is absolute, timeframe is just a view
      // Per FX Replay spec: Never reset replay on TF switch
      // ═══════════════════════════════════════════════════════════════════════════
      const replayTs = replayTimestampRef.current;
      console.log('Fast-path: Using replayTime:', new Date(replayTs).toISOString());
      
      // CRITICAL: Clear pending switch BEFORE calling setReplayTimeAndDeriveIndex
      // This ensures no downstream effects read stale pendingAnchorTimestampRef
      pendingTimeframeSwitchRef.current = null;
      pendingAnchorTimestampRef.current = null;
      
      // UPDATE STATE
      setAllBars(cachedBars);
      setCurrentInterval(targetInterval);
      if (hideDropdown) setShowTimeframeDropdown(false);
      
      // TIME-DRIVEN: Use canonical setter to derive index from existing replayTime
      // Note: allBarsRef was already set to cachedBars at line 873
      const derivedIndex = setReplayTimeAndDeriveIndex(replayTs, targetInterval);
      console.log('Fast-path TF switch: replayTime=', new Date(replayTs).toISOString(), 'derived index=', derivedIndex);
      
      // NOW flip callbacksReadyRef AFTER setReplayTimeAndDeriveIndex has settled
      // If we have cached callback, enable immediately. Otherwise subscribeBars will enable it.
      callbacksReadyRef.current = !!cachedCallback;
      
      // TRIGGER TRADINGVIEW UPDATE if requested (for custom dropdown changes)
      if (triggerSymbolSwitch && tvWidgetRef.current) {
        try {
          const chart = tvWidgetRef.current.activeChart();
          const cachedCallback = realtimeCallbacksRef.current.get(targetInterval);
          
          // DRAWING PRESERVATION: Use drawings already captured in processTimeframeSwitch
          // setSymbol with dynamic suffix ensures TradingView calls getBars with fresh data
          // Drawings were captured in processTimeframeSwitch; DO NOT recapture here to avoid race conditions
          const baseSymbol = sessionDataRef.current?.symbol || 'EUR/USD';
          const symbolWithSuffix = `${baseSymbol}#tf_${targetInterval}_${Date.now()}`;
          const restoreSwitchId = drawingSwitchIdRef.current; // Capture switch ID for restore validation
          
          console.log('Fast-path: Using', pendingDrawingsRef.current.length, 'drawings from capture (switch', restoreSwitchId, ')');
          
          if (cachedCallback) {
            console.log('Fast-path: Using setSymbol with dynamic suffix:', symbolWithSuffix);
            
            chart.setSymbol(symbolWithSuffix, () => {
              chart.setResolution(targetInterval, () => {
                // CRITICAL: Wait for dataReady before restoring drawings
                // This ensures bars are loaded so drawings anchor to correct timestamps
                const innerChart = tvWidgetRef.current?.activeChart();
                if (!innerChart) {
                  tfController.finalize(targetInterval);
                  fastPathActiveRef.current = false;
                  isChangingResolutionRef.current = false;
                  return;
                }
                
                innerChart.dataReady(() => {
                  console.log('Fast-path: dataReady fired, restoring drawings');
                  try {
                    // RESTORE DRAWINGS after data loaded (only if switch ID matches to prevent race conditions)
                    if (pendingDrawingsRef.current.length > 0 && drawingSwitchIdRef.current === restoreSwitchId) {
                      console.log('Fast-path: Restoring', pendingDrawingsRef.current.length, 'drawings (switch', restoreSwitchId, ')');
                      isRestoringDrawingsRef.current = true;
                      DrawingManager.clearAllDrawings(innerChart);
                      DrawingManager.restoreDrawings(innerChart, pendingDrawingsRef.current);
                      pendingDrawingsRef.current = [];
                      setTimeout(() => { isRestoringDrawingsRef.current = false; }, 3000);
                    } else if (drawingSwitchIdRef.current !== restoreSwitchId) {
                      console.log('Fast-path: Skipping restore - newer switch in progress (', restoreSwitchId, 'vs', drawingSwitchIdRef.current, ')');
                    }
                    
                    // Center chart on replay position
                    const replayTs = replayTimestampRef.current;
                    if (replayTs > 0) {
                      const resolutionMinutes = intervalToMinutes(targetInterval);
                      const barMs = resolutionMinutes * 60 * 1000;
                      const visibleFrom = (replayTs - barMs * 60) / 1000;
                      const visibleTo = (replayTs + barMs * 20) / 1000;
                      innerChart.setVisibleRange({ from: visibleFrom, to: visibleTo });
                      try {
                        innerChart.getPanes()[0].getMainSourcePriceScale().setAutoScale(true);
                      } catch (e) {}
                    }
                    
                    // ATOMIC TRANSACTION COMPLETE: Re-enable replay
                    // CRITICAL: Ensure callbacksReady is true - TradingView may not call subscribeBars
                    // on repeated switches to same resolution, so restore from cached callbacks
                    if (!callbacksReadyRef.current) {
                      const cachedCb = realtimeCallbacksRef.current.get(targetInterval);
                      if (cachedCb) {
                        console.log('Fast-path: Restoring cached callback for', targetInterval);
                        subscribedResolutionRef.current = targetInterval;
                        onRealtimeCallbackRef.current = cachedCb;
                        callbacksReadyRef.current = true;
                      } else {
                        console.warn('Fast-path: No cached callback for', targetInterval);
                      }
                    }
                    console.log('Fast-path: callbacksReady=', callbacksReadyRef.current);
                    
                    // VERIFY SYNC: Confirm derived state matches replayTime
                    const bars = allBarsRef.current;
                    const idx = currentBarIndexRef.current;
                    const replayTs2 = replayTimestampRef.current;
                    const resMinutes = intervalToMinutes(targetInterval);
                    const intervalMs = resMinutes * 60 * 1000;
                    
                    if (bars && bars.length > 0 && idx >= 0 && idx < bars.length) {
                      const barCloseTime = bars[idx].time + intervalMs;
                      if (barCloseTime > replayTs2) {
                        console.error('SYNC VERIFY FAILED: bar close > replayTime', { barCloseTime, replayTs: replayTs2, idx });
                      } else {
                        console.log('Fast-path: SYNC VERIFIED, replayReady=true');
                      }
                    }
                    
                    // Only NOW enable replay via controller
                    lastTfSwitchTimeRef.current = Date.now(); // Mark switch completion time
                    tfController.finalize(targetInterval);
                    fastPathActiveRef.current = false;
                  } catch (e) {
                    console.warn('Error in post-switch cleanup:', e);
                    lastTfSwitchTimeRef.current = Date.now();
                    tfController.finalize(targetInterval);
                    fastPathActiveRef.current = false;
                  }
                  isChangingResolutionRef.current = false;
                }); // Close dataReady callback
              }); // Close setResolution callback
            }); // Close setSymbol callback
          } else {
            // Fallback: No cached callback - use same setSymbol approach
            console.log('Fast-path fallback: Using setSymbol with dynamic suffix:', symbolWithSuffix);
            
            chart.setSymbol(symbolWithSuffix, () => {
              chart.setResolution(targetInterval, () => {
                // CRITICAL: Wait for dataReady before restoring drawings
                const innerChart = tvWidgetRef.current?.activeChart();
                if (!innerChart) {
                  tfController.finalize(targetInterval);
                  fastPathActiveRef.current = false;
                  isChangingResolutionRef.current = false;
                  return;
                }
                
                innerChart.dataReady(() => {
                  console.log('Fast-path fallback: dataReady fired, restoring drawings');
                  try {
                    // RESTORE DRAWINGS after data loaded (only if switch ID matches)
                    if (pendingDrawingsRef.current.length > 0 && drawingSwitchIdRef.current === restoreSwitchId) {
                      console.log('Fast-path fallback: Restoring', pendingDrawingsRef.current.length, 'drawings (switch', restoreSwitchId, ')');
                      isRestoringDrawingsRef.current = true;
                      DrawingManager.clearAllDrawings(innerChart);
                      DrawingManager.restoreDrawings(innerChart, pendingDrawingsRef.current);
                      pendingDrawingsRef.current = [];
                      setTimeout(() => { isRestoringDrawingsRef.current = false; }, 3000);
                    } else if (drawingSwitchIdRef.current !== restoreSwitchId) {
                      console.log('Fast-path fallback: Skipping restore - newer switch in progress');
                    }
                    
                    const replayTs = replayTimestampRef.current;
                    if (replayTs > 0) {
                      const resolutionMinutes = intervalToMinutes(targetInterval);
                      const barMs = resolutionMinutes * 60 * 1000;
                      const visibleFrom = (replayTs - barMs * 60) / 1000;
                      const visibleTo = (replayTs + barMs * 20) / 1000;
                      innerChart.setVisibleRange({ from: visibleFrom, to: visibleTo });
                      try {
                        innerChart.getPanes()[0].getMainSourcePriceScale().setAutoScale(true);
                      } catch (e) {}
                    }
                    
                    // ATOMIC TRANSACTION COMPLETE: Re-enable replay
                    // CRITICAL: Ensure callbacksReady is true - TradingView may not call subscribeBars
                    // on repeated switches to same resolution, so restore from cached callbacks
                    if (!callbacksReadyRef.current) {
                      const cachedCb = realtimeCallbacksRef.current.get(targetInterval);
                      if (cachedCb) {
                        console.log('Fast-path fallback: Restoring cached callback for', targetInterval);
                        subscribedResolutionRef.current = targetInterval;
                        onRealtimeCallbackRef.current = cachedCb;
                        callbacksReadyRef.current = true;
                      } else {
                        console.warn('Fast-path fallback: No cached callback for', targetInterval);
                      }
                    }
                    console.log('Fast-path fallback: callbacksReady=', callbacksReadyRef.current);
                    
                    // VERIFY SYNC: Confirm derived state matches replayTime
                    const bars = allBarsRef.current;
                    const idx = currentBarIndexRef.current;
                    const replayTs2 = replayTimestampRef.current;
                    const resMinutes = intervalToMinutes(targetInterval);
                    const intervalMs = resMinutes * 60 * 1000;
                    
                    if (bars && bars.length > 0 && idx >= 0 && idx < bars.length) {
                      const barCloseTime = bars[idx].time + intervalMs;
                      if (barCloseTime > replayTs2) {
                        console.error('SYNC VERIFY FAILED (fallback): bar close > replayTime', { barCloseTime, replayTs: replayTs2, idx });
                      } else {
                        console.log('Fast-path fallback: SYNC VERIFIED, replayReady=true');
                      }
                    }
                    
                    // Only NOW enable replay via controller
                    lastTfSwitchTimeRef.current = Date.now(); // Mark switch completion time
                    tfController.finalize(targetInterval);
                    fastPathActiveRef.current = false;
                  } catch (e) {
                    console.warn('Error in post-switch cleanup:', e);
                    lastTfSwitchTimeRef.current = Date.now();
                    tfController.finalize(targetInterval);
                    fastPathActiveRef.current = false;
                  }
                  isChangingResolutionRef.current = false;
                }); // Close dataReady callback
              }); // Close setResolution callback
            }); // Close setSymbol callback
          }
        } catch (e) {
          isChangingResolutionRef.current = false;
        }
      } else {
        isChangingResolutionRef.current = false;
      }
    } else {
      // CRITICAL: Reset fastPathActiveRef so the native TF handler knows we're on slow path
      fastPathActiveRef.current = false;
      // CRITICAL: Reset isChangingResolutionRef so the useEffect can run fetchAllHistory
      // Without this, the slow path would leave the flag stuck at true
      isChangingResolutionRef.current = false;
      console.log('Using SLOW PATH - will fetch data');
      // Slow path: need to fetch from API
      // CRITICAL: Set targetTimestampRef to bar-start for fetch anchor, but per FX Replay spec,
      // replayTimestampRef (the absolute replay time) NEVER changes on timeframe switch.
      targetTimestampRef.current = barStartTime;
      // Do NOT update replayTimestampRef here - it only changes when user advances replay
      
      // Keep pending switch info for the effect to use
      // (pendingTimeframeSwitchRef was already set above)
      
      setCurrentInterval(targetInterval);
      if (hideDropdown) setShowTimeframeDropdown(false);
    }
  }, [intervalToMinutes, setCurrentBarIndex, getValidAnchor]);
  
  // Calculate how many candles to skip based on skip duration and chart timeframe
  // Uses Math.round to honor the configured duration as closely as possible
  const getCandlesToSkip = useCallback((): number => {
    if (skipDuration === "1") return 1; // "1 bar" option = always 1 candle
    const skipMinutes = parseInt(skipDuration) || 1;
    const chartMinutes = intervalToMinutes(currentInterval);
    return Math.max(1, Math.round(skipMinutes / chartMinutes));
  }, [skipDuration, currentInterval, intervalToMinutes]);
  
  const handleCustomTf = () => {
    const val = parseInt(customTfInput);
    if (val > 0 && val <= 10080) {
      handleTimeframeChange(String(val));
      setShowCustomTfInput(false);
      setCustomTfInput("");
    }
  };

  const handleSpeedSliderChange = (value: number) => {
    setSpeedMultiplier(value);
    setPlaybackSpeed(800 / value);
  };

  // Simplified wrapper that delegates to unified helper
  const handleTimeframeChange = (tf: string) => {
    processTimeframeSwitch(tf, { hideDropdown: true, triggerSymbolSwitch: true, captureDrawings: true });
  };

  const [tradingState, dispatch] = useReducer(tradingReducer, {
    openTrades: [],
    potentialTrade: null,
    limitOrders: [],
    balance: initialBalance,
    unrealisedPL: 0,
    realisedPL: 0,
    tradeHistory: [],
  });

  const totalBalance = initialBalance + tradingState.realisedPL + tradingState.unrealisedPL;
  
  // isEndReached: Check if we've reached the SESSION end date, not just loaded bars
  // This allows fetching more bars when at the end of loaded data
  // NOTE: Not using useMemo because replayTimestampRef is a ref and won't trigger re-renders
  const getIsEndReached = (): boolean => {
    const atEndOfLoadedBars = currentBarIndex >= allBars.length - 1;
    
    // If not at end of loaded bars, definitely not at end
    if (!atEndOfLoadedBars) return false;
    
    // If no session data or no toDate, only check loaded bars
    if (!sessionData?.toDate) return atEndOfLoadedBars;
    
    // Parse toDate and set to END of day (23:59:59.999) to ensure full day coverage
    // toDate is typically "YYYY-MM-DD" which parses to midnight START of that day
    const sessionEndDate = new Date(sessionData.toDate);
    sessionEndDate.setHours(23, 59, 59, 999);
    const sessionEndTs = sessionEndDate.getTime();
    
    const currentReplayTime = replayTimestampRef.current;
    
    // Only consider "end reached" if we're past the session end date
    return currentReplayTime >= sessionEndTs;
  };
  
  // For UI elements that need the value (buttons, etc.)
  const isEndReached = getIsEndReached();
  const winTrades = tradingState.tradeHistory.filter((trade) => trade.pnl > 0);
  const winRate = tradingState.tradeHistory.length > 0
    ? (winTrades.length / tradingState.tradeHistory.length) * 100 : 0;

  // Keep refs in sync with state for use in interval callbacks
  useEffect(() => {
    totalBalanceRef.current = totalBalance;
  }, [totalBalance]);

  useEffect(() => {
    sessionDataRef.current = sessionData;
  }, [sessionData]);

  // Keep allBarsRef in sync with allBars - used by widget to avoid recreation on data changes
  useEffect(() => {
    allBarsRef.current = allBars;
  }, [allBars]);
  
  // Keep currentIntervalRef in sync with currentInterval - critical for replay functionality
  useEffect(() => {
    currentIntervalRef.current = currentInterval;
  }, [currentInterval]);

  // Boolean flag for widget effect - only triggers when bars go from empty to having data
  const hasBarsData = allBars.length > 0;

  // Fetch session data AND initial bars in one request for faster load
  useEffect(() => {
    const fetchSessionWithData = async () => {
      try {
        setSessionLoading(true);
        setIsLoading(true);
        dataReadyForLayoutRef.current = false; // Reset data-ready signal for fresh load
        
        // Check URL for forceRefresh parameter to clear cache and refetch
        const urlParams = new URLSearchParams(window.location.search);
        const forceRefresh = urlParams.get('forceRefresh') === 'true';
        
        // Use combined endpoint that fetches session + bars in one request
        const res = await fetch(`/api/backtest-sessions/with-data?sessionId=${sessionId}&resolution=${currentIntervalRef.current}${forceRefresh ? '&forceRefresh=true' : ''}`);
        const result = await res.json();
        
        if (result.success && result.session) {
          const sessionResult = result.session;
          setSessionData(sessionResult);
          
          // Check for VPS error or no data
          if (result.bars && result.bars.s === 'error') {
            setLoadError(result.bars.errmsg || 'Data server temporarily unavailable. Please try again.');
            setIsLoading(false);
            setSessionLoading(false);
            return;
          }
          
          // Check if VPS returned no data
          if (!result.bars || result.bars.s === 'no_data' || !result.bars.t || result.bars.t.length === 0) {
            setLoadError('No market data available for this date range. The data server may be slow - please wait and try again.');
            setIsLoading(false);
            setSessionLoading(false);
            return;
          }
          
          // Process bars data if available
          if (result.bars && result.bars.s === 'ok' && result.bars.t && result.bars.t.length > 0) {
            const bars = result.bars.t.map((time: number, i: number) => ({
              time: time * 1000,
              open: result.bars.o[i],
              high: result.bars.h[i],
              low: result.bars.l[i],
              close: result.bars.c[i],
              volume: result.bars.v?.[i] || 0,
            }));
            
            // Set decimal places based on instrument type
            const symbolDecimalPlaces = getDecimalPlaces(sessionResult.symbol, sessionResult.market);
            setDecimalPlaces(symbolDecimalPlaces);
            
            // Cache bars for this resolution and track loaded range
            // Use normalized cache key for consistency (1D/D -> D)
            const initialCacheKey = normalizeCacheKey(result.resolution);
            barsCacheRef.current[initialCacheKey] = bars;
            // Track the actual loaded data range (10 years history to session end)
            const firstBarTs = bars.length > 0 ? bars[0].time / 1000 : 0;
            const lastBarTs = bars.length > 0 ? bars[bars.length - 1].time / 1000 : 0;
            loadedRangeRef.current[initialCacheKey] = { from: firstBarTs, to: lastBarTs };
            lastSessionKeyRef.current = `${sessionResult.symbol}-${sessionResult.market}-${sessionResult.fromDate}-${sessionResult.toDate}`;
            
            // Signal that data is ready for layout restoration
            dataReadyForLayoutRef.current = true;
            console.log('Data ready signal set (from with-data endpoint) - layout can now restore safely');
            
            // CRITICAL: Update ref IMMEDIATELY so handleNext sees correct bars
            allBarsRef.current = bars;
            setAllBars(bars);
            
            // ═══════════════════════════════════════════════════════════════════
            // TIME-DRIVEN: Session Resume
            // Use setReplayTimeAndDeriveIndex as the canonical setter
            // ═══════════════════════════════════════════════════════════════════
            
            // Get resolution interval in ms
            const resolutionMinutes = intervalToMinutes(result.resolution);
            const intervalMs = resolutionMinutes * 60 * 1000;
            
            // Determine replayTime (from progressPointer or fromDate)
            let targetReplayTime: number;
            if (sessionResult.progressPointer && sessionResult.progressPointer > 0) {
              // Resume from saved progress position
              targetReplayTime = typeof sessionResult.progressPointer === 'number' 
                ? sessionResult.progressPointer 
                : new Date(sessionResult.progressPointer).getTime();
              console.log('Session resume: Using progressPointer:', new Date(targetReplayTime).toISOString());
            } else {
              // Fresh session - start at fromDate + one candle duration (so first candle is "completed")
              // TIME-DRIVEN: Use fromDate directly, not a bar index, to stay within session window
              const startTs = result.replayStartTs ? result.replayStartTs * 1000 : new Date(sessionResult.fromDate).getTime();
              targetReplayTime = startTs + intervalMs;
              
              // CLAMP: If data starts after fromDate, use first bar's close time to stay in data window
              if (bars.length > 0 && targetReplayTime < bars[0].time + intervalMs) {
                targetReplayTime = bars[0].time + intervalMs;
                console.log('Session resume: Clamped to first bar close:', new Date(targetReplayTime).toISOString());
              } else {
                console.log('Session resume: Using fromDate + interval:', new Date(targetReplayTime).toISOString());
              }
            }
            
            // TIME-DRIVEN: Use canonical setter to set replayTime and derive index
            const derivedIndex = setReplayTimeAndDeriveIndex(targetReplayTime, result.resolution);
            console.log('Session resume: Derived index:', derivedIndex);
          }
          
          // Load existing trades from session
          if (sessionResult.trades && sessionResult.trades.length > 0) {
            let totalPnl = 0;
            const closedTrades: any[] = [];
            let openTrade: any = null;
            
            for (const t of sessionResult.trades) {
              if (t.status === 'closed') {
                totalPnl += t.pnl || 0;
                closedTrades.push({
                  id: t.id,
                  type: t.side === 'buy' ? 'long' : 'short',
                  entry: t.entryPrice,
                  exit: t.exitPrice,
                  sl: t.sl,
                  tp: t.tp,
                  lotSize: t.size,
                  pnl: t.pnl || 0,
                  rr: t.rr || 0,
                  reason: t.notes || 'Closed',
                  status: 'closed',
                  timestamp: t.closedAt || t.openedAt,
                });
              } else if (t.status === 'open' && !openTrade) {
                openTrade = {
                  type: t.side === 'buy' ? 'long' : 'short',
                  entry: t.entryPrice,
                  target: t.tp,
                  stopLoss: t.sl,
                  dbId: t.id,
                };
                setLotSize(t.size || 1);
              }
            }
            
            dispatch({ type: "SET_TRADE_HISTORY", payload: closedTrades });
            dispatch({ type: "SET_REALISED_PL", payload: totalPnl });
            
            if (openTrade) {
              pendingOpenTradeRef.current = openTrade;
            }
          }
          
          // Background preload common timeframes after a short delay
          setTimeout(() => {
            preloadCommonTimeframes(sessionResult);
          }, 2000);
          
        } else {
          console.error("Session not found");
          router.push('/backtesting/dashboard');
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
        router.push('/backtesting/dashboard');
      } finally {
        setSessionLoading(false);
        setIsLoading(false);
      }
    };
    
    // Background preload function for common timeframes - runs ALL in parallel for faster cache warming
    const preloadCommonTimeframes = async (session: SessionData) => {
      const allTimeframes = ['1', '5', '15', '30', '60', '120', '240', 'D'];
      const currentTf = currentIntervalRef.current;
      
      // Filter out already cached and current timeframe
      // Use normalized keys for cache check
      const currentCacheKey = normalizeCacheKey(currentTf);
      const toPreload = allTimeframes.filter(tf => {
        const tfCacheKey = normalizeCacheKey(tf);
        return tfCacheKey !== currentCacheKey && !barsCacheRef.current[tfCacheKey];
      });
      if (toPreload.length === 0) return;
      
      console.log('Pre-warming cache for timeframes:', toPreload.join(', '));
      
      // Determine anchor: replay position > progress pointer > session start
      const replayTs = replayTimestampRef.current;
      let anchorDate: Date;
      if (replayTs > 0) {
        anchorDate = new Date(replayTs);
      } else if (session.progressPointer) {
        anchorDate = new Date(session.progressPointer);
      } else {
        anchorDate = new Date(session.fromDate);
      }
      console.log('Preload anchor date:', anchorDate.toISOString());
      
      // Fetch ALL timeframes in parallel for maximum speed
      const preloadPromises = toPreload.map(async (tf) => {
        try {
          // CRITICAL: Polygon API returns earliest 50k bars from requested range
          // So we need to request a SMALLER window that's biased to include the anchor
          // For intraday: 1 month back, 1 month forward (will definitely include anchor)
          // For daily+: 5 years back, 5 years forward
          const isIntraday = !['D', 'W', 'M'].includes(tf);
          const monthsBack = isIntraday ? 1 : 60;  // 1 month for intraday, 5 years for daily
          const monthsForward = isIntraday ? 1 : 60;
          const windowStartDate = subMonths(anchorDate, monthsBack);
          const windowEndDate = addMonths(anchorDate, monthsForward);
          const fromTs = Math.floor(windowStartDate.getTime() / 1000);
          const toTs = Math.floor(windowEndDate.getTime() / 1000);
          const apiUrl = `/api/backtest/bars?market=${session.market || 'FOREX'}&symbol=${session.symbol}&resolution=${tf}&to=${toTs}&from=${fromTs}`;
          
          const response = await fetch(apiUrl);
          const data = await response.json();
          
          if (data && data.s === 'ok' && data.t && data.t.length > 0) {
            const bars = data.t.map((time: number, i: number) => ({
              time: time * 1000,
              open: data.o[i],
              high: data.h[i],
              low: data.l[i],
              close: data.c[i],
              volume: data.v?.[i] || 0,
            }));
            const preloadCacheKey = normalizeCacheKey(tf);
            barsCacheRef.current[preloadCacheKey] = bars;
            loadedRangeRef.current[preloadCacheKey] = { from: fromTs, to: toTs };
            console.log('Preloaded', bars.length, 'bars for timeframe', tf, '(key:', preloadCacheKey, ')');
            return { tf, success: true, count: bars.length };
          }
          return { tf, success: false };
        } catch (e) {
          return { tf, success: false, error: e };
        }
      });
      
      // Wait for all to complete (don't block UI)
      const results = await Promise.allSettled(preloadPromises);
      const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as any)?.success).length;
      console.log(`Cache pre-warming complete: ${successCount}/${toPreload.length} timeframes cached`);
    };
    
    fetchSessionWithData();
    sessionStartTimeRef.current = Date.now();
  }, [sessionId, router]);

  // Auto-save progress every 30 seconds - use refs to avoid restarting interval on state changes
  useEffect(() => {
    if (!sessionData || allBars.length === 0) return;

    const saveProgress = async () => {
      const currentSession = sessionDataRef.current;
      const currentBalance = totalBalanceRef.current;
      const currentBar = allBars[currentBarIndexRef.current];
      if (!currentBar || !currentSession) return;
      
      const elapsedMinutes = Math.floor((Date.now() - sessionStartTimeRef.current) / 60000);
      const newTimeInvested = (currentSession.timeInvested || 0) + elapsedMinutes;
      sessionStartTimeRef.current = Date.now(); // Reset for next interval
      
      try {
        await fetch('/api/backtest-sessions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: parseInt(sessionId),
            progressPointer: currentBar.time,
            currentBalance: currentBalance,
            timeInvested: newTimeInvested,
          }),
        });
        // Update local session data via ref (avoid state update that would trigger effect)
        sessionDataRef.current = { ...currentSession, timeInvested: newTimeInvested, progressPointer: currentBar.time };
      } catch (error) {
        console.error("Failed to save progress:", error);
      }
    };

    autoSaveIntervalRef.current = setInterval(saveProgress, 30000);
    
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData?.sessionId, sessionId, allBars.length]);

  // Helper function to fetch bars for a specific resolution and fulfill pending callbacks
  // This is called from getBars when TradingView requests a resolution we don't have cached
  const fetchBarsForResolution = async (resolution: string) => {
    // Avoid duplicate fetches for the same resolution
    if (fetchingResolutionsRef.current.has(resolution)) {
      console.log('Already fetching resolution', resolution, '- skipping duplicate');
      return;
    }
    
    const session = sessionDataRef.current || sessionData;
    if (!session || !fromDate || !toDate || !session.symbol) {
      console.log('Missing session data for fetch - skipping');
      return;
    }
    
    fetchingResolutionsRef.current.add(resolution);
    console.log('Fetching bars for resolution:', resolution);
    
    try {
      // Determine anchor timestamp: replay position > progress pointer > session start
      const replayTs = replayTimestampRef.current;
      let anchorDate: Date;
      if (replayTs > 0) {
        anchorDate = new Date(replayTs);
        console.log('Using replay timestamp as anchor:', anchorDate.toISOString());
      } else if (session.progressPointer) {
        anchorDate = new Date(session.progressPointer);
        console.log('Using progress pointer as anchor:', anchorDate.toISOString());
      } else {
        anchorDate = new Date(fromDate);
        console.log('Using session fromDate as anchor:', anchorDate.toISOString());
      }
      
      // CRITICAL: Polygon API returns earliest 50k bars from requested range
      // So we need to request a SMALLER window that's biased to include the anchor
      // For intraday: 1 month back, 2 months forward (to ensure visible range is covered)
      // For daily+: 5 years back, 5 years forward
      // Note: TradingView sends '1D', '1W', '1M' for daily/weekly/monthly
      const isDailyOrHigher = ['D', 'W', 'M', '1D', '1W', '1M'].includes(resolution);
      const monthsBack = isDailyOrHigher ? 60 : 1;  // 5 years for daily+, 1 month for intraday
      const monthsForward = isDailyOrHigher ? 60 : 2;  // 2 months forward for intraday to cover visible range
      const windowStartDate = subMonths(anchorDate, monthsBack);
      let windowEndDate = addMonths(anchorDate, monthsForward);
      
      // Extend window end if pendingVisibleRangeRef has a later date (ensures visible range is covered)
      if (pendingVisibleRangeRef.current?.to) {
        const visibleEndDate = new Date(pendingVisibleRangeRef.current.to * 1000);
        if (visibleEndDate > windowEndDate) {
          windowEndDate = addMonths(visibleEndDate, 1); // Add 1 month buffer beyond visible range
          console.log('Extended fetch window to cover visible range:', windowEndDate.toISOString());
        }
      }
      
      const fromTs = Math.floor(windowStartDate.getTime() / 1000);
      const toTs = Math.floor(windowEndDate.getTime() / 1000);
      const market = session.market || 'FOREX';
      const rawSymbol = session.symbol;
      
      const apiUrl = `/api/backtest/bars?market=${market}&symbol=${rawSymbol}&resolution=${resolution}&to=${toTs}&from=${fromTs}`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data && data.s === 'ok' && data.t && data.t.length > 0) {
        const bars = data.t.map((time: number, i: number) => ({
          time: time * 1000,
          open: data.o[i],
          high: data.h[i],
          low: data.l[i],
          close: data.c[i],
          volume: data.v?.[i] || 0,
        }));
        
        // Set decimal places based on instrument type (prevents floating-point artifacts)
        const symbolDecimalPlaces = getDecimalPlaces(rawSymbol, market);
        setDecimalPlaces(symbolDecimalPlaces);
        
        // Cache the bars for this resolution and track loaded range
        // Use normalized key to prevent D/1D cache misses
        const cacheKey = normalizeCacheKey(resolution);
        barsCacheRef.current[cacheKey] = bars;
        loadedRangeRef.current[cacheKey] = { from: fromTs, to: toTs };
        console.log('Cached', bars.length, 'bars for resolution', resolution, '(key:', cacheKey, ')');
        
        // CRITICAL: Update ref IMMEDIATELY so handleNext sees correct bars
        allBarsRef.current = bars;
        // Update React state so playback controls and UI stay in sync
        setAllBars(bars);
        
        // ═══════════════════════════════════════════════════════════════════════════
        // TIME-DRIVEN APPROACH: Always set replayTime first, then derive index
        // Per FX Replay spec: replayTime is the SINGLE SOURCE OF TRUTH
        // ═══════════════════════════════════════════════════════════════════════════
        const intervalMs = intervalToMs(resolution);
        let newReplayTime = replayTimestampRef.current;
        
        if (newReplayTime > 0) {
          // Use existing replayTime - just derive the index for the new bars
          console.log('Slow-path: Using existing replayTime:', new Date(newReplayTime).toISOString());
        } else if (fromDate) {
          // Fresh session: start at the first bar >= fromDate
          const fromTs = new Date(fromDate).getTime();
          for (let i = 0; i < bars.length; i++) {
            if (bars[i].time >= fromTs) {
              // Set replayTime to the candle CLOSE time (open + interval)
              newReplayTime = bars[i].time + intervalMs;
              console.log('Slow-path: Fresh session, setting replayTime from fromDate:', new Date(newReplayTime).toISOString());
              break;
            }
          }
        }
        
        // Fallback for fresh sessions with no matching bar
        if (newReplayTime <= 0 && bars.length > 0) {
          const startIndex = bars.length >= 6 ? 5 : Math.max(0, bars.length - 1);
          newReplayTime = bars[startIndex].time + intervalMs;
          console.log('Slow-path: Fallback, setting replayTime from bar', startIndex);
        }
        
        // TIME-DRIVEN: Always use setReplayTimeAndDeriveIndex - never mutate index directly
        const newIndex = setReplayTimeAndDeriveIndex(newReplayTime, resolution);
        console.log('Slow-path: Derived index:', newIndex, 'bar time:', bars[newIndex] ? new Date(bars[newIndex].time).toISOString() : 'N/A');
        
        // Trigger any pending getBars callbacks for this resolution
        const pendingCallbacks = pendingCallbacksRef.current[resolution];
        if (pendingCallbacks && pendingCallbacks.length > 0) {
          console.log('Triggering', pendingCallbacks.length, 'pending callbacks for resolution', resolution);
          
          for (const { callback, periodParams } of pendingCallbacks) {
            const { firstDataRequest } = periodParams;
            
            if (firstDataRequest) {
              // TIME-DRIVEN: Filter bars STRICTLY by close time <= replayTime
              // Do NOT extend past replayTime for visible range - that would leak future candles
              // Visible range restoration should be handled by TradingView's setVisibleRange, not by widening bar payload
              const barsToShow = bars.filter((bar: any) => (bar.time + intervalMs) <= newReplayTime);
              console.log('Slow-path pending callback: replayTime=', new Date(newReplayTime).toISOString(), 'bars=', barsToShow.length);
              callback(barsToShow, { noData: barsToShow.length === 0 });
            } else {
              const filteredBars = bars.filter(
                (bar: any) => bar.time / 1000 >= periodParams.from && bar.time / 1000 < periodParams.to
              );
              callback(filteredBars, { noData: filteredBars.length === 0 });
            }
          }
          delete pendingCallbacksRef.current[resolution];
          
          // CRITICAL: Finalize the controller to re-enable replay controls
          // This completes the slow path atomic transaction
          console.log('Slow-path: ATOMIC TRANSACTION COMPLETE, finalizing controller for', resolution);
          lastTfSwitchTimeRef.current = Date.now();
          tfController.finalize(resolution);
        }
      } else {
        console.log('No data returned for resolution', resolution);
        // Still need to fulfill pending callbacks with no data
        const pendingCallbacks = pendingCallbacksRef.current[resolution];
        if (pendingCallbacks && pendingCallbacks.length > 0) {
          for (const { callback } of pendingCallbacks) {
            callback([], { noData: true });
          }
          delete pendingCallbacksRef.current[resolution];
        }
        // Finalize even with no data to unblock controls
        console.log('Slow-path: No data, finalizing controller for', resolution);
        lastTfSwitchTimeRef.current = Date.now();
        tfController.finalize(resolution);
      }
    } catch (error) {
      console.error('Failed to fetch bars for resolution', resolution, error);
      // Fulfill pending callbacks with error state
      const pendingCallbacks = pendingCallbacksRef.current[resolution];
      if (pendingCallbacks && pendingCallbacks.length > 0) {
        for (const { callback } of pendingCallbacks) {
          callback([], { noData: true });
        }
        delete pendingCallbacksRef.current[resolution];
      }
      // Finalize on error to unblock controls
      console.log('Slow-path: Error, finalizing controller for', resolution);
      lastTfSwitchTimeRef.current = Date.now();
      tfController.finalize(resolution);
    } finally {
      fetchingResolutionsRef.current.delete(resolution);
    }
  };

  // Fetch additional bars when user scrolls beyond loaded range
  const fetchMoreBars = async (resolution: string, direction: 'back' | 'forward', periodParams: any, callback: any) => {
    const cacheKey = normalizeCacheKey(resolution);
    if (fetchingRangeRef.current[cacheKey]) {
      callback([], { noData: true });
      return;
    }
    
    const session = sessionDataRef.current || sessionData;
    if (!session) {
      callback([], { noData: true });
      return;
    }
    
    fetchingRangeRef.current[cacheKey] = true;
    const currentRange = loadedRangeRef.current[cacheKey];
    
    try {
      let fetchFrom: number, fetchTo: number;
      
      if (direction === 'back') {
        // Load 4 more months backwards
        const currentFromDate = new Date(currentRange.from * 1000);
        const newFromDate = subMonths(currentFromDate, 4);
        fetchFrom = Math.floor(newFromDate.getTime() / 1000);
        fetchTo = currentRange.from;
      } else {
        // Load 4 more months forwards
        const currentToDate = new Date(currentRange.to * 1000);
        const newToDate = addMonths(currentToDate, 4);
        fetchFrom = currentRange.to;
        fetchTo = Math.floor(newToDate.getTime() / 1000);
      }
      
      const market = session.market || 'FOREX';
      const apiUrl = `/api/backtest/bars?market=${market}&symbol=${session.symbol}&resolution=${resolution}&to=${fetchTo}&from=${fetchFrom}`;
      
      console.log(`Fetching more bars (${direction}):`, { resolution, fetchFrom, fetchTo });
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data && data.s === 'ok' && data.t && data.t.length > 0) {
        const newBars = data.t.map((time: number, i: number) => ({
          time: time * 1000,
          open: data.o[i],
          high: data.h[i],
          low: data.l[i],
          close: data.c[i],
          volume: data.v?.[i] || 0,
        }));
        
        // Merge with existing cache
        const existingBars = barsCacheRef.current[cacheKey] || [];
        let mergedBars: any[];
        
        if (direction === 'back') {
          // Prepend new bars, remove duplicates
          const existingTimes = new Set(existingBars.map((b: any) => b.time));
          const uniqueNewBars = newBars.filter((b: any) => !existingTimes.has(b.time));
          mergedBars = [...uniqueNewBars, ...existingBars];
          loadedRangeRef.current[cacheKey] = { from: fetchFrom, to: currentRange.to };
        } else {
          // Append new bars, remove duplicates
          const existingTimes = new Set(existingBars.map((b: any) => b.time));
          const uniqueNewBars = newBars.filter((b: any) => !existingTimes.has(b.time));
          mergedBars = [...existingBars, ...uniqueNewBars];
          loadedRangeRef.current[cacheKey] = { from: currentRange.from, to: fetchTo };
        }
        
        // Sort by time
        mergedBars.sort((a, b) => a.time - b.time);
        barsCacheRef.current[cacheKey] = mergedBars;
        
        console.log(`Merged bars: ${existingBars.length} + ${newBars.length} = ${mergedBars.length}`);
        
        // NOTE: Per FX Replay spec, scrolling is VIEW-ONLY - it does NOT change replayTime or replayIndex.
        // We only update barsCacheRef (for chart rendering), NOT allBarsRef (replay state).
        // The replay continues independently at replayTimestampRef.
        
        // Filter for requested period
        const filteredBars = newBars.filter(
          (bar: any) => bar.time / 1000 >= periodParams.from && bar.time / 1000 < periodParams.to
        );
        callback(filteredBars, { noData: filteredBars.length === 0 });
      } else {
        callback([], { noData: true });
      }
    } catch (error) {
      console.error('Failed to fetch more bars:', error);
      callback([], { noData: true });
    } finally {
      fetchingRangeRef.current[cacheKey] = false;
    }
  };

  // Save progress when leaving page - use refs for current values
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentSession = sessionDataRef.current;
      const currentBalance = totalBalanceRef.current;
      if (!currentSession || allBars.length === 0) return;
      const currentBar = allBars[currentBarIndexRef.current];
      if (!currentBar) return;
      
      const elapsedMinutes = Math.floor((Date.now() - sessionStartTimeRef.current) / 60000);
      
      // Use fetch with keepalive for PATCH requests (sendBeacon only supports POST)
      fetch('/api/backtest-sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: parseInt(sessionId),
          progressPointer: currentBar.time,
          currentBalance: currentBalance,
          timeInvested: (currentSession.timeInvested || 0) + elapsedMinutes,
        }),
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, allBars.length]);

  useEffect(() => {
    if (!sessionData || !fromDate || !toDate || !sessionData.symbol) return;
    
    // DEBUG: Log when this effect runs to trace slow path flow
    console.log('=== DATA FETCH EFFECT TRIGGERED ===', {
      currentInterval,
      replayTs: replayTimestampRef.current,
      cacheKeys: Object.keys(barsCacheRef.current),
      tfControllerState: tfController.state
    });
    
    // Invalidate cache when symbol or date range changes
    const sessionKey = `${sessionData.symbol}-${sessionData.market}-${fromDate}-${toDate}`;
    if (sessionKey !== lastSessionKeyRef.current) {
      barsCacheRef.current = {};
      lastSessionKeyRef.current = sessionKey;
      hasLoadedLayoutRef.current = false; // Reset layout loaded flag for new session
      hasScrolledToStartRef.current = false; // Reset scroll flag for new session
      replayTimestampRef.current = 0; // Reset replay timestamp for new session/symbol
    }
    
    // NOTE: We removed the isChangingResolutionRef early return here because it was
    // causing slow path switches to fail. The fast path sets this flag but if the user
    // then switches to a non-cached interval (slow path), the useEffect would skip
    // entirely, leaving the controller stuck in SWITCHING state.
    // The flag is now only used to prevent widget recreation, not to skip the fetch.
    
    // Check cache first - use normalized key for lookup
    const effectCacheKey = normalizeCacheKey(currentInterval);
    const cachedBars = barsCacheRef.current[effectCacheKey];
    console.log('Effect cache check:', { effectCacheKey, hasCachedBars: !!cachedBars, barCount: cachedBars?.length || 0 });
    
    if (cachedBars && cachedBars.length > 0) {
      const savedTimestamp = targetTimestampRef.current;
      
      // CRITICAL: Check if replay timestamp is within cached bar range
      // If not, we need to invalidate cache and fetch fresh data centered on replay position
      const replayTs = replayTimestampRef.current;
      if (replayTs > 0) {
        const firstBarTime = cachedBars[0].time;
        const lastBarTime = cachedBars[cachedBars.length - 1].time;
        if (replayTs < firstBarTime || replayTs > lastBarTime) {
          console.log('Replay timestamp outside cached range, invalidating cache for', effectCacheKey);
          console.log('Replay:', new Date(replayTs).toISOString(), 'Cached:', new Date(firstBarTime).toISOString(), '-', new Date(lastBarTime).toISOString());
          // Delete the cached bars so fetchAllHistory runs with correct anchor
          delete barsCacheRef.current[effectCacheKey];
          delete loadedRangeRef.current[effectCacheKey];
          // Don't return - fall through to fetchAllHistory
        } else {
          // Replay timestamp is within range - use cache
          targetTimestampRef.current = null;
          // CRITICAL: Update ref IMMEDIATELY so handleNext sees correct bars
          allBarsRef.current = cachedBars;
          setAllBars(cachedBars);
          
          // Check if this is a timeframe switch (pending switch ref is set)
          const pendingSwitch = pendingTimeframeSwitchRef.current;
          
          // ═══════════════════════════════════════════════════════════════════════════
          // TIME-DRIVEN: Use setReplayTimeAndDeriveIndex as canonical setter
          // Per FX Replay spec: replayTime is absolute, never changes during TF switch
          // ═══════════════════════════════════════════════════════════════════════════
          
          // Clear pending switch BEFORE calling canonical setter
          if (pendingSwitch) {
            pendingTimeframeSwitchRef.current = null;
            pendingAnchorTimestampRef.current = null;
          }
          
          // Use existing replayTime - timeframe switch preserves it
          const derivedIndex = setReplayTimeAndDeriveIndex(replayTs, currentInterval);
          console.log('Slow-path cached: replayTime preserved at:', new Date(replayTs).toISOString(), 'derived index:', derivedIndex);
          
          // Update interval ref to NEW state after switch completes
          if (pendingSwitch) {
            replayIntervalRef.current = currentInterval;
          }
          
          // Re-enable playback after canonical setter
          const cachedCallback = realtimeCallbacksRef.current.get(currentInterval);
          callbacksReadyRef.current = !!cachedCallback;
          
          // ATOMIC TRANSACTION COMPLETE: Re-enable replay via controller (only if fast-path isn't handling it)
          if (!fastPathActiveRef.current) {
            console.log('Slow-path cached: ATOMIC TRANSACTION COMPLETE, finalizing controller');
            tfController.finalize(currentInterval);
          } else {
            console.log('Slow-path cached: fastPathActive, controller will be finalized by fast-path');
          }
          return;
        }
      } else {
        // No replay timestamp - use cache with saved progress or session start
        targetTimestampRef.current = null;
        // CRITICAL: Update ref IMMEDIATELY so handleNext sees correct bars
        allBarsRef.current = cachedBars;
        setAllBars(cachedBars);
        
        // ═══════════════════════════════════════════════════════════════════════════
        // TIME-DRIVEN: Compute targetReplayTime and use canonical setter
        // ═══════════════════════════════════════════════════════════════════════════
        const intervalMs = intervalToMinutes(currentInterval) * 60 * 1000;
        const sessionHasTrades = sessionData?.trades && sessionData.trades.length > 0;
        let targetReplayTime: number;
        
        const savedTs = savedTimestamp || (sessionHasTrades ? sessionData?.progressPointer : null);
        if (savedTs) {
          targetReplayTime = typeof savedTs === 'number' ? savedTs : new Date(savedTs).getTime();
        } else {
          // Fresh start - use fromDate + interval
          const fromTimestamp = new Date(fromDate).getTime();
          targetReplayTime = fromTimestamp + intervalMs;
          
          // Clamp to first bar's close if data starts later
          if (cachedBars.length > 0 && targetReplayTime < cachedBars[0].time + intervalMs) {
            targetReplayTime = cachedBars[0].time + intervalMs;
          }
        }
        
        const derivedIndex = setReplayTimeAndDeriveIndex(targetReplayTime, currentInterval);
        console.log('Slow-path no-replay: replayTime set to:', new Date(targetReplayTime).toISOString(), 'derived index:', derivedIndex);
        
        // Re-enable playback after canonical setter
        const cachedCallback = realtimeCallbacksRef.current.get(currentInterval);
        callbacksReadyRef.current = !!cachedCallback;
        
        // ATOMIC TRANSACTION COMPLETE: Re-enable replay via controller (only if fast-path isn't handling it)
        if (!fastPathActiveRef.current) {
          console.log('Slow-path no-replay: ATOMIC TRANSACTION COMPLETE, finalizing controller');
          tfController.finalize(currentInterval);
        } else {
          console.log('Slow-path no-replay: fastPathActive, controller will be finalized by fast-path');
        }
        return;
      }
    }
    
    const fetchAllHistory = async () => {
      const savedTimestamp = targetTimestampRef.current;
      targetTimestampRef.current = null;
      
      // Determine anchor: replay position > progress pointer > session start
      const replayTs = replayTimestampRef.current;
      let anchorDate: Date;
      if (replayTs > 0) {
        anchorDate = new Date(replayTs);
        console.log('fetchAllHistory using replay timestamp as anchor:', anchorDate.toISOString());
      } else if (sessionData.progressPointer) {
        anchorDate = new Date(sessionData.progressPointer);
        console.log('fetchAllHistory using progress pointer as anchor:', anchorDate.toISOString());
      } else {
        anchorDate = new Date(sessionData.fromDate);
        console.log('fetchAllHistory using session fromDate as anchor:', anchorDate.toISOString());
      }
      
      // CRITICAL: Polygon API returns earliest 50k bars from requested range
      // So we need to request a SMALLER window that's biased to include the anchor
      // For intraday: 1 month back, 1 month forward (will definitely include anchor)
      // For daily+: 5 years back, 5 years forward
      const isIntraday = !['D', 'W', 'M'].includes(currentInterval);
      const monthsBack = isIntraday ? 1 : 60;  // 1 month for intraday, 5 years for daily
      const monthsForward = isIntraday ? 1 : 60;
      const windowStartDate = subMonths(anchorDate, monthsBack);
      const windowEndDate = addMonths(anchorDate, monthsForward);
      const fromTs = Math.floor(windowStartDate.getTime() / 1000);
      const toTs = Math.floor(windowEndDate.getTime() / 1000);
      
      const market = sessionData.market || 'FOREX';
      const rawSymbol = sessionData.symbol;
      
      setIsLoading(true);
      setLoadError(null);
      
      // Only destroy widget on first load, not on resolution change
      const isFirstLoad = Object.keys(barsCacheRef.current).length === 0;
      if (isFirstLoad && tvWidgetRef.current) {
        tvWidgetRef.current.remove();
        tvWidgetRef.current = null;
      }
      
      try {
        const apiUrl = `/api/backtest/bars?market=${market}&symbol=${rawSymbol}&resolution=${currentInterval}&to=${toTs}&from=${fromTs}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // Check for API errors
        if (data.s === 'error') {
          setLoadError(data.errmsg || 'Failed to load chart data. Please try again.');
          return;
        }
        
        if (data && data.s === 'ok' && data.t && data.t.length > 0) {
          let bars = data.t.map((time: number, i: number) => ({
            time: time * 1000,
            open: data.o[i],
            high: data.h[i],
            low: data.l[i],
            close: data.c[i],
            volume: data.v?.[i] || 0,
          }));
          
          // Set decimal places based on instrument type (prevents floating-point artifacts)
          const symbolDecimalPlaces = getDecimalPlaces(rawSymbol, market);
          setDecimalPlaces(symbolDecimalPlaces);
          
          // Cache the bars for this resolution and track loaded range
          // Use normalized cache key for consistency (1D/D -> D)
          const fetchCacheKey = normalizeCacheKey(currentInterval);
          barsCacheRef.current[fetchCacheKey] = bars;
          loadedRangeRef.current[fetchCacheKey] = { from: fromTs, to: toTs };
          
          // ═══════════════════════════════════════════════════════════════════════════
          // CRITICAL: Check if user has switched to a different interval during fetch
          // If so, data is cached but we should NOT update state or finalize
          // This prevents stale data from overwriting current state
          // ═══════════════════════════════════════════════════════════════════════════
          if (currentIntervalRef.current !== currentInterval) {
            console.log('Slow path: Aborting processing - user switched from', currentInterval, 'to', currentIntervalRef.current, 'during fetch');
            // CRITICAL: Abort the controller so queued switches can proceed
            // The new interval's handler should have already started its own switch
            tfController.abort('Interval changed during fetch');
            // NOTE: Do NOT clear pendingTimeframeSwitchRef/pendingAnchorTimestampRef here!
            // They may have been set by the NEW switch that's in progress
            // Only clear isChangingResolutionRef for this (aborted) interval's context
            isChangingResolutionRef.current = false;
            setIsLoading(false);
            return; // Data is cached, let the new interval's handler process it
          }
          
          // Signal that data is ready for layout restoration
          dataReadyForLayoutRef.current = true;
          console.log('Data ready signal set - layout can now restore safely');
          
          // CRITICAL: Update ref IMMEDIATELY so handleNext sees correct bars
          // State update is async, but ref is synchronous
          allBarsRef.current = bars;
          setAllBars(bars);
          
          // ═══════════════════════════════════════════════════════════════════════════
          // TIME-DRIVEN: Compute targetReplayTime and use canonical setter
          // Per FX Replay spec: replayTime is absolute, index is always derived
          // ═══════════════════════════════════════════════════════════════════════════
          const pendingSwitch = pendingTimeframeSwitchRef.current;
          const sessionHasTrades = sessionData?.trades && sessionData.trades.length > 0;
          const intervalMs = intervalToMinutes(currentInterval) * 60 * 1000;
          let targetReplayTime: number;
          
          // Priority: existing replayTime (TF switch) > saved progress > session start
          const existingReplayTs = replayTimestampRef.current;
          if (existingReplayTs > 0) {
            // Timeframe switch or resume - preserve existing replayTime
            targetReplayTime = existingReplayTs;
            console.log('Slow-path fetch: Preserving existing replayTime:', new Date(targetReplayTime).toISOString());
          } else {
            // Fresh load - compute from saved progress or session start
            const savedTs = savedTimestamp || (sessionHasTrades ? sessionData?.progressPointer : null);
            if (savedTs) {
              targetReplayTime = typeof savedTs === 'number' ? savedTs : new Date(savedTs).getTime();
            } else {
              // Fresh session - use fromDate + interval
              const fromTimestamp = fromTs * 1000; // Convert to milliseconds
              targetReplayTime = fromTimestamp + intervalMs;
              
              // Clamp to first bar's close if data starts later
              if (bars.length > 0 && targetReplayTime < bars[0].time + intervalMs) {
                targetReplayTime = bars[0].time + intervalMs;
              }
            }
          }
          
          // Clear pending switch BEFORE calling canonical setter
          if (pendingSwitch) {
            pendingTimeframeSwitchRef.current = null;
            pendingAnchorTimestampRef.current = null;
          }
          
          // Use canonical setter to set replayTime and derive index
          const derivedIndex = setReplayTimeAndDeriveIndex(targetReplayTime, currentInterval);
          console.log('Slow-path fetch: replayTime=', new Date(targetReplayTime).toISOString(), 'derived index:', derivedIndex);
          
          // Update interval ref to NEW state after switch completes
          if (pendingSwitch) {
            replayIntervalRef.current = currentInterval;
          }
          
          // Re-enable playback after canonical setter (subscribeBars will set to true if no cached callback)
          const cachedCallback = realtimeCallbacksRef.current.get(currentInterval);
          callbacksReadyRef.current = !!cachedCallback;
          setIsPlaying(false);
          
          // Trigger any pending getBars callbacks for this resolution
          // TIME-DRIVEN: Filter by replayTime (not index)
          const pendingCallbacks = pendingCallbacksRef.current[currentInterval];
          if (pendingCallbacks && pendingCallbacks.length > 0) {
            console.log('Triggering', pendingCallbacks.length, 'pending callbacks for resolution', currentInterval);
            const replayTs = replayTimestampRef.current;
            
            for (const { callback, periodParams } of pendingCallbacks) {
              const { firstDataRequest } = periodParams;
              
              if (firstDataRequest) {
                // TIME-DRIVEN: Filter by replayTime (candles with closeTime <= replayTime)
                const barsToShow = bars.filter((bar: any) => (bar.time + intervalMs) <= replayTs);
                callback(barsToShow, { noData: barsToShow.length === 0 });
              } else {
                const filteredBars = bars.filter(
                  (bar: any) => bar.time / 1000 >= periodParams.from && bar.time / 1000 < periodParams.to
                );
                callback(filteredBars, { noData: filteredBars.length === 0 });
              }
            }
            delete pendingCallbacksRef.current[currentInterval];
          }
          
          // DRAWING PRESERVATION: Use setResolution + resetData (no symbol change)
          // This preserves TradingView's native drawing persistence across timeframe switches
          // We avoid setSymbol because dynamic suffixes break drawing persistence
          // NOTE: Use widgetInitializedRef (not pendingSwitch) to detect TF switch vs first load
          // pendingSwitch can be overwritten by rapid switches, causing race conditions
          // widgetInitializedRef is stable - it's true once widget exists, never gets reset during session
          const isTimeframeSwitch = widgetInitializedRef.current;
          console.log('Slow path: isTimeframeSwitch=', isTimeframeSwitch, '(using setResolution + resetData for drawing preservation)');
          
          if (tvWidgetRef.current && isTimeframeSwitch) {
            try {
              const chart = tvWidgetRef.current.activeChart();
              
              // Add small delay to ensure cache is fully synchronized before TradingView queries
              await new Promise(resolve => setTimeout(resolve, 50));
              
              // Use setResolution ONLY - this preserves drawings natively
              chart.setResolution(currentInterval, () => {
                // CRITICAL: Call resetData() to force TradingView to re-subscribe the datafeed
                // Without this, subscribeBars is never called and replay guards stay blocked
                console.log('Slow path: Calling resetData() to re-subscribe datafeed');
                chart.resetData();
                
                // Wait for dataReady to ensure bars are loaded
                const innerChart = tvWidgetRef.current?.activeChart();
                if (!innerChart) {
                  tfController.finalize(currentInterval);
                  isChangingResolutionRef.current = false;
                  return;
                }
                
                innerChart.dataReady(() => {
                  console.log('Slow path: dataReady fired - drawings preserved natively');
                  try {
                    // DRAWINGS: TradingView handles native persistence across timeframe switches
                    // No manual clear/restore needed - drawings stay intact with stable symbol
                    
                    // Restore the captured visible range to preserve zoom level
                    const savedRange = pendingVisibleRangeRef.current;
                    if (savedRange && savedRange.from != null && savedRange.to != null && !pendingVisibleRangeAppliedRef.current) {
                      console.log('Restoring captured visible range (slow path):', savedRange);
                      innerChart.setVisibleRange(savedRange);
                      pendingVisibleRangeAppliedRef.current = true;
                    } else if (!pendingVisibleRangeAppliedRef.current) {
                      const replayTs = replayTimestampRef.current;
                      if (replayTs > 0) {
                        const resolutionMinutes = intervalToMinutes(currentInterval);
                        const barsToShow = 50;
                        const windowMs = resolutionMinutes * 60 * 1000 * barsToShow;
                        const visibleFrom = (replayTs - windowMs * 0.3) / 1000;
                        const visibleTo = (replayTs + windowMs * 0.1) / 1000;
                        console.log('Setting visible range around replay timestamp (slow path):', new Date(replayTs).toISOString());
                        innerChart.setVisibleRange({ from: visibleFrom, to: visibleTo });
                        pendingVisibleRangeAppliedRef.current = true;
                      }
                    }
                  } catch (e) {
                    console.warn('Error setting visible range:', e);
                  }
                  
                  // ATOMIC TRANSACTION COMPLETE: Re-enable replay via controller
                  console.log('Slow-path: ATOMIC TRANSACTION COMPLETE, finalizing controller');
                  lastTfSwitchTimeRef.current = Date.now(); // Mark switch completion time
                  tfController.finalize(currentInterval);
                  isChangingResolutionRef.current = false;
                }); // Close dataReady callback
              }); // Close setResolution callback
            } catch (e) {
              console.log('setResolution/resetData error:', e);
              tfController.abort('setResolution/resetData error');
              isChangingResolutionRef.current = false;
            }
          } else {
            // First load (no TF switch) - controller may not be in switching state
            console.log('Slow-path: First load complete');
            isChangingResolutionRef.current = false;
          }
        } else {
          console.log('No data from VPS API:', data);
          // Don't clear bars on failure - keep existing data
          tfController.abort('No data from VPS API');
          isChangingResolutionRef.current = false;
        }
      } catch (error) {
        console.error("Error fetching history from VPS:", error);
        // Don't clear bars on error - keep existing data and allow retry
        tfController.abort('Fetch error');
        isChangingResolutionRef.current = false;
        // Set error state if this is the first load (no bars cached yet)
        if (Object.keys(barsCacheRef.current).length === 0) {
          setLoadError('Connection failed. The market data server may be temporarily unavailable.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData?.symbol, sessionData?.market, fromDate, toDate, currentInterval]);

  useEffect(() => {
    // Only create widget ONCE when initial data is available
    // Use refs to avoid recreation on data changes - only symbol/decimalPlaces changes should recreate
    if (allBarsRef.current.length === 0 || widgetInitializedRef.current || !chartContainerRef.current) {
      return;
    }
    
    // Mark widget as initialized to prevent recreation
    widgetInitializedRef.current = true;

    const supportedMinuteResolutions = ["1", "3", "5", "10", "15", "30", "60", "120", "240"];
    
    const datafeed = {
      onReady: (callback: any) => {
        setTimeout(() => callback({
          supported_resolutions: [...supportedMinuteResolutions, "1D", "1W", "1M"],
          supports_marks: true,
        }), 0);
      },
      resolveSymbol: (symbolName: string, onSymbolResolvedCallback: any) => {
        // Strip resolution suffix if present (format: "SYMBOL#tf_60")
        // This allows us to force fresh subscriptions by changing the symbol
        const baseSymbol = symbolName.split('#tf_')[0];
        const symbolInfo = {
          ticker: symbolName, // Keep full name for TradingView's internal tracking
          name: baseSymbol, // Display name without suffix
          description: baseSymbol,
          type: "forex",
          session: "24x7",
          timezone: "Etc/UTC",
          exchange: "ProJournX",
          minmov: 1,
          pricescale: Math.pow(10, decimalPlaces || 5),
          has_intraday: true,
          has_daily: true,
          has_weekly_and_monthly: true,
          supported_resolutions: [...supportedMinuteResolutions, "1D", "1W", "1M"],
          intraday_multipliers: supportedMinuteResolutions,
          data_status: "streaming",
        };
        setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
      },
      getBars: (symbolInfo: any, resolution: string, periodParams: any, onHistoryCallback: any) => {
        const { firstDataRequest } = periodParams;
        
        // Normalize resolution for cache lookup (1D/D -> D, 1W/W -> W)
        const cacheKey = normalizeCacheKey(resolution);
        
        // CRITICAL: Use pending anchor if set (during timeframe switch)
        // This handles the race condition where TradingView calls getBars BEFORE our onIntervalChanged
        const anchorTs = pendingAnchorTimestampRef.current || replayTimestampRef.current;
        const usingPendingAnchor = !!pendingAnchorTimestampRef.current;
        
        // Clear the pending anchor after use - it's only for the first getBars call after a switch
        if (pendingAnchorTimestampRef.current) {
          console.log('getBars: Using pending anchor:', new Date(anchorTs).toISOString());
          pendingAnchorTimestampRef.current = null;
        }
        
        // ONLY use cached bars for the exact requested resolution - no fallback
        // This prevents mixing data between resolutions
        const barsForResolution = barsCacheRef.current[cacheKey];
        
        console.log('getBars called:', { 
          resolution,
          cacheKey,
          firstDataRequest, 
          cachedKeys: Object.keys(barsCacheRef.current),
          hasBarsForResolution: !!barsForResolution,
          barCount: barsForResolution?.length || 0
        });
        
        // CRITICAL: Validate cached bars contain the anchor timestamp
        // If anchor timestamp is outside cached range, we need fresh data
        let validCache = barsForResolution && barsForResolution.length > 0;
        if (validCache && anchorTs > 0) {
          const firstBarTime = barsForResolution[0].time;
          const lastBarTime = barsForResolution[barsForResolution.length - 1].time;
          if (anchorTs < firstBarTime || anchorTs > lastBarTime) {
            console.log('getBars: Anchor timestamp outside cached range, invalidating for', cacheKey);
            console.log('Anchor:', new Date(anchorTs).toISOString(), 
              'Cache:', new Date(firstBarTime).toISOString(), '-', new Date(lastBarTime).toISOString());
            // Invalidate this cache - it's stale for the current replay position
            delete barsCacheRef.current[cacheKey];
            delete loadedRangeRef.current[cacheKey];
            validCache = false;
          }
        }
        
        if (!validCache) {
          // No data for this resolution yet - queue callback and trigger fetch
          console.log('No valid bars for resolution', resolution, '(key:', cacheKey, ') - queuing callback and triggering fetch');
          if (!pendingCallbacksRef.current[resolution]) {
            pendingCallbacksRef.current[resolution] = [];
          }
          pendingCallbacksRef.current[resolution].push({ callback: onHistoryCallback, periodParams });
          
          // Trigger fetch for this resolution - this will fulfill pending callbacks when complete
          fetchBarsForResolution(resolution);
          return;
        }
        
        if (firstDataRequest) {
          // ═══════════════════════════════════════════════════════════════════════════
          // TIME-DRIVEN FILTERING: Show only completed candles
          // A candle is completed when its closeTime <= replayTime
          // closeTime = bar.time + interval
          // CRITICAL: Always use replayTimestampRef as the filter - never fall back to index
          // ═══════════════════════════════════════════════════════════════════════════
          const intervalMs = intervalToMs(resolution);
          
          // Use anchorTs if available, otherwise fall back to replayTimestampRef (the SINGLE source of truth)
          const filterTime = anchorTs > 0 ? anchorTs : replayTimestampRef.current;
          
          const barsToShow = filterTime > 0 
            ? barsForResolution.filter((bar: any) => (bar.time + intervalMs) <= filterTime)
            : barsForResolution.slice(0, 6); // Absolute fallback: show first 6 bars for fresh sessions
          
          console.log('getBars firstDataRequest: filterTime=', filterTime > 0 ? new Date(filterTime).toISOString() : 'N/A', 
            'returning', barsToShow.length, 'bars (closeTime <= filterTime)');
          
          onHistoryCallback(barsToShow, { noData: barsToShow.length === 0 });
          return;
        }
        
        // Check if requested period is outside the loaded range - fetch more if needed
        const loadedRange = loadedRangeRef.current[cacheKey];
        if (loadedRange) {
          const requestedFrom = periodParams.from;
          const requestedTo = periodParams.to;
          
          if (requestedFrom < loadedRange.from) {
            // User scrolled back beyond loaded data - fetch more
            console.log('Scrolled back beyond loaded range, fetching more...');
            fetchMoreBars(resolution, 'back', periodParams, onHistoryCallback);
            return;
          }
          
          if (requestedTo > loadedRange.to) {
            // User scrolled forward beyond loaded data - fetch more
            console.log('Scrolled forward beyond loaded range, fetching more...');
            fetchMoreBars(resolution, 'forward', periodParams, onHistoryCallback);
            return;
          }
        }
        
        const bars = barsForResolution.filter(
          (bar) => bar.time / 1000 >= periodParams.from && bar.time / 1000 < periodParams.to
        );
        onHistoryCallback(bars, { noData: bars.length === 0 });
      },
      subscribeBars: (symbolInfo: any, resolution: string, onRealtimeCallback: any) => {
        console.log('subscribeBars called for resolution:', resolution, 'callback exists:', !!onRealtimeCallback);
        
        // Store callback in map - TradingView may subscribe to multiple resolutions
        realtimeCallbacksRef.current.set(resolution, onRealtimeCallback);
        
        // ALWAYS update the main callback ref - TradingView may only call subscribeBars once
        // and we need to use that callback for our replay system
        subscribedResolutionRef.current = resolution;
        onRealtimeCallbackRef.current = onRealtimeCallback;
        
        // Mark callbacks as ready - handleNext can now proceed
        callbacksReadyRef.current = true;
      },
      unsubscribeBars: (subscriberUID: string) => {
        // For replay mode, we DON'T clear any callbacks on unsubscribe
        // We need to keep all callbacks in the map so they can be reused when switching timeframes
        const unsubResolution = subscriberUID?.split('_').pop() || '';
        console.log('unsubscribeBars called (keeping callback for replay):', { subscriberUID, unsubResolution });
        
        // CRITICAL: Do NOT delete from callbacks map - we need these for timeframe switching
        // realtimeCallbacksRef.current.delete(unsubResolution); // REMOVED - breaks timeframe switching
        // Keep onRealtimeCallbackRef.current intact for replay
      },
      getMarks: (symbolInfo: any, from: number, to: number, onDataCallback: any) => {
        onDataCallback([]);
      },
    };

    const save_load_adapter = {
      getAllCharts: async () => {
        const data = await loadChartLayouts(sessionId);
        return data.chartLayouts.map((layout: any) => ({
          id: layout.id,
          name: layout.name,
          symbol: layout.symbol,
          resolution: layout.resolution,
          timestamp: layout.timestamp
        }));
      },
      removeChart: async (chartId: string) => {
        await deleteChartLayout(sessionId, chartId);
      },
      saveChart: async (chartData: any) => {
        const result = await saveChartLayout(sessionId, {
          id: chartData.id || `chart_${Date.now()}`,
          name: chartData.name || 'Default Layout',
          symbol: chartData.symbol,
          resolution: chartData.resolution,
          content: chartData.content
        });
        return result.data?.id || chartData.id;
      },
      getChartContent: async (chartId: string) => {
        const data = await loadChartLayouts(sessionId);
        const layout = data.chartLayouts.find((l: any) => l.id === chartId);
        return layout?.content || '';
      },
      getAllStudyTemplates: async () => {
        const data = await loadChartLayouts(sessionId);
        return Object.keys(data.studyTemplates || {}).map(name => ({ name }));
      },
      removeStudyTemplate: async (studyTemplateInfo: { name: string }) => {
        await fetch(`/api/backtest-sessions/chart-layout?sessionId=${sessionId}&type=studyTemplate&name=${studyTemplateInfo.name}`, {
          method: 'DELETE'
        });
      },
      saveStudyTemplate: async (studyTemplateData: { name: string; content: string }) => {
        await saveStudyTemplate(sessionId, studyTemplateData.name, studyTemplateData.content);
      },
      getStudyTemplateContent: async (studyTemplateInfo: { name: string }) => {
        const data = await loadChartLayouts(sessionId);
        return data.studyTemplates?.[studyTemplateInfo.name] || '';
      },
      getDrawingTemplates: async (toolName: string) => {
        const data = await loadChartLayouts(sessionId);
        const templates = data.drawingTemplates || {};
        return Object.keys(templates).filter(k => k.startsWith(toolName));
      },
      loadDrawingTemplate: async (toolName: string, templateName: string) => {
        const data = await loadChartLayouts(sessionId);
        return data.drawingTemplates?.[`${toolName}_${templateName}`] || '';
      },
      removeDrawingTemplate: async (toolName: string, templateName: string) => {
        await fetch(`/api/backtest-sessions/chart-layout?sessionId=${sessionId}&type=drawingTemplate&name=${toolName}_${templateName}`, {
          method: 'DELETE'
        });
      },
      saveDrawingTemplate: async (toolName: string, templateName: string, content: string) => {
        await saveDrawingTemplate(sessionId, `${toolName}_${templateName}`, content);
      },
      
      // TradingView native drawing persistence (saveload_separate_drawings_storage featureset)
      // These methods are called automatically by TradingView to save/load drawings
      saveLineToolsAndGroups: async (layoutId: string, chartId: string | number, state: any) => {
        console.log('[save_load_adapter] saveLineToolsAndGroups called:', { layoutId, chartId, sourcesCount: state?.sources?.size || 0 });
        
        // Convert Map to array for JSON serialization
        const serializedState: any = {};
        if (state.sources instanceof Map) {
          serializedState.sources = Array.from(state.sources.entries());
        } else if (state.sources) {
          serializedState.sources = state.sources;
        }
        if (state.groups instanceof Map) {
          serializedState.groups = Array.from(state.groups.entries());
        } else if (state.groups) {
          serializedState.groups = state.groups;
        }
        
        try {
          await fetch('/api/backtest-sessions/chart-layout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              type: 'lineTools',
              layoutId: layoutId || sessionId,
              chartId: String(chartId || 'main'),
              state: serializedState
            })
          });
        } catch (e) {
          console.error('[save_load_adapter] Failed to save line tools:', e);
        }
      },
      
      loadLineToolsAndGroups: async (layoutId: string | undefined, chartId: string | number, requestType: string, requestContext: any) => {
        console.log('[save_load_adapter] loadLineToolsAndGroups called:', { layoutId, chartId, requestType });
        
        try {
          const effectiveLayoutId = layoutId || sessionId;
          const effectiveChartId = String(chartId || 'main');
          
          const response = await fetch(
            `/api/backtest-sessions/chart-layout?sessionId=${sessionId}&lineToolsLayoutId=${effectiveLayoutId}&lineToolsChartId=${effectiveChartId}`
          );
          const result = await response.json();
          
          if (!result.success || !result.data) {
            console.log('[save_load_adapter] No saved line tools found');
            return null;
          }
          
          // Convert arrays back to Maps
          const state = result.data;
          const sources = new Map();
          const groups = new Map();
          
          if (Array.isArray(state.sources)) {
            for (const [key, value] of state.sources) {
              sources.set(key, value);
            }
          }
          if (Array.isArray(state.groups)) {
            for (const [key, value] of state.groups) {
              groups.set(key, value);
            }
          }
          
          console.log('[save_load_adapter] Loaded line tools:', { sourcesCount: sources.size, groupsCount: groups.size });
          return { sources, groups };
        } catch (e) {
          console.error('[save_load_adapter] Failed to load line tools:', e);
          return null;
        }
      }
    };

    const widgetOptions: any = {
      symbol: symbol,
      interval: currentInterval,
      datafeed: datafeed,
      container: chartContainerRef.current,
      library_path: "/charting_library/",
      locale: "en",
      disabled_features: [
        "use_localstorage_for_settings",
        "header_compare",
        "create_volume_indicator_by_default",
      ],
      enabled_features: [
        "side_toolbar_in_fullscreen_mode",
        "items_favoriting",
        "saveload_separate_drawings_storage",
      ],
      fullscreen: false,
      autosize: true,
      theme: "dark",
      save_load_adapter: save_load_adapter,
      auto_save_delay: 5,
      favorites: {
        intervals: ["1", "5", "15", "60", "1D"],
        drawingTools: [],
      },
    };

    // CRITICAL: Clear all callback refs before creating new widget
    // This ensures we don't push bars to a stale/dead chart instance (e.g., after HMR)
    realtimeCallbacksRef.current.clear();
    onRealtimeCallbackRef.current = null;
    subscribedResolutionRef.current = null;
    callbacksReadyRef.current = false; // Block handleNext until subscribeBars fires
    console.log('Creating new TradingView widget - cleared all callback refs, waiting for subscribeBars');
    
    const tvWidget = new TradingViewWidget(widgetOptions);
    tvWidgetRef.current = tvWidget;

    tvWidget.onChartReady(() => {
      const chart = tvWidget.activeChart();
      chart.setChartType(1);
      
      // Use refs for state that must persist across effect invocations
      // (During timeframe switches, allBars changes trigger effect re-runs)
      // Note: initialRestoreCompleteRef, lastSavedDrawingsCountRef, userDeletedAllDrawingsRef are component-level refs
      
      // Track if a layout existed to restore (prevents accidental overwrites on error)
      let hadSavedLayout = false;
      
      const loadSavedLayout = async () => {
        try {
          // CRITICAL: Wait for data to be fully loaded before restoring drawings
          // Otherwise TradingView aligns drawings against placeholder data and they shift
          console.log('Waiting for data to be ready before restoring layout...');
          let waitTime = 0;
          const maxWait = 15000; // Max 15 seconds
          const pollInterval = 100;
          while (!dataReadyForLayoutRef.current && waitTime < maxWait) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            waitTime += pollInterval;
          }
          if (!dataReadyForLayoutRef.current) {
            console.warn('Data not ready after 15s - proceeding anyway');
          } else {
            console.log('Data ready after', waitTime, 'ms - restoring layout');
          }
          // Additional small delay to ensure TradingView has processed the bars
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const data = await loadChartLayouts(sessionId);
          if (data.chartLayouts && data.chartLayouts.length > 0) {
            hadSavedLayout = true; // Mark that we found prior content
            const latestLayout = data.chartLayouts.sort((a: any, b: any) => b.timestamp - a.timestamp)[0];
            if (latestLayout?.content) {
              const savedData = JSON.parse(latestLayout.content);
              console.log('Restoring chart layout:', latestLayout.name, 'Data keys:', Object.keys(savedData));
              
              // NOTE: Drawings are now restored by TradingView natively via loadLineToolsAndGroups
              // We only restore studies (indicators) and chart properties here
              
              // Clear all existing studies/indicators (including default Volume)
              // This ensures user's deletion of indicators is respected
              try {
                const existingStudies = chart.getAllStudies();
                console.log('Clearing', existingStudies.length, 'existing studies before restore');
                for (const study of existingStudies) {
                  try {
                    chart.removeEntity(study.id);
                  } catch (e) {
                    // Some studies may not be removable
                  }
                }
              } catch (e) {
                console.warn('Could not clear existing studies:', e);
              }
              
              console.log('Drawings will be restored by TradingView via loadLineToolsAndGroups');
              
              // Restore studies/indicators - DEDUPLICATE to prevent accumulation
              if (savedData.studies && Array.isArray(savedData.studies)) {
                // Deduplicate studies by name before restoring
                const uniqueStudies = savedData.studies.reduce((acc: any[], study: any) => {
                  if (!acc.find((s: any) => s.name === study.name)) {
                    acc.push(study);
                  }
                  return acc;
                }, []);
                
                console.log('Restoring', uniqueStudies.length, 'unique studies (from', savedData.studies.length, 'saved)');
                for (const study of uniqueStudies) {
                  try {
                    if (study.name) {
                      chart.createStudy(study.name, study.forceOverlay || false, study.lock || false, study.inputs || [], study.overrides || {});
                    }
                  } catch (studyError) {
                    console.warn('Could not restore study:', study.name, studyError);
                  }
                }
              }
              
              // Restore chart properties (canvas color, etc.) if saved
              if (savedData.chartProperties) {
                console.log('Restoring chart properties:', savedData.chartProperties);
                try {
                  const overrides: any = {};
                  if (savedData.chartProperties.background) {
                    overrides['paneProperties.background'] = savedData.chartProperties.background;
                  }
                  if (savedData.chartProperties.backgroundType) {
                    overrides['paneProperties.backgroundType'] = savedData.chartProperties.backgroundType;
                  }
                  if (savedData.chartProperties.scalesBackground) {
                    overrides['scalesProperties.backgroundColor'] = savedData.chartProperties.scalesBackground;
                  }
                  if (Object.keys(overrides).length > 0) {
                    chart.applyOverrides(overrides);
                    console.log('Applied chart property overrides:', overrides);
                  }
                } catch (e) {
                  console.warn('Could not restore chart properties:', e);
                }
              }
              
              console.log('Chart layout restore complete (drawings handled by TradingView)');
              
              // Restore favorite drawing tools if saved
              if (savedData.favoriteDrawingTools && Array.isArray(savedData.favoriteDrawingTools)) {
                console.log('Restoring favorite drawing tools:', savedData.favoriteDrawingTools);
                favoriteDrawingToolsRef.current = savedData.favoriteDrawingTools;
                try {
                  chart.setFavoriteDrawings(savedData.favoriteDrawingTools);
                } catch (e) {
                  console.warn('Could not restore favorite drawing tools:', e);
                }
              }
              
              // Initialize lastSavedDrawingsCountRef from stored payload immediately
              // This provides a fallback if chart.getAllShapes() is slow or returns empty
              const storedDrawingCount = savedData.drawings?.length || 0;
              lastSavedDrawingsCountRef.current = storedDrawingCount;
              console.log('Stored drawing count (from payload):', storedDrawingCount);
              
              // Poll for shapes with retries - TradingView may take a moment to render shapes
              let actualCount = 0;
              for (let attempt = 0; attempt < 5; attempt++) {
                await new Promise(resolve => setTimeout(resolve, 500));
                const actualShapes = chart.getAllShapes();
                actualCount = actualShapes.length;
                console.log(`Shape check attempt ${attempt + 1}: found ${actualCount} shapes`);
                if (actualCount >= storedDrawingCount) {
                  console.log('All shapes restored successfully');
                  break;
                }
              }
              
              // Use the higher of stored vs actual count for safety
              if (actualCount > lastSavedDrawingsCountRef.current) {
                lastSavedDrawingsCountRef.current = actualCount;
              }
              
              // Enable auto-saves now that restore is complete
              initialRestoreCompleteRef.current = true;
              console.log('Initial restore complete, auto-saves now enabled');
            }
          } else {
            console.log('No saved chart layouts found for session', sessionId);
            // Small delay before allowing saves on new sessions
            await new Promise(resolve => setTimeout(resolve, 1000));
            initialRestoreCompleteRef.current = true; // No saved data, allow new saves
          }
        } catch (error) {
          console.error('Error loading saved layout:', error);
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Only enable autosave if no prior layout existed (prevents accidental overwrites)
          if (!hadSavedLayout) {
            initialRestoreCompleteRef.current = true;
            console.log('No prior layout found - autosave enabled');
          } else {
            console.log('ERROR: Restore failed with prior layout - autosave DISABLED to prevent data loss');
          }
        }
      };
      
      // Only load saved layout on FIRST widget creation for this session
      // During timeframe switches, drawings should persist in memory (not reloaded)
      // This prevents drawing drift when switching between resolutions
      if (!hasLoadedLayoutRef.current) {
        hasLoadedLayoutRef.current = true;
        loadSavedLayout().then(() => {
          // After layout loads, scroll chart to session start date (ONLY on first load)
          if (!hasScrolledToStartRef.current) {
            scrollChartToStartDate(chart);
          }
        });
      } else {
        // Already loaded layout - just enable auto-save immediately
        initialRestoreCompleteRef.current = true;
        // DO NOT scroll here - user may have moved the chart and we don't want to reset their view
      }
      
      // Function to scroll chart to the session's start date
      // Uses multiple attempts with delays because TradingView may auto-fit after initial render
      function scrollChartToStartDate(chart: any, retryCount = 0, forceScroll = false) {
        // Skip if already scrolled, unless forcing re-scroll
        if (hasScrolledToStartRef.current && !forceScroll) return;
        
        // Priority: sessionData.replayTimestamp (for resume) > sessionData.fromDate > replayTimestampRef
        const sessionData = sessionDataRef.current;
        let targetTimestamp: number | null = null;
        
        if (sessionData) {
          // If session has saved replay progress, use that
          if (sessionData.replayTimestamp && sessionData.replayTimestamp > 0) {
            // replayTimestamp is stored in SECONDS, convert to milliseconds
            targetTimestamp = sessionData.replayTimestamp < 946684800000 
              ? sessionData.replayTimestamp * 1000 
              : sessionData.replayTimestamp;
          } 
          // Otherwise use session start date
          else if (sessionData.fromDate) {
            // Handle both Unix timestamps (seconds) and date strings
            const fromDate = sessionData.fromDate;
            if (typeof fromDate === 'number') {
              // If number is small (before year 2000 in ms), it's likely seconds
              targetTimestamp = fromDate < 946684800000 ? fromDate * 1000 : fromDate;
            } else {
              // Try parsing as date string
              const parsed = new Date(fromDate).getTime();
              // If parsing fails or gives 1970, the string might be a numeric timestamp
              if (isNaN(parsed) || parsed < 946684800000) {
                const numericValue = parseInt(fromDate);
                if (!isNaN(numericValue)) {
                  targetTimestamp = numericValue < 946684800000 ? numericValue * 1000 : numericValue;
                }
              } else {
                targetTimestamp = parsed;
              }
            }
          }
        }
        
        // Last fallback to replayTimestampRef
        if (!targetTimestamp || targetTimestamp <= 0) {
          targetTimestamp = replayTimestampRef.current;
        }
        
        // If timestamp not set yet, retry a few times with delay
        if ((!targetTimestamp || targetTimestamp <= 0) && retryCount < 5) {
          setTimeout(() => scrollChartToStartDate(chart, retryCount + 1, forceScroll), 500);
          return;
        }
        
        if (!targetTimestamp || targetTimestamp <= 0) {
          console.log('Could not scroll to start date: no replay timestamp available');
          return;
        }
        
        try {
          // Calculate visible range: show ~50 bars before and after the target
          const intervalMs = getIntervalMs(currentIntervalRef.current);
          const barsToShow = 50;
          const from = (targetTimestamp - (intervalMs * barsToShow)) / 1000;
          const to = (targetTimestamp + (intervalMs * barsToShow)) / 1000;
          
          chart.setVisibleRange({ from, to });
          hasScrolledToStartRef.current = true;
          console.log('Scrolled chart to session start date:', new Date(targetTimestamp).toISOString());
          
          // One quick re-scroll after initial render to counter TradingView's auto-fit
          // But DON'T keep re-scrolling - this prevents user from moving the chart
          if (!forceScroll && retryCount === 0) {
            requestAnimationFrame(() => {
              try {
                chart.setVisibleRange({ from, to });
              } catch (e) {}
            });
          }
        } catch (e) {
          console.warn('Could not scroll chart to start date:', e);
        }
      }
      
      // Helper to get interval duration in milliseconds
      function getIntervalMs(interval: string): number {
        const num = parseInt(interval) || 1;
        if (interval.endsWith('D') || interval === 'D') return 24 * 60 * 60 * 1000;
        if (interval.endsWith('W') || interval === 'W') return 7 * 24 * 60 * 60 * 1000;
        if (interval.endsWith('M') || interval === 'M') return 30 * 24 * 60 * 60 * 1000;
        // Minutes
        return num * 60 * 1000;
      }
      
      const autoSaveChart = async () => {
        // Block all auto-saves until initial restore is complete
        if (!initialRestoreCompleteRef.current) {
          console.log('Skipping auto-save: initial restore not complete');
          return;
        }
        
        // Block auto-saves during resolution changes - drawings may temporarily be unavailable
        if (isChangingResolutionRef.current) {
          console.log('Skipping auto-save: resolution change in progress');
          return;
        }
        
        // Block auto-saves during drawing restoration - prevents duplicates
        if (isRestoringDrawingsRef.current) {
          console.log('Skipping auto-save: drawing restoration in progress');
          return;
        }
        
        // Block auto-saves during unmount - chart is being destroyed and will return 0 drawings
        if (isUnmountingRef.current) {
          console.log('Skipping auto-save: component unmounting');
          return;
        }
        
        // CRITICAL: Skip auto-save if TF switch completed within last 3 seconds
        // TradingView internally adjusts drawing coordinates to match current TF bar boundaries,
        // so capturing too soon after switch would save these adjusted (incorrect) coordinates
        const timeSinceSwitch = Date.now() - lastTfSwitchTimeRef.current;
        if (lastTfSwitchTimeRef.current > 0 && timeSinceSwitch < 3000) {
          console.log('Skipping auto-save: TF switch completed', timeSinceSwitch, 'ms ago (waiting 3000ms)');
          return;
        }
        
        try {
          // NOTE: Drawings are now saved by TradingView natively via save_load_adapter.saveLineToolsAndGroups
          // This auto-save only handles studies (indicators) and chart properties
          
          // Get all studies (indicators) on the chart - DEDUPLICATE by name
          const allStudies = chart.getAllStudies();
          const studies: any[] = [];
          const seenStudyNames = new Set<string>();
          
          for (const study of allStudies) {
            try {
              // Skip duplicate studies - only save one of each type
              if (seenStudyNames.has(study.name)) {
                console.log('Skipping duplicate study during save:', study.name);
                continue;
              }
              seenStudyNames.add(study.name);
              
              const studyObj = chart.getStudyById(study.id);
              if (studyObj) {
                const inputs = studyObj.getInputValues();
                studies.push({
                  name: study.name,
                  inputs: inputs,
                  forceOverlay: false,
                  lock: false,
                  overrides: {}
                });
              }
            } catch (e) {
              // Skip studies that can't be serialized
            }
          }
          
          // Get chart properties including canvas/background colors
          // TradingView Charting Library properties API
          let chartProperties: any = null;
          try {
            const props = chart.properties();
            if (props && typeof props.child === 'function') {
              const paneProps = props.child('paneProperties');
              if (paneProps) {
                const background = paneProps.child('background')?.value?.() || paneProps.child('background')?.getValue?.();
                const backgroundType = paneProps.child('backgroundType')?.value?.() || paneProps.child('backgroundType')?.getValue?.();
                
                if (background) {
                  chartProperties = {
                    background: background,
                    backgroundType: backgroundType || 'solid',
                    scalesBackground: background
                  };
                  console.log('Captured chart properties:', chartProperties);
                }
              }
            }
          } catch (e) {
            console.log('TradingView properties API not available, skipping chartProperties save');
          }
          
          // Build saved data object - drawings are handled by TradingView natively
          // This saves only studies, chart properties, and favorites
          const savedData: any = {
            drawings: [], // Empty - TradingView handles drawings via saveLineToolsAndGroups
            studies,
            interval: currentInterval,
            timestamp: Date.now(),
            favoriteDrawingTools: favoriteDrawingToolsRef.current
          };
          
          // Add chartProperties only if successfully captured
          if (chartProperties) {
            savedData.chartProperties = chartProperties;
          }
          
          const layoutData = {
            id: `session_${sessionId}_default`,
            name: 'Auto-saved Layout',
            symbol: symbol,
            resolution: currentInterval,
            content: JSON.stringify(savedData)
          };
          
          saveChartLayout(sessionId, layoutData);
          console.log('Chart auto-saved (studies only):', studies.length, 'studies (drawings handled by TradingView)');
        } catch (error) {
          console.error('Error auto-saving chart:', error);
        }
      };

      let saveTimeout: NodeJS.Timeout | null = null;
      const debouncedSave = () => {
        // Cancel any pending save if autosave is disabled
        if (!initialRestoreCompleteRef.current) {
          if (saveTimeout) {
            clearTimeout(saveTimeout);
            saveTimeout = null;
          }
          return;
        }
        // Block saves during resolution changes - drawings may be temporarily unavailable
        if (isChangingResolutionRef.current) {
          if (saveTimeout) {
            clearTimeout(saveTimeout);
            saveTimeout = null;
          }
          console.log('Skipping debounced save: resolution change in progress');
          return;
        }
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(autoSaveChart, 2000);
      };

      tvWidget.subscribe('onAutoSaveNeeded', debouncedSave);
      tvWidget.subscribe('drawing_event', (id: any, type: string) => {
        // Track explicit delete events to allow intentional zero-length saves
        if (type === 'remove') {
          const remainingShapes = chart.getAllShapes();
          if (remainingShapes.length === 0 && lastSavedDrawingsCountRef.current > 0) {
            console.log('User deleted all drawings, allowing empty save');
            userDeletedAllDrawingsRef.current = true;
          }
        } else if (type === 'create') {
          // Reset the delete flag
          userDeletedAllDrawingsRef.current = false;
          // Re-enable autosave if user creates new drawings (even if restore failed)
          if (!initialRestoreCompleteRef.current) {
            console.log('User created new drawing - enabling autosave');
            initialRestoreCompleteRef.current = true;
          }
        }
        debouncedSave();
      });
      tvWidget.subscribe('study_event', () => {
        // Immediately save when indicators are added/removed (not debounced)
        // This ensures deletions persist before timeframe switches
        if (initialRestoreCompleteRef.current) {
          autoSaveChart();
        }
      });
      
      // Subscribe to favorite drawing tools changes (if API is available)
      try {
        if (typeof (chart as any).onFavoriteDrawingsChanged === 'function') {
          (chart as any).onFavoriteDrawingsChanged().subscribe(null, (drawingTools: string[]) => {
            console.log('Favorite drawing tools changed:', drawingTools);
            favoriteDrawingToolsRef.current = drawingTools;
            debouncedSave();
          });
        }
      } catch (e) {
        console.log('Favorite drawings subscription not available');
      }
      
      chart.onIntervalChanged().subscribe(null, (newInterval: string) => {
        // Guard against re-entry when we trigger resolution changes ourselves
        if (isChangingResolutionRef.current) {
          console.log('onIntervalChanged: Ignoring (our own change)');
          return;
        }
        
        // TradingView's native timeframe buttons clicked
        console.log('==== TV NATIVE TIMEFRAME BUTTON ====');
        
        // Set guard BEFORE any work to prevent resetData from re-triggering this callback
        isChangingResolutionRef.current = true;
        
        // CRITICAL: Capture drawings AND visible range BEFORE any chart operations
        const chart = tvWidgetRef.current?.activeChart();
        let savedVisibleRange: { from: number; to: number } | null = null;
        
        if (chart) {
          // Capture visible range to preserve zoom level across timeframe switches
          try {
            savedVisibleRange = chart.getVisibleRange();
            console.log('Captured visible range:', savedVisibleRange);
          } catch (e) {
            console.warn('Failed to capture visible range:', e);
          }
          
          // DRAWINGS: Let TradingView handle native persistence across timeframe switches
          // Manual capture/restore causes race conditions with bar data loading on 1m timeframes
          // We only use manual save/restore for DB persistence, not for timeframe switches
          console.log('Native TF: Letting TradingView handle drawing persistence natively');
        }
        
        // Store saved range for use in callback AND in the slow path
        pendingVisibleRangeRef.current = savedVisibleRange;
        pendingVisibleRangeAppliedRef.current = false; // Reset flag for new switch
        
        // Update refs and state via the unified helper
        // Note: processTimeframeSwitch increments drawingSwitchIdRef, so we capture it after the call
        processTimeframeSwitch(newInterval, { 
          hideDropdown: false, 
          triggerSymbolSwitch: false,
          captureDrawings: false  // Already captured above
        });
        
        // Capture switch ID AFTER processTimeframeSwitch to use for restore validation
        const nativeSwitchId = drawingSwitchIdRef.current;
        console.log('Native TF: Using switch ID', nativeSwitchId, 'for restore validation');
        
        // NOTE: Do NOT clear bars cache here - processTimeframeSwitch handles cache validation
        // Clearing after processTimeframeSwitch causes bar index mismatch (fast path sets index
        // then cache clear triggers new fetch which resets index to wrong position)
        
        // Update subscribed resolution ref so handleNext uses correct bars
        subscribedResolutionRef.current = newInterval;
        
        // DRAWING PRESERVATION: Use setResolution ONLY (no symbol change)
        // This preserves TradingView's native drawing persistence across timeframe switches
        // 
        // IMPORTANT: Only run this block for FAST PATH (cached data).
        // For SLOW PATH, the data needs to be fetched first via the effect/API,
        // then the slow path's own completion handler will finalize things.
        // Running resetData() during slow path interferes with the data fetch.
        setTimeout(() => {
          // Check if fast path is being used - if not, skip TradingView operations
          // Slow path handles its own finalization after data loads via useEffect -> fetchAllHistory
          if (!fastPathActiveRef.current) {
            console.log('Native TF switch: SLOW PATH detected - useEffect will handle data fetch and finalization');
            // NOTE: Don't reset isChangingResolutionRef here - it was already reset in processTimeframeSwitch
            // The useEffect will call fetchAllHistory which will finalize the controller
            return;
          }
          
          try {
            const innerChart = tvWidgetRef.current?.activeChart();
            if (innerChart) {
              console.log('Native TF switch: FAST PATH - Using setResolution + resetData for drawing persistence');
              
              // Set the anchor AGAIN right before triggering getBars
              const currentAnchor = replayTimestampRef.current;
              if (currentAnchor > 0) {
                pendingAnchorTimestampRef.current = currentAnchor;
              }
              
              // NOTE: Do NOT clear cache here! Fast path uses cached data.
              // Clearing the cache causes getBars to find nothing and queue a fetch,
              // but dataReady fires immediately before fetch completes → gap in chart.
              // The cache was already validated in processTimeframeSwitch.
              console.log('Native TF: Using cached', barsCacheRef.current[newInterval]?.length || 0, 'bars for', newInterval);
              
              // Use setResolution ONLY - this preserves drawings natively
              innerChart.setResolution(newInterval, () => {
                // CRITICAL: Call resetData() to force TradingView to re-subscribe the datafeed
                // Without this, subscribeBars is never called and replay guards stay blocked
                console.log('Native TF: Calling resetData() to re-subscribe datafeed');
                innerChart.resetData();
                
                // Wait for dataReady to ensure bars are loaded
                innerChart.dataReady(() => {
                  console.log('Native TF: dataReady fired - drawings preserved natively');
                  try {
                    // DRAWINGS: TradingView handles native persistence across timeframe switches
                    // No manual clear/restore needed - drawings stay intact with stable symbol
                    
                    // Restore captured visible range or calculate default
                    const savedRange = pendingVisibleRangeRef.current;
                    if (savedRange && savedRange.from != null && savedRange.to != null && !pendingVisibleRangeAppliedRef.current) {
                      console.log('Native TF: Restoring visible range:', savedRange);
                      innerChart.setVisibleRange(savedRange);
                      pendingVisibleRangeAppliedRef.current = true;
                    } else if (!pendingVisibleRangeAppliedRef.current) {
                      const replayTs = replayTimestampRef.current;
                      if (replayTs > 0) {
                        const resolutionMinutes = intervalToMinutes(newInterval);
                        const barMs = resolutionMinutes * 60 * 1000;
                        const visibleFrom = (replayTs - barMs * 60) / 1000;
                        const visibleTo = (replayTs + barMs * 20) / 1000;
                        innerChart.setVisibleRange({ from: visibleFrom, to: visibleTo });
                        pendingVisibleRangeAppliedRef.current = true;
                      }
                    }
                    
                    try {
                      innerChart.getPanes()[0].getMainSourcePriceScale().setAutoScale(true);
                    } catch (e) {}
                  } catch (e) {}
                  
                  // CRITICAL: Ensure callbacksReady is true before finalizing
                  // TradingView may not call subscribeBars on repeated switches to same resolution
                  // In that case, restore from cached callbacks
                  if (!callbacksReadyRef.current) {
                    const cachedCallback = realtimeCallbacksRef.current.get(newInterval);
                    if (cachedCallback) {
                      console.log('Native TF: Restoring cached callback for', newInterval);
                      subscribedResolutionRef.current = newInterval;
                      onRealtimeCallbackRef.current = cachedCallback;
                      callbacksReadyRef.current = true;
                    } else {
                      console.warn('Native TF: No cached callback for', newInterval, '- replay controls may not work');
                    }
                  }
                  console.log('Native TF: callbacksReady=', callbacksReadyRef.current, 'before finalizing');
                  
                  // Finalize the controller to re-enable replay controls
                  console.log('Native TF switch: Finalizing controller for', newInterval);
                  lastTfSwitchTimeRef.current = Date.now(); // Mark switch completion time
                  tfController.finalize(newInterval);
                  isChangingResolutionRef.current = false;
                }); // Close dataReady callback
              }); // Close setResolution callback
            } else {
              lastTfSwitchTimeRef.current = Date.now();
              tfController.finalize(newInterval);
              isChangingResolutionRef.current = false;
            }
          } catch (e) {
            tfController.abort('onIntervalChanged error');
            isChangingResolutionRef.current = false;
          }
        }, 50);
        
        debouncedSave();
      });

      tvWidget.subscribe("drawing_event", (id: any, type: string) => {
        if (tradingState.potentialTrade) {
          dispatch({ type: "SET_POTENTIAL_TRADE", payload: null });
        }
        
        const drawing = chart.getShapeById(id);
        if (!drawing) return;

        const properties = drawing.getProperties();
        const points = drawing.getPoints();
        const point = points[0]?.price;
        const toolname = (drawing as any)._source?.toolname;

        // Handle TP/SL line drag events - look up which trade owns this line
        if (type === "move" || type === "properties_changed") {
          const allTradeLines = tradeLinesRef.current;
          const newPrice = points[0]?.price;
          
          if (newPrice) {
            // Find which trade this line belongs to
            for (const [tradeId, lines] of Object.entries(allTradeLines)) {
              const isTPLine = lines.tp && String(id) === String(lines.tp);
              const isSLLine = lines.sl && String(id) === String(lines.sl);
              
              if (isTPLine || isSLLine) {
                const precision = decimalPlaces || 5;
                const updates: any = { id: tradeId };
                if (isTPLine) {
                  updates.target = parseFloat(newPrice.toFixed(precision));
                } else if (isSLLine) {
                  updates.stopLoss = parseFloat(newPrice.toFixed(precision));
                }
                dispatch({ type: "UPDATE_OPEN_TRADE", payload: updates });
                console.log(`${isTPLine ? 'TP' : 'SL'} line for trade ${tradeId} moved to:`, newPrice.toFixed(precision));
                break; // Found the matching trade
              }
            }
          }
        }

        if (type !== "create" && type !== "properties_changed" && type !== "remove" && type !== "move") {
          handleDrawingTool(id, type, properties, point, toolname);
        }
      });
    });

    return () => {
      // Mark as unmounting to prevent auto-save from overwriting with empty data
      isUnmountingRef.current = true;
      
      if (tvWidgetRef.current) {
        // Skip save during resolution changes - widget is kept alive and drawings may be temporarily unavailable
        if (isChangingResolutionRef.current) {
          console.log('Skipping cleanup save: resolution change in progress');
          isUnmountingRef.current = false; // Reset since we're not actually unmounting
          return;
        }
        
        // IMPORTANT: Skip cleanup save entirely - the chart is in an unstable state during unmount
        // Auto-save has already saved the data, and trying to capture here often returns 0 drawings
        // which would overwrite the good data
        console.log('Cleanup: Skipping save during unmount - relying on auto-save data');
        
        // This is true unmount (leaving page) - destroy widget
        try {
          tvWidgetRef.current.remove();
        } catch (e) {
          // Widget might already be removed
        }
        tvWidgetRef.current = null;
        widgetInitializedRef.current = false; // Reset so widget can be created again if needed
      }
    };
  // Dependencies: symbol and decimalPlaces for widget config, hasBarsData to trigger on initial data load
  // Using hasBarsData (boolean) prevents re-runs when data changes, only triggers when data becomes available
  // Note: decimalPlaces may change during timeframe switches but isChangingResolutionRef guard prevents destruction
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, decimalPlaces, hasBarsData]);

  const handleDrawingTool = (id: any, type: string, properties: any, point: number, toolname: string) => {
    if (!point || !properties) return;
    
    const profitLevel = properties.profitLevel / Math.pow(10, decimalPlaces);
    const stopLevel = properties.stopLevel / Math.pow(10, decimalPlaces);
    let target, stopLoss, tradePoint;

    if (toolname === "LineToolRiskRewardLong") {
      target = point + profitLevel;
      stopLoss = point - stopLevel;
      tradePoint = point;

      dispatch({
        type: "SET_POTENTIAL_TRADE",
        payload: {
          id,
          entry: tradePoint,
          target: parseFloat(target.toFixed(5)),
          stopLoss: parseFloat(stopLoss.toFixed(5)),
          type: "long",
        },
      });
    } else if (toolname === "LineToolRiskRewardShort") {
      target = point - profitLevel;
      stopLoss = point + stopLevel;
      tradePoint = point;

      dispatch({
        type: "SET_POTENTIAL_TRADE",
        payload: {
          id,
          entry: tradePoint,
          target: parseFloat(target.toFixed(5)),
          stopLoss: parseFloat(stopLoss.toFixed(5)),
          type: "short",
        },
      });
    }
  };

  const removeTradeLines = useCallback((tradeId?: string, tradePrices?: { entry?: number; tp?: number; sl?: number }) => {
    if (!tvWidgetRef.current) {
      console.log("removeTradeLines: No widget ref");
      return;
    }
    
    try {
      const chart = tvWidgetRef.current.activeChart();
      if (!chart) {
        console.log("removeTradeLines: No active chart");
        return;
      }
      
      // Helper function to safely remove an entity by ID
      const safeRemoveEntity = (entityId: any, label: string) => {
        if (!entityId) return false;
        try {
          chart.removeEntity(entityId);
          console.log(`Removed ${label} line:`, entityId);
          return true;
        } catch (e) {
          console.log(`Could not remove ${label} line (may already be removed):`, entityId);
          return false;
        }
      };
      
      // Helper function to remove horizontal lines by price level (fallback)
      const removeLinesByPrice = (prices: number[]) => {
        try {
          const allShapes = chart.getAllShapes();
          console.log("getAllShapes for fallback removal:", allShapes.length, "shapes found");
          
          for (const shape of allShapes) {
            if (shape.name === 'horizontal_line') {
              try {
                const shapeObj = chart.getShapeById(shape.id);
                if (shapeObj) {
                  const points = shapeObj.getPoints();
                  if (points && points.length > 0) {
                    const shapePrice = points[0].price;
                    // Check if this shape's price matches any of our trade prices (with tolerance)
                    const matchesPrice = prices.some(p => Math.abs(shapePrice - p) < 0.00001);
                    if (matchesPrice) {
                      chart.removeEntity(shape.id);
                      console.log("Fallback removed horizontal line at price:", shapePrice);
                    }
                  }
                }
              } catch (shapeErr) {
                // Shape might already be removed
              }
            }
          }
        } catch (e) {
          console.log("Fallback removal error:", e);
        }
      };
      
      // If tradeId specified AND exists, remove only that trade's lines
      if (tradeId && tradeLinesRef.current[tradeId]) {
        const { entry, tp, sl } = tradeLinesRef.current[tradeId];
        console.log("Removing trade lines for trade:", tradeId, { entry, tp, sl });
        
        const entryRemoved = safeRemoveEntity(entry, 'entry');
        const tpRemoved = safeRemoveEntity(tp, 'TP');
        const slRemoved = safeRemoveEntity(sl, 'SL');
        
        // If any removal failed and we have price data, try fallback removal
        if ((!entryRemoved || !tpRemoved || !slRemoved) && tradePrices) {
          const pricesToRemove = [tradePrices.entry, tradePrices.tp, tradePrices.sl].filter(p => p !== undefined) as number[];
          if (pricesToRemove.length > 0) {
            console.log("Attempting fallback removal by price:", pricesToRemove);
            removeLinesByPrice(pricesToRemove);
          }
        }
        
        delete tradeLinesRef.current[tradeId];
        return;
      }
      
      // If tradeId specified but not found, try fallback removal by price
      if (tradeId) {
        console.log("Trade lines not found for:", tradeId, "- trying fallback removal");
        if (tradePrices) {
          const pricesToRemove = [tradePrices.entry, tradePrices.tp, tradePrices.sl].filter(p => p !== undefined) as number[];
          if (pricesToRemove.length > 0) {
            removeLinesByPrice(pricesToRemove);
          }
        }
        return;
      }
      
      // No tradeId provided - remove ALL trade lines
      console.log("Removing all trade lines:", Object.keys(tradeLinesRef.current));
      for (const tid of Object.keys(tradeLinesRef.current)) {
        const lines = tradeLinesRef.current[tid];
        // Skip if not a valid trade lines object (e.g., old format legacy keys)
        if (!lines || typeof lines !== 'object' || !('entry' in lines)) continue;
        const { entry, tp, sl } = lines;
        safeRemoveEntity(entry, 'entry');
        safeRemoveEntity(tp, 'TP');
        safeRemoveEntity(sl, 'SL');
      }
      tradeLinesRef.current = {};
    } catch (e) {
      console.error("Error in removeTradeLines:", e);
    }
  }, []);

  // Track if entry line is currently being updated to prevent race conditions
  const entryLineUpdatingRef = useRef(false);
  const lastEntryPnLRef = useRef<number>(0);

  // Update entry line label with current unrealized P&L using setProperties (keeps line ID stable)
  const updateEntryLineLabel = useCallback((trade: any, unrealizedPnL: number) => {
    if (!tvWidgetRef.current || !trade) return;
    
    // Skip if P&L hasn't changed significantly (prevents unnecessary updates)
    if (Math.abs(unrealizedPnL - lastEntryPnLRef.current) < 0.01) return;
    
    // Skip if already updating to prevent race conditions
    if (entryLineUpdatingRef.current) return;
    
    try {
      const chart = tvWidgetRef.current.activeChart();
      if (!chart) return;
      
      const tradeLineId = trade.id || 'default';
      const tradeLines = tradeLinesRef.current[tradeLineId];
      const entryLineId = tradeLines?.entry;
      
      if (!entryLineId) {
        // No entry line exists yet, skip update
        return;
      }
      
      let entryShape;
      try {
        entryShape = chart.getShapeById(entryLineId);
      } catch (e) {
        // Shape was removed (TradingView throws "There is no such shape")
        // This is expected after timeframe switch - silently clear reference
        if (tradeLines) tradeLines.entry = null;
        return;
      }
      
      if (!entryShape) {
        // Shape was removed, clear the reference
        if (tradeLines) tradeLines.entry = null;
        return;
      }
      
      entryLineUpdatingRef.current = true;
      lastEntryPnLRef.current = unrealizedPnL;
      
      const tradeLotSize = trade.lotSize || lotSize;
      const lotDisplay = tradeLotSize.toFixed(2);
      const pnlSign = unrealizedPnL >= 0 ? '+' : '';
      const entryLabel = `${lotDisplay} → ${pnlSign}${unrealizedPnL.toFixed(2)} USD`;
      
      // Update properties in place - keeps the same shape ID so TP/SL refs remain intact
      try {
        entryShape.setProperties({ text: entryLabel, showLabel: true, horzLabelsAlign: 'right' });
        entryShape.applyOverrides({
          linecolor: unrealizedPnL >= 0 ? "rgba(16, 185, 129, 0.9)" : "rgba(239, 68, 68, 0.9)",
          textcolor: unrealizedPnL >= 0 ? "rgba(16, 185, 129, 1)" : "rgba(239, 68, 68, 1)",
        });
      } catch (e) {
        console.log("Could not update entry shape properties:", e);
      }
      
      entryLineUpdatingRef.current = false;
    } catch (e) {
      console.error("Error updating entry line label:", e);
      entryLineUpdatingRef.current = false;
    }
  }, [lotSize]);

  const drawTradeLines = useCallback((trade: any) => {
    if (!tvWidgetRef.current || !trade) return;
    // Guard: Ensure session data is loaded for correct contractSize
    if (!sessionData?.symbol) return;
    
    try {
      const chart = tvWidgetRef.current.activeChart();
      if (!chart) return;
      
      // Remove only THIS trade's existing lines IF they exist (don't call for new trades)
      if (trade.id && tradeLinesRef.current[trade.id]) {
        removeTradeLines(trade.id, {
          entry: trade.entry,
          tp: trade.target,
          sl: trade.stopLoss
        });
      }
      
      console.log("Drawing trade lines for:", trade);
      
      // Calculate P&L values for each level
      const tradeLotSize = trade.lotSize || lotSize;
      const lotDisplay = tradeLotSize.toFixed(2);
      
      // Calculate potential P&L at TP level (using memoized contractSize)
      let tpPnL = 0;
      if (trade.target !== undefined) {
        if (trade.type === "long") {
          tpPnL = (trade.target - trade.entry) * tradeLotSize * contractSize;
        } else {
          tpPnL = (trade.entry - trade.target) * tradeLotSize * contractSize;
        }
      }
      
      // Calculate potential P&L at SL level
      let slPnL = 0;
      if (trade.stopLoss !== undefined) {
        if (trade.type === "long") {
          slPnL = (trade.stopLoss - trade.entry) * tradeLotSize * contractSize;
        } else {
          slPnL = (trade.entry - trade.stopLoss) * tradeLotSize * contractSize;
        }
      }
      
      // Format P&L labels like FX Replay: "0.90 -> +100.00 USD"
      const tpLabel = `${lotDisplay} → ${tpPnL >= 0 ? '+' : ''}${tpPnL.toFixed(2)} USD`;
      const slLabel = `${lotDisplay} → ${slPnL >= 0 ? '+' : ''}${slPnL.toFixed(2)} USD`;
      const entryLabel = `${lotDisplay} → +0.00 USD`;
      
      // Create entry line
      const entryPromise = chart.createShape(
        { price: trade.entry },
        {
          shape: "horizontal_line",
          lock: true,
          disableSelection: true,
          text: entryLabel,
          overrides: {
            linecolor: "rgba(245, 158, 11, 0.9)",
            linestyle: 2,
            linewidth: 1,
            showPrice: true,
            showLabel: true,
            horzLabelsAlign: "right",
            textcolor: "rgba(245, 158, 11, 1)",
          },
        }
      );
      
      // Only create TP line if target is defined
      const tpPromise = trade.target !== undefined ? chart.createShape(
        { price: trade.target },
        {
          shape: "horizontal_line",
          lock: false,
          disableSelection: false,
          text: tpLabel,
          overrides: {
            linecolor: "rgba(16, 185, 129, 0.9)",
            linestyle: 2,
            linewidth: 1,
            showPrice: true,
            showLabel: true,
            horzLabelsAlign: "right",
            textcolor: "rgba(16, 185, 129, 1)",
          },
        }
      ) : Promise.resolve(null);
      
      // Only create SL line if stopLoss is defined
      const slPromise = trade.stopLoss !== undefined ? chart.createShape(
        { price: trade.stopLoss },
        {
          shape: "horizontal_line",
          lock: false,
          disableSelection: false,
          text: slLabel,
          overrides: {
            linecolor: "rgba(239, 68, 68, 0.9)",
            linestyle: 2,
            linewidth: 1,
            showPrice: true,
            showLabel: true,
            horzLabelsAlign: "right",
            textcolor: "rgba(239, 68, 68, 1)",
          },
        }
      ) : Promise.resolve(null);
      
      // Wait for all shapes to be created, then force chart refresh
      Promise.all([entryPromise, tpPromise, slPromise]).then(([entryId, tpId, slId]) => {
        console.log("Lines created:", { entryId, tpId, slId });
        // Store lines keyed by trade ID for multi-trade support
        const tradeId = trade.id || 'default';
        tradeLinesRef.current[tradeId] = { entry: entryId, tp: tpId, sl: slId };
        
        // Force chart to refresh by getting visible range and resetting it
        try {
          const visibleRange = chart.getVisibleRange();
          if (visibleRange) {
            chart.setVisibleRange(visibleRange);
          }
        } catch (e) {
          console.log("Could not force chart refresh:", e);
        }
      }).catch((e: any) => console.error("Failed to create trade lines:", e));
      
    } catch (e) {
      console.error("Error drawing trade lines:", e);
    }
  }, [removeTradeLines, lotSize, contractSize, sessionData?.symbol]);

  // Restore open trade after chart loads
  useEffect(() => {
    if (!tvWidgetRef.current || allBars.length === 0 || isLoading) return;
    
    const openTrade = pendingOpenTradeRef.current;
    if (openTrade) {
      // Clear ref to prevent re-restore on re-render
      pendingOpenTradeRef.current = null;
      
      // Wait for chart to be fully ready before drawing lines
      setTimeout(() => {
        const tradeId = openTrade.id || `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const tradeWithId = { ...openTrade, id: tradeId };
        dispatch({ type: "ADD_OPEN_TRADE", payload: tradeWithId });
        drawTradeLines(tradeWithId);
        setShowPanel(true);
        console.log("Restored open trade:", tradeWithId);
      }, 500);
    }
  }, [allBars.length, isLoading, drawTradeLines]);

  useEffect(() => {
    // Only handle removal here - drawing is done directly in placement functions
    if (tradingState.openTrades.length === 0) {
      removeTradeLines();
    }
  }, [tradingState.openTrades, removeTradeLines]);

  // Keep openTradesRef in sync with state for event handlers
  useEffect(() => {
    openTradesRef.current = tradingState.openTrades;
  }, [tradingState.openTrades]);

  const closeTrade = useCallback(async (exitPrice: number, reason: string, trade: any) => {
    if (!trade) return;
    // Guard: Ensure session data is loaded for correct contractSize
    if (!sessionData?.symbol) return;
    
    // Remove only this trade's lines (pass prices for fallback removal)
    removeTradeLines(trade.id, {
      entry: trade.entry,
      tp: trade.target,
      sl: trade.stopLoss
    });
    
    // Use the trade's stored lot size, fallback to global lotSize (using memoized contractSize)
    const tradeLotSize = trade.lotSize || lotSize;
    
    let pnl = 0;
    if (trade.type === "long") {
      pnl = (exitPrice - trade.entry) * tradeLotSize * contractSize;
    } else {
      pnl = (trade.entry - exitPrice) * tradeLotSize * contractSize;
    }
    
    // Calculate R:R ratio - signed based on direction
    const slDistance = trade.stopLoss ? Math.abs(trade.entry - trade.stopLoss) : 0;
    let signedRR = 0;
    if (slDistance > 0) {
      // For long: positive move = (exit - entry), for short: positive move = (entry - exit)
      const signedMove = trade.type === "long" 
        ? (exitPrice - trade.entry) 
        : (trade.entry - exitPrice);
      signedRR = signedMove / slDistance;
    }
    
    const tradeData = {
      id: trade.dbId || Date.now(),
      type: trade.type,
      entry: trade.entry,
      exit: exitPrice,
      sl: trade.stopLoss,
      tp: trade.target,
      lotSize: tradeLotSize,
      pnl: pnl,
      rr: parseFloat(signedRR.toFixed(2)),
      reason: reason,
      timestamp: allBars[currentBarIndexRef.current]?.time || Date.now(),
    };
    
    dispatch({ type: "ADD_TRADE_HISTORY", payload: tradeData });
    dispatch({ type: "SET_REALISED_PL", payload: tradingState.realisedPL + pnl });
    dispatch({ type: "SET_UNREALISED_PL", payload: 0 });
    dispatch({ type: "CLOSE_OPEN_TRADE", payload: trade.id });
    
    // Update trade in database (close it)
    const parsedSessionId = parseInt(sessionId);
    if (!isNaN(parsedSessionId) && trade.dbId) {
      try {
        await fetch("/api/trades", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: parsedSessionId,
            tradeId: trade.dbId,
            exitPrice: exitPrice,
            closedAt: tradeData.timestamp,
            pnl: pnl,
            rr: parseFloat(signedRR.toFixed(2)),
          }),
        });
        
        // Save progress immediately when trade closes (don't wait for auto-save)
        const currentBar = allBars[currentBarIndexRef.current];
        if (currentBar) {
          const newBalance = (sessionDataRef.current?.currentBalance || 0) + pnl;
          await fetch('/api/backtest-sessions', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: parsedSessionId,
              progressPointer: currentBar.time,
              currentBalance: newBalance,
            }),
          });
          if (sessionDataRef.current) {
            sessionDataRef.current = { ...sessionDataRef.current, progressPointer: currentBar.time, currentBalance: newBalance };
          }
        }
      } catch (error) {
        console.error("Failed to close trade:", error);
      }
    }
  }, [removeTradeLines, lotSize, allBars, tradingState.realisedPL, sessionId, contractSize, sessionData?.symbol]);

  const handleNext = useCallback(async () => {
    // TRANSACTIONAL GATE: Block ALL replay advancement during TF switches
    // Use getIsSwitching() for immediate ref-based check (avoids React state delay)
    if (tfController.getIsSwitching()) {
      console.warn('handleNext: TF switch in progress - blocking');
      setIsPlaying(false);
      return;
    }
    
    // CRITICAL: Block if widget callbacks aren't ready yet (e.g., during HMR/widget recreation)
    if (!callbacksReadyRef.current) {
      console.warn('handleNext: callbacks not ready (widget recreating?) - pausing playback');
      setIsPlaying(false);
      return;
    }
    
    // Use ref for latest bars to avoid stale closure issues
    const bars = allBarsRef.current;
    const idx = currentBarIndexRef.current;
    const resolution = currentIntervalRef.current;
    const hasCallback = !!onRealtimeCallbackRef.current;
    const subscribedRes = subscribedResolutionRef.current;
    
    console.log('handleNext called:', { 
      idx, 
      barsLength: bars?.length, 
      resolution, 
      hasCallback,
      subscribedRes,
      callbacksReady: callbacksReadyRef.current,
      isAtEnd: idx >= (bars?.length || 0) - 1
    });
    
    if (!bars || bars.length === 0) {
      console.log('handleNext: no bars, stopping playback');
      setIsPlaying(false);
      return;
    }
    
    // Check if we're at the end and need to fetch more data
    if (idx >= bars.length - 1) {
      const session = sessionDataRef.current || sessionData;
      if (!session) {
        setIsPlaying(false);
        return;
      }
      
      // ALWAYS use the actual last bar's timestamp as the starting point
      // This prevents gaps when cached range is stale
      const lastBar = bars[bars.length - 1];
      if (!lastBar) {
        setIsPlaying(false);
        return;
      }
      
      // Use last bar's OPEN time as the fetch start (in seconds)
      // This ensures overlap at the boundary - Polygon aggregates by open time
      // The merge will dedupe the overlapping bar
      const lastBarOpenTime = lastBar.time / 1000;
      
      // Fetch 2 months of future data from the last bar's open time
      const newToDate = addMonths(new Date(lastBar.time), 2);
      const fetchFrom = Math.floor(lastBarOpenTime);
      const fetchTo = Math.floor(newToDate.getTime() / 1000);
      
      console.log('Fetch more bars: Using last bar open time for overlap', {
        lastBarTime: new Date(lastBar.time).toISOString(),
        fetchFrom,
        fetchTo,
      });
      
      const market = session.market || 'FOREX';
      const apiUrl = `/api/backtest/bars?market=${market}&symbol=${session.symbol}&resolution=${resolution}&to=${fetchTo}&from=${fetchFrom}`;
      
      console.log('Fetching more future bars for auto-play:', { resolution, fetchFrom, fetchTo });
      
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data && data.s === 'ok' && data.t && data.t.length > 0) {
          const newBars = data.t.map((time: number, i: number) => ({
            time: time * 1000,
            open: data.o[i],
            high: data.h[i],
            low: data.l[i],
            close: data.c[i],
            volume: data.v?.[i] || 0,
          }));
          
          // Merge with existing bars - use normalized cache key
          const nextCacheKey = normalizeCacheKey(resolution);
          const existingBars = barsCacheRef.current[nextCacheKey] || [];
          const allTimestamps = new Set(existingBars.map((b: any) => b.time));
          const uniqueNewBars = newBars.filter((b: any) => !allTimestamps.has(b.time));
          const mergedBars = [...existingBars, ...uniqueNewBars].sort((a, b) => a.time - b.time);
          
          console.log(`Merged bars: ${existingBars.length} + ${uniqueNewBars.length} = ${mergedBars.length}`);
          
          barsCacheRef.current[nextCacheKey] = mergedBars;
          
          // Update loaded range - use first bar's time for 'from' if not already set
          const existingRange = loadedRangeRef.current[nextCacheKey];
          loadedRangeRef.current[nextCacheKey] = {
            from: existingRange?.from || (mergedBars[0]?.time / 1000) || fetchFrom,
            to: fetchTo
          };
          
          // Update allBars and continue to next bar
          if (resolution === currentIntervalRef.current) {
            allBarsRef.current = mergedBars;
            setAllBars(mergedBars);
            
            // TIME-DRIVEN: Advance replayTime by one candle, then derive index
            const iMs = intervalToMs(resolution);
            const newReplayTime = replayTimestampRef.current + iMs;
            const newIndex = deriveBarIndexFromTime(mergedBars, newReplayTime, resolution);
            
            const nextBar = mergedBars[newIndex];
            if (nextBar && onRealtimeCallbackRef.current) {
              onRealtimeCallbackRef.current({ ...nextBar, time: nextBar.time });
            }
            
            setReplayTimeAndDeriveIndex(newReplayTime, resolution);
          }
        } else {
          console.log('No more future data available');
          setIsPlaying(false);
        }
      } catch (error) {
        console.error('Failed to fetch more bars:', error);
        setIsPlaying(false);
      }
      return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // TIME-DRIVEN APPROACH: Advance replayTime first, then derive new index
    // ═══════════════════════════════════════════════════════════════════════════
    const intervalMs = intervalToMs(resolution);
    const { newReplayTime, newIndex } = advanceReplayTime(intervalMs);
    
    // Get the bar at the new derived index
    const newBar = bars[newIndex];
    
    // Get the correct callback for the current resolution
    let callback = onRealtimeCallbackRef.current;
    if (!callback || subscribedRes !== resolution) {
      const correctCallback = realtimeCallbacksRef.current.get(resolution);
      if (correctCallback) {
        console.log('handleNext: Using callback from map for resolution:', resolution);
        callback = correctCallback;
        onRealtimeCallbackRef.current = correctCallback;
        subscribedResolutionRef.current = resolution;
      }
    }
    
    // Push bar to TradingView if subscribed
    if (newBar && callback) {
      callback({
        ...newBar,
        time: newBar.time,
      });
      // Update bar index state (derived from replayTime)
      currentBarIndexRef.current = newIndex;
      setCurrentBarIndexState(newIndex);
      replayIntervalRef.current = resolution;
    } else if (newBar && !callback) {
      // Rollback replayTime if we can't push to chart
      replayTimestampRef.current = newReplayTime - intervalMs;
      console.warn('handleNext: no callback available for resolution:', resolution, '- pausing until chart subscribes');
      setIsPlaying(false);
      return;
    }
  }, [sessionData]);

  // Handle forward with skip duration - skips multiple candles based on time
  const handleSkipForward = useCallback(async () => {
    // TRANSACTIONAL GATE: Block ALL replay advancement during TF switches
    // Use getIsSwitching() for immediate ref-based check (avoids React state delay)
    if (tfController.getIsSwitching()) {
      console.warn('handleSkipForward: TF switch in progress - blocking');
      setIsPlaying(false);
      return;
    }
    
    // CRITICAL: Block if widget callbacks aren't ready yet (e.g., during HMR/widget recreation)
    if (!callbacksReadyRef.current) {
      console.warn('handleSkipForward: callbacks not ready (widget recreating?) - pausing playback');
      setIsPlaying(false);
      return;
    }
    
    const bars = allBarsRef.current;
    const idx = currentBarIndexRef.current;
    const resolution = currentIntervalRef.current;
    const subscribedRes = subscribedResolutionRef.current;
    
    console.log('handleSkipForward called:', {
      idx,
      barsLength: bars?.length,
      resolution,
      subscribedRes,
      hasCallback: !!onRealtimeCallbackRef.current,
      callbacksReady: callbacksReadyRef.current,
    });
    
    if (!bars || bars.length === 0) {
      console.log('handleSkipForward: no bars, stopping playback');
      setIsPlaying(false);
      return;
    }
    
    // Check if we're at or near the end and need to fetch more data
    if (idx >= bars.length - 1) {
      console.log('Skip forward: at end of loaded bars', { resolution, idx, barsLength: bars.length });
      
      // Fetch more future data
      const session = sessionDataRef.current || sessionData;
      if (!session) {
        console.log('Skip forward: no session data');
        setIsPlaying(false);
        return;
      }
      
      const skipCacheKey = normalizeCacheKey(resolution);
      let currentRange = loadedRangeRef.current[skipCacheKey];
      if (!currentRange) {
        // If no range exists, derive from the last bar's timestamp
        const lastBar = bars[bars.length - 1];
        if (lastBar) {
          const lastBarTime = lastBar.time / 1000;
          currentRange = { from: lastBarTime - (30 * 24 * 60 * 60), to: lastBarTime };
          loadedRangeRef.current[skipCacheKey] = currentRange;
          console.log('Skip forward: created range from last bar', { lastBarTime, currentRange });
        } else {
          console.log('Skip forward: no range and no bars');
          setIsPlaying(false);
          return;
        }
      }
      
      // Fetch 2 months of future data
      const currentToDate = new Date(currentRange.to * 1000);
      const newToDate = addMonths(currentToDate, 2);
      const fetchFrom = currentRange.to;
      const fetchTo = Math.floor(newToDate.getTime() / 1000);
      
      const market = session.market || 'FOREX';
      const apiUrl = `/api/backtest/bars?market=${market}&symbol=${session.symbol}&resolution=${resolution}&to=${fetchTo}&from=${fetchFrom}`;
      
      console.log('Fetching more future bars for skip forward:', { resolution, fetchFrom, fetchTo });
      
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data && data.s === 'ok' && data.t && data.t.length > 0) {
          const newBars = data.t.map((time: number, i: number) => ({
            time: time * 1000,
            open: data.o[i],
            high: data.h[i],
            low: data.l[i],
            close: data.c[i],
            volume: data.v?.[i] || 0,
          }));
          
          // Merge with existing bars - use normalized cache key
          const existingBars = barsCacheRef.current[skipCacheKey] || [];
          const allTimestamps = new Set(existingBars.map((b: any) => b.time));
          const uniqueNewBars = newBars.filter((b: any) => !allTimestamps.has(b.time));
          const mergedBars = [...existingBars, ...uniqueNewBars].sort((a, b) => a.time - b.time);
          
          console.log(`Merged bars: ${existingBars.length} + ${uniqueNewBars.length} = ${mergedBars.length}`);
          
          barsCacheRef.current[skipCacheKey] = mergedBars;
          loadedRangeRef.current[skipCacheKey] = {
            from: currentRange.from,
            to: fetchTo
          };
          
          // Update allBars if this is the current resolution
          if (resolution === currentIntervalRef.current) {
            allBarsRef.current = mergedBars;
            setAllBars(mergedBars);
            
            // TIME-DRIVEN: Advance replayTime by skip duration
            const candlesToSkip = getCandlesToSkip();
            const intervalMs = intervalToMs(resolution);
            const skipMs = candlesToSkip * intervalMs;
            const newReplayTime = replayTimestampRef.current + skipMs;
            const newIndex = Math.min(
              deriveBarIndexFromTime(mergedBars, newReplayTime, resolution),
              mergedBars.length - 1
            );
            
            // Get the correct callback for the current resolution
            let cb = onRealtimeCallbackRef.current;
            if (!cb || subscribedRes !== resolution) {
              const correctCb = realtimeCallbacksRef.current.get(resolution);
              if (correctCb) {
                cb = correctCb;
                onRealtimeCallbackRef.current = correctCb;
                subscribedResolutionRef.current = resolution;
              }
            }
            
            // Push all bars from current to new index
            if (cb) {
              const currentIdx = deriveBarIndexFromTime(mergedBars, replayTimestampRef.current, resolution);
              for (let i = currentIdx + 1; i <= newIndex; i++) {
                const bar = mergedBars[i];
                if (bar) {
                  cb({ ...bar, time: bar.time });
                }
              }
            }
            
            setReplayTimeAndDeriveIndex(newReplayTime, resolution);
          }
        } else {
          console.log('No more future data available');
          setIsPlaying(false);
        }
      } catch (error) {
        console.error('Failed to fetch more bars:', error);
        setIsPlaying(false);
      }
      return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // TIME-DRIVEN APPROACH: Advance replayTime by skip duration, then derive index
    // ═══════════════════════════════════════════════════════════════════════════
    const candlesToSkip = getCandlesToSkip();
    const intervalMs = intervalToMs(resolution);
    const skipMs = candlesToSkip * intervalMs;
    
    // Advance replayTime by skip duration
    const oldReplayTime = replayTimestampRef.current;
    const newReplayTime = oldReplayTime + skipMs;
    replayTimestampRef.current = newReplayTime;
    
    // Derive new index from replayTime
    const newIndex = Math.min(
      deriveBarIndexFromTime(bars, newReplayTime, resolution),
      bars.length - 1
    );
    
    console.log('handleSkipForward time-driven:', {
      oldTime: new Date(oldReplayTime).toISOString(),
      newTime: new Date(newReplayTime).toISOString(),
      skipMs,
      candlesToSkip,
      derivedIndex: newIndex,
    });
    
    // Get the correct callback for the current resolution
    let callback = onRealtimeCallbackRef.current;
    if (!callback || subscribedRes !== resolution) {
      const correctCallback = realtimeCallbacksRef.current.get(resolution);
      if (correctCallback) {
        console.log('handleSkipForward: Using callback from map for resolution:', resolution);
        callback = correctCallback;
        onRealtimeCallbackRef.current = correctCallback;
        subscribedResolutionRef.current = resolution;
      }
    }
    
    // Push all bars in between to TradingView to update the chart
    if (callback) {
      for (let i = idx + 1; i <= newIndex; i++) {
        const bar = bars[i];
        if (bar) {
          callback({
            ...bar,
            time: bar.time,
          });
        }
      }
      // Update bar index state (derived from replayTime)
      currentBarIndexRef.current = newIndex;
      setCurrentBarIndexState(newIndex);
      replayIntervalRef.current = resolution;
    } else {
      // Rollback replayTime if we can't push to chart
      replayTimestampRef.current = oldReplayTime;
      console.warn('handleSkipForward: no callback available for resolution:', resolution, '- pausing');
      setIsPlaying(false);
    }
  }, [getCandlesToSkip, sessionData]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TIME-DRIVEN: All seek/prev/next functions compute replayTime first
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleSkipBackward = useCallback(() => {
    // TRANSACTIONAL GATE: Block during TF switches
    if (tfController.getIsSwitching()) return;
    
    const bars = allBarsRef.current;
    const resolution = currentIntervalRef.current;
    if (!bars || bars.length === 0) return;
    
    const intervalMs = intervalToMs(resolution);
    const candlesToSkip = getCandlesToSkip();
    const skipMs = candlesToSkip * intervalMs;
    
    // TIME-DRIVEN: Subtract time, then derive index
    const newReplayTime = Math.max(replayTimestampRef.current - skipMs, bars[0].time + intervalMs);
    setReplayTimeAndDeriveIndex(newReplayTime, resolution);
  }, [getCandlesToSkip]);

  const handlePrev = useCallback(() => {
    // TRANSACTIONAL GATE: Block during TF switches
    if (tfController.getIsSwitching()) return;
    
    const bars = allBarsRef.current;
    const resolution = currentIntervalRef.current;
    if (!bars || bars.length === 0) return;
    
    const intervalMs = intervalToMs(resolution);
    // TIME-DRIVEN: Subtract one candle duration
    const newReplayTime = Math.max(replayTimestampRef.current - intervalMs, bars[0].time + intervalMs);
    setReplayTimeAndDeriveIndex(newReplayTime, resolution);
  }, []);

  const handleNext10 = () => {
    // TRANSACTIONAL GATE: Block during TF switches
    if (tfController.getIsSwitching()) return;
    
    const bars = allBarsRef.current;
    const resolution = currentIntervalRef.current;
    if (!bars || bars.length === 0) return;
    
    const intervalMs = intervalToMs(resolution);
    const lastBarCloseTime = bars[bars.length - 1].time + intervalMs;
    // TIME-DRIVEN: Add 10 candle durations
    const newReplayTime = Math.min(replayTimestampRef.current + (10 * intervalMs), lastBarCloseTime);
    setReplayTimeAndDeriveIndex(newReplayTime, resolution);
  };

  const handlePrev10 = () => {
    // TRANSACTIONAL GATE: Block during TF switches
    if (tfController.getIsSwitching()) return;
    
    const bars = allBarsRef.current;
    const resolution = currentIntervalRef.current;
    if (!bars || bars.length === 0) return;
    
    const intervalMs = intervalToMs(resolution);
    // TIME-DRIVEN: Subtract 10 candle durations
    const newReplayTime = Math.max(replayTimestampRef.current - (10 * intervalMs), bars[0].time + intervalMs);
    setReplayTimeAndDeriveIndex(newReplayTime, resolution);
  };

  const handleRestart = () => {
    // TRANSACTIONAL GATE: Block during TF switches
    if (tfController.getIsSwitching()) return;
    
    const bars = allBarsRef.current;
    const resolution = currentIntervalRef.current;
    if (!bars || bars.length === 0) return;
    
    const intervalMs = intervalToMs(resolution);
    const startIndex = bars.length >= 6 ? 5 : Math.max(0, bars.length - 1);
    // TIME-DRIVEN: Set replayTime to the close time of the start bar
    const newReplayTime = bars[startIndex].time + intervalMs;
    setReplayTimeAndDeriveIndex(newReplayTime, resolution);
    setIsPlaying(false);
    removeTradeLines();
    dispatch({ type: "RESET_SESSION" });
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleResetChart = async () => {
    if (!confirm('Reset chart layout? This will clear all saved indicators and drawings. The chart will reload.')) {
      return;
    }
    try {
      const response = await fetch('/api/backtest-sessions/chart-layout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action: 'resetChartLayouts' })
      });
      const result = await response.json();
      if (result.success) {
        window.location.reload();
      } else {
        alert('Failed to reset chart: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Reset chart error:', error);
      alert('Failed to reset chart');
    }
  };

  useEffect(() => {
    if (isPlaying && !isEndReached) {
      autoPlayIntervalRef.current = setInterval(() => {
        handleNext();
      }, playbackSpeed);
    } else {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    }
    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [isPlaying, isEndReached, handleNext, playbackSpeed]);

  // Function to sync TP/SL line positions from chart before hit detection
  const syncLinesToTradeState = useCallback(() => {
    const allTradeLines = tradeLinesRef.current;
    const openTrades = openTradesRef.current || [];
    const hasWidget = !!tvWidgetRef.current;
    
    console.log("syncLinesToTradeState called:", {
      hasWidget,
      hasActiveTrade: openTrades.length > 0,
      tradeCount: openTrades.length
    });
    
    if (!tvWidgetRef.current || openTrades.length === 0) return;
    
    try {
      const chart = tvWidgetRef.current.activeChart();
      if (!chart) return;
      
      const precision = decimalPlaces || 5;
      
      // Sync lines for each open trade
      for (const trade of openTrades) {
        const storedLines = allTradeLines[trade.id];
        if (!storedLines) continue;
        
        let updated = false;
        const updates: any = { id: trade.id };
        
        // Check TP line position
        if (storedLines.tp && trade.target !== undefined) {
          try {
            const tpShape = chart.getShapeById(storedLines.tp);
            if (tpShape) {
              const tpPoints = tpShape.getPoints();
              const tpPrice = tpPoints[0]?.price;
              if (tpPrice && Math.abs(tpPrice - trade.target) > 0.00001) {
                updates.target = parseFloat(tpPrice.toFixed(precision));
                updated = true;
              }
            }
          } catch (e) { /* shape may be removed */ }
        }
        
        // Check SL line position
        if (storedLines.sl && trade.stopLoss !== undefined) {
          try {
            const slShape = chart.getShapeById(storedLines.sl);
            if (slShape) {
              const slPoints = slShape.getPoints();
              const slPrice = slPoints[0]?.price;
              if (slPrice && Math.abs(slPrice - trade.stopLoss) > 0.00001) {
                updates.stopLoss = parseFloat(slPrice.toFixed(precision));
                updated = true;
              }
            }
          } catch (e) { /* shape may be removed */ }
        }
        
        if (updated) {
          dispatch({ type: "UPDATE_OPEN_TRADE", payload: updates });
        }
      }
    } catch (e) {
      console.error("Error syncing lines:", e);
    }
  }, [decimalPlaces]);

  useEffect(() => {
    // Guard: Don't process trades until session data is fully loaded
    // This ensures contractSize is correctly calculated for XAU/XAG/etc
    if (!sessionData?.symbol) return;
    
    // Sync line positions from chart before checking TP/SL hits
    syncLinesToTradeState();
    
    // Use ref for immediate access to latest trade values (including after dragging TP/SL)
    const trades = openTradesRef.current || [];
    if (trades.length > 0 && allBars[currentBarIndex]) {
      const currentBar = allBars[currentBarIndex];
      const currentHigh = currentBar.high;
      const currentLow = currentBar.low;
      const currentClose = currentBar.close;
      let totalPnl = 0;
      
      // Using memoized contractSize for P&L calculations
      for (const trade of trades) {
        const tradeLotSize = trade.lotSize || lotSize;
        let tradePnl = 0;
        
        if (trade.type === "long") {
          tradePnl = (currentClose - trade.entry) * tradeLotSize * contractSize;
          // Check if wick touched TP (high >= target) or SL (low <= stopLoss)
          if (trade.target !== undefined && currentHigh >= trade.target) {
            closeTrade(trade.target, "TP Hit", trade);
          } else if (trade.stopLoss !== undefined && currentLow <= trade.stopLoss) {
            closeTrade(trade.stopLoss, "SL Hit", trade);
          }
        } else {
          tradePnl = (trade.entry - currentClose) * tradeLotSize * contractSize;
          // Check if wick touched TP (low <= target) or SL (high >= stopLoss)
          if (trade.target !== undefined && currentLow <= trade.target) {
            closeTrade(trade.target, "TP Hit", trade);
          } else if (trade.stopLoss !== undefined && currentHigh >= trade.stopLoss) {
            closeTrade(trade.stopLoss, "SL Hit", trade);
          }
        }
        totalPnl += tradePnl;
        
        // Update entry line label with current unrealized P&L
        updateEntryLineLabel(trade, tradePnl);
      }
      dispatch({ type: "SET_UNREALISED_PL", payload: totalPnl });
    } else if (trades.length === 0) {
      dispatch({ type: "SET_UNREALISED_PL", payload: 0 });
    }
  }, [currentBarIndex, allBars, tradingState.openTrades, lotSize, closeTrade, syncLinesToTradeState, updateEntryLineLabel, contractSize, sessionData?.symbol]);

  useEffect(() => {
    if (tradingState.limitOrders.length > 0 && allBars[currentBarIndex]) {
      const currentBar = allBars[currentBarIndex];
      const currentHigh = currentBar.high;
      const currentLow = currentBar.low;
      const openedAt = currentBar.time || Date.now();
      
      for (const order of tradingState.limitOrders) {
        let triggered = false;
        
        if (order.type === "long" && currentLow <= order.entryPrice && order.entryPrice <= currentHigh) {
          triggered = true;
        } else if (order.type === "short" && currentLow <= order.entryPrice && order.entryPrice <= currentHigh) {
          triggered = true;
        }
        
        if (triggered) {
          const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const trade = {
            id: tradeId,
            type: order.type,
            entry: order.entryPrice,
            target: order.target,
            stopLoss: order.stopLoss,
            dbId: null as string | null,
            lotSize: order.lotSize || lotSize,
          };
          drawTradeLines(trade);
          dispatch({ type: "REMOVE_LIMIT_ORDER", payload: order.id });
          setShowPanel(true);
          
          // Save to DB asynchronously
          const parsedSessionId = parseInt(sessionId);
          if (!isNaN(parsedSessionId)) {
            fetch("/api/trades", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: parsedSessionId,
                side: order.type === 'long' ? 'buy' : 'sell',
                entryPrice: order.entryPrice,
                sl: order.stopLoss,
                tp: order.target,
                size: order.lotSize || lotSize,
                openedAt: openedAt,
              }),
            })
            .then(res => res.json())
            .then(result => {
              if (result.success && result.trade?.id) {
                dispatch({ type: "UPDATE_OPEN_TRADE", payload: { id: tradeId, dbId: result.trade.id } });
              }
            })
            .catch(() => {});
          }
          dispatch({ type: "ADD_OPEN_TRADE", payload: trade });
          break;
        }
      }
    }
  }, [currentBarIndex, allBars, tradingState.limitOrders, tradingState.openTrades, drawTradeLines, sessionId, lotSize]);

  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(500 / speed);
  };

  const handlePlaceTrade = async (type: string) => {
    if (!allBars[currentBarIndex]) return;
    const currentPrice = allBars[currentBarIndex].close;
    const openedAt = allBars[currentBarIndex]?.time || Date.now();
    const tp = currentPrice + (type === "long" ? 0.0100 : -0.0100);
    const sl = currentPrice - (type === "long" ? 0.0050 : -0.0050);
    
    const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const trade = {
      id: tradeId,
      type: type,
      entry: currentPrice,
      target: tp,
      stopLoss: sl,
      dbId: null as string | null,
      lotSize: lotSize,
    };
    drawTradeLines(trade);
    setShowPanel(true);
    
    // Save to DB and update with dbId
    const dbId = await saveTradeToDb({
      side: type === 'long' ? 'buy' : 'sell',
      entryPrice: currentPrice,
      sl: sl,
      tp: tp,
      size: lotSize,
      openedAt: openedAt,
    });
    
    dispatch({ type: "ADD_OPEN_TRADE", payload: { ...trade, dbId } });
  };

  const handlePlaceOrderFromDrawing = () => {
    if (tradingState.potentialTrade) {
      setShowOrderDialog(true);
    }
  };

  const handleMarketOrder = async () => {
    if (!tradingState.potentialTrade || !allBars[currentBarIndex]) return;
    const currentPrice = allBars[currentBarIndex].close;
    const openedAt = allBars[currentBarIndex]?.time || Date.now();
    const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const trade = {
      id: tradeId,
      type: tradingState.potentialTrade.type,
      entry: currentPrice,
      target: tradingState.potentialTrade.target,
      stopLoss: tradingState.potentialTrade.stopLoss,
      dbId: null as string | null,
      lotSize: lotSize,
    };
    // Draw lines FIRST before any state updates to ensure immediate visibility
    drawTradeLines(trade);
    setShowOrderDialog(false);
    dispatch({ type: "SET_POTENTIAL_TRADE", payload: null });
    setShowPanel(true);
    
    // Save to DB and update with dbId
    const dbId = await saveTradeToDb({
      side: tradingState.potentialTrade.type === 'long' ? 'buy' : 'sell',
      entryPrice: currentPrice,
      sl: tradingState.potentialTrade.stopLoss,
      tp: tradingState.potentialTrade.target,
      size: lotSize,
      openedAt: openedAt,
    });
    
    dispatch({ type: "ADD_OPEN_TRADE", payload: { ...trade, dbId } });
  };

  const handleLimitOrder = () => {
    if (!tradingState.potentialTrade) return;
    const limitOrder = {
      id: Date.now(),
      type: tradingState.potentialTrade.type,
      entryPrice: tradingState.potentialTrade.entry,
      target: tradingState.potentialTrade.target,
      stopLoss: tradingState.potentialTrade.stopLoss,
      lotSize: lotSize,
    };
    const pendingTrade = {
      entry: tradingState.potentialTrade.entry,
      target: tradingState.potentialTrade.target,
      stopLoss: tradingState.potentialTrade.stopLoss,
    };
    drawTradeLines(pendingTrade);
    setShowOrderDialog(false);
    dispatch({ type: "ADD_LIMIT_ORDER", payload: limitOrder });
    dispatch({ type: "SET_POTENTIAL_TRADE", payload: null });
  };

  const initializeOrderForm = useCallback(() => {
    if (!allBars[currentBarIndex]) return;
    const currentPrice = allBars[currentBarIndex].close;
    const pipValue = Math.pow(10, -decimalPlaces);
    const defaultSLPips = 50;
    const defaultTPPips = 100;
    
    setOrderFormData(prev => ({
      ...prev,
      entryPrice: currentPrice.toFixed(decimalPlaces),
      stopLoss: (prev.side === 'buy' 
        ? currentPrice - (defaultSLPips * pipValue)
        : currentPrice + (defaultSLPips * pipValue)).toFixed(decimalPlaces),
      stopLossTicks: defaultSLPips.toString(),
      takeProfit: (prev.side === 'buy'
        ? currentPrice + (defaultTPPips * pipValue)
        : currentPrice - (defaultTPPips * pipValue)).toFixed(decimalPlaces),
      takeProfitTicks: defaultTPPips.toString(),
    }));
  }, [allBars, currentBarIndex, decimalPlaces]);

  useEffect(() => {
    if (showOrderDialog) {
      if (tradingState.potentialTrade) {
        setOrderFormData(prev => ({
          ...prev,
          side: tradingState.potentialTrade.type === 'long' ? 'buy' : 'sell',
          entryPrice: tradingState.potentialTrade.entry.toFixed(decimalPlaces),
          takeProfit: tradingState.potentialTrade.target.toFixed(decimalPlaces),
          stopLoss: tradingState.potentialTrade.stopLoss.toFixed(decimalPlaces),
          stopLossTicks: Math.abs(Math.round((tradingState.potentialTrade.entry - tradingState.potentialTrade.stopLoss) / Math.pow(10, -decimalPlaces))).toString(),
          takeProfitTicks: Math.abs(Math.round((tradingState.potentialTrade.target - tradingState.potentialTrade.entry) / Math.pow(10, -decimalPlaces))).toString(),
        }));
      } else {
        initializeOrderForm();
      }
    }
  }, [showOrderDialog, initializeOrderForm, tradingState.potentialTrade, decimalPlaces]);

  const calculateRiskAmount = () => {
    const balance = orderFormData.balanceType === 'initial' ? initialBalance : totalBalance;
    return (balance * orderFormData.riskPercent) / 100;
  };

  const calculateEstimatedLoss = () => {
    const riskAmount = calculateRiskAmount();
    return -riskAmount;
  };

  const calculateEstimatedProfit = () => {
    if (!orderFormData.entryPrice || !orderFormData.takeProfit || !orderFormData.stopLoss) return 0;
    const entry = parseFloat(orderFormData.entryPrice);
    const tp = parseFloat(orderFormData.takeProfit);
    const sl = parseFloat(orderFormData.stopLoss);
    
    const tpDistance = Math.abs(tp - entry);
    const slDistance = Math.abs(entry - sl);
    
    if (slDistance === 0) return 0;
    const riskRewardRatio = tpDistance / slDistance;
    return calculateRiskAmount() * riskRewardRatio;
  };

  const calculatePositionSize = () => {
    if (!orderFormData.entryPrice || !orderFormData.stopLoss) return 0;
    const entry = parseFloat(orderFormData.entryPrice);
    const sl = parseFloat(orderFormData.stopLoss);
    const slDistance = Math.abs(entry - sl);
    
    if (slDistance === 0) return 0;
    const riskAmount = calculateRiskAmount();
    // Using memoized contractSize for position sizing
    // Position size formula derived from P&L formula:
    // P&L = priceChange * lotSize * contractSize
    // To risk exactly riskAmount at SL: lotSize = riskAmount / (slDistance * contractSize)
    return riskAmount / (slDistance * contractSize);
  };

  const saveTradeToDb = async (tradeData: {
    side: string;
    entryPrice: number;
    sl: number;
    tp: number;
    size: number;
    openedAt: number;
  }): Promise<string | null> => {
    const parsedSessionId = parseInt(sessionId);
    if (isNaN(parsedSessionId)) return null;
    
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: parsedSessionId,
          ...tradeData,
        }),
      });
      const result = await res.json();
      if (result.success && result.trade?.id) {
        return result.trade.id;
      }
    } catch (error) {
      console.error("Failed to save trade to DB:", error);
    }
    return null;
  };

  const handleOrderFormSubmit = async (action: 'save' | 'save_journal') => {
    if (!allBars[currentBarIndex]) return;
    
    const entry = orderFormData.orderType === 'market' 
      ? allBars[currentBarIndex].close 
      : parseFloat(orderFormData.entryPrice);
    const tp = orderFormData.takeProfitEnabled 
      ? (parseFloat(orderFormData.takeProfit) || entry + (orderFormData.side === 'buy' ? 0.01 : -0.01))
      : undefined;
    const sl = orderFormData.stopLossEnabled 
      ? (parseFloat(orderFormData.stopLoss) || entry - (orderFormData.side === 'buy' ? 0.005 : -0.005))
      : undefined;
    const posSize = parseFloat(orderFormData.positionSize) || calculatePositionSize();
    
    const tradeType = orderFormData.side === 'buy' ? 'long' : 'short';
    const openedAt = allBars[currentBarIndex]?.time || Date.now();
    
    if (orderFormData.orderType === 'market') {
      const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const trade = {
        id: tradeId,
        type: tradeType,
        entry: entry,
        target: tp,
        stopLoss: sl,
        dbId: null as string | null,
        lotSize: posSize,
      };
      drawTradeLines(trade);
      setShowOrderDialog(false);
      setLotSize(posSize);
      setShowPanel(true);
      
      // Save to DB and update with dbId
      const dbId = await saveTradeToDb({
        side: orderFormData.side,
        entryPrice: entry,
        sl: sl,
        tp: tp,
        size: posSize,
        openedAt: openedAt,
      });
      
      dispatch({ type: "ADD_OPEN_TRADE", payload: { ...trade, dbId } });
    } else {
      const limitOrder = {
        id: Date.now(),
        type: tradeType,
        entryPrice: entry,
        target: tp,
        stopLoss: sl,
        lotSize: posSize,
      };
      const pendingTrade = { entry, target: tp, stopLoss: sl };
      drawTradeLines(pendingTrade);
      setShowOrderDialog(false);
      dispatch({ type: "ADD_LIMIT_ORDER", payload: limitOrder });
    }
    
    setOrderFormData(prev => ({ ...prev, side: 'buy' }));
  };

  const handleQuickOrderSubmit = async () => {
    if (!allBars[currentBarIndex]) return;
    
    // Capture all form data before any state changes
    const orderSide = quickOrderData.side;
    const entry = allBars[currentBarIndex].close;
    const posSize = parseFloat(quickOrderData.lotSize) || 1;
    const tp = quickOrderData.takeProfit ? parseFloat(quickOrderData.takeProfit) : undefined;
    const sl = quickOrderData.stopLoss ? parseFloat(quickOrderData.stopLoss) : undefined;
    const tradeType = orderSide === 'buy' ? 'long' : 'short';
    const openedAt = allBars[currentBarIndex]?.time || Date.now();
    
    // Reset form and close dialog immediately
    setQuickOrderData({ side: 'buy', lotSize: '1', takeProfit: '', stopLoss: '' });
    setShowQuickOrderDialog(false);
    
    const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const trade = {
      id: tradeId,
      type: tradeType,
      entry: entry,
      target: tp,
      stopLoss: sl,
      dbId: null as string | null,
      lotSize: posSize,
    };
    drawTradeLines(trade);
    setLotSize(posSize);
    setShowPanel(true);
    
    const dbId = await saveTradeToDb({
      side: orderSide,
      entryPrice: entry,
      sl: sl,
      tp: tp,
      size: posSize,
      openedAt: openedAt,
    });
    
    dispatch({ type: "ADD_OPEN_TRADE", payload: { ...trade, dbId } });
  };

  const updateStopLossFromTicks = (ticks: string) => {
    const ticksNum = parseInt(ticks) || 0;
    const pipValue = Math.pow(10, -decimalPlaces);
    const entry = parseFloat(orderFormData.entryPrice) || 0;
    const newSL = orderFormData.side === 'buy'
      ? entry - (ticksNum * pipValue)
      : entry + (ticksNum * pipValue);
    setOrderFormData(prev => ({
      ...prev,
      stopLossTicks: ticks,
      stopLoss: newSL.toFixed(decimalPlaces),
    }));
  };

  const updateTakeProfitFromTicks = (ticks: string) => {
    const ticksNum = parseInt(ticks) || 0;
    const pipValue = Math.pow(10, -decimalPlaces);
    const entry = parseFloat(orderFormData.entryPrice) || 0;
    const newTP = orderFormData.side === 'buy'
      ? entry + (ticksNum * pipValue)
      : entry - (ticksNum * pipValue);
    setOrderFormData(prev => ({
      ...prev,
      takeProfitTicks: ticks,
      takeProfit: newTP.toFixed(decimalPlaces),
    }));
  };

  const handleManualClose = (trade: any) => {
    if (!trade) return;
    
    // Get the last available bar price for closing
    const currentBar = allBars[currentBarIndex] || allBars[currentBarIndex - 1] || allBars[allBars.length - 1];
    if (currentBar) {
      closeTrade(currentBar.close, "Manual Close", trade);
    }
  };

  const handleCloseAllTrades = () => {
    const currentBar = allBars[currentBarIndex] || allBars[currentBarIndex - 1] || allBars[allBars.length - 1];
    if (!currentBar) return;
    
    tradingState.openTrades.forEach((trade: any) => {
      closeTrade(currentBar.close, "Manual Close", trade);
    });
  };

  const [selectedTradeForModify, setSelectedTradeForModify] = useState<any>(null);

  const handleModifyTrade = (trade: any) => {
    if (trade) {
      setSelectedTradeForModify(trade);
      setModifyTradeData({
        newTP: trade.target?.toString() || '',
        newSL: trade.stopLoss?.toString() || '',
      });
      setShowModifyTradePopup(true);
    }
  };

  const executeModifyTrade = () => {
    if (selectedTradeForModify) {
      dispatch({
        type: "UPDATE_OPEN_TRADE",
        payload: {
          id: selectedTradeForModify.id,
          target: parseFloat(modifyTradeData.newTP),
          stopLoss: parseFloat(modifyTradeData.newSL),
        },
      });
      setShowModifyTradePopup(false);
      setSelectedTradeForModify(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      
      // Ctrl + Space = advance one candle (ignores skip duration)
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        if (!isEndReached) handleNext();
        return;
      }
      
      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (!isEndReached) togglePlayPause();
          break;
        case "ArrowRight":
          e.preventDefault();
          if (!isEndReached) handleSkipForward();
          break;
        case "KeyB":
          if (!tradingState.potentialTrade && !showOrderDialog && !showQuickOrderDialog) {
            e.preventDefault();
            setQuickOrderData(prev => ({ ...prev, side: 'buy' }));
            setShowQuickOrderDialog(true);
          }
          break;
        case "KeyS":
          if (!tradingState.potentialTrade && !showOrderDialog && !showQuickOrderDialog) {
            e.preventDefault();
            setQuickOrderData(prev => ({ ...prev, side: 'sell' }));
            setShowQuickOrderDialog(true);
          }
          break;
        case "KeyO":
          // O = Open full order dialog (market order by default)
          if (!showOrderDialog && !showQuickOrderDialog) {
            e.preventDefault();
            setOrderFormData(prev => ({ ...prev, orderType: 'market' }));
            setShowOrderDialog(true);
          }
          break;
        case "KeyL":
          // L = Open limit order dialog
          if (!showOrderDialog && !showQuickOrderDialog) {
            e.preventDefault();
            setOrderFormData(prev => ({ ...prev, orderType: 'limit' }));
            setShowOrderDialog(true);
          }
          break;
        case "KeyP":
          if (tradingState.potentialTrade) handlePlaceOrderFromDrawing();
          break;
        case "Escape":
          setShowPanel(false);
          setShowModifyTradePopup(false);
          setShowOrderDialog(false);
          setShowQuickOrderDialog(false);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEndReached, handleNext, handleSkipForward, tradingState.openTrades, tradingState.potentialTrade, showOrderDialog, showQuickOrderDialog]);

  const speedOptions = [
    { value: 0.25, label: "0.25x" },
    { value: 0.5, label: "0.5x" },
    { value: 1, label: "1x" },
    { value: 2, label: "2x" },
    { value: 4, label: "4x" },
    { value: 8, label: "8x" },
  ];
  const currentSpeed = 500 / playbackSpeed;

  const currentBar = allBars[currentBarIndex];
  const currentTime = currentBar
    ? new Date(currentBar.time).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      })
    : "...";

  if (sessionLoading) {
    return (
      <div className={`bt-container ${isDarkTheme ? '' : 'bt-light'}`}>
        {/* Skeleton Header */}
        <header className="bt-header-modern">
          <div className="bt-header-section">
            <div className="bt-skeleton-pill" style={{ width: 32, height: 32 }} />
            <div className="bt-skeleton-pill" style={{ width: 180, height: 32 }} />
            <div className="bt-skeleton-pill" style={{ width: 120, height: 32 }} />
          </div>
          <div className="bt-header-section" />
          <div className="bt-header-section">
            <div className="bt-skeleton-pill" style={{ width: 100, height: 32 }} />
          </div>
        </header>
        
        {/* Skeleton Chart Area */}
        <main className="bt-chart-area" style={{ marginBottom: 48 }}>
          <div className="bt-chart-wrapper">
            <div className="bt-chart-skeleton">
              <div className="bt-skeleton-chart-loading">
                <div className="bt-spinner"></div>
                <span>Loading chart...</span>
              </div>
              {/* Skeleton candlesticks - deterministic heights to avoid hydration mismatch */}
              <div className="bt-skeleton-candles">
                {[45, 62, 38, 55, 48, 70, 42, 58, 35, 65, 50, 40, 68, 52, 44, 60, 47, 56, 36, 63, 49, 41, 67, 53, 46, 59, 37, 64, 51, 43].map((height, i) => (
                  <div 
                    key={i} 
                    className="bt-skeleton-candle"
                    style={{ 
                      height: `${height}%`,
                      animationDelay: `${i * 50}ms`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>
        
        {/* Skeleton Bottom Drawer */}
        <div className="bt-bottom-drawer collapsed" style={{ height: 48 }}>
          <div className="bt-drawer-header">
            <div className="bt-drawer-tabs">
              <div className="bt-skeleton-pill" style={{ width: 120, height: 24 }} />
              <div className="bt-skeleton-pill" style={{ width: 120, height: 24 }} />
              <div className="bt-skeleton-pill" style={{ width: 120, height: 24 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bt-container ${isDarkTheme ? '' : 'bt-light'}`}>
      <header className="bt-header-modern">
        <div className="bt-header-section">
          <button className="bt-back-btn" onClick={() => router.push("/backtesting/dashboard")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          
          <div className="bt-session-pill">
            <span className="bt-session-name-text">{sessionData?.name || 'Session'}</span>
            <span className="bt-symbol-badge">{sessionData?.symbol || '...'}</span>
            <span className="bt-tf-badge">{currentInterval === "60" ? "1H" : currentInterval}</span>
          </div>
          
          <div className="bt-meta-pill">
            <span className="bt-meta-time">{currentTime}</span>
            <span className="bt-meta-divider">•</span>
            <span className="bt-meta-progress">{currentBarIndex + 1} / {allBars.length}</span>
          </div>
        </div>

        <div className="bt-header-section bt-stats-row">
        </div>

        <div className="bt-header-section">
          <button 
            className="bt-theme-toggle-btn"
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            title={isDarkTheme ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkTheme ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            )}
          </button>
          <button 
            className="bt-analytics-btn" 
            onClick={() => router.push('/backtesting/sessions')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10M12 20V4M6 20v-6"/>
            </svg>
            Analytics
          </button>
        </div>
      </header>

      <main className="bt-chart-area" style={{ marginBottom: isDrawerCollapsed ? drawerCollapsedHeight : drawerHeight }}>
        {/* Floating Replay Control Bar */}
        <div 
          className={`bt-floating-bar ${isDragging ? 'dragging' : ''}`}
          style={barPosition ? { 
            position: 'fixed',
            left: barPosition.x, 
            top: barPosition.y, 
            transform: 'none' 
          } : undefined}
        >
          {/* Drag Handle */}
          <div className="bt-float-drag" onMouseDown={handleBarDragStart}>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
              <circle cx="2" cy="2" r="1.5"/>
              <circle cx="6" cy="2" r="1.5"/>
              <circle cx="2" cy="7" r="1.5"/>
              <circle cx="6" cy="7" r="1.5"/>
              <circle cx="2" cy="12" r="1.5"/>
              <circle cx="6" cy="12" r="1.5"/>
            </svg>
          </div>
          
          {/* Navigation Group */}
          <div className="bt-float-group">
            <button onClick={togglePlayPause} disabled={isEndReached} className="bt-float-btn play" title={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7L8 5z"/>
                </svg>
              )}
            </button>
            <button onClick={handleSkipForward} disabled={isEndReached} className="bt-float-btn" title={`Skip Forward (${skipDurationOptions.find(s => s.value === skipDuration)?.label || '1 bar'})`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 5v14l10-7L9 5z"/>
              </svg>
            </button>
          </div>

          <div className="bt-float-divider"></div>

          {/* Speed Slider Group */}
          <div className="bt-float-group speed-group">
            <span className="bt-float-label">Speed</span>
            <input
              type="range"
              min="1"
              max="10"
              value={speedMultiplier}
              onChange={(e) => handleSpeedSliderChange(parseInt(e.target.value))}
              className="bt-float-range"
            />
            <span className="bt-float-speed-value">{speedMultiplier}x</span>
          </div>

          <div className="bt-float-divider"></div>

          {/* Skip Duration Dropdown */}
          <div className="bt-float-timeframe">
            <span className="bt-float-label" style={{ marginRight: '4px', fontSize: '10px' }}>Skip</span>
            <button 
              className="bt-float-tf-btn" 
              onClick={() => setShowSkipDurationDropdown(!showSkipDurationDropdown)}
            >
              {skipDurationOptions.find(s => s.value === skipDuration)?.label || '1 bar'}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5H7z"/>
              </svg>
            </button>
            {showSkipDurationDropdown && (
              <div className="bt-float-tf-dropdown">
                {skipDurationOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={`bt-float-tf-option ${skipDuration === opt.value ? 'active' : ''}`}
                    onClick={() => { setSkipDuration(opt.value); setShowSkipDurationDropdown(false); }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bt-float-divider"></div>

          {/* Trade Buttons */}
          <div className="bt-float-group trade-group">
            <button
              onClick={() => { setQuickOrderData(prev => ({ ...prev, side: 'buy' })); setShowQuickOrderDialog(true); }}
              className="bt-float-trade-btn long"
            >
              Long
            </button>
            <button
              onClick={() => { setQuickOrderData(prev => ({ ...prev, side: 'sell' })); setShowQuickOrderDialog(true); }}
              className="bt-float-trade-btn short"
            >
              Short
            </button>
            {tradingState.potentialTrade && (
              <button
                onClick={handlePlaceOrderFromDrawing}
                className="bt-float-trade-btn place"
              >
                Place
              </button>
            )}
            {tradingState.openTrades.length > 0 && (
              <button
                onClick={handleCloseAllTrades}
                className="bt-float-trade-btn close"
              >
                Close All ({tradingState.openTrades.length})
              </button>
            )}
          </div>
        </div>
        
        {/* Chart Container */}
        <div className="bt-chart-wrapper">
          {isLoading && (
            <div className="bt-chart-loading">
              <div className="bt-spinner"></div>
              <span>Loading chart data...</span>
            </div>
          )}
          {!isLoading && loadError && (
            <div className="bt-chart-error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
              </svg>
              <span className="bt-error-title">Unable to load chart</span>
              <span className="bt-error-message">{loadError}</span>
              <button 
                className="bt-retry-btn"
                onClick={() => {
                  setLoadError(null);
                  setIsLoading(true);
                  // Reset widget state to allow re-creation
                  widgetInitializedRef.current = false;
                  barsCacheRef.current = {};
                  // Force re-fetch by updating a dependency
                  const fetchKey = Date.now();
                  window.location.reload();
                }}
              >
                Try Again
              </button>
            </div>
          )}
          <div className="bt-chart" ref={chartContainerRef}></div>
        </div>
      </main>

      {/* Bottom Drawer Panel */}
      <div 
        className={`bt-bottom-drawer ${isDrawerResizing ? 'resizing' : ''} ${isDrawerCollapsed ? 'collapsed' : ''}`}
        style={{ height: isDrawerCollapsed ? drawerCollapsedHeight : drawerHeight }}
      >
        {!isDrawerCollapsed && (
          <div 
            className="bt-drawer-resize-handle" 
            onMouseDown={handleDrawerResizeStart}
          />
        )}
        <div className="bt-drawer-header">
          <div className="bt-drawer-tabs">
            <button 
              className={`bt-drawer-tab ${activeDrawerTab === 'open' ? 'active' : ''}`}
              onClick={() => { setActiveDrawerTab('open'); if (isDrawerCollapsed) setIsDrawerCollapsed(false); }}
            >
              Open Positions
              <span className="bt-drawer-tab-count">
                {tradingState.openTrades.length}
              </span>
            </button>
            <button 
              className={`bt-drawer-tab ${activeDrawerTab === 'pending' ? 'active' : ''}`}
              onClick={() => { setActiveDrawerTab('pending'); if (isDrawerCollapsed) setIsDrawerCollapsed(false); }}
            >
              Pending Orders
              <span className="bt-drawer-tab-count">
                {tradingState.limitOrders?.length || 0}
              </span>
            </button>
            <button 
              className={`bt-drawer-tab ${activeDrawerTab === 'closed' ? 'active' : ''}`}
              onClick={() => { setActiveDrawerTab('closed'); if (isDrawerCollapsed) setIsDrawerCollapsed(false); }}
            >
              Closed Positions
              <span className="bt-drawer-tab-count">
                {tradingState.tradeHistory.length}
              </span>
            </button>
          </div>

          <div className="bt-drawer-stats">
            <div className="bt-drawer-stat">
              <span className="bt-drawer-stat-label">Balance:</span>
              <span className="bt-drawer-stat-value">${totalBalance.toFixed(2)}</span>
            </div>
            <div className="bt-drawer-stat">
              <span className="bt-drawer-stat-label">Realized:</span>
              <span className={`bt-drawer-stat-value ${tradingState.realisedPL >= 0 ? 'profit' : 'loss'}`}>
                ${tradingState.realisedPL.toFixed(2)}
              </span>
            </div>
            <div className="bt-drawer-stat">
              <span className="bt-drawer-stat-label">Unrealized:</span>
              <span className={`bt-drawer-stat-value ${tradingState.unrealisedPL >= 0 ? 'profit' : 'loss'}`}>
                ${tradingState.unrealisedPL.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bt-drawer-actions">
            <button 
              className="bt-drawer-toggle-btn" 
              onClick={() => router.push('/backtesting/sessions')}
              title="Analytics"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18"/>
                <path d="M18 9l-5 5-4-4-3 3"/>
              </svg>
            </button>
            <button 
              className="bt-drawer-toggle-btn" 
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  document.documentElement.requestFullscreen();
                }
              }}
              title="Fullscreen"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
              </svg>
            </button>
            <button 
              className="bt-drawer-toggle-btn" 
              onClick={() => router.push("/backtesting/dashboard")}
              title="Exit"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
            <button 
              className="bt-drawer-toggle-btn" 
              onClick={() => setIsDrawerCollapsed(!isDrawerCollapsed)}
              title={isDrawerCollapsed ? "Expand panel" : "Collapse panel"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isDrawerCollapsed ? (
                  <path d="M18 15l-6-6-6 6"/>
                ) : (
                  <path d="M6 9l6 6 6-6"/>
                )}
              </svg>
            </button>
          </div>
        </div>

        <div className="bt-drawer-content">
          {activeDrawerTab === 'open' && (
            <>
              {tradingState.openTrades.length > 0 ? (
                <table className="bt-trade-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Side</th>
                      <th>Size</th>
                      <th>Entry</th>
                      <th>Take Profit</th>
                      <th>Stop Loss</th>
                      <th>Unrealized</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradingState.openTrades.map((trade: any, index: number) => {
                      const tradeLotSize = trade.lotSize || lotSize;
                      const currentBar = allBars[currentBarIndex];
                      const entryPrice = typeof trade.entry === 'number' ? trade.entry : 0;
                      const currentClose = currentBar?.close || entryPrice;
                      // Using memoized contractSize for display
                      const tradePnl = trade.type === 'long' 
                        ? (currentClose - entryPrice) * tradeLotSize * contractSize
                        : (entryPrice - currentClose) * tradeLotSize * contractSize;
                      return (
                        <tr key={trade.id || index}>
                          <td className="bt-table-symbol">{sessionData?.symbol || 'N/A'}</td>
                          <td>
                            <span className={`bt-table-side ${trade.type}`}>
                              {trade.type === 'long' ? 'BUY' : 'SELL'}
                            </span>
                          </td>
                          <td className="bt-table-value">{tradeLotSize}</td>
                          <td className="bt-table-value">{typeof trade.entry === 'number' ? trade.entry.toFixed(decimalPlaces || 5) : trade.entry || '-'}</td>
                          <td className="bt-table-value profit">
                            {typeof trade.target === 'number'
                              ? trade.target.toFixed(decimalPlaces || 5) 
                              : '-'}
                          </td>
                          <td className="bt-table-value loss">
                            {typeof trade.stopLoss === 'number'
                              ? trade.stopLoss.toFixed(decimalPlaces || 5) 
                              : '-'}
                          </td>
                          <td className={`bt-table-value ${tradePnl >= 0 ? 'profit' : 'loss'}`}>
                            {tradePnl >= 0 ? '+' : ''}${tradePnl.toFixed(2)}
                          </td>
                          <td>
                            <div className="bt-table-actions">
                              <button 
                                className="bt-table-action-btn edit" 
                                onClick={() => handleModifyTrade(trade)}
                                title="Modify"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              </button>
                              <button 
                                className="bt-table-action-btn close" 
                                onClick={() => handleManualClose(trade)}
                                title="Close"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="bt-table-empty">
                  <div className="bt-table-empty-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 2v20M2 12h20"/>
                    </svg>
                  </div>
                  <p>No open positions</p>
                  <span className="bt-hint">Press B to buy or S to sell</span>
                </div>
              )}
            </>
          )}

          {activeDrawerTab === 'pending' && (
            <>
              {tradingState.limitOrders && tradingState.limitOrders.length > 0 ? (
                <table className="bt-trade-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Side</th>
                      <th>Size</th>
                      <th>Entry Price</th>
                      <th>Take Profit</th>
                      <th>Stop Loss</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradingState.limitOrders.map((order: any) => (
                      <tr key={order.id}>
                        <td className="bt-table-symbol">{sessionData?.symbol || 'N/A'}</td>
                        <td>
                          <span className={`bt-table-side ${order.type}`}>
                            {order.type === 'long' ? 'BUY LIMIT' : 'SELL LIMIT'}
                          </span>
                        </td>
                        <td className="bt-table-value">{order.size || lotSize}</td>
                        <td className="bt-table-value">{order.entry?.toFixed(decimalPlaces || 5) || '-'}</td>
                        <td className="bt-table-value profit">
                          {order.target !== undefined ? order.target.toFixed(decimalPlaces || 5) : '-'}
                        </td>
                        <td className="bt-table-value loss">
                          {order.stopLoss !== undefined ? order.stopLoss.toFixed(decimalPlaces || 5) : '-'}
                        </td>
                        <td className="bt-table-value muted">Pending</td>
                        <td>
                          <div className="bt-table-actions">
                            <button 
                              className="bt-table-action-btn close" 
                              onClick={() => dispatch({ type: 'REMOVE_LIMIT_ORDER', payload: order.id })}
                              title="Cancel Order"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="bt-table-empty">
                  <div className="bt-table-empty-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M9 12h6"/>
                    </svg>
                  </div>
                  <p>No pending orders</p>
                  <span className="bt-hint">Use Place Order to create limit orders</span>
                </div>
              )}
            </>
          )}

          {activeDrawerTab === 'closed' && (
            <>
              {tradingState.tradeHistory.length > 0 ? (
                <table className="bt-trade-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Side</th>
                      <th>Size</th>
                      <th>Entry</th>
                      <th>Exit</th>
                      <th>Exit Reason</th>
                      <th>Realized</th>
                      <th>Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradingState.tradeHistory.map((trade: any) => (
                      <tr key={trade.id}>
                        <td className="bt-table-symbol">{sessionData?.symbol || 'N/A'}</td>
                        <td>
                          <span className={`bt-table-side ${trade.type}`}>
                            {trade.type === 'long' ? 'BUY' : 'SELL'}
                          </span>
                        </td>
                        <td className="bt-table-value">{trade.size || lotSize}</td>
                        <td className="bt-table-value">{trade.entry?.toFixed(decimalPlaces || 5) || '-'}</td>
                        <td className="bt-table-value">{trade.exit?.toFixed(decimalPlaces || 5) || '-'}</td>
                        <td className="bt-table-value muted">{trade.reason || 'Manual'}</td>
                        <td className={`bt-table-value ${trade.pnl >= 0 ? 'profit' : 'loss'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </td>
                        <td className="bt-table-value muted">$0.00</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="bt-table-empty">
                  <div className="bt-table-empty-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                      <path d="M22 4L12 14.01l-3-3"/>
                    </svg>
                  </div>
                  <p>No closed positions</p>
                  <span className="bt-hint">Completed trades will appear here</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showModifyTradePopup && (
        <div className="bt-modal-overlay" onClick={() => setShowModifyTradePopup(false)}>
          <div className="bt-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Modify Trade</h3>
            <div className="bt-input-group">
              <label>Take Profit</label>
              <input
                type="number"
                value={modifyTradeData.newTP}
                onChange={(e) => setModifyTradeData({ ...modifyTradeData, newTP: e.target.value })}
                step="0.00001"
              />
            </div>
            <div className="bt-input-group">
              <label>Stop Loss</label>
              <input
                type="number"
                value={modifyTradeData.newSL}
                onChange={(e) => setModifyTradeData({ ...modifyTradeData, newSL: e.target.value })}
                step="0.00001"
              />
            </div>
            <div className="bt-modal-actions">
              <button onClick={() => setShowModifyTradePopup(false)} className="bt-modal-btn cancel">Cancel</button>
              <button onClick={executeModifyTrade} className="bt-modal-btn save">Save</button>
            </div>
          </div>
        </div>
      )}

      {showOrderDialog && (
        <div className="bt-modal-overlay" onClick={() => setShowOrderDialog(false)}>
          <div className="bt-order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bt-order-modal-header">
              <h3>Place Order</h3>
              <button className="bt-modal-close" onClick={() => setShowOrderDialog(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="bt-order-balance-toggle">
              <div className="bt-order-balance-toggle-inner">
                <label className={`bt-radio-option ${orderFormData.balanceType === 'initial' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    checked={orderFormData.balanceType === 'initial'}
                    onChange={() => setOrderFormData(prev => ({ ...prev, balanceType: 'initial' }))}
                  />
                  Initial Balance
                </label>
                <label className={`bt-radio-option ${orderFormData.balanceType === 'current' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    checked={orderFormData.balanceType === 'current'}
                    onChange={() => setOrderFormData(prev => ({ ...prev, balanceType: 'current' }))}
                  />
                  Current Balance
                </label>
              </div>
            </div>

            <div className="bt-order-estimates">
              <div className="bt-estimate loss">
                <span className="bt-estimate-label">Estimated Loss</span>
                <span className="bt-estimate-value">${calculateEstimatedLoss().toFixed(2)}</span>
              </div>
              <div className="bt-estimate profit">
                <span className="bt-estimate-label">Estimated Profit</span>
                <span className="bt-estimate-value">${calculateEstimatedProfit().toFixed(2)}</span>
              </div>
            </div>

            <div className="bt-order-section">
              <label className="bt-order-section-label">Set risk percentage</label>
              <div className="bt-risk-presets">
                {[0.30, 0.50, 0.70, 1, 2, 3].map((pct) => (
                  <button
                    key={pct}
                    className={`bt-risk-btn ${orderFormData.riskPercent === pct ? 'active' : ''}`}
                    onClick={() => setOrderFormData(prev => ({ ...prev, riskPercent: pct }))}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="bt-order-row">
              <div className="bt-order-field">
                <label>Side</label>
                <div className="bt-select-wrapper">
                  <select
                    value={orderFormData.side}
                    onChange={(e) => {
                      setOrderFormData(prev => ({ ...prev, side: e.target.value as 'buy' | 'sell' }));
                      setTimeout(initializeOrderForm, 0);
                    }}
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                  <svg className="bt-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 10l5 5 5-5H7z"/>
                  </svg>
                </div>
              </div>
              <div className="bt-order-field">
                <label>Type</label>
                <div className="bt-select-wrapper">
                  <select
                    value={orderFormData.orderType}
                    onChange={(e) => setOrderFormData(prev => ({ ...prev, orderType: e.target.value as 'market' | 'limit' }))}
                  >
                    <option value="market">Market</option>
                    <option value="limit">Limit</option>
                  </select>
                  <svg className="bt-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 10l5 5 5-5H7z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bt-order-row">
              <div className="bt-order-field">
                <label>Risk Percent</label>
                <div className="bt-input-with-icon">
                  <span className="bt-input-icon">%</span>
                  <input
                    type="number"
                    value={orderFormData.riskPercent}
                    onChange={(e) => setOrderFormData(prev => ({ ...prev, riskPercent: parseFloat(e.target.value) || 0 }))}
                    step="0.1"
                  />
                </div>
              </div>
              <div className="bt-order-field">
                <label>Risk Amount</label>
                <div className="bt-input-with-icon">
                  <span className="bt-input-icon">$</span>
                  <input
                    type="text"
                    value={calculateRiskAmount().toFixed(2)}
                    readOnly
                    className="bt-readonly"
                  />
                </div>
              </div>
            </div>

            <div className="bt-order-row">
              <div className="bt-order-field">
                <label>Position Size (Contracts) *</label>
                <input
                  type="number"
                  value={orderFormData.positionSize || calculatePositionSize().toFixed(2)}
                  onChange={(e) => setOrderFormData(prev => ({ ...prev, positionSize: e.target.value }))}
                  step="0.01"
                  placeholder={calculatePositionSize().toFixed(2)}
                />
              </div>
              <div className="bt-order-field">
                <label>Entry Price *</label>
                <input
                  type="number"
                  value={orderFormData.entryPrice}
                  onChange={(e) => setOrderFormData(prev => ({ ...prev, entryPrice: e.target.value }))}
                  step="0.00001"
                  disabled={orderFormData.orderType === 'market'}
                  className={orderFormData.orderType === 'market' ? 'bt-readonly' : ''}
                />
              </div>
            </div>

            <div className="bt-order-toggle-row">
              <label className="bt-toggle">
                <input
                  type="checkbox"
                  checked={orderFormData.restrictedPositionSize}
                  onChange={(e) => setOrderFormData(prev => ({ ...prev, restrictedPositionSize: e.target.checked }))}
                />
                <span className="bt-toggle-slider"></span>
              </label>
              <span>Restricted Position Size</span>
            </div>

            <div className="bt-order-sl-tp-section">
              <div className="bt-sl-tp-header">
                <label className="bt-toggle">
                  <input
                    type="checkbox"
                    checked={orderFormData.stopLossEnabled}
                    onChange={(e) => setOrderFormData(prev => ({ ...prev, stopLossEnabled: e.target.checked }))}
                  />
                  <span className="bt-toggle-slider"></span>
                </label>
                <span>Stop Loss</span>
              </div>
              {orderFormData.stopLossEnabled && (
                <div className="bt-order-row">
                  <div className="bt-order-field">
                    <label>Stop Loss *</label>
                    <input
                      type="number"
                      value={orderFormData.stopLoss}
                      onChange={(e) => setOrderFormData(prev => ({ ...prev, stopLoss: e.target.value }))}
                      step="0.00001"
                    />
                  </div>
                  <div className="bt-order-field">
                    <label>Stop Loss in ticks *</label>
                    <div className="bt-input-with-suffix">
                      <input
                        type="number"
                        value={orderFormData.stopLossTicks}
                        onChange={(e) => updateStopLossFromTicks(e.target.value)}
                      />
                      <span className="bt-input-suffix">ticks</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bt-order-sl-tp-section">
              <div className="bt-sl-tp-header">
                <label className="bt-toggle">
                  <input
                    type="checkbox"
                    checked={orderFormData.takeProfitEnabled}
                    onChange={(e) => setOrderFormData(prev => ({ ...prev, takeProfitEnabled: e.target.checked }))}
                  />
                  <span className="bt-toggle-slider"></span>
                </label>
                <span>Take Profit</span>
              </div>
              {orderFormData.takeProfitEnabled && (
                <div className="bt-order-row">
                  <div className="bt-order-field">
                    <label>Take Profit *</label>
                    <input
                      type="number"
                      value={orderFormData.takeProfit}
                      onChange={(e) => setOrderFormData(prev => ({ ...prev, takeProfit: e.target.value }))}
                      step="0.00001"
                    />
                  </div>
                  <div className="bt-order-field">
                    <label>Take Profit in ticks *</label>
                    <div className="bt-input-with-suffix">
                      <input
                        type="number"
                        value={orderFormData.takeProfitTicks}
                        onChange={(e) => updateTakeProfitFromTicks(e.target.value)}
                      />
                      <span className="bt-input-suffix">ticks</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bt-order-actions">
              <button className="bt-order-action-btn discard" onClick={() => setShowOrderDialog(false)}>
                Discard
              </button>
              <button className="bt-order-action-btn save" onClick={() => handleOrderFormSubmit('save')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuickOrderDialog && (
        <div className="bt-modal-overlay" onClick={() => setShowQuickOrderDialog(false)}>
          <div className="bt-order-modal bt-quick-order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bt-order-modal-header">
              <h3>{quickOrderData.side === 'buy' ? 'Buy' : 'Sell'} Order</h3>
              <button className="bt-modal-close" onClick={() => setShowQuickOrderDialog(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="bt-quick-order-content">
              <div className="bt-order-field">
                <label>Lot Size *</label>
                <input
                  type="number"
                  value={quickOrderData.lotSize}
                  onChange={(e) => setQuickOrderData(prev => ({ ...prev, lotSize: e.target.value }))}
                  step="0.01"
                  min="0.01"
                  placeholder="1"
                />
              </div>

              <div className="bt-order-field">
                <label>Take Profit (optional)</label>
                <input
                  type="number"
                  value={quickOrderData.takeProfit}
                  onChange={(e) => setQuickOrderData(prev => ({ ...prev, takeProfit: e.target.value }))}
                  step="0.00001"
                  placeholder="Leave empty for no TP"
                />
              </div>

              <div className="bt-order-field">
                <label>Stop Loss (optional)</label>
                <input
                  type="number"
                  value={quickOrderData.stopLoss}
                  onChange={(e) => setQuickOrderData(prev => ({ ...prev, stopLoss: e.target.value }))}
                  step="0.00001"
                  placeholder="Leave empty for no SL"
                />
              </div>
            </div>

            <div className="bt-order-actions">
              <button className="bt-order-action-btn discard" onClick={() => setShowQuickOrderDialog(false)}>
                Cancel
              </button>
              <button 
                className={`bt-order-action-btn ${quickOrderData.side === 'buy' ? 'buy' : 'sell'}`}
                onClick={handleQuickOrderSubmit}
                disabled={!quickOrderData.lotSize || parseFloat(quickOrderData.lotSize) <= 0}
              >
                {quickOrderData.side === 'buy' ? 'Buy' : 'Sell'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
