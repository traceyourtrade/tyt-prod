"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries, createSeriesMarkers, SeriesMarker } from "lightweight-charts";
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface TradeChartProps {
  symbol: string;
  date: string;
  entryPrice?: number;
  exitPrice?: number;
  entryTime?: string;
  exitTime?: string;
  isLong?: boolean;
  interval?: string;
}

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function TradeChart({
  symbol,
  date,
  entryPrice,
  exitPrice,
  entryTime,
  exitTime,
  isLong = true,
  interval = "5min",
}: TradeChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candleCount, setCandleCount] = useState(0);

  useEffect(() => {
    console.log('[TradeChart] useEffect triggered:', { symbol, date, hasContainer: !!chartContainerRef.current });
    
    if (!chartContainerRef.current || !symbol || !date) {
      console.log('[TradeChart] Early return - missing:', { 
        hasContainer: !!chartContainerRef.current, 
        symbol, 
        date
      });
      return;
    }

    let isActive = true;

    const initChart = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch candle data
        console.log('[TradeChart] Fetching candle data...');
        const response = await fetch(
          `/api/trade-chart?symbol=${encodeURIComponent(symbol)}&date=${date}&interval=${interval}`
        );
        const data = await response.json();
        console.log('[TradeChart] API response:', data);

        if (!isActive) return;

        if (data.error && !data.candles) {
          setError(data.error);
          setLoading(false);
          return;
        }

        const candles: Candle[] = data.candles || [];
        
        if (candles.length === 0) {
          setError("No chart data available for this symbol and date");
          setLoading(false);
          return;
        }

        setCandleCount(candles.length);
        console.log('[TradeChart] Creating chart with', candles.length, 'candles');
        console.log('[TradeChart] Container dimensions:', chartContainerRef.current?.clientWidth, 'x', chartContainerRef.current?.clientHeight);

        // Create chart
        if (chartRef.current) {
          chartRef.current.remove();
        }

        const chart = createChart(chartContainerRef.current!, {
          layout: {
            background: { color: "transparent" },
            textColor: "rgba(255, 255, 255, 0.5)",
          },
          grid: {
            vertLines: { color: "rgba(255, 255, 255, 0.03)" },
            horzLines: { color: "rgba(255, 255, 255, 0.03)" },
          },
          crosshair: {
            vertLine: {
              color: "rgba(59, 130, 246, 0.5)",
              width: 1,
              style: 2,
              labelBackgroundColor: "rgba(59, 130, 246, 0.8)",
            },
            horzLine: {
              color: "rgba(59, 130, 246, 0.5)",
              width: 1,
              style: 2,
              labelBackgroundColor: "rgba(59, 130, 246, 0.8)",
            },
          },
          rightPriceScale: {
            borderColor: "rgba(255, 255, 255, 0.1)",
          },
          timeScale: {
            borderColor: "rgba(255, 255, 255, 0.1)",
            timeVisible: true,
            secondsVisible: false,
          },
          handleScale: {
            axisPressedMouseMove: true,
          },
          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: true,
          },
        });

        chartRef.current = chart;

        // Add candlestick series (v5 API)
        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: "#4EBF94",
          downColor: "#ef4444",
          borderUpColor: "#4EBF94",
          borderDownColor: "#ef4444",
          wickUpColor: "#4EBF94",
          wickDownColor: "#ef4444",
        });

        candleSeriesRef.current = candleSeries;

        // Format candle data for lightweight-charts
        const formattedCandles: CandlestickData<Time>[] = candles.map((c) => {
          // Handle both datetime strings and date-only strings
          let timeValue: Time;
          if (c.time.includes(" ")) {
            // Intraday: "2024-01-15 09:30:00"
            const dt = new Date(c.time.replace(" ", "T") + "Z");
            timeValue = Math.floor(dt.getTime() / 1000) as Time;
          } else {
            // Daily: "2024-01-15"
            timeValue = c.time as Time;
          }
          
          return {
            time: timeValue,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          };
        });

        candleSeries.setData(formattedCandles);

        // Add entry/exit markers using v5 API
        if (entryPrice && entryTime) {
          const entryMarkerTime = findClosestCandleTime(candles, entryTime);
          if (entryMarkerTime) {
            const markers: SeriesMarker<Time>[] = [
              {
                time: entryMarkerTime as Time,
                position: isLong ? "belowBar" : "aboveBar",
                color: "#4EBF94",
                shape: isLong ? "arrowUp" : "arrowDown",
                text: `Entry $${entryPrice.toFixed(2)}`,
                size: 2,
              },
            ];
            
            if (exitPrice && exitTime) {
              const exitMarkerTime = findClosestCandleTime(candles, exitTime);
              if (exitMarkerTime) {
                markers.push({
                  time: exitMarkerTime as Time,
                  position: isLong ? "aboveBar" : "belowBar",
                  color: "#ef4444",
                  shape: isLong ? "arrowDown" : "arrowUp",
                  text: `Exit $${exitPrice.toFixed(2)}`,
                  size: 2,
                });
              }
            }
            
            // Sort markers by time
            markers.sort((a, b) => {
              const timeA = typeof a.time === 'number' ? a.time : 0;
              const timeB = typeof b.time === 'number' ? b.time : 0;
              return timeA - timeB;
            });
            
            // Create markers using v5 API
            createSeriesMarkers(candleSeries, markers);
          }
        }

        // Add price lines for entry/exit
        if (entryPrice) {
          candleSeries.createPriceLine({
            price: entryPrice,
            color: "#4EBF94",
            lineWidth: 1,
            lineStyle: 2, // Dashed
            axisLabelVisible: true,
            title: "Entry",
          });
        }

        if (exitPrice) {
          candleSeries.createPriceLine({
            price: exitPrice,
            color: "#ef4444",
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: "Exit",
          });
        }

        // Fit content
        chart.timeScale().fitContent();

        // Handle resize
        const handleResize = () => {
          if (chartContainerRef.current && chart) {
            chart.applyOptions({
              width: chartContainerRef.current.clientWidth,
              height: chartContainerRef.current.clientHeight,
            });
          }
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        console.log('[TradeChart] Chart created successfully, setting loading to false');
        setLoading(false);

        return () => {
          window.removeEventListener("resize", handleResize);
        };
      } catch (err) {
        console.error("[TradeChart] Chart error:", err);
        if (isActive) {
          setError("Failed to load chart data");
          setLoading(false);
        }
      }
    };

    initChart();

    return () => {
      isActive = false;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [symbol, date, entryPrice, exitPrice, entryTime, exitTime, isLong, interval]);

  // Find the closest candle time to a given time string
  function findClosestCandleTime(candles: Candle[], timeStr: string): Time | null {
    if (!candles.length || !timeStr) return null;

    // Parse target time (HH:MM or HH:MM:SS)
    const [hours, minutes] = timeStr.split(":").map(Number);
    const targetMinutes = hours * 60 + minutes;

    let closestCandle = candles[0];
    let minDiff = Infinity;

    for (const candle of candles) {
      // Extract time from candle
      let candleMinutes: number;
      if (candle.time.includes(" ")) {
        const timePart = candle.time.split(" ")[1];
        const [h, m] = timePart.split(":").map(Number);
        candleMinutes = h * 60 + m;
      } else {
        // Daily candle, just use first one
        candleMinutes = targetMinutes;
      }

      const diff = Math.abs(candleMinutes - targetMinutes);
      if (diff < minDiff) {
        minDiff = diff;
        closestCandle = candle;
      }
    }

    // Return formatted time
    if (closestCandle.time.includes(" ")) {
      const dt = new Date(closestCandle.time.replace(" ", "T") + "Z");
      return Math.floor(dt.getTime() / 1000) as Time;
    }
    return closestCandle.time as Time;
  }

  return (
    <div className="h-full w-full relative">
      {/* Chart Container - ALWAYS render so ref is available */}
      <div ref={chartContainerRef} className="h-full w-full" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-[#0a0a0f]/80 backdrop-blur-sm z-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm">Loading chart for {symbol}...</p>
        </div>
      )}

      {/* Error Overlay */}
      {error && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-[#0a0a0f]/80 backdrop-blur-sm z-20">
          <AlertCircle className="w-8 h-8 text-amber-500/50 mb-3" />
          <p className="text-sm text-center max-w-xs">{error}</p>
          <p className="text-xs text-muted-foreground/60 mt-2">Try uploading a screenshot instead</p>
        </div>
      )}

      {/* Chart Info Overlay - only show when not loading/error */}
      {!loading && !error && (
        <>
          <div className="absolute top-3 left-3 z-10 flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-white/10 flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{symbol}</span>
              <span className="text-xs text-muted-foreground">{interval}</span>
            </div>
            {entryPrice && (
              <div className="px-2 py-1 rounded bg-profit/10 border border-profit/20 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-profit" />
                <span className="text-xs text-profit">${entryPrice.toFixed(2)}</span>
              </div>
            )}
            {exitPrice && (
              <div className="px-2 py-1 rounded bg-loss/10 border border-loss/20 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-loss" />
                <span className="text-xs text-loss">${exitPrice.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Candle Count */}
          <div className="absolute bottom-3 right-3 z-10">
            <span className="text-[10px] text-muted-foreground/60">{candleCount} candles</span>
          </div>
        </>
      )}
    </div>
  );
}
