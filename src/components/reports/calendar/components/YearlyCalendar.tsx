// YearlyCalendar.tsx
import React, { useState } from 'react';

interface DayData {
  pnl: number;
  trades: number;
  hasNote: boolean;
}

interface YearlyCalendarProps {
  currentYear?: number;
  selectedMonth?: number;
  setSelectedMonth: (month: number) => void;
  data?: Record<string, DayData>;
}

const YearlyCalendar: React.FC<YearlyCalendarProps> = ({
  currentYear = new Date().getFullYear(),
  selectedMonth,
  setSelectedMonth,
  data = {},
}) => {
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const getDayPnlColor = (dayOfMonth: number, monthIndex: number): string => {
    const dateKey = new Date(currentYear, monthIndex, dayOfMonth)
      .toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      .replace(/\//g, '-');

    const pnlValue = data?.[dateKey]?.pnl;
    
    if (pnlValue === undefined || pnlValue === null) {
      return '#161616';
    } else if (pnlValue > 0) {
      return '#10b981';
    } else if (pnlValue < 0) {
      return '#ef4444';
    } else {
      return '#1e3a8a';
    }
  };

  const renderMonth = (monthIndex: number) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const monthName = monthNames[monthIndex];
    const daysInMonth = getDaysInMonth(currentYear, monthIndex);
    const firstDay = getFirstDayOfMonth(currentYear, monthIndex);
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = [];
    let dayCounter = 1;

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="border border-transparent rounded-lg p-2 text-center"></div>);
    }

    while (dayCounter <= daysInMonth) {
      days.push(
        <div
          key={dayCounter}
          className="border border-gray-700 rounded-lg p-2 text-center text-sm cursor-pointer transition-all duration-200 text-white"
          style={{
            backgroundColor: getDayPnlColor(dayCounter, monthIndex),
          }}
        >
          {dayCounter}
        </div>
      );
      dayCounter++;
    }

    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    for (let i = daysInMonth + firstDay; i < totalCells; i++) {
      days.push(<div key={`empty-end-${i}`} className="border border-transparent rounded-lg p-2 text-center"></div>);
    }

    return (
      <div
        className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-lg transition-all duration-200 cursor-pointer"
        key={monthIndex}
        onClick={() => {
          setSelectedMonth(monthIndex);
        }}
        style={{ borderColor: selectedMonth === monthIndex ? 'blue' : '#374151' }}
      >
        <h3 className="text-base font-medium text-center mb-2">{monthName}</h3>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {daysOfWeek.map((day, index) => (
            <div key={index} className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{days}</div>
      </div>
    );
  };

  return (
    <div className="p-5 font-sans text-white bg-gray-900 rounded-xl border border-gray-800 shadow-lg overflow-hidden">
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-800">
        <h3 className="text-base font-medium">YEAR</h3>
        <div className="flex items-center gap-2">
          <span className="text-base font-medium">{currentYear}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-5">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((monthIndex) =>
          renderMonth(monthIndex)
        )}
      </div>
    </div>
  );
};

export default YearlyCalendar;