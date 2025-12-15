"use client"
import React, { useEffect, useRef, useState, memo, useImperativeHandle, forwardRef, useCallback } from "react";
import { widget as TradingViewWidget } from "../../../public/charting_library";

interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingViewChartProps {
  symbol: string;
  interval: string;
  allBars: Bar[];
  initialBarIndex: number;
  decimalPlaces: number;
  containerReady: boolean;
  onDrawingActive?: (isActive: boolean) => void;
}

export interface TradingViewChartRef {
  updateBar: (bar: Bar) => void;
  getCurrentBarIndex: () => number;
  setCurrentBarIndex: (index: number) => void;
  isDrawing: () => boolean;
}

const TradingViewChartInner = forwardRef<TradingViewChartRef, TradingViewChartProps>(
  ({ symbol, interval, allBars, initialBarIndex, decimalPlaces, containerReady, onDrawingActive }, ref) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const tvWidgetRef = useRef<any>(null);
    const onRealtimeCallbackRef = useRef<any>(null);
    const currentBarIndexRef = useRef(initialBarIndex);
    const allBarsRef = useRef(allBars);
    const [internalReady, setInternalReady] = useState(false);
    const isDrawingRef = useRef(false);
    const rafIdRef = useRef<number | null>(null);
    const pendingBarRef = useRef<Bar | null>(null);

    allBarsRef.current = allBars;

    const throttledUpdateBar = useCallback((bar: Bar) => {
      if (isDrawingRef.current) {
        pendingBarRef.current = bar;
        return;
      }
      
      if (rafIdRef.current !== null) {
        pendingBarRef.current = bar;
        return;
      }

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const barToUpdate = pendingBarRef.current || bar;
        pendingBarRef.current = null;
        
        if (onRealtimeCallbackRef.current && barToUpdate && !isDrawingRef.current) {
          onRealtimeCallbackRef.current(barToUpdate);
        }
      });
    }, []);

    useImperativeHandle(ref, () => ({
      updateBar: throttledUpdateBar,
      getCurrentBarIndex: () => currentBarIndexRef.current,
      setCurrentBarIndex: (index: number) => {
        currentBarIndexRef.current = index;
      },
      isDrawing: () => isDrawingRef.current,
    }));

    useEffect(() => {
      if (!chartContainerRef.current || internalReady) return;
      
      const container = chartContainerRef.current;
      const rect = container.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 100) {
        setInternalReady(true);
        return;
      }
      
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 100 && height > 100) {
            setInternalReady(true);
            observer.disconnect();
          }
        }
      });
      
      observer.observe(container);
      return () => observer.disconnect();
    }, [internalReady]);

    useEffect(() => {
      if (allBars.length === 0 || tvWidgetRef.current || !chartContainerRef.current || !internalReady) return;

      const datafeed = {
        onReady: (callback: any) => {
          setTimeout(() => callback({
            supported_resolutions: ["60", "120", "240", "1D", "1W", "1M"],
            supports_marks: false,
            supports_timescale_marks: false,
            supports_time: true,
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
            supported_resolutions: ["60", "120", "240", "1D", "1W", "1M"],
            intraday_multipliers: ["60", "120", "240"],
            data_status: "streaming",
          };
          setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
        },
        getBars: (symbolInfo: any, resolution: string, periodParams: any, onHistoryCallback: any) => {
          const { from, to, firstDataRequest } = periodParams;
          const currentIndex = currentBarIndexRef.current;
          const bars = allBarsRef.current;
          const visibleBars = bars.slice(0, currentIndex + 1);
          
          if (firstDataRequest) {
            if (visibleBars.length === 0) {
              onHistoryCallback([], { noData: true });
            } else {
              onHistoryCallback(visibleBars, { noData: false });
            }
          } else {
            const filteredBars = visibleBars.filter(bar => {
              return bar.time >= from && bar.time <= to;
            });
            
            if (filteredBars.length === 0) {
              onHistoryCallback([], { noData: true });
            } else {
              onHistoryCallback(filteredBars, { noData: false });
            }
          }
        },
        subscribeBars: (symbolInfo: any, resolution: string, onRealtimeCallback: any) => {
          onRealtimeCallbackRef.current = onRealtimeCallback;
        },
        unsubscribeBars: () => {},
        getMarks: (symbolInfo: any, from: number, to: number, onDataCallback: any, resolution: string) => {
          onDataCallback([]);
        },
      };

      const widgetOptions: any = {
        symbol: symbol,
        datafeed: datafeed,
        interval: interval,
        container: chartContainerRef.current,
        library_path: "/charting_library/",
        locale: "en",
        disabled_features: [
          "header_symbol_search",
          "header_compare",
          "study_templates",
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
        
        try {
          chart.crossHairMoved().subscribe(null, () => {});
        } catch (e) {}
      });

      return () => {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        if (tvWidgetRef.current) {
          tvWidgetRef.current.remove();
          tvWidgetRef.current = null;
        }
      };
    }, [allBars, decimalPlaces, symbol, interval, internalReady]);

    const handleMouseDown = useCallback(() => {
      isDrawingRef.current = true;
      onDrawingActive?.(true);
    }, [onDrawingActive]);

    const handleMouseUp = useCallback(() => {
      isDrawingRef.current = false;
      onDrawingActive?.(false);
      if (pendingBarRef.current && onRealtimeCallbackRef.current) {
        onRealtimeCallbackRef.current(pendingBarRef.current);
        pendingBarRef.current = null;
      }
    }, [onDrawingActive]);

    useEffect(() => {
      const container = chartContainerRef.current;
      if (!container) return;

      container.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        container.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [handleMouseDown, handleMouseUp]);

    return <div ref={chartContainerRef} className="bt-chart" />;
  }
);

TradingViewChartInner.displayName = "TradingViewChartInner";

const TradingViewChart = memo(TradingViewChartInner, (prevProps, nextProps) => {
  return (
    prevProps.symbol === nextProps.symbol &&
    prevProps.interval === nextProps.interval &&
    prevProps.decimalPlaces === nextProps.decimalPlaces &&
    prevProps.containerReady === nextProps.containerReady &&
    prevProps.allBars === nextProps.allBars &&
    prevProps.initialBarIndex === nextProps.initialBarIndex
  );
});

export default TradingViewChart;
