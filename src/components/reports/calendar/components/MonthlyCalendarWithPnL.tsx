// MonthlyCalendarWithPnL.tsx
import React, { useState, useEffect } from "react";

interface DayData {
  pnl: number;
  trades: number;
  hasNote: boolean;
}

interface MonthlyCalendarWithPnLProps {
  year?: number;
  monthIndex?: number;
  data?: Record<string, DayData>;
}

const MonthlyCalendarWithPnL: React.FC<MonthlyCalendarWithPnLProps> = ({
  year = new Date().getFullYear(),
  monthIndex = new Date().getMonth(),
  data = {},
}) => {
  const [pnlData, setPnlData] = useState<Record<string, DayData>>({});

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthName = monthNames[monthIndex];

  useEffect(() => {
    setPnlData(data);
  }, [data]);

  const getDaysInMonth = (): number => {
    return new Date(year, monthIndex + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (): number => {
    return new Date(year, monthIndex, 1).getDay();
  };

  const renderDayCell = (day: number) => {
    if (day <= 0 || day > getDaysInMonth()) {
      return (
        <div key={day} className="border border-transparent aspect-square rounded-lg"></div>
      );
    }

    const dateString = new Date(year, monthIndex, day)
      .toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-");

    const dayData = pnlData[dateString] || {
      pnl: 0,
      trades: 0,
      hasNote: false,
    };

    const { pnl, trades, hasNote } = dayData;

    let cellClass = "border rounded-lg p-2 aspect-square flex flex-col items-center justify-center cursor-pointer transition-all duration-200";

    if (pnl > 0) {
      cellClass += " bg-green-500/10 border-green-500 hover:bg-green-500/20";
    } else if (pnl < 0) {
      cellClass += " bg-red-500/10 border-red-500 hover:bg-red-500/20";
    } else if (pnl === 0 && trades !== 0) {
      cellClass += " bg-blue-500/10 border-blue-500 hover:bg-blue-500/20";
    } else if (pnl === 0 && trades === 0) {
      cellClass += " bg-gray-800 border-gray-700 hover:bg-gray-700";
    }

    return (
      <div className={cellClass}>
        <div className="text-gray-500 text-xs font-medium mb-1">{day}</div>
        <div className="flex flex-col items-center justify-center w-full gap-1">
          {hasNote && (
            <div className="mb-1 flex items-center justify-center w-6 h-6 bg-gray-800 rounded-full border border-gray-700 hover:border-green-500 transition-all duration-200">
              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.66699 4.79199C6.32533 4.79199 6.04199 4.50866 6.04199 4.16699V2.5C6.04199 2.15833 6.32533 1.87499 6.66699 1.87499H13.3337C13.6753 1.87499 13.9587 2.15833 13.9587 2.5V4.16699C13.9587 4.50866 13.6753 4.79199 13.3337 4.79199H6.66699ZM13.3337 18.125H6.66699C6.32533 18.125 6.04199 17.8417 6.04199 17.5V5.41699H13.9587V17.5C13.9587 17.8417 13.6753 18.125 13.3337 18.125ZM11.6667 13.3333H8.33366V15H11.6667V13.3333Z"
                  fill="#666666"
                />
              </svg>
            </div>
          )}
          <div
            className={`text-sm font-medium text-center ${
              pnl >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {pnl >= 0 ? "+" : ""}$
            {Math.abs(pnl).toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="text-gray-500 text-xs text-center font-medium">
            {trades} trade{trades !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    );
  };

  const daysInMonth = getDaysInMonth();
  const firstDay = getFirstDayOfMonth();
  const weeks = [];
  
  // Calculate number of weeks needed
  const totalCells = getDaysInMonth() + firstDay;
  const totalWeeks = Math.ceil(totalCells / 7);

  let dayCounter = 1 - firstDay;

  for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex++) {
    const weekDays = [];
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      weekDays.push(renderDayCell(dayCounter));
      dayCounter++;
    }
    weeks.push(
      <div key={`week-${weekIndex}`} className="grid grid-cols-7 gap-2">
        {weekDays}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-5 shadow-lg border border-gray-800 transition-all duration-200 hover:border-green-500 w-full max-w-full">
      <h3 className="text-white text-base font-medium text-center mb-4">
        {monthName} {year}
      </h3>
      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
          <div
            key={index}
            className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">{weeks}</div>
    </div>
  );
};

export default MonthlyCalendarWithPnL;