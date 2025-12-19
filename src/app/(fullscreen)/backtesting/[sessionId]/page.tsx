"use client"
import React, {
  use,
  useEffect,
  useRef,
  useState,
  useReducer,
  useCallback,
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

const tradingReducer = (state, action) => {
  switch (action.type) {
    case "SET_ACTIVE_TRADE":
      return { ...state, activeTrades: action.payload };
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
        activeTrades: null,
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
  const autoPlayIntervalRef = useRef<any>(null);
  const currentBarIndexRef = useRef(5);
  const autoSaveIntervalRef = useRef<any>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const totalBalanceRef = useRef<number>(10000);
  const sessionDataRef = useRef<SessionData | null>(null);
  const pendingOpenTradeRef = useRef<any>(null);
  const targetTimestampRef = useRef<number | null>(null);
  const barsCacheRef = useRef<Record<string, any[]>>({});
  const pendingCallbacksRef = useRef<Record<string, Array<{ callback: any; periodParams: any }>>>({});
  const isChangingResolutionRef = useRef(false);
  const currentIntervalRef = useRef(initialInterval);
  const lastSessionKeyRef = useRef<string>("");
  const hasLoadedLayoutRef = useRef(false);
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
  const tradeLinesRef = useRef<{ entry: any; tp: any; sl: any }>({ entry: null, tp: null, sl: null });
  const activeTradesRef = useRef<any>(null);
  
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
    if (cachedBars && cachedBars.length > 0 && tvWidgetRef.current) {
      // Fast path: use cached data and setResolution
      // Set flag to prevent data fetch effect from re-fetching
      isChangingResolutionRef.current = true;
      setAllBars(cachedBars);
      setCurrentInterval(tf);
      setShowTimeframeDropdown(false);
      
      // Find the new bar index based on replay timestamp
      // Use <= to find the last bar at or before the replay timestamp
      let newIndex = cachedBars.length >= 6 ? 5 : Math.max(0, cachedBars.length - 1);
      if (currentReplayTs > 0) {
        // Find the last bar whose time <= replayTimestamp
        let foundIndex = -1;
        for (let i = cachedBars.length - 1; i >= 0; i--) {
          if (cachedBars[i].time <= currentReplayTs) {
            foundIndex = i;
            break;
          }
        }
        if (foundIndex >= 0) {
          newIndex = foundIndex;
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
    activeTrades: null,
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

  // Fetch session data on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setSessionLoading(true);
        const res = await fetch(`/api/backtest-sessions?sessionId=${sessionId}`);
        const result = await res.json();
        if (result.success && result.data) {
          setSessionData(result.data);
          
          // Load existing trades from session
          if (result.data.trades && result.data.trades.length > 0) {
            let totalPnl = 0;
            const closedTrades: any[] = [];
            let openTrade: any = null;
            
            for (const t of result.data.trades) {
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
            
            // Bulk set trade history (avoids duplicates on refetch)
            dispatch({ type: "SET_TRADE_HISTORY", payload: closedTrades });
            dispatch({ type: "SET_REALISED_PL", payload: totalPnl });
            
            // Store open trade in ref for restoration after chart loads
            if (openTrade) {
              pendingOpenTradeRef.current = openTrade;
            }
          }
        } else {
          console.error("Session not found");
          router.push('/backtesting/dashboard');
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
        router.push('/backtesting/dashboard');
      } finally {
        setSessionLoading(false);
      }
    };
    fetchSession();
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
      const toTs = Math.floor(new Date(toDate).getTime() / 1000);
      const fromTs = Math.floor(new Date(fromDate).getTime() / 1000);
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
        
        // Compute decimal places for this resolution's data
        let maxDecimalPlaces = 0;
        bars.forEach((bar: any) => {
          [bar.open, bar.high, bar.low, bar.close].forEach((val: number) => {
            const str = val?.toString() || "";
            if (str.includes(".") && !str.includes("e")) {
              const decCount = str.split(".")[1].length;
              if (decCount > maxDecimalPlaces) maxDecimalPlaces = decCount;
            }
          });
        });
        setDecimalPlaces(maxDecimalPlaces);
        
        // Cache the bars for this resolution
        barsCacheRef.current[resolution] = bars;
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
      targetTimestampRef.current = null;
      
      setAllBars(cachedBars);
      let newIndex = cachedBars.length >= 6 ? 5 : Math.max(0, cachedBars.length - 1);
      // Use replayTimestamp if available, otherwise use saved progress
      // Only use progressPointer if session has actual trades (user made progress worth resuming)
      const sessionHasTrades = sessionData?.trades && sessionData.trades.length > 0;
      const targetTs = replayTimestampRef.current > 0 
        ? replayTimestampRef.current 
        : (savedTimestamp || (sessionHasTrades ? sessionData?.progressPointer : null));
      if (targetTs) {
        // Find the last bar whose time <= target timestamp
        let foundIndex = -1;
        for (let i = cachedBars.length - 1; i >= 0; i--) {
          if (cachedBars[i].time <= targetTs) {
            foundIndex = i;
            break;
          }
        }
        if (foundIndex >= 0) {
          newIndex = foundIndex;
        }
      } else {
        // For fresh sessions with no saved progress, start at the 'from' date
        const fromTimestamp = new Date(fromDate).getTime();
        for (let i = 0; i < cachedBars.length; i++) {
          if (cachedBars[i].time >= fromTimestamp) {
            newIndex = i;
            break;
          }
        }
      }
      // Preserve timestamp during resolution changes (when explicitly triggered via handleTimeframeChange)
      // isChangingResolutionRef is set before this path is reached via handleTimeframeChange
      // For initial loads (replayTimestamp=0), always update the timestamp
      const shouldPreserveTimestamp = replayTimestampRef.current > 0 && Object.keys(barsCacheRef.current).length > 0;
      setCurrentBarIndex(newIndex, cachedBars, shouldPreserveTimestamp);
      return;
    }
    
    const fetchAllHistory = async () => {
      const savedTimestamp = targetTimestampRef.current;
      targetTimestampRef.current = null;
      
      const toTs = Math.floor(new Date(toDate).getTime() / 1000);
      const fromTs = Math.floor(new Date(fromDate).getTime() / 1000);
      const market = sessionData.market || 'FOREX';
      const rawSymbol = sessionData.symbol;
      
      setIsLoading(true);
      
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
        
        if (data && data.s === 'ok' && data.t && data.t.length > 0) {
          let bars = data.t.map((time: number, i: number) => ({
            time: time * 1000,
            open: data.o[i],
            high: data.h[i],
            low: data.l[i],
            close: data.c[i],
            volume: data.v?.[i] || 0,
          }));
          
          let maxDecimalPlaces = 0;
          bars.forEach((bar: any) => {
            [bar.open, bar.high, bar.low, bar.close].forEach((val: number) => {
              const str = val?.toString() || "";
              if (str.includes(".") && !str.includes("e")) {
                const decCount = str.split(".")[1].length;
                if (decCount > maxDecimalPlaces) maxDecimalPlaces = decCount;
              }
            });
          });
          setDecimalPlaces(maxDecimalPlaces);
          
          // Cache the bars for this resolution
          barsCacheRef.current[currentInterval] = bars;
          
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
        
        if (!barsForResolution || barsForResolution.length === 0) {
          // No data for this resolution yet - queue callback and trigger fetch
          console.log('No bars for resolution', resolution, '- queuing callback and triggering fetch');
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
        
        const bars = barsForResolution.filter(
          (bar) => bar.time / 1000 >= periodParams.from && bar.time / 1000 < periodParams.to
        );
        onHistoryCallback(bars, { noData: bars.length === 0 });
      },
      subscribeBars: (symbolInfo: any, resolution: string, onRealtimeCallback: any) => {
        console.log('subscribeBars called for resolution:', resolution);
        onRealtimeCallbackRef.current = onRealtimeCallback;
      },
      unsubscribeBars: () => {
        console.log('unsubscribeBars called');
        onRealtimeCallbackRef.current = null;
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
      ],
      enabled_features: [
        "side_toolbar_in_fullscreen_mode",
        "items_favoriting",
      ],
      fullscreen: false,
      autosize: true,
      theme: "dark",
      overrides: {
        "paneProperties.background": "#0a0a0b",
        "paneProperties.backgroundType": "solid",
        "scalesProperties.backgroundColor": "#0a0a0b",
      },
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
        loadSavedLayout();
      } else {
        // Already loaded layout - just enable auto-save immediately
        initialRestoreCompleteRef.current = true;
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
          
          const savedData = {
            drawings,
            studies,
            interval: currentInterval,
            timestamp: Date.now(),
            favoriteDrawingTools: favoriteDrawingToolsRef.current
          };
          
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

        // Handle TP/SL line drag events - use stored shape IDs for reliable detection
        if (type === "move" || type === "properties_changed") {
          const storedLines = tradeLinesRef.current;
          // Debug: Log all info to diagnose ID matching issues
          console.log("Drawing event:", { 
            eventId: id, 
            eventType: type, 
            storedTP: storedLines.tp, 
            storedSL: storedLines.sl,
            idType: typeof id,
            tpType: typeof storedLines.tp,
            strictEqual: id === storedLines.tp,
            looseEqual: id == storedLines.tp
          });
          
          // Use loose equality (==) to handle string/number type mismatches
          const isTPLine = storedLines.tp && String(id) === String(storedLines.tp);
          const isSLLine = storedLines.sl && String(id) === String(storedLines.sl);
          
          if (isTPLine || isSLLine) {
            const newPrice = points[0]?.price;
            const currentActiveTrade = activeTradesRef.current;
            if (newPrice && currentActiveTrade) {
              const updatedTrade = { ...currentActiveTrade };
              const precision = decimalPlaces || 5;
              if (isTPLine) {
                updatedTrade.target = parseFloat(newPrice.toFixed(precision));
              } else if (isSLLine) {
                updatedTrade.stopLoss = parseFloat(newPrice.toFixed(precision));
              }
              // Update ref immediately so TP/SL hit detection uses new values
              activeTradesRef.current = updatedTrade;
              dispatch({ type: "SET_ACTIVE_TRADE", payload: updatedTrade });
              console.log(`${isTPLine ? 'TP' : 'SL'} line moved to:`, newPrice.toFixed(precision));
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

  const removeTradeLines = useCallback(() => {
    if (!tvWidgetRef.current) return;
    
    try {
      const chart = tvWidgetRef.current.activeChart();
      if (!chart) return;
      
      // Remove lines using stored IDs from tradeLinesRef
      const { entry, tp, sl } = tradeLinesRef.current;
      console.log("Removing trade lines with IDs:", { entry, tp, sl });
      
      if (entry) {
        try { chart.removeEntity(entry); console.log("Removed entry line:", entry); } catch (e) { /* shape already removed */ }
      }
      if (tp) {
        try { chart.removeEntity(tp); console.log("Removed TP line:", tp); } catch (e) { /* shape already removed */ }
      }
      if (sl) {
        try { chart.removeEntity(sl); console.log("Removed SL line:", sl); } catch (e) { /* shape already removed */ }
      }
    } catch (e) {
      console.error("Error in removeTradeLines:", e);
    }
    
    tradeLinesRef.current = { entry: null, tp: null, sl: null };
  }, []);

  // Track if entry line is currently being updated to prevent race conditions
  const entryLineUpdatingRef = useRef(false);
  const lastEntryPnLRef = useRef<number>(0);

  // Update entry line label with current unrealized P&L
  const updateEntryLineLabel = useCallback((trade: any, unrealizedPnL: number) => {
    if (!tvWidgetRef.current || !trade) return;
    
    // Skip if P&L hasn't changed significantly (prevents unnecessary updates)
    if (Math.abs(unrealizedPnL - lastEntryPnLRef.current) < 0.01) return;
    
    // Skip if already updating to prevent race conditions
    if (entryLineUpdatingRef.current) return;
    
    try {
      const chart = tvWidgetRef.current.activeChart();
      if (!chart) return;
      
      entryLineUpdatingRef.current = true;
      lastEntryPnLRef.current = unrealizedPnL;
      
      const tradeLotSize = trade.lotSize || lotSize;
      const lotDisplay = tradeLotSize.toFixed(2);
      const pnlSign = unrealizedPnL >= 0 ? '+' : '';
      const entryLabel = `${lotDisplay} → ${pnlSign}${unrealizedPnL.toFixed(2)} USD`;
      
      // Remove old entry line if it exists
      const oldEntryId = tradeLinesRef.current.entry;
      if (oldEntryId) {
        try { chart.removeEntity(oldEntryId); } catch (e) { /* already removed */ }
      }
      
      // Create new entry line with updated label
      chart.createShape(
        { price: trade.entry },
        {
          shape: "horizontal_line",
          lock: true,
          disableSelection: true,
          text: entryLabel,
          overrides: {
            linecolor: unrealizedPnL >= 0 ? "rgba(16, 185, 129, 0.9)" : "rgba(239, 68, 68, 0.9)",
            linestyle: 2,
            linewidth: 1,
            showPrice: true,
            showLabel: true,
            horzLabelsAlign: "right",
            textcolor: unrealizedPnL >= 0 ? "rgba(16, 185, 129, 1)" : "rgba(239, 68, 68, 1)",
          },
        }
      ).then((newEntryId: any) => {
        tradeLinesRef.current.entry = newEntryId;
        entryLineUpdatingRef.current = false;
      }).catch((e: any) => {
        console.error("Failed to update entry line:", e);
        entryLineUpdatingRef.current = false;
      });
      
    } catch (e) {
      console.error("Error updating entry line label:", e);
      entryLineUpdatingRef.current = false;
    }
  }, [lotSize]);

  const drawTradeLines = useCallback((trade: any) => {
    if (!tvWidgetRef.current || !trade) return;
    
    try {
      const chart = tvWidgetRef.current.activeChart();
      if (!chart) return;
      
      // First remove any existing trade lines
      removeTradeLines();
      
      console.log("Drawing trade lines for:", trade);
      
      // Calculate P&L values for each level
      const tradeLotSize = trade.lotSize || lotSize;
      const lotDisplay = tradeLotSize.toFixed(2);
      
      // Calculate potential P&L at TP level
      let tpPnL = 0;
      if (trade.target !== undefined) {
        if (trade.type === "long") {
          tpPnL = (trade.target - trade.entry) * tradeLotSize * 100000;
        } else {
          tpPnL = (trade.entry - trade.target) * tradeLotSize * 100000;
        }
      }
      
      // Calculate potential P&L at SL level
      let slPnL = 0;
      if (trade.stopLoss !== undefined) {
        if (trade.type === "long") {
          slPnL = (trade.stopLoss - trade.entry) * tradeLotSize * 100000;
        } else {
          slPnL = (trade.entry - trade.stopLoss) * tradeLotSize * 100000;
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
        tradeLinesRef.current = { entry: entryId, tp: tpId, sl: slId };
        
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
  }, [removeTradeLines, lotSize]);

  // Restore open trade after chart loads
  useEffect(() => {
    if (!tvWidgetRef.current || allBars.length === 0 || isLoading) return;
    
    const openTrade = pendingOpenTradeRef.current;
    if (openTrade) {
      // Clear ref to prevent re-restore on re-render
      pendingOpenTradeRef.current = null;
      
      // Wait for chart to be fully ready before drawing lines
      setTimeout(() => {
        dispatch({ type: "SET_ACTIVE_TRADE", payload: openTrade });
        drawTradeLines(openTrade);
        setShowPanel(true);
        console.log("Restored open trade:", openTrade);
      }, 500);
    }
  }, [allBars.length, isLoading, drawTradeLines]);

  useEffect(() => {
    // Only handle removal here - drawing is done directly in placement functions
    if (!tradingState.activeTrades) {
      removeTradeLines();
    }
  }, [tradingState.activeTrades, removeTradeLines]);

  // Keep activeTradesRef in sync with state for event handlers
  useEffect(() => {
    activeTradesRef.current = tradingState.activeTrades;
  }, [tradingState.activeTrades]);

  const closeTrade = useCallback(async (exitPrice: number, reason: string, trade: any) => {
    if (!trade) return;
    
    removeTradeLines();
    
    let pnl = 0;
    if (trade.type === "long") {
      pnl = (exitPrice - trade.entry) * lotSize * 100000;
    } else {
      pnl = (trade.entry - exitPrice) * lotSize * 100000;
    }
    
    // Calculate R:R ratio - signed based on direction
    const slDistance = Math.abs(trade.entry - trade.stopLoss);
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
      lotSize: lotSize,
      pnl: pnl,
      rr: parseFloat(signedRR.toFixed(2)),
      reason: reason,
      timestamp: allBars[currentBarIndexRef.current]?.time || Date.now(),
    };
    
    dispatch({ type: "ADD_TRADE_HISTORY", payload: tradeData });
    dispatch({ type: "SET_REALISED_PL", payload: tradingState.realisedPL + pnl });
    dispatch({ type: "SET_UNREALISED_PL", payload: 0 });
    dispatch({ type: "SET_ACTIVE_TRADE", payload: null });
    
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
      } catch (error) {
        console.error("Failed to close trade:", error);
      }
    }
  }, [removeTradeLines, lotSize, allBars, tradingState.realisedPL, sessionId]);

  const handleNext = useCallback(() => {
    // Use ref for latest bars to avoid stale closure issues
    const bars = allBarsRef.current;
    const idx = currentBarIndexRef.current;
    
    if (!bars || bars.length === 0 || idx >= bars.length - 1) {
      setIsPlaying(false);
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
  }, []);

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
    const storedLines = tradeLinesRef.current;
    const hasActiveTrade = !!activeTradesRef.current;
    const hasWidget = !!tvWidgetRef.current;
    
    // Debug log to see what's available
    console.log("syncLinesToTradeState called:", {
      hasWidget,
      hasActiveTrade,
      storedTP: storedLines.tp,
      storedSL: storedLines.sl,
      currentTarget: activeTradesRef.current?.target,
      currentSL: activeTradesRef.current?.stopLoss
    });
    
    if (!tvWidgetRef.current || !activeTradesRef.current) return;
    if (!storedLines.tp && !storedLines.sl) return;
    
    try {
      const chart = tvWidgetRef.current.activeChart();
      if (!chart) return;
      
      const currentTrade = activeTradesRef.current;
      let updated = false;
      const precision = decimalPlaces || 5;
      const updatedTrade = { ...currentTrade };
      
      // Check TP line position (only if TP is defined)
      if (storedLines.tp && currentTrade.target !== undefined) {
        try {
          const tpShape = chart.getShapeById(storedLines.tp);
          console.log("TP shape lookup:", { id: storedLines.tp, found: !!tpShape });
          if (tpShape) {
            const tpPoints = tpShape.getPoints();
            const tpPrice = tpPoints[0]?.price;
            console.log("TP line price:", tpPrice, "current target:", currentTrade.target);
            if (tpPrice && Math.abs(tpPrice - currentTrade.target) > 0.00001) {
              updatedTrade.target = parseFloat(tpPrice.toFixed(precision));
              updated = true;
              console.log("Synced TP from chart line:", updatedTrade.target);
            }
          }
        } catch (e) { 
          console.log("TP shape error:", e);
        }
      }
      
      // Check SL line position (only if SL is defined)
      if (storedLines.sl && currentTrade.stopLoss !== undefined) {
        try {
          const slShape = chart.getShapeById(storedLines.sl);
          console.log("SL shape lookup:", { id: storedLines.sl, found: !!slShape });
          if (slShape) {
            const slPoints = slShape.getPoints();
            const slPrice = slPoints[0]?.price;
            console.log("SL line price:", slPrice, "current stopLoss:", currentTrade.stopLoss);
            if (slPrice && Math.abs(slPrice - currentTrade.stopLoss) > 0.00001) {
              updatedTrade.stopLoss = parseFloat(slPrice.toFixed(precision));
              updated = true;
              console.log("Synced SL from chart line:", updatedTrade.stopLoss);
            }
          }
        } catch (e) { 
          console.log("SL shape error:", e);
        }
      }
      
      if (updated) {
        activeTradesRef.current = updatedTrade;
        dispatch({ type: "SET_ACTIVE_TRADE", payload: updatedTrade });
      }
    } catch (e) {
      console.error("Error syncing lines:", e);
    }
  }, [decimalPlaces]);

  useEffect(() => {
    // Sync line positions from chart before checking TP/SL hits
    syncLinesToTradeState();
    
    // Use ref for immediate access to latest trade values (including after dragging TP/SL)
    const trade = activeTradesRef.current;
    if (trade && allBars[currentBarIndex]) {
      const currentBar = allBars[currentBarIndex];
      const currentHigh = currentBar.high;
      const currentLow = currentBar.low;
      const currentClose = currentBar.close;
      let pnl = 0;
      
      if (trade.type === "long") {
        pnl = (currentClose - trade.entry) * lotSize * 100000;
        // Check if wick touched TP (high >= target) or SL (low <= stopLoss)
        if (trade.target !== undefined && currentHigh >= trade.target) {
          closeTrade(trade.target, "TP Hit", trade);
        } else if (trade.stopLoss !== undefined && currentLow <= trade.stopLoss) {
          closeTrade(trade.stopLoss, "SL Hit", trade);
        }
      } else {
        pnl = (trade.entry - currentClose) * lotSize * 100000;
        // Check if wick touched TP (low <= target) or SL (high >= stopLoss)
        if (trade.target !== undefined && currentLow <= trade.target) {
          closeTrade(trade.target, "TP Hit", trade);
        } else if (trade.stopLoss !== undefined && currentHigh >= trade.stopLoss) {
          closeTrade(trade.stopLoss, "SL Hit", trade);
        }
      }
      dispatch({ type: "SET_UNREALISED_PL", payload: pnl });
      
      // Update entry line label with current unrealized P&L
      updateEntryLineLabel(trade, pnl);
    }
  }, [currentBarIndex, allBars, tradingState.activeTrades, lotSize, closeTrade, syncLinesToTradeState, updateEntryLineLabel]);

  useEffect(() => {
    if (!tradingState.activeTrades && tradingState.limitOrders.length > 0 && allBars[currentBarIndex]) {
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
          const trade = {
            type: order.type,
            entry: order.entryPrice,
            target: order.target,
            stopLoss: order.stopLoss,
            dbId: null as string | null,
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
                dispatch({ type: "SET_ACTIVE_TRADE", payload: { ...trade, dbId: result.trade.id } });
              } else {
                dispatch({ type: "SET_ACTIVE_TRADE", payload: trade });
              }
            })
            .catch(() => {
              dispatch({ type: "SET_ACTIVE_TRADE", payload: trade });
            });
          } else {
            dispatch({ type: "SET_ACTIVE_TRADE", payload: trade });
          }
          break;
        }
      }
    }
  }, [currentBarIndex, allBars, tradingState.limitOrders, tradingState.activeTrades, drawTradeLines, sessionId, lotSize]);

  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(500 / speed);
  };

  const handlePlaceTrade = async (type: string) => {
    if (!allBars[currentBarIndex]) return;
    const currentPrice = allBars[currentBarIndex].close;
    const openedAt = allBars[currentBarIndex]?.time || Date.now();
    const tp = currentPrice + (type === "long" ? 0.0100 : -0.0100);
    const sl = currentPrice - (type === "long" ? 0.0050 : -0.0050);
    
    const trade = {
      type: type,
      entry: currentPrice,
      target: tp,
      stopLoss: sl,
      dbId: null as string | null,
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
    
    dispatch({ type: "SET_ACTIVE_TRADE", payload: { ...trade, dbId } });
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
    const trade = {
      type: tradingState.potentialTrade.type,
      entry: currentPrice,
      target: tradingState.potentialTrade.target,
      stopLoss: tradingState.potentialTrade.stopLoss,
      dbId: null as string | null,
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
    
    dispatch({ type: "SET_ACTIVE_TRADE", payload: { ...trade, dbId } });
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
    // Position size formula derived from P&L formula:
    // P&L = priceChange * lotSize * 100000
    // To risk exactly riskAmount at SL: lotSize = riskAmount / (slDistance * 100000)
    return riskAmount / (slDistance * 100000);
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
      const trade = {
        type: tradeType,
        entry: entry,
        target: tp,
        stopLoss: sl,
        dbId: null as string | null,
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
      
      dispatch({ type: "SET_ACTIVE_TRADE", payload: { ...trade, dbId } });
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
    
    const trade = {
      type: tradeType,
      entry: entry,
      target: tp,
      stopLoss: sl,
      dbId: null as string | null,
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
    
    dispatch({ type: "SET_ACTIVE_TRADE", payload: { ...trade, dbId } });
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

  const handleManualClose = () => {
    if (tradingState.activeTrades && allBars[currentBarIndex]) {
      closeTrade(allBars[currentBarIndex].close, "Manual Close", tradingState.activeTrades);
    }
  };

  const handleModifyTrade = () => {
    if (tradingState.activeTrades) {
      setModifyTradeData({
        newTP: tradingState.activeTrades.target.toString(),
        newSL: tradingState.activeTrades.stopLoss.toString(),
      });
      setShowModifyTradePopup(true);
    }
  };

  const executeModifyTrade = () => {
    if (tradingState.activeTrades) {
      dispatch({
        type: "SET_ACTIVE_TRADE",
        payload: {
          ...tradingState.activeTrades,
          target: parseFloat(modifyTradeData.newTP),
          stopLoss: parseFloat(modifyTradeData.newSL),
        },
      });
      setShowModifyTradePopup(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      
      // Ctrl + Space = advance one candle
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
          if (!isEndReached) handleNext();
          break;
        case "KeyB":
          if (!tradingState.activeTrades && !tradingState.potentialTrade) handlePlaceTrade("long");
          break;
        case "KeyS":
          if (!tradingState.activeTrades && !tradingState.potentialTrade) handlePlaceTrade("short");
          break;
        case "KeyP":
          if (tradingState.potentialTrade && !tradingState.activeTrades) handlePlaceOrderFromDrawing();
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
  }, [isEndReached, handleNext, tradingState.activeTrades, tradingState.potentialTrade]);

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
        <div className="bt-loading">
          <div className="bt-spinner"></div>
          <span>Loading session...</span>
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
            <button onClick={handleNext} disabled={isEndReached} className="bt-float-btn" title="Next">
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

          {/* Timeframe Dropdown */}
          <div className="bt-float-timeframe">
            <button 
              className="bt-float-tf-btn" 
              onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
            >
              {timeframeOptions.find(tf => tf.value === currentInterval)?.label || '1H'}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5H7z"/>
              </svg>
            </button>
            {showTimeframeDropdown && (
              <div className="bt-float-tf-dropdown">
                {timeframeOptions.map((tf) => (
                  <button
                    key={tf.value}
                    className={`bt-float-tf-option ${currentInterval === tf.value ? 'active' : ''}`}
                    onClick={() => handleTimeframeChange(tf.value)}
                  >
                    {tf.label}
                  </button>
                ))}
                <div className="bt-float-tf-divider"></div>
                {showCustomTfInput ? (
                  <div className="bt-float-tf-custom-input">
                    <input
                      type="number"
                      placeholder="e.g. 69"
                      value={customTfInput}
                      onChange={(e) => setCustomTfInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomTf()}
                      autoFocus
                    />
                    <button onClick={handleCustomTf}>Go</button>
                  </div>
                ) : (
                  <button
                    className="bt-float-tf-option custom"
                    onClick={() => setShowCustomTfInput(true)}
                  >
                    Custom...
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bt-float-divider"></div>

          {/* Trade Buttons */}
          <div className="bt-float-group trade-group">
            {tradingState.potentialTrade ? (
              <button
                onClick={handlePlaceOrderFromDrawing}
                disabled={!!tradingState.activeTrades}
                className="bt-float-trade-btn place"
              >
                Place {tradingState.potentialTrade.type === 'long' ? 'Long' : 'Short'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setQuickOrderData(prev => ({ ...prev, side: 'buy' })); setShowQuickOrderDialog(true); }}
                  disabled={!!tradingState.activeTrades}
                  className="bt-float-trade-btn buy"
                >
                  Buy
                </button>
                <button
                  onClick={() => { setQuickOrderData(prev => ({ ...prev, side: 'sell' })); setShowQuickOrderDialog(true); }}
                  disabled={!!tradingState.activeTrades}
                  className="bt-float-trade-btn sell"
                >
                  Sell
                </button>
              </>
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
          <div className="bt-chart" ref={chartContainerRef}></div>
        </div>
      </main>

      <footer className="bt-status-bar">
        <div className="bt-status-left">
          <div className="bt-status-drag">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="8" cy="6" r="2"/>
              <circle cx="16" cy="6" r="2"/>
              <circle cx="8" cy="12" r="2"/>
              <circle cx="16" cy="12" r="2"/>
              <circle cx="8" cy="18" r="2"/>
              <circle cx="16" cy="18" r="2"/>
            </svg>
          </div>
          <button className="bt-status-analytics">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18"/>
              <path d="M18 9l-5 5-4-4-3 3"/>
            </svg>
            Analytics
          </button>
        </div>
        
        <div className="bt-status-center">
          <div className="bt-status-item">
            <span className="bt-status-label">Account Balance:</span>
            <span className="bt-status-value">${totalBalance.toFixed(2)}</span>
          </div>
          <div className="bt-status-item">
            <span className="bt-status-label">Realized PnL:</span>
            <span className={`bt-status-value ${tradingState.realisedPL >= 0 ? 'profit' : 'loss'}`}>
              {tradingState.realisedPL >= 0 ? '' : '-'}${Math.abs(tradingState.realisedPL).toFixed(2)}
            </span>
          </div>
          <div className="bt-status-item">
            <span className="bt-status-label">Unrealized PnL:</span>
            <span className={`bt-status-value ${tradingState.unrealisedPL >= 0 ? 'profit' : 'loss'}`}>
              ${tradingState.unrealisedPL.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="bt-status-right">
          <button className="bt-status-icon" onClick={() => router.push("/backtesting/dashboard")} title="Exit to Dashboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
          <button 
            className="bt-status-icon" 
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            }}
            title="Toggle Fullscreen"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
            </svg>
          </button>
        </div>
      </footer>

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
                {tradingState.activeTrades ? 1 : 0}
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
              onClick={() => setIsDrawerCollapsed(!isDrawerCollapsed)}
              title={isDrawerCollapsed ? "Expand panel" : "Collapse panel"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              {tradingState.activeTrades ? (
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
                    <tr>
                      <td className="bt-table-symbol">{sessionData?.symbol || 'N/A'}</td>
                      <td>
                        <span className={`bt-table-side ${tradingState.activeTrades.type}`}>
                          {tradingState.activeTrades.type === 'long' ? 'BUY' : 'SELL'}
                        </span>
                      </td>
                      <td className="bt-table-value">{lotSize}</td>
                      <td className="bt-table-value">{tradingState.activeTrades.entry.toFixed(decimalPlaces || 5)}</td>
                      <td className="bt-table-value profit">
                        {tradingState.activeTrades.target !== undefined 
                          ? tradingState.activeTrades.target.toFixed(decimalPlaces || 5) 
                          : '-'}
                      </td>
                      <td className="bt-table-value loss">
                        {tradingState.activeTrades.stopLoss !== undefined 
                          ? tradingState.activeTrades.stopLoss.toFixed(decimalPlaces || 5) 
                          : '-'}
                      </td>
                      <td className={`bt-table-value ${tradingState.unrealisedPL >= 0 ? 'profit' : 'loss'}`}>
                        {tradingState.unrealisedPL >= 0 ? '+' : ''}${tradingState.unrealisedPL.toFixed(2)}
                      </td>
                      <td>
                        <div className="bt-table-actions">
                          <button 
                            className="bt-table-action-btn edit" 
                            onClick={handleModifyTrade}
                            title="Modify"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button 
                            className="bt-table-action-btn close" 
                            onClick={handleManualClose}
                            title="Close"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
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
