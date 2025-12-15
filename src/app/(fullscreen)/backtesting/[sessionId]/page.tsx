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

interface SessionData {
  sessionId: number;
  name: string;
  symbol: string;
  fromDate: string;
  toDate: string;
  initialBalance: number;
  currentBalance: number;
  progressPointer: number;
  status: 'active' | 'completed';
  trades: any[];
  timeInvested: number;
}

const symbolToChartFormat = (symbol: string): string => {
  const mapping: Record<string, string> = {
    'EURUSD': 'FXCM:EUR/USD',
    'GBPUSD': 'FXCM:GBP/USD',
    'USDJPY': 'FXCM:USD/JPY',
    'AUDUSD': 'FXCM:AUD/USD',
    'USDCAD': 'FXCM:USD/CAD',
    'USDCHF': 'FXCM:USD/CHF',
    'NZDUSD': 'FXCM:NZD/USD',
    'XAUUSD': 'OANDA:XAU/USD',
    'XAGUSD': 'OANDA:XAG/USD',
    'BTCUSD': 'COINBASE:BTC/USD',
    'ETHUSD': 'COINBASE:ETH/USD',
  };
  return mapping[symbol] || `FXCM:${symbol.slice(0,3)}/${symbol.slice(3)}`;
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

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [allBars, setAllBars] = useState<any[]>([]);
  const [currentBarIndex, setCurrentBarIndexState] = useState(5);
  const tradeLinesRef = useRef<{ entry: any; tp: any; sl: any }>({ entry: null, tp: null, sl: null });
  const activeTradesRef = useRef<any>(null);
  
  const setCurrentBarIndex = (newIndex: number) => {
    currentBarIndexRef.current = newIndex;
    setCurrentBarIndexState(newIndex);
  };
  
  const [isLoading, setIsLoading] = useState(true);
  const [decimalPlaces, setDecimalPlaces] = useState(0);
  const [currentInterval, setCurrentInterval] = useState(initialInterval);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(500);
  const [lotSize, setLotSize] = useState(1);
  const [showPanel, setShowPanel] = useState(false);

  const symbol = sessionData ? symbolToChartFormat(sessionData.symbol) : '';
  const fromDate = sessionData?.fromDate || '';
  const toDate = sessionData?.toDate || '';
  const initialBalance = sessionData?.initialBalance || 10000;
  const [showModifyTradePopup, setShowModifyTradePopup] = useState(false);
  const [modifyTradeData, setModifyTradeData] = useState({ newTP: "", newSL: "" });
  const [showOrderDialog, setShowOrderDialog] = useState(false);
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

  const timeframeOptions = [
    { value: "1", label: "1m" },
    { value: "5", label: "5m" },
    { value: "15", label: "15m" },
    { value: "60", label: "1H" },
    { value: "240", label: "4H" },
    { value: "1D", label: "1D" },
  ];

  const handleSpeedSliderChange = (value: number) => {
    setSpeedMultiplier(value);
    setPlaybackSpeed(800 / value);
  };

  const handleTimeframeChange = (tf: string) => {
    setCurrentInterval(tf);
    setShowTimeframeDropdown(false);
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
    if (!sessionData || !fromDate || !toDate || !symbol) return;
    
    const fetchAllHistory = async () => {
      const fromTs = Math.floor(new Date(fromDate).getTime() / 1000);
      const toTs = Math.floor(new Date(toDate).getTime() / 1000);
      const parsedSymbol = parseFullSymbol(`${symbol}`);
      const apiEndpoint = "historic-data";
      const query = `e=${parsedSymbol.exchange}&fsym=${parsedSymbol.fromSymbol}&tsym=${parsedSymbol.toSymbol}&toTs=${toTs}&fromTs=${fromTs}&timeframe=${currentInterval}`;
      setIsLoading(true);
      setAllBars([]);
      
      if (tvWidgetRef.current) {
        tvWidgetRef.current.remove();
        tvWidgetRef.current = null;
      }
      
      try {
        const data = await makeApiRequest(`data/${apiEndpoint}?${query}`);
        if (data && data.Data && data.Data.length > 0) {
          let bars = data.Data.map((bar: any) => ({
            time: bar.time * 1000,
            low: bar.low,
            high: bar.high,
            open: bar.open,
            close: bar.close,
            volume: bar.volume,
          }));
          bars = bars.filter((bar: any) => bar.volume > 0);
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
          setAllBars(bars);
          
          // Resume from progressPointer if available
          let newIndex = bars.length >= 6 ? 5 : Math.max(0, bars.length - 1);
          if (sessionData?.progressPointer) {
            const pointerIndex = bars.findIndex((bar: any) => bar.time >= sessionData.progressPointer);
            if (pointerIndex >= 0) {
              newIndex = pointerIndex;
            }
          }
          setCurrentBarIndex(newIndex);
          setIsPlaying(false);
        } else {
          setAllBars([]);
          setCurrentBarIndex(0);
        }
      } catch (error) {
        console.error("Error fetching history:", error);
        setAllBars([]);
        setCurrentBarIndex(0);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, fromDate, toDate, currentInterval]);

  useEffect(() => {
    if (allBars.length === 0 || tvWidgetRef.current || !chartContainerRef.current) {
      return;
    }

    const datafeed = {
      onReady: (callback: any) => {
        setTimeout(() => callback({
          supported_resolutions: ["1", "5", "15", "30", "60", "120", "240", "1D", "1W", "1M"],
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
          exchange: "bigbull",
          minmov: 1,
          pricescale: Math.pow(10, decimalPlaces || 5),
          has_intraday: true,
          has_daily: true,
          has_weekly_and_monthly: true,
          supported_resolutions: ["1", "5", "15", "30", "60", "120", "240", "1D", "1W", "1M"],
          intraday_multipliers: ["1", "5", "15", "30", "60", "120", "240"],
          data_status: "streaming",
        };
        setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
      },
      getBars: (symbolInfo: any, resolution: string, periodParams: any, onHistoryCallback: any) => {
        const { firstDataRequest } = periodParams;
        const idx = currentBarIndexRef.current;
        
        if (firstDataRequest) {
          const barsToShow = allBars.slice(0, idx + 1);
          onHistoryCallback(barsToShow, { noData: barsToShow.length === 0 });
          return;
        }
        
        const bars = allBars.filter(
          (bar) => bar.time / 1000 >= periodParams.from && bar.time / 1000 < periodParams.to
        );
        onHistoryCallback(bars, { noData: bars.length === 0 });
      },
      subscribeBars: (symbolInfo: any, resolution: string, onRealtimeCallback: any) => {
        onRealtimeCallbackRef.current = onRealtimeCallback;
      },
      unsubscribeBars: () => {
        onRealtimeCallbackRef.current = null;
      },
      getMarks: (symbolInfo: any, from: number, to: number, onDataCallback: any) => {
        onDataCallback([]);
      },
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
      ],
      fullscreen: false,
      autosize: true,
      theme: "dark",
      overrides: {
        "paneProperties.background": "#0a0a0b",
        "paneProperties.backgroundType": "solid",
        "scalesProperties.backgroundColor": "#0a0a0b",
      },
    };

    const tvWidget = new TradingViewWidget(widgetOptions);
    tvWidgetRef.current = tvWidget;

    tvWidget.onChartReady(() => {
      const chart = tvWidget.activeChart();
      chart.setChartType(1);
      
      chart.onIntervalChanged().subscribe(null, (newInterval: string) => {
        setCurrentInterval(newInterval);
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
        tvWidgetRef.current.remove();
        tvWidgetRef.current = null;
      }
    };
  }, [allBars, symbol, decimalPlaces]);

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

  const drawTradeLines = useCallback((trade: any) => {
    if (!tvWidgetRef.current || !trade) return;
    
    try {
      const chart = tvWidgetRef.current.activeChart();
      if (!chart) return;
      
      // First remove any existing trade lines
      removeTradeLines();
      
      console.log("Drawing trade lines for:", trade);
      
      // Create entry line
      const entryPromise = chart.createShape(
        { price: trade.entry },
        {
          shape: "horizontal_line",
          lock: true,
          disableSelection: true,
          text: "Entry",
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
          text: "TP",
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
          text: "SL",
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
  }, [removeTradeLines]);

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
    if (!onRealtimeCallbackRef.current || currentBarIndex >= allBars.length - 1) {
      setIsPlaying(false);
      return;
    }
    
    const nextBar = allBars[currentBarIndex + 1];
    if (nextBar && onRealtimeCallbackRef.current) {
      onRealtimeCallbackRef.current({
        ...nextBar,
        time: nextBar.time,
      });
    }
    
    setCurrentBarIndex(currentBarIndex + 1);
  }, [currentBarIndex, allBars]);

  const handlePrev = useCallback(() => {
    if (currentBarIndex > 0) {
      setCurrentBarIndex(currentBarIndex - 1);
    }
  }, [currentBarIndex]);

  const handleNext10 = () => {
    const newIndex = Math.min(currentBarIndex + 10, allBars.length - 1);
    setCurrentBarIndex(newIndex);
  };

  const handlePrev10 = () => {
    const newIndex = Math.max(currentBarIndex - 10, 0);
    setCurrentBarIndex(newIndex);
  };

  const handleRestart = () => {
    const newIndex = allBars.length >= 6 ? 5 : Math.max(0, allBars.length - 1);
    setCurrentBarIndex(newIndex);
    setIsPlaying(false);
    removeTradeLines();
    dispatch({ type: "RESET_SESSION" });
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
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
    }
  }, [currentBarIndex, allBars, tradingState.activeTrades, lotSize, closeTrade, syncLinesToTradeState]);

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
        case "ArrowLeft":
          e.preventDefault();
          handlePrev();
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
  }, [isEndReached, handleNext, handlePrev, tradingState.activeTrades, tradingState.potentialTrade]);

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
      {isLoading && (
        <div className="bt-loading">
          <div className="bt-spinner"></div>
          <span>Loading chart data...</span>
        </div>
      )}

      <header className="bt-header">
        <div className="bt-header-left">
          <button className="bt-back" onClick={() => router.push("/backtesting/dashboard")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="bt-session-info">
            <span className="bt-session-name">{sessionData?.name || 'Session'}</span>
            <span className="bt-pair">{sessionData?.symbol || 'Loading...'}</span>
            <span className="bt-timeframe">{currentInterval === "60" ? "1H" : currentInterval}</span>
          </div>
          <div className="bt-divider"></div>
          <span className="bt-time">{currentTime}</span>
          <span className="bt-bar-count">{currentBarIndex + 1} / {allBars.length}</span>
        </div>

        <div className="bt-header-center">
          <div className="bt-stat">
            <span className="bt-stat-label">Balance</span>
            <span className="bt-stat-value">${totalBalance.toFixed(2)}</span>
          </div>
          <div className="bt-stat">
            <span className="bt-stat-label">P/L</span>
            <span className={`bt-stat-value ${tradingState.realisedPL >= 0 ? 'profit' : 'loss'}`}>
              {tradingState.realisedPL >= 0 ? '+' : ''}${tradingState.realisedPL.toFixed(2)}
            </span>
          </div>
          <div className="bt-stat">
            <span className="bt-stat-label">Unrealized</span>
            <span className={`bt-stat-value ${tradingState.unrealisedPL >= 0 ? 'profit' : 'loss'}`}>
              {tradingState.unrealisedPL >= 0 ? '+' : ''}${tradingState.unrealisedPL.toFixed(2)}
            </span>
          </div>
          <div className="bt-stat">
            <span className="bt-stat-label">Win Rate</span>
            <span className="bt-stat-value">{winRate.toFixed(0)}%</span>
          </div>
        </div>

        <div className="bt-header-right">
          <button 
            className={`bt-panel-btn ${showPanel ? 'active' : ''}`} 
            onClick={() => setShowPanel(!showPanel)}
          >
            Panel
          </button>
        </div>
      </header>

      <main className="bt-chart-area">
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
            <button onClick={handleRestart} className="bt-float-btn" title="Go to start">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"/>
              </svg>
            </button>
            <button onClick={handlePrev} disabled={currentBarIndex <= 0} className="bt-float-btn" title="Previous">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 19V5l-10 7 10 7z"/>
              </svg>
            </button>
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
            <button onClick={() => setCurrentBarIndex(allBars.length - 1)} disabled={isEndReached} className="bt-float-btn" title="Go to end">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
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
                  onClick={() => setShowOrderDialog(true)}
                  disabled={!!tradingState.activeTrades}
                  className="bt-float-trade-btn buy"
                >
                  Buy
                </button>
                <button
                  onClick={() => { setOrderFormData(prev => ({ ...prev, side: 'sell' })); setShowOrderDialog(true); }}
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
        <div className="bt-chart" ref={chartContainerRef}></div>
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
          <button className="bt-status-icon" onClick={() => setShowPanel(!showPanel)} title="Toggle Panel">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showPanel ? (
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z"/>
              ) : (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </>
              )}
            </svg>
          </button>
          <button className="bt-status-icon" onClick={() => router.push("/backtesting/dashboard")} title="Exit to Dashboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14"/>
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

      <div className={`bt-slide-panel ${showPanel ? 'open' : ''}`}>
        <div className="bt-panel-header">
          <h3>Trade Panel</h3>
          <button onClick={() => setShowPanel(false)} className="bt-panel-close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="bt-panel-content">
          {tradingState.activeTrades ? (
            <div className="bt-position-card">
              <div className="bt-position-header">
                <span className={`bt-position-type ${tradingState.activeTrades.type}`}>
                  {tradingState.activeTrades.type === 'long' ? 'LONG' : 'SHORT'}
                </span>
                <span className={`bt-position-pnl ${tradingState.unrealisedPL >= 0 ? 'profit' : 'loss'}`}>
                  {tradingState.unrealisedPL >= 0 ? '+' : ''}${tradingState.unrealisedPL.toFixed(2)}
                </span>
              </div>
              <div className="bt-position-details">
                <div className="bt-detail">
                  <span className="bt-detail-label">Entry</span>
                  <span className="bt-detail-value">{tradingState.activeTrades.entry.toFixed(5)}</span>
                </div>
                <div className="bt-detail">
                  <span className="bt-detail-label">Lot Size</span>
                  <span className="bt-detail-value">{lotSize}</span>
                </div>
                {tradingState.activeTrades.target !== undefined && (
                  <div className="bt-detail">
                    <span className="bt-detail-label">Take Profit</span>
                    <span className="bt-detail-value profit">{tradingState.activeTrades.target.toFixed(5)}</span>
                  </div>
                )}
                {tradingState.activeTrades.stopLoss !== undefined && (
                  <div className="bt-detail">
                    <span className="bt-detail-label">Stop Loss</span>
                    <span className="bt-detail-value loss">{tradingState.activeTrades.stopLoss.toFixed(5)}</span>
                  </div>
                )}
              </div>
              <div className="bt-position-actions">
                <button onClick={handleManualClose} className="bt-action-btn close">Close Trade</button>
                <button onClick={handleModifyTrade} className="bt-action-btn modify">Modify</button>
              </div>
            </div>
          ) : (
            <div className="bt-empty-state">
              <p>No active position</p>
              <p className="bt-hint">Press B to buy or S to sell</p>
            </div>
          )}

          {tradingState.tradeHistory.length > 0 && (
            <div className="bt-history-section">
              <h4>Trade History</h4>
              {tradingState.tradeHistory.map((trade) => (
                <div key={trade.id} className="bt-history-item">
                  <div className="bt-history-info">
                    <span className={`bt-history-type ${trade.type}`}>
                      {trade.type === 'long' ? 'LONG' : 'SHORT'}
                    </span>
                    <span className="bt-history-reason">{trade.reason}</span>
                  </div>
                  <span className={`bt-history-pnl ${trade.pnl >= 0 ? 'profit' : 'loss'}`}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
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
              <label className={`bt-radio-option ${orderFormData.balanceType === 'initial' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  checked={orderFormData.balanceType === 'initial'}
                  onChange={() => setOrderFormData(prev => ({ ...prev, balanceType: 'initial' }))}
                />
                <span className="bt-radio-dot"></span>
                Initial Balance
              </label>
              <label className={`bt-radio-option ${orderFormData.balanceType === 'current' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  checked={orderFormData.balanceType === 'current'}
                  onChange={() => setOrderFormData(prev => ({ ...prev, balanceType: 'current' }))}
                />
                <span className="bt-radio-dot"></span>
                Current Balance
              </label>
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
    </div>
  );
}
