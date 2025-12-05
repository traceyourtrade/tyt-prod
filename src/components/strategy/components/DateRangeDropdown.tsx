import React, { useEffect, useMemo, useRef, useState } from "react";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const MIN_YEAR = 1970;
const MAX_YEAR = 2100;

interface MonthYear {
  y: number;
  m: number;
}

function buildMonthMatrix(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

interface MonthYearControlsProps {
  y: number;
  m: number;
  onChange: (value: MonthYear) => void;
}

function MonthYearControls({ y, m, onChange }: MonthYearControlsProps) {
  const years = useMemo(
    () => Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i),
    []
  );
  
  return (
    <div className="flex justify-between gap-2 items-center mb-2">
      <select
        className="bg-muted text-foreground border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        value={m}
        onChange={(e) => onChange({ y, m: parseInt(e.target.value, 10) })}
        title="Month"
      >
        {[
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December",
        ].map((label, idx) => (
          <option key={label} value={idx}>{label}</option>
        ))}
      </select>

      <select
        className="bg-muted text-foreground border border-border rounded-lg px-2 py-1.5 text-sm w-[110px] focus:outline-none focus:ring-2 focus:ring-primary/20"
        value={y}
        onChange={(e) => {
          const ny = clamp(parseInt(e.target.value, 10), MIN_YEAR, MAX_YEAR);
          onChange({ y: ny, m });
        }}
        title="Year"
      >
        {years.map((yy) => (
          <option key={yy} value={yy}>{yy}</option>
        ))}
      </select>
    </div>
  );
}

interface CalendarGridProps {
  y: number;
  m: number;
  fromDate: Date | null;
  toDate: Date | null;
  hoverDate: Date | null;
  onHover: (date: Date) => void;
  onPick: (date: Date) => void;
  today: Date;
}

function CalendarGrid({
  y,
  m,
  fromDate,
  toDate,
  hoverDate,
  onHover,
  onPick,
  today
}: CalendarGridProps) {
  const cells = buildMonthMatrix(y, m);

  const isFuture = (d: Date | null): d is Date => !!d && d > today;

  const isSameDay = (a: Date | null, b: Date | null): boolean =>
    !!a && !!b && a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const inHoverRange = (d: Date | null): boolean => {
    if (!d || !fromDate || toDate) return false;
    if (d <= today && hoverDate) {
      const start = fromDate < hoverDate ? fromDate : hoverDate;
      const end = fromDate < hoverDate ? hoverDate : fromDate;
      return d > start && d < end;
    }
    return false;
  };

  const inFinalRange = (d: Date | null): boolean => {
    if (!d || !fromDate || !toDate) return false;
    return d > fromDate && d < toDate;
  };

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2 text-muted-foreground text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
          <div key={w} className="text-center font-medium">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, idx) => {
          const disabled = !d || isFuture(d);
          let className = "h-8 flex items-center justify-center text-sm rounded-lg cursor-pointer select-none transition-all duration-150 text-foreground hover:bg-muted";
          
          if (d && isSameDay(d, fromDate)) {
            className += " bg-primary text-primary-foreground font-semibold";
          } else if (d && isSameDay(d, toDate)) {
            className += " bg-primary text-primary-foreground font-semibold";
          } else if (d && inHoverRange(d)) {
            className += " bg-primary/10";
          } else if (d && inFinalRange(d)) {
            className += " bg-primary/10";
          } else if (disabled) {
            className += " text-muted-foreground/50 pointer-events-none bg-transparent";
          }

          return (
            <div
              key={idx}
              className={className}
              onMouseEnter={() => d && !disabled && onHover(d)}
              onClick={() => d && !disabled && onPick(d)}
            >
              {d ? d.getDate() : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DateRangeDropdownProps {
  setFDate: (date: string) => void;
  setTDate: (date: string) => void;
}

export default function DateRangeDropdown({ setFDate, setTDate }: DateRangeDropdownProps) {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState<MonthYear>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [right, setRight] = useState<MonthYear>(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  useEffect(() => {
    const leftAbs = left.y * 12 + left.m;
    const rightAbs = right.y * 12 + right.m;
    if (rightAbs < leftAbs) {
      setRight(left);
    }
  }, [left, right]);

  const handlePick = (d: Date) => {
    if (!fromDate || (fromDate && toDate)) {
      setFromDate(d);
      setToDate(null);
      setHoverDate(null);
      return;
    }
    if (d > fromDate) {
      setToDate(d);
      setFDate(`${fmt(fromDate)}`);
      setTDate(`${fmt(d)}`);
    } else {
      setFromDate(d);
      setToDate(null);
      setHoverDate(null);
    }
  };

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const label = fromDate && toDate
    ? `${fmt(fromDate)} → ${fmt(toDate)}`
    : "Select Range";

  return (
    <div className="relative w-full sm:w-auto" ref={ref}>
      <button 
        className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto bg-card text-foreground border border-border px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted text-sm font-medium touch-manipulation"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="truncate">{label}</span>
        <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 top-1/2 sm:top-full -translate-y-1/2 sm:translate-y-0 sm:mt-2 bg-card border border-border rounded-xl p-4 w-auto sm:w-[560px] max-w-[calc(100vw-2rem)] shadow-lg z-50 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-muted/50 border border-border rounded-lg p-3">
              <MonthYearControls
                y={left.y}
                m={left.m}
                onChange={({ y, m }) => {
                  const ny = clamp(y, MIN_YEAR, MAX_YEAR);
                  setLeft({ y: ny, m });
                }}
              />
              <CalendarGrid
                y={left.y}
                m={left.m}
                fromDate={fromDate}
                toDate={toDate}
                hoverDate={hoverDate}
                onHover={setHoverDate}
                onPick={handlePick}
                today={today}
              />
            </div>

            <div className="bg-muted/50 border border-border rounded-lg p-3">
              <MonthYearControls
                y={right.y}
                m={right.m}
                onChange={({ y, m }) => {
                  const ny = clamp(y, MIN_YEAR, MAX_YEAR);
                  setRight({ y: ny, m });
                }}
              />
              <CalendarGrid
                y={right.y}
                m={right.m}
                fromDate={fromDate}
                toDate={toDate}
                hoverDate={hoverDate}
                onHover={setHoverDate}
                onPick={handlePick}
                today={today}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-border">
            <button
              className="bg-transparent text-muted-foreground border border-border px-4 py-2.5 rounded-lg cursor-pointer hover:bg-muted transition-colors text-sm font-medium touch-manipulation"
              onClick={() => {
                setFromDate(null);
                setToDate(null);
                setHoverDate(null);
              }}
            >
              Clear
            </button>
            <button 
              className="bg-primary text-primary-foreground border-none px-4 py-2.5 rounded-lg cursor-pointer font-medium text-sm hover:bg-primary/90 transition-colors touch-manipulation"
              onClick={() => setOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}