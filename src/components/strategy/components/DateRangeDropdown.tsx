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
    <div className="flex justify-between gap-2 items-center mb-1.5">
      <select
        className="bg-[#171717] text-[#e8e8e8] border border-[#2b2b2b] rounded-lg px-2 py-1.5 text-sm"
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
        className="bg-[#171717] text-[#e8e8e8] border border-[#2b2b2b] rounded-lg px-2 py-1.5 text-sm w-[110px]"
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
      <div className="grid grid-cols-7 gap-1 mb-1.5 text-[#8a8a8a] text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
          <div key={w} className="text-center">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, idx) => {
          const disabled = !d || isFuture(d);
          let className = "h-8 flex items-center justify-center text-sm rounded-lg cursor-pointer select-none transition-all duration-150 text-[#d2d2d2] hover:bg-white/6";
          
          if (d && isSameDay(d, fromDate)) {
            className += " bg-[#b281ff] text-[#0e0e0e] font-semibold rounded-xl";
          } else if (d && isSameDay(d, toDate)) {
            className += " bg-[#b281ff] text-[#0e0e0e] font-semibold rounded-xl";
          } else if (d && inHoverRange(d)) {
            className += " bg-white/8";
          } else if (d && inFinalRange(d)) {
            className += " bg-white/8";
          } else if (disabled) {
            className += " text-[#5a5a5a] pointer-events-none bg-transparent";
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
    <div className="relative" ref={ref}>
      <button 
        className="bg-[#1f1f1f] text-white border border-[#2a2a2a] px-3.5 py-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-[#232323] active:scale-98"
        onClick={() => setOpen((o) => !o)}
      >
        {label} ▾
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-[#121212] border border-[#2b2b2b] rounded-xl p-3.5 w-[560px] shadow-2xl z-30 animate-fadeIn">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0e0e0e] border border-[#262626] rounded-lg p-2.5">
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

            <div className="bg-[#0e0e0e] border border-[#262626] rounded-lg p-2.5">
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

          <div className="flex justify-end gap-2.5 mt-3">
            <button
              className="bg-transparent text-[#bdbdbd] border border-[#2c2c2c] px-3 py-2 rounded-lg cursor-pointer"
              onClick={() => {
                setFromDate(null);
                setToDate(null);
                setHoverDate(null);
              }}
            >
              Clear
            </button>
            <button 
              className="bg-gradient-to-r from-[#d57eeb] to-[#fccb90] text-[#141414] border-none px-3.5 py-2 rounded-lg cursor-pointer font-semibold"
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