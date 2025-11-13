import React, { useEffect, useMemo, useRef, useState } from "react";
import "./dateRangePicker.css";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const MIN_YEAR = 1970;
const MAX_YEAR = 2100;

function buildMonthMatrix(year, month) {
  // month: 0-11
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay(); // 0 sun .. 6 sat
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  // leading blanks
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  // days
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  // trailing blanks to fill grid
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function MonthYearControls({ y, m, onChange }) {
  const years = useMemo(
    () => Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i),
    []
  );
  return (
    <div className="cal-header">
      <select
        className="cal-select"
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
        className="cal-select cal-year"
        value={y}
        onChange={(e) => {
          let ny = clamp(parseInt(e.target.value, 10), MIN_YEAR, MAX_YEAR);
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

function CalendarGrid({
  y,
  m,
  fromDate,
  toDate,
  hoverDate,
  onHover,
  onPick,
  today
}) {
  const cells = buildMonthMatrix(y, m);

  const isFuture = (d) => d && d > today;

  const isSameDay = (a, b) =>
    a && b && a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const inHoverRange = (d) => {
    if (!d || !fromDate || toDate) return false;
    if (d <= today && hoverDate) {
      const start = fromDate < hoverDate ? fromDate : hoverDate;
      const end = fromDate < hoverDate ? hoverDate : fromDate;
      return d > start && d < end;
    }
    return false;
  };

  const inFinalRange = (d) => {
    if (!d || !fromDate || !toDate) return false;
    return d > fromDate && d < toDate;
  };

  return (
    <div className="calendar">
      <div className="weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
          <div key={w} className="weekday">{w}</div>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((d, idx) => {
          const disabled = !d || isFuture(d);
          const classes = [
            "day",
            d && isSameDay(d, fromDate) ? "from" : "",
            d && isSameDay(d, toDate) ? "to" : "",
            d && inHoverRange(d) ? "hover-range" : "",
            d && inFinalRange(d) ? "in-range" : "",
            disabled ? "disabled" : "",
          ].join(" ");

          return (
            <div
              key={idx}
              className={classes}
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

export default function DateRangeDropdown({ setFDate, setTDate }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const [open, setOpen] = useState(false);

  // default left = previous month, right = current month
  const [left, setLeft] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [right, setRight] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  // selections
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);

  // keep right calendar >= left calendar
  useEffect(() => {
    const leftAbs = left.y * 12 + left.m;
    const rightAbs = right.y * 12 + right.m;
    if (rightAbs < leftAbs) {
      setRight(left);
    }
  }, [left, right]);

  const handlePick = (d) => {
    if (!fromDate || (fromDate && toDate)) {
      setFromDate(d);
      setToDate(null);
      setHoverDate(null);
      return;
    }
    if (d > fromDate) {
      setToDate(d);
      // alert(`From: ${fmt(fromDate)} To: ${fmt(d)}`);

      setFDate(`${fmt(fromDate)}`)
      setTDate(`${fmt(d)}`)

    } else {
      // if clicked earlier than fromDate, treat as new fromDate
      setFromDate(d);
      setToDate(null);
      setHoverDate(null);
    }
  };

  // close when clicking outside
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // display label
  const label = fromDate && toDate
    ? `${fmt(fromDate)} → ${fmt(toDate)}`
    : "Select Range";

  return (
    <div className="range-dropdown-container" ref={ref}>
      <button className="range-toggle" onClick={() => setOpen((o) => !o)}>
        {label} ▾
      </button>

      {open && (
        <div className="range-menu">
          <div className="cal-wrapper">
            <div className="cal-panel">
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

            <div className="cal-panel">
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

          <div className="range-actions">
            <button
              className="ghost"
              onClick={() => {
                setFromDate(null);
                setToDate(null);
                setHoverDate(null);
              }}
            >
              Clear
            </button>
            <button className="primary" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
