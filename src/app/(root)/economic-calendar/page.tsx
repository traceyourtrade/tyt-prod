"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  TrendingUp,
  Clock,
  Globe,
  RefreshCw,
  CalendarDays,
  CalendarRange,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  country: string;
  currency: string;
  event: string;
  impact: number;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  unit: string;
}

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"];

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  AUD: "🇦🇺",
  CAD: "🇨🇦",
  CHF: "🇨🇭",
  NZD: "🇳🇿",
  CNY: "🇨🇳",
};

const IMPACT_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  3: { label: "High", color: "text-red-500", bg: "bg-red-500" },
  2: { label: "Medium", color: "text-amber-500", bg: "bg-amber-500" },
  1: { label: "Low", color: "text-zinc-400", bg: "bg-zinc-400" },
};

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getWeekRange(date: Date): { from: Date; to: Date } {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const from = new Date(date);
  from.setDate(diff);
  const to = new Date(from);
  to.setDate(from.getDate() + 6);
  return { from, to };
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(timeStr: string): string {
  if (!timeStr) return "--:--";
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

const EventSkeleton = () => (
  <div className="p-4 border-b border-border/50 last:border-b-0">
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center min-w-[80px]">
        <Skeleton className="h-4 w-16 mb-1" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="flex items-center gap-2 min-w-[60px]">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-8" />
      </div>
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <div className="flex gap-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
        </div>
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  </div>
);

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 text-center"
  >
    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
      <Calendar className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
    <p className="text-muted-foreground text-sm max-w-md">
      There are no economic events matching your filters for this time period.
      Try adjusting your filters or selecting a different date range.
    </p>
  </motion.div>
);

const ImpactDots = ({ level }: { level: number }) => (
  <div className="flex gap-1">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className={`w-2 h-2 rounded-full transition-colors ${
          i <= level ? IMPACT_LABELS[level]?.bg : "bg-muted"
        }`}
      />
    ))}
  </div>
);

const ValueBox = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | null;
  highlight?: boolean;
}) => (
  <div
    className={`flex flex-col items-center px-3 py-1.5 rounded-lg min-w-[70px] ${
      highlight ? "bg-primary/10" : "bg-muted/50"
    }`}
  >
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
      {label}
    </span>
    <span
      className={`text-sm font-semibold ${
        highlight ? "text-primary" : "text-foreground"
      }`}
    >
      {value ?? "--"}
    </span>
  </div>
);

export default function EconomicCalendarPage() {
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("weekly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [selectedImpacts, setSelectedImpacts] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const dateRange = useMemo(() => {
    if (viewMode === "daily") {
      return { from: currentDate, to: currentDate };
    }
    return getWeekRange(currentDate);
  }, [viewMode, currentDate]);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const from = formatDate(dateRange.from);
      const to = formatDate(dateRange.to);
      const response = await fetch(
        `/api/economic-calendar?from=${from}&to=${to}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch events");
      }
      setEvents(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [dateRange.from.toISOString(), dateRange.to.toISOString()]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const currencyMatch =
        selectedCurrencies.length === 0 ||
        selectedCurrencies.includes(event.currency);
      const impactMatch =
        selectedImpacts.length === 0 || selectedImpacts.includes(event.impact);
      return currencyMatch && impactMatch;
    });
  }, [events, selectedCurrencies, selectedImpacts]);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, EconomicEvent[]> = {};
    filteredEvents.forEach((event) => {
      if (!groups[event.date]) {
        groups[event.date] = [];
      }
      groups[event.date].push(event);
    });
    return groups;
  }, [filteredEvents]);

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewMode === "daily") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const toggleCurrency = (currency: string) => {
    setSelectedCurrencies((prev) =>
      prev.includes(currency)
        ? prev.filter((c) => c !== currency)
        : [...prev, currency]
    );
  };

  const toggleImpact = (impact: number) => {
    setSelectedImpacts((prev) =>
      prev.includes(impact)
        ? prev.filter((i) => i !== impact)
        : [...prev, impact]
    );
  };

  const clearFilters = () => {
    setSelectedCurrencies([]);
    setSelectedImpacts([]);
  };

  const hasActiveFilters =
    selectedCurrencies.length > 0 || selectedImpacts.length > 0;

  const dateRangeLabel = useMemo(() => {
    if (viewMode === "daily") {
      return formatDisplayDate(formatDate(currentDate));
    }
    return `${formatDisplayDate(formatDate(dateRange.from))} - ${formatDisplayDate(formatDate(dateRange.to))}`;
  }, [viewMode, currentDate, dateRange]);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/20">
              <Globe className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Economic Calendar
              </h1>
              <p className="text-sm text-muted-foreground">
                Track market-moving events worldwide
              </p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border/50">
              <button
                onClick={() => setViewMode("daily")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === "daily"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                Daily
              </button>
              <button
                onClick={() => setViewMode("weekly")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === "weekly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarRange className="h-4 w-4" />
                Weekly
              </button>
            </div>
          </div>
        </div>

        {/* Navigation & Filters */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Date Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate("prev")}
                  className="h-9 w-9"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <button
                  onClick={goToToday}
                  className="px-4 py-2 text-sm font-medium bg-muted/50 hover:bg-muted rounded-lg transition-colors min-w-[200px] text-center"
                >
                  {dateRangeLabel}
                </button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate("next")}
                  className="h-9 w-9"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  className="text-primary"
                >
                  Today
                </Button>
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={hasActiveFilters ? "border-primary text-primary" : ""}
                >
                  <Filter className="h-4 w-4 mr-1.5" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                      {selectedCurrencies.length + selectedImpacts.length}
                    </span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchEvents}
                  disabled={loading}
                  className="h-9 w-9"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 mt-4 border-t border-border/50 space-y-4">
                    {/* Currency Filter */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Currency
                        </span>
                        {selectedCurrencies.length > 0 && (
                          <button
                            onClick={() => setSelectedCurrencies([])}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {CURRENCIES.map((currency) => (
                          <button
                            key={currency}
                            onClick={() => toggleCurrency(currency)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              selectedCurrencies.includes(currency)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            <span>{CURRENCY_FLAGS[currency]}</span>
                            {currency}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Impact Filter */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Impact Level
                        </span>
                        {selectedImpacts.length > 0 && (
                          <button
                            onClick={() => setSelectedImpacts([])}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[3, 2, 1].map((impact) => (
                          <button
                            key={impact}
                            onClick={() => toggleImpact(impact)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              selectedImpacts.includes(impact)
                                ? `${IMPACT_LABELS[impact].bg} text-white`
                                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            <ImpactDots level={impact} />
                            {IMPACT_LABELS[impact].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-muted-foreground"
                      >
                        <X className="h-4 w-4 mr-1.5" />
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Events List */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
          {error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Error Loading Events</h3>
              <p className="text-muted-foreground text-sm max-w-md mb-4">
                {error}
              </p>
              <Button onClick={fetchEvents} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : loading ? (
            <div>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <EventSkeleton key={i} />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <EmptyState />
          ) : (
            <div>
              {Object.entries(groupedEvents).map(([date, dateEvents]) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Date Header */}
                  <div className="sticky top-0 z-10 px-4 py-2 bg-muted/80 backdrop-blur-sm border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">
                        {formatDisplayDate(date)}
                      </span>
                      <Badge variant="outline" className="ml-2">
                        {dateEvents.length} events
                      </Badge>
                    </div>
                  </div>

                  {/* Events for this date */}
                  {dateEvents.map((event, idx) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 border-b border-border/30 last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                        {/* Time */}
                        <div className="flex items-center gap-2 min-w-[90px]">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {formatTime(event.time)}
                          </span>
                        </div>

                        {/* Currency Badge */}
                        <div className="flex items-center gap-2 min-w-[70px]">
                          <span className="text-lg">
                            {CURRENCY_FLAGS[event.currency] || "🌐"}
                          </span>
                          <Badge variant="outline" className="font-semibold">
                            {event.currency}
                          </Badge>
                        </div>

                        {/* Event Name & Impact */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate mb-1">
                            {event.event}
                          </p>
                          <div className="flex items-center gap-2">
                            <ImpactDots level={event.impact} />
                            <span
                              className={`text-xs ${IMPACT_LABELS[event.impact]?.color}`}
                            >
                              {IMPACT_LABELS[event.impact]?.label} Impact
                            </span>
                          </div>
                        </div>

                        {/* Values */}
                        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                          <ValueBox
                            label="Actual"
                            value={event.actual}
                            highlight={!!event.actual}
                          />
                          <ValueBox label="Forecast" value={event.forecast} />
                          <ValueBox label="Previous" value={event.previous} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* Stats Summary */}
        {!loading && !error && filteredEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {filteredEvents.length}
                </div>
                <div className="text-xs text-muted-foreground">Total Events</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-500">
                  {filteredEvents.filter((e) => e.impact === 3).length}
                </div>
                <div className="text-xs text-muted-foreground">High Impact</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-500">
                  {filteredEvents.filter((e) => e.impact === 2).length}
                </div>
                <div className="text-xs text-muted-foreground">
                  Medium Impact
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-zinc-400">
                  {filteredEvents.filter((e) => e.impact === 1).length}
                </div>
                <div className="text-xs text-muted-foreground">Low Impact</div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
