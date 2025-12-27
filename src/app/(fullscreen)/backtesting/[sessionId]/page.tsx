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
  const pendingDrawingsRef = useRef<any[]>([]); // Stores drawings before resolution change for restoration
  const favoriteDrawingToolsRef = useRef<string[]>([]); // Stores favorite drawing tools
  const lastSavedDrawingsCountRef = useRef<number>(0); // Tracks drawing count to prevent empty overwrites
  const userDeletedAllDrawingsRef = useRef<boolean>(false); // Tracks if user explicitly deleted all drawings
  const initialRestoreCompleteRef = useRef<boolean>(false); // Tracks if initial chart restore is complete
  const allBarsRef = useRef<any[]>([]); // Ref for bars data to avoid widget recreation on data changes
  const widgetInitializedRef = useRef<boolean>(false); // Track if widget has been created
  const fetchingResolutionsRef = useRef<Set<string>>(new Set()); // Track in-flight resolution fetches

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [allBars, setAllBars] = useState<any[]>([]);
  const [currentBarIndex, setCurrentBarIndexState] = useState(5);
  const tradeLinesRef = useRef<Record<string, { entry: any; tp: any; sl: any }>>({});
  const openTradesRef = useRef<any[]>([]);
  
  const setCurrentBarIndex = (newIndex: number, bars?: any[], preserveTimestamp: boolean = false) => {
    currentBarIndexRef.current = newIndex;
    setCurrentBarIndexState(newIndex);
    
    // During timeframe switches, preserve the exact replay timestamp to prevent drift
    // Only update timestamp during normal playback/seek operations
    if (!preserveTimestamp) {
      const barsToUse = bars || barsCacheRef.current[currentIntervalRef.current] || allBars;
      if (barsToUse && barsToUse[newIndex]) {
        replayTimestampRef.current = barsToUse[newIndex].time;
      }
    }
    // When preserveTimestamp is true, keep the existing replayTimestampRef value
  };
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [decimalPlaces, setDecimalPlaces] = useState(0);
  const [currentInterval, setCurrentInterval] = useState(initialInterval);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(500);
  const [lotSize, setLotSize] = useState(1);
  const [showPanel, setShowPanel] = useState(false);
  const [drawerHeight, setDrawerHeight] = useState(250);
  const [isDrawerResizing, setIsDrawerResizing] = useState(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(true);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'open' | 'pending' | 'closed'>('open');
  const drawerMinHeight = 150;
  const drawerMaxHeight = 500;
  const drawerCollapsedHeight = 48;

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
      setBarPosition({
        x: e.clientX - dragOffsetRef.current.x,
        y: e.clientY - dragOffsetRef.current.y,
      });
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
    if (interval === "1D") return 1440;
    if (interval === "1W") return 10080;
    return parseInt(interval) || 1;
  }, []);
  
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

  const handleTimeframeChange = async (tf: string) => {
    if (tf === currentIntervalRef.current) {
      setShowTimeframeDropdown(false);
      return;
    }
    
    // Use replayTimestamp for consistent drawing anchors across resolutions
    // This is already set whenever currentBarIndex changes
    const currentReplayTs = replayTimestampRef.current;
    
    // Update interval ref immediately for cleanup guards
    currentIntervalRef.current = tf;
    
    // Capture current drawings BEFORE resolution change for potential restoration
    if (tvWidgetRef.current) {
      try {
        const chart = tvWidgetRef.current.activeChart();
        const allShapes = chart.getAllShapes();
        const drawings: any[] = [];
        
        for (const shape of allShapes) {
          try {
            const shapeObj = chart.getShapeById(shape.id);
            if (shapeObj) {
              const points = shapeObj.getPoints();
              const properties = shapeObj.getProperties();
              drawings.push({
                name: shape.name,
                points: points,
                overrides: properties,
                lock: false
              });
            }
          } catch (e) {
            // Skip shapes that can't be serialized
          }
        }
        
        pendingDrawingsRef.current = drawings;
        console.log('Captured', drawings.length, 'drawings before resolution change');
      } catch (e) {
        console.warn('Could not capture drawings before resolution change:', e);
      }
    }
    
    // Check if we have cached bars for this resolution
    const cachedBars = barsCacheRef.current[tf];
    
    // CRITICAL: Validate cache contains the replay timestamp before using fast path
    // If replay timestamp is outside cached range, we must use slow path to fetch correct data
    let useFastPath = false;
    if (cachedBars && cachedBars.length > 0 && tvWidgetRef.current) {
      if (currentReplayTs > 0) {
        const firstBarTime = cachedBars[0].time;
        const lastBarTime = cachedBars[cachedBars.length - 1].time;
        if (currentReplayTs >= firstBarTime && currentReplayTs <= lastBarTime) {
          useFastPath = true;
        } else {
          console.log('Fast path BLOCKED: replay timestamp outside cached range for', tf);
          console.log('Replay:', new Date(currentReplayTs).toISOString(), 
            'Cache:', new Date(firstBarTime).toISOString(), '-', new Date(lastBarTime).toISOString());
          // Invalidate this cache entry so slow path fetches fresh data
          delete barsCacheRef.current[tf];
          delete loadedRangeRef.current[tf];
        }
      } else {
        useFastPath = true; // No replay timestamp = initial load, use cache
      }
    }
    
    if (useFastPath && cachedBars) {
      // Fast path: use cached data and setResolution
      // Set flag to prevent data fetch effect from re-fetching
      isChangingResolutionRef.current = true;
      setAllBars(cachedBars);
      setCurrentInterval(tf);
      setShowTimeframeDropdown(false);
      
      // Find the new bar index based on replay timestamp
      let newIndex = cachedBars.length >= 6 ? 5 : Math.max(0, cachedBars.length - 1);
      if (currentReplayTs > 0) {
        for (let i = cachedBars.length - 1; i >= 0; i--) {
          if (cachedBars[i].time <= currentReplayTs) {
            newIndex = i;
            break;
          }
        }
      }
      // Preserve timestamp during timeframe switch to prevent drift
      setCurrentBarIndex(newIndex, cachedBars, true);
      
      // Use TradingView's setResolution for instant switch
      try {
        const chart = tvWidgetRef.current.activeChart();
        // Force chart to re-request data from datafeed for new resolution
        chart.resetData();
        chart.setResolution(tf, () => {
          // Restore drawings if they were lost during resolution change
          setTimeout(() => {
            try {
              const innerChart = tvWidgetRef.current?.activeChart();
              if (innerChart && pendingDrawingsRef.current.length > 0) {
                const currentShapes = innerChart.getAllShapes();
                if (currentShapes.length === 0) {
                  console.log('Drawings lost during resolution change, restoring', pendingDrawingsRef.current.length, 'drawings');
                  for (const drawing of pendingDrawingsRef.current) {
                    try {
                      if (drawing.name && drawing.points && drawing.points.length > 0) {
                        innerChart.createMultipointShape(drawing.points, {
                          shape: drawing.name,
                          overrides: drawing.overrides || {},
                          lock: drawing.lock || false,
                          disableSelection: false,
                          disableSave: false,
                          disableUndo: false,
                        });
                      }
                    } catch (restoreError) {
                      console.warn('Could not restore drawing:', drawing.name, restoreError);
                    }
                  }
                }
                pendingDrawingsRef.current = [];
              }
            } catch (e) {
              console.warn('Error checking/restoring drawings:', e);
            }
            isChangingResolutionRef.current = false;
          }, 500); // Small delay to ensure chart has finished loading
        });
      } catch (e) {
        isChangingResolutionRef.current = false;
      }
    } else {
      // Slow path: need to fetch from API - flag will be reset after fetch completes
      setCurrentInterval(tf);
      setShowTimeframeDropdown(false);
    }
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
  const isEndReached = currentBarIndex >= allBars.length - 1;
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

  // Boolean flag for widget effect - only triggers when bars go from empty to having data
  const hasBarsData = allBars.length > 0;

  // Fetch session data AND initial bars in one request for faster load
  useEffect(() => {
    const fetchSessionWithData = async () => {
      try {
        setSessionLoading(true);
        setIsLoading(true);
        
        // Use combined endpoint that fetches session + bars in one request
        const res = await fetch(`/api/backtest-sessions/with-data?sessionId=${sessionId}&resolution=${currentIntervalRef.current}`);
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
            barsCacheRef.current[result.resolution] = bars;
            // Calculate window based on resolution (smaller for intraday, larger for daily+)
            const sessionFromDate = new Date(sessionResult.fromDate);
            const windowMonths = getWindowMonths(result.resolution);
            const windowStartDate = subMonths(sessionFromDate, windowMonths);
            const windowEndDate = addMonths(sessionFromDate, windowMonths);
            const fromTs = Math.floor(windowStartDate.getTime() / 1000);
            const toTs = Math.floor(windowEndDate.getTime() / 1000);
            loadedRangeRef.current[result.resolution] = { from: fromTs, to: toTs };
            lastSessionKeyRef.current = `${sessionResult.symbol}-${sessionResult.market}-${sessionResult.fromDate}-${sessionResult.toDate}`;
            
            setAllBars(bars);
            
            // Calculate initial bar index
            let newIndex = bars.length >= 6 ? 5 : Math.max(0, bars.length - 1);
            const sessionHasTrades = sessionResult.trades && sessionResult.trades.length > 0;
            const targetTs = sessionHasTrades ? sessionResult.progressPointer : null;
            
            if (targetTs) {
              for (let i = bars.length - 1; i >= 0; i--) {
                if (bars[i].time <= targetTs) {
                  newIndex = i;
                  break;
                }
              }
            } else {
              const fromTimestamp = new Date(sessionResult.fromDate).getTime();
              for (let i = 0; i < bars.length; i++) {
                if (bars[i].time >= fromTimestamp) {
                  newIndex = i;
                  break;
                }
              }
            }
            setCurrentBarIndex(newIndex, bars, false);
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
      const toPreload = allTimeframes.filter(tf => tf !== currentTf && !barsCacheRef.current[tf]);
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
          const windowMonths = getWindowMonths(tf);
          const windowStartDate = subMonths(anchorDate, windowMonths);
          const windowEndDate = addMonths(anchorDate, windowMonths);
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
            barsCacheRef.current[tf] = bars;
            loadedRangeRef.current[tf] = { from: fromTs, to: toTs };
            console.log('Preloaded', bars.length, 'bars for timeframe', tf);
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
      
      // Load window centered on anchor (NOT session start)
      const windowMonths = getWindowMonths(resolution);
      const windowStartDate = subMonths(anchorDate, windowMonths);
      const windowEndDate = addMonths(anchorDate, windowMonths);
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
        barsCacheRef.current[resolution] = bars;
        loadedRangeRef.current[resolution] = { from: fromTs, to: toTs };
        console.log('Cached', bars.length, 'bars for resolution', resolution);
        
        // Update React state so playback controls and UI stay in sync
        setAllBars(bars);
        
        // Calculate the appropriate bar index based on replay timestamp or 'from' date
        const replayTs = replayTimestampRef.current;
        let newIndex = bars.length >= 6 ? 5 : Math.max(0, bars.length - 1);
        if (replayTs > 0) {
          // Use replay timestamp for timeframe switches
          for (let i = bars.length - 1; i >= 0; i--) {
            if (bars[i].time <= replayTs) {
              newIndex = i;
              break;
            }
          }
        } else if (fromDate) {
          // For fresh sessions, start at the 'from' date so user can replay forward
          const fromTs = new Date(fromDate).getTime();
          for (let i = 0; i < bars.length; i++) {
            if (bars[i].time >= fromTs) {
              newIndex = i;
              break;
            }
          }
        }
        
        // Update current bar index to sync playback position (preserve timestamp during TF switch)
        setCurrentBarIndex(newIndex, bars, true);
        
        // Trigger any pending getBars callbacks for this resolution
        const pendingCallbacks = pendingCallbacksRef.current[resolution];
        if (pendingCallbacks && pendingCallbacks.length > 0) {
          console.log('Triggering', pendingCallbacks.length, 'pending callbacks for resolution', resolution);
          
          for (const { callback, periodParams } of pendingCallbacks) {
            const { firstDataRequest } = periodParams;
            
            if (firstDataRequest) {
              const barsToShow = replayTs > 0 
                ? bars.filter((bar: any) => bar.time <= replayTs)
                : bars.slice(0, newIndex + 1);
              callback(barsToShow, { noData: barsToShow.length === 0 });
            } else {
              const filteredBars = bars.filter(
                (bar: any) => bar.time / 1000 >= periodParams.from && bar.time / 1000 < periodParams.to
              );
              callback(filteredBars, { noData: filteredBars.length === 0 });
            }
          }
          delete pendingCallbacksRef.current[resolution];
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
    } finally {
      fetchingResolutionsRef.current.delete(resolution);
    }
  };

  // Fetch additional bars when user scrolls beyond loaded range
  const fetchMoreBars = async (resolution: string, direction: 'back' | 'forward', periodParams: any, callback: any) => {
    const rangeKey = resolution;
    if (fetchingRangeRef.current[rangeKey]) {
      callback([], { noData: true });
      return;
    }
    
    const session = sessionDataRef.current || sessionData;
    if (!session) {
      callback([], { noData: true });
      return;
    }
    
    fetchingRangeRef.current[rangeKey] = true;
    const currentRange = loadedRangeRef.current[resolution];
    
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
        const existingBars = barsCacheRef.current[resolution] || [];
        let mergedBars: any[];
        
        if (direction === 'back') {
          // Prepend new bars, remove duplicates
          const existingTimes = new Set(existingBars.map((b: any) => b.time));
          const uniqueNewBars = newBars.filter((b: any) => !existingTimes.has(b.time));
          mergedBars = [...uniqueNewBars, ...existingBars];
          loadedRangeRef.current[resolution] = { from: fetchFrom, to: currentRange.to };
        } else {
          // Append new bars, remove duplicates
          const existingTimes = new Set(existingBars.map((b: any) => b.time));
          const uniqueNewBars = newBars.filter((b: any) => !existingTimes.has(b.time));
          mergedBars = [...existingBars, ...uniqueNewBars];
          loadedRangeRef.current[resolution] = { from: currentRange.from, to: fetchTo };
        }
        
        // Sort by time
        mergedBars.sort((a, b) => a.time - b.time);
        barsCacheRef.current[resolution] = mergedBars;
        
        console.log(`Merged bars: ${existingBars.length} + ${newBars.length} = ${mergedBars.length}`);
        
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
      fetchingRangeRef.current[rangeKey] = false;
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
    
    // Invalidate cache when symbol or date range changes
    const sessionKey = `${sessionData.symbol}-${sessionData.market}-${fromDate}-${toDate}`;
    if (sessionKey !== lastSessionKeyRef.current) {
      barsCacheRef.current = {};
      lastSessionKeyRef.current = sessionKey;
      hasLoadedLayoutRef.current = false; // Reset layout loaded flag for new session
      hasScrolledToStartRef.current = false; // Reset scroll flag for new session
      replayTimestampRef.current = 0; // Reset replay timestamp for new session/symbol
    }
    
    // If we're changing resolution with cached data, skip fetch
    if (isChangingResolutionRef.current) {
      isChangingResolutionRef.current = false;
      return;
    }
    
    // Check cache first
    const cachedBars = barsCacheRef.current[currentInterval];
    if (cachedBars && cachedBars.length > 0) {
      const savedTimestamp = targetTimestampRef.current;
      
      // CRITICAL: Check if replay timestamp is within cached bar range
      // If not, we need to invalidate cache and fetch fresh data centered on replay position
      const replayTs = replayTimestampRef.current;
      if (replayTs > 0) {
        const firstBarTime = cachedBars[0].time;
        const lastBarTime = cachedBars[cachedBars.length - 1].time;
        if (replayTs < firstBarTime || replayTs > lastBarTime) {
          console.log('Replay timestamp outside cached range, invalidating cache for', currentInterval);
          console.log('Replay:', new Date(replayTs).toISOString(), 'Cached:', new Date(firstBarTime).toISOString(), '-', new Date(lastBarTime).toISOString());
          // Delete the cached bars so fetchAllHistory runs with correct anchor
          delete barsCacheRef.current[currentInterval];
          delete loadedRangeRef.current[currentInterval];
          // Don't return - fall through to fetchAllHistory
        } else {
          // Replay timestamp is within range - use cache
          targetTimestampRef.current = null;
          setAllBars(cachedBars);
          let newIndex = cachedBars.length >= 6 ? 5 : Math.max(0, cachedBars.length - 1);
          // Find the last bar whose time <= target timestamp
          for (let i = cachedBars.length - 1; i >= 0; i--) {
            if (cachedBars[i].time <= replayTs) {
              newIndex = i;
              break;
            }
          }
          const shouldPreserveTimestamp = Object.keys(barsCacheRef.current).length > 0;
          setCurrentBarIndex(newIndex, cachedBars, shouldPreserveTimestamp);
          return;
        }
      } else {
        // No replay timestamp - use cache with saved progress or session start
        targetTimestampRef.current = null;
        setAllBars(cachedBars);
        let newIndex = cachedBars.length >= 6 ? 5 : Math.max(0, cachedBars.length - 1);
        const sessionHasTrades = sessionData?.trades && sessionData.trades.length > 0;
        const targetTs = savedTimestamp || (sessionHasTrades ? sessionData?.progressPointer : null);
        if (targetTs) {
          for (let i = cachedBars.length - 1; i >= 0; i--) {
            if (cachedBars[i].time <= targetTs) {
              newIndex = i;
              break;
            }
          }
        } else {
          const fromTimestamp = new Date(fromDate).getTime();
          for (let i = 0; i < cachedBars.length; i++) {
            if (cachedBars[i].time >= fromTimestamp) {
              newIndex = i;
              break;
            }
          }
        }
        setCurrentBarIndex(newIndex, cachedBars, false);
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
      
      // Load window centered on anchor (NOT always session start)
      const windowMonths = getWindowMonths(currentInterval);
      const windowStartDate = subMonths(anchorDate, windowMonths);
      const windowEndDate = addMonths(anchorDate, windowMonths);
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
          barsCacheRef.current[currentInterval] = bars;
          loadedRangeRef.current[currentInterval] = { from: fromTs, to: toTs };
          
          setAllBars(bars);
          
          let newIndex = bars.length >= 6 ? 5 : Math.max(0, bars.length - 1);
          // Use replayTimestamp if available (timeframe switch), otherwise use saved session pointer
          // Only use progressPointer if session has actual trades (user made progress worth resuming)
          const sessionHasTrades = sessionData?.trades && sessionData.trades.length > 0;
          const targetTs = replayTimestampRef.current > 0 
            ? replayTimestampRef.current 
            : (savedTimestamp || (sessionHasTrades ? sessionData?.progressPointer : null));
          if (targetTs) {
            // Find the last bar whose time <= target timestamp for consistent positioning
            let foundIndex = -1;
            for (let i = bars.length - 1; i >= 0; i--) {
              if (bars[i].time <= targetTs) {
                foundIndex = i;
                break;
              }
            }
            if (foundIndex >= 0) {
              newIndex = foundIndex;
            }
          } else {
            // For fresh sessions with no saved progress, start at the 'from' date
            // This allows user to see historical data and replay forward from their chosen start date
            const fromTimestamp = fromTs * 1000; // Convert to milliseconds
            for (let i = 0; i < bars.length; i++) {
              if (bars[i].time >= fromTimestamp) {
                newIndex = i;
                break;
              }
            }
          }
          // Preserve timestamp during resolution changes (not first load)
          // Only preserve if we already have bars cached (not first load) and have a valid timestamp
          const shouldPreserveTimestamp = replayTimestampRef.current > 0 && Object.keys(barsCacheRef.current).length > 1;
          setCurrentBarIndex(newIndex, bars, shouldPreserveTimestamp);
          setIsPlaying(false);
          
          // Trigger any pending getBars callbacks for this resolution
          // This must happen AFTER computing newIndex so callbacks receive correct bar count
          const pendingCallbacks = pendingCallbacksRef.current[currentInterval];
          if (pendingCallbacks && pendingCallbacks.length > 0) {
            console.log('Triggering', pendingCallbacks.length, 'pending callbacks for resolution', currentInterval);
            const replayTs = replayTimestampRef.current;
            
            for (const { callback, periodParams } of pendingCallbacks) {
              const { firstDataRequest } = periodParams;
              
              if (firstDataRequest) {
                // Use same logic as live getBars path: timestamp-based filtering
                const barsToShow = replayTs > 0 
                  ? bars.filter((bar: any) => bar.time <= replayTs)
                  : bars.slice(0, newIndex + 1);
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
          
          // If widget exists and this isn't the first load, update the resolution
          if (tvWidgetRef.current && Object.keys(barsCacheRef.current).length > 1) {
            try {
              const chart = tvWidgetRef.current.activeChart();
              // Add small delay to ensure cache is fully synchronized before TradingView queries
              await new Promise(resolve => setTimeout(resolve, 50));
              // Force chart to re-request data from datafeed for new resolution
              chart.resetData();
              chart.setResolution(currentInterval, () => {
                // Restore drawings if they were lost during resolution change
                setTimeout(() => {
                  try {
                    const chart = tvWidgetRef.current?.activeChart();
                    if (chart && pendingDrawingsRef.current.length > 0) {
                      const currentShapes = chart.getAllShapes();
                      if (currentShapes.length === 0) {
                        console.log('Drawings lost during resolution change (slow path), restoring', pendingDrawingsRef.current.length, 'drawings');
                        for (const drawing of pendingDrawingsRef.current) {
                          try {
                            if (drawing.name && drawing.points && drawing.points.length > 0) {
                              chart.createMultipointShape(drawing.points, {
                                shape: drawing.name,
                                overrides: drawing.overrides || {},
                                lock: drawing.lock || false,
                                disableSelection: false,
                                disableSave: false,
                                disableUndo: false,
                              });
                            }
                          } catch (restoreError) {
                            console.warn('Could not restore drawing:', drawing.name, restoreError);
                          }
                        }
                      }
                      pendingDrawingsRef.current = [];
                    }
                  } catch (e) {
                    console.warn('Error checking/restoring drawings:', e);
                  }
                  isChangingResolutionRef.current = false;
                }, 500);
              });
            } catch (e) {
              console.log('setResolution error:', e);
              isChangingResolutionRef.current = false;
            }
          } else {
            isChangingResolutionRef.current = false;
          }
        } else {
          console.log('No data from VPS API:', data);
          // Don't clear bars on failure - keep existing data
          isChangingResolutionRef.current = false;
        }
      } catch (error) {
        console.error("Error fetching history from VPS:", error);
        // Don't clear bars on error - keep existing data and allow retry
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
        const symbolInfo = {
          ticker: symbolName,
          name: symbolName,
          description: symbolName,
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
        const replayTs = replayTimestampRef.current;
        
        // ONLY use cached bars for the exact requested resolution - no fallback
        // This prevents mixing data between resolutions
        const barsForResolution = barsCacheRef.current[resolution];
        
        console.log('getBars called:', { 
          resolution, 
          firstDataRequest, 
          cachedKeys: Object.keys(barsCacheRef.current),
          hasBarsForResolution: !!barsForResolution,
          barCount: barsForResolution?.length || 0
        });
        
        // CRITICAL: Validate cached bars contain the replay timestamp
        // If replay timestamp is outside cached range, we need fresh data
        let validCache = barsForResolution && barsForResolution.length > 0;
        if (validCache && replayTs > 0) {
          const firstBarTime = barsForResolution[0].time;
          const lastBarTime = barsForResolution[barsForResolution.length - 1].time;
          if (replayTs < firstBarTime || replayTs > lastBarTime) {
            console.log('getBars: Replay timestamp outside cached range, invalidating for', resolution);
            console.log('Replay:', new Date(replayTs).toISOString(), 
              'Cache:', new Date(firstBarTime).toISOString(), '-', new Date(lastBarTime).toISOString());
            // Invalidate this cache - it's stale for the current replay position
            delete barsCacheRef.current[resolution];
            delete loadedRangeRef.current[resolution];
            validCache = false;
          }
        }
        
        if (!validCache) {
          // No data for this resolution yet - queue callback and trigger fetch
          console.log('No valid bars for resolution', resolution, '- queuing callback and triggering fetch');
          if (!pendingCallbacksRef.current[resolution]) {
            pendingCallbacksRef.current[resolution] = [];
          }
          pendingCallbacksRef.current[resolution].push({ callback: onHistoryCallback, periodParams });
          
          // Trigger fetch for this resolution - this will fulfill pending callbacks when complete
          fetchBarsForResolution(resolution);
          return;
        }
        
        if (firstDataRequest) {
          // Use timestamp-based filtering to ensure consistent drawing anchors across resolutions
          // Filter to bars whose time <= replay timestamp (hides future bars)
          const barsToShow = replayTs > 0 
            ? barsForResolution.filter((bar: any) => bar.time <= replayTs)
            : barsForResolution.slice(0, currentBarIndexRef.current + 1);
          onHistoryCallback(barsToShow, { noData: barsToShow.length === 0 });
          return;
        }
        
        // Check if requested period is outside the loaded range - fetch more if needed
        const loadedRange = loadedRangeRef.current[resolution];
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
        console.log('subscribeBars called for resolution:', resolution);
        // Store both the callback AND which resolution it's for
        subscribedResolutionRef.current = resolution;
        onRealtimeCallbackRef.current = onRealtimeCallback;
      },
      unsubscribeBars: (subscriberUID: string) => {
        // TradingView calls unsubscribe for the OLD resolution AFTER subscribing to the new one
        // We need to ignore late unsubscribe calls that don't match the current subscription
        // The subscriberUID contains the resolution, e.g., "GBPUSD_5" or "GBPUSD_60"
        const unsubResolution = subscriberUID?.split('_').pop() || '';
        const currentResolution = subscribedResolutionRef.current;
        
        console.log('unsubscribeBars called:', { subscriberUID, unsubResolution, currentResolution });
        
        // Only clear callback if unsubscribing from the currently subscribed resolution
        if (unsubResolution === currentResolution || !currentResolution) {
          onRealtimeCallbackRef.current = null;
          subscribedResolutionRef.current = null;
        } else {
          console.log('Ignoring stale unsubscribe for old resolution:', unsubResolution);
        }
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
          await new Promise(resolve => setTimeout(resolve, 800));
          const data = await loadChartLayouts(sessionId);
          if (data.chartLayouts && data.chartLayouts.length > 0) {
            hadSavedLayout = true; // Mark that we found prior content
            const latestLayout = data.chartLayouts.sort((a: any, b: any) => b.timestamp - a.timestamp)[0];
            if (latestLayout?.content) {
              const savedData = JSON.parse(latestLayout.content);
              console.log('Restoring chart layout:', latestLayout.name, 'Data keys:', Object.keys(savedData));
              
              // Check if this is new format (has drawings array) or old format
              if (savedData.drawings && Array.isArray(savedData.drawings)) {
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
                
                // New format - restore drawings manually
                console.log('Using new format - restoring', savedData.drawings.length, 'drawings');
                let restoredCount = 0;
                for (const drawing of savedData.drawings) {
                  try {
                    if (drawing.name && drawing.points && drawing.points.length > 0) {
                      const shapeOptions: any = {
                        shape: drawing.name,
                        overrides: drawing.overrides || {},
                        lock: drawing.lock || false,
                        disableSelection: false,
                        disableSave: false,
                        disableUndo: false,
                      };
                      chart.createMultipointShape(drawing.points, shapeOptions);
                      restoredCount++;
                    }
                  } catch (drawingError) {
                    console.warn('Could not restore drawing:', drawing.name, drawingError);
                  }
                }
                console.log('Restored', restoredCount, 'of', savedData.drawings.length, 'drawings');
                
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
              } else {
                // Old format - try tvWidget.load() as fallback
                console.log('Using old format - attempting tvWidget.load()');
                try {
                  tvWidget.load(savedData);
                  console.log('Loaded chart via tvWidget.load()');
                } catch (loadError) {
                  console.warn('tvWidget.load() failed:', loadError);
                }
              }
              
              console.log('Chart layout restore complete');
              
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
              
              // Delay to allow shapes to fully render
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Poll actual shape count from the chart to verify restore success
              const actualShapes = chart.getAllShapes();
              const actualCount = actualShapes.length;
              console.log('Actual restored shape count:', actualCount);
              
              // Use the higher of stored vs actual count for safety
              if (actualCount > lastSavedDrawingsCountRef.current) {
                lastSavedDrawingsCountRef.current = actualCount;
              }
              
              // Enable auto-saves now that restore is complete
              // We cleared existing studies and restored saved state, so enable autosave
              // This allows users to save layouts with deleted indicators (empty studies array)
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
          // After layout loads, scroll chart to session start date
          scrollChartToStartDate(chart);
        });
      } else {
        // Already loaded layout - just enable auto-save immediately
        initialRestoreCompleteRef.current = true;
        // Scroll to start date if not done yet
        scrollChartToStartDate(chart);
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
          
          // TradingView may auto-fit after our scroll, so re-scroll after delays
          // Using requestAnimationFrame ensures we scroll after TradingView's render cycle
          if (!forceScroll && retryCount === 0) {
            const doScroll = () => {
              try {
                chart.setVisibleRange({ from, to });
              } catch (e) {}
            };
            // Multiple attempts using both requestAnimationFrame and setTimeout
            requestAnimationFrame(() => {
              doScroll();
              requestAnimationFrame(doScroll);
            });
            setTimeout(() => { doScroll(); requestAnimationFrame(doScroll); }, 500);
            setTimeout(() => { doScroll(); requestAnimationFrame(doScroll); }, 1000);
            setTimeout(() => { doScroll(); requestAnimationFrame(doScroll); }, 2000);
            setTimeout(() => { doScroll(); requestAnimationFrame(doScroll); }, 3000);
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
        
        try {
          // Get all shapes (drawings) on the chart
          const allShapes = chart.getAllShapes();
          const drawings: any[] = [];
          
          for (const shape of allShapes) {
            try {
              const shapeObj = chart.getShapeById(shape.id);
              if (shapeObj) {
                const points = shapeObj.getPoints();
                const properties = shapeObj.getProperties();
                drawings.push({
                  name: shape.name,
                  points: points,
                  overrides: properties,
                  lock: false
                });
              }
            } catch (e) {
              // Skip shapes that can't be serialized
            }
          }
          
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
          
          // Prevent overwriting saved drawings with empty state
          // Only allow empty save if user explicitly deleted all drawings
          if (drawings.length === 0 && lastSavedDrawingsCountRef.current > 0 && !userDeletedAllDrawingsRef.current) {
            console.log('Skipping auto-save: would overwrite', lastSavedDrawingsCountRef.current, 'drawings with empty state');
            return;
          }
          
          // Update the count and reset delete flag after successful save
          lastSavedDrawingsCountRef.current = drawings.length;
          if (drawings.length === 0 && userDeletedAllDrawingsRef.current) {
            userDeletedAllDrawingsRef.current = false; // Reset after saving the empty state
            console.log('Saved empty state after user deletion');
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
          
          // Build saved data object - only include chartProperties if successfully captured
          // This prevents overwriting user's settings with fallback dark colors
          const savedData: any = {
            drawings,
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
          console.log('Chart auto-saved:', drawings.length, 'drawings,', studies.length, 'studies');
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
        const currentBar = allBars[currentBarIndexRef.current];
        if (currentBar) {
          targetTimestampRef.current = currentBar.time;
        }
        setCurrentInterval(newInterval);
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
      if (tvWidgetRef.current) {
        // Skip save during resolution changes - widget is kept alive and drawings may be temporarily unavailable
        if (isChangingResolutionRef.current) {
          console.log('Skipping cleanup save: resolution change in progress');
          return;
        }
        
        try {
          const widget = tvWidgetRef.current;
          // Check if widget is still valid before saving
          // Also verify internal state is intact (tradingViewApi may be null during cleanup)
          if (widget && typeof widget.activeChart === 'function') {
            let chartInstance;
            try {
              chartInstance = widget.activeChart();
            } catch (chartError) {
              // Widget may be in an invalid state during cleanup
              console.log('Could not access chart during cleanup:', chartError);
              return;
            }
            if (chartInstance) {
              // Use new format - extract drawings and studies
              const allShapes = chartInstance.getAllShapes();
              const drawings: any[] = [];
              
              for (const shape of allShapes) {
                try {
                  const shapeObj = chartInstance.getShapeById(shape.id);
                  if (shapeObj) {
                    const points = shapeObj.getPoints();
                    const properties = shapeObj.getProperties();
                    drawings.push({
                      name: shape.name,
                      points: points,
                      overrides: properties,
                      lock: false
                    });
                  }
                } catch (e) {
                  // Skip shapes that can't be serialized
                }
              }
              
              const allStudies = chartInstance.getAllStudies();
              const studies: any[] = [];
              
              for (const study of allStudies) {
                try {
                  const studyObj = chartInstance.getStudyById(study.id);
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
              
              if (drawings.length > 0 || studies.length > 0) {
                const savedData = {
                  drawings,
                  studies,
                  interval: currentInterval,
                  timestamp: Date.now()
                };
                
                const layoutData = {
                  id: `session_${sessionId}_default`,
                  name: 'Auto-saved Layout',
                  symbol: symbol,
                  resolution: currentInterval,
                  content: JSON.stringify(savedData)
                };
                
                saveChartLayout(sessionId, layoutData);
                console.log('Chart saved before unmount:', drawings.length, 'drawings,', studies.length, 'studies');
              }
            }
          }
        } catch (error) {
          console.error('Error saving chart before unmount:', error);
        }
        // Only destroy widget on true unmount (page navigation)
        // Skip destruction during timeframe changes - widget should stay alive
        if (isChangingResolutionRef.current) {
          console.log('Cleanup: Skipping widget destruction - resolution change in progress');
          return;
        }
        
        // This is true unmount (leaving page) - safe to destroy
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
      
      const entryShape = chart.getShapeById(entryLineId);
      if (!entryShape) {
        // Shape was removed, clear the reference
        console.log("Entry shape not found, clearing reference for trade:", tradeLineId);
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
    // Use ref for latest bars to avoid stale closure issues
    const bars = allBarsRef.current;
    const idx = currentBarIndexRef.current;
    const resolution = currentIntervalRef.current;
    
    if (!bars || bars.length === 0) {
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
      
      let currentRange = loadedRangeRef.current[resolution];
      if (!currentRange) {
        // If no range exists, derive from the last bar's timestamp
        const lastBar = bars[bars.length - 1];
        if (lastBar) {
          const lastBarTime = lastBar.time / 1000;
          currentRange = { from: lastBarTime - (30 * 24 * 60 * 60), to: lastBarTime };
          loadedRangeRef.current[resolution] = currentRange;
        } else {
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
          
          // Merge with existing bars
          const existingBars = barsCacheRef.current[resolution] || [];
          const allTimestamps = new Set(existingBars.map((b: any) => b.time));
          const uniqueNewBars = newBars.filter((b: any) => !allTimestamps.has(b.time));
          const mergedBars = [...existingBars, ...uniqueNewBars].sort((a, b) => a.time - b.time);
          
          console.log(`Merged bars: ${existingBars.length} + ${uniqueNewBars.length} = ${mergedBars.length}`);
          
          barsCacheRef.current[resolution] = mergedBars;
          loadedRangeRef.current[resolution] = {
            from: currentRange.from,
            to: fetchTo
          };
          
          // Update allBars and continue to next bar
          if (resolution === currentIntervalRef.current) {
            allBarsRef.current = mergedBars;
            setAllBars(mergedBars);
            
            const nextBar = mergedBars[idx + 1];
            if (nextBar && onRealtimeCallbackRef.current) {
              onRealtimeCallbackRef.current({ ...nextBar, time: nextBar.time });
            }
            
            setCurrentBarIndex(idx + 1, mergedBars);
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
    
    const nextBar = bars[idx + 1];
    
    // Push bar to TradingView if subscribed
    if (nextBar && onRealtimeCallbackRef.current) {
      onRealtimeCallbackRef.current({
        ...nextBar,
        time: nextBar.time,
      });
    }
    
    // Pass bars to update replayTimestamp correctly during playback
    setCurrentBarIndex(idx + 1, bars);
  }, [sessionData]);

  // Handle forward with skip duration - skips multiple candles based on time
  const handleSkipForward = useCallback(async () => {
    const bars = allBarsRef.current;
    const idx = currentBarIndexRef.current;
    const resolution = currentIntervalRef.current;
    
    if (!bars || bars.length === 0) {
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
      
      let currentRange = loadedRangeRef.current[resolution];
      if (!currentRange) {
        // If no range exists, derive from the last bar's timestamp
        const lastBar = bars[bars.length - 1];
        if (lastBar) {
          const lastBarTime = lastBar.time / 1000;
          currentRange = { from: lastBarTime - (30 * 24 * 60 * 60), to: lastBarTime };
          loadedRangeRef.current[resolution] = currentRange;
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
          
          // Merge with existing bars
          const existingBars = barsCacheRef.current[resolution] || [];
          const allTimestamps = new Set(existingBars.map((b: any) => b.time));
          const uniqueNewBars = newBars.filter((b: any) => !allTimestamps.has(b.time));
          const mergedBars = [...existingBars, ...uniqueNewBars].sort((a, b) => a.time - b.time);
          
          console.log(`Merged bars: ${existingBars.length} + ${uniqueNewBars.length} = ${mergedBars.length}`);
          
          barsCacheRef.current[resolution] = mergedBars;
          loadedRangeRef.current[resolution] = {
            from: currentRange.from,
            to: fetchTo
          };
          
          // Update allBars if this is the current resolution
          if (resolution === currentIntervalRef.current) {
            allBarsRef.current = mergedBars;
            setAllBars(mergedBars);
            
            // Now skip forward on the new bars
            const candlesToSkip = getCandlesToSkip();
            const newIndex = Math.min(idx + candlesToSkip, mergedBars.length - 1);
            
            if (onRealtimeCallbackRef.current) {
              for (let i = idx + 1; i <= newIndex; i++) {
                const bar = mergedBars[i];
                if (bar) {
                  onRealtimeCallbackRef.current({ ...bar, time: bar.time });
                }
              }
            }
            
            setCurrentBarIndex(newIndex, mergedBars);
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
    
    const candlesToSkip = getCandlesToSkip();
    const newIndex = Math.min(idx + candlesToSkip, bars.length - 1);
    
    // Push all bars in between to TradingView to update the chart
    if (onRealtimeCallbackRef.current) {
      for (let i = idx + 1; i <= newIndex; i++) {
        const bar = bars[i];
        if (bar) {
          onRealtimeCallbackRef.current({
            ...bar,
            time: bar.time,
          });
        }
      }
    }
    
    setCurrentBarIndex(newIndex, bars);
  }, [getCandlesToSkip, sessionData]);
  
  // Handle backward with skip duration
  const handleSkipBackward = useCallback(() => {
    const bars = allBarsRef.current;
    const idx = currentBarIndexRef.current;
    if (!bars || bars.length === 0 || idx <= 0) return;
    
    const candlesToSkip = getCandlesToSkip();
    const newIndex = Math.max(idx - candlesToSkip, 0);
    setCurrentBarIndex(newIndex, bars);
  }, [getCandlesToSkip]);

  const handlePrev = useCallback(() => {
    const bars = allBarsRef.current;
    const idx = currentBarIndexRef.current;
    if (idx > 0 && bars && bars.length > 0) {
      // Pass bars to update replayTimestamp correctly
      setCurrentBarIndex(idx - 1, bars);
    }
  }, []);

  const handleNext10 = () => {
    const bars = allBarsRef.current;
    const idx = currentBarIndexRef.current;
    if (!bars || bars.length === 0) return;
    const newIndex = Math.min(idx + 10, bars.length - 1);
    setCurrentBarIndex(newIndex, bars);
  };

  const handlePrev10 = () => {
    const bars = allBarsRef.current;
    const idx = currentBarIndexRef.current;
    if (!bars || bars.length === 0) return;
    const newIndex = Math.max(idx - 10, 0);
    setCurrentBarIndex(newIndex, bars);
  };

  const handleRestart = () => {
    const bars = allBarsRef.current;
    if (!bars || bars.length === 0) return;
    const newIndex = bars.length >= 6 ? 5 : Math.max(0, bars.length - 1);
    setCurrentBarIndex(newIndex, bars);
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
          if (!tradingState.potentialTrade) handlePlaceTrade("long");
          break;
        case "KeyS":
          if (!tradingState.potentialTrade) handlePlaceTrade("short");
          break;
        case "KeyP":
          if (tradingState.potentialTrade) handlePlaceOrderFromDrawing();
          break;
        case "Escape":
          setShowPanel(false);
          setShowModifyTradePopup(false);
          setShowOrderDialog(false);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEndReached, handleNext, handleSkipForward, tradingState.openTrades, tradingState.potentialTrade]);

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
      <div className="bt-container">
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
    <div className="bt-container">
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
              <button className="bt-order-action-btn save-journal" onClick={() => handleOrderFormSubmit('save_journal')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                Save & Journal
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
