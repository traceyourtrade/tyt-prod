"use client"

import React from 'react'

interface DayData {
  pnl: number
  trades: number
  hasNote: boolean
}

interface YearlyCalendarProps {
  currentYear?: number
  selectedMonth?: number
  setSelectedMonth: (month: number) => void
  data?: Record<string, DayData>
}

const YearlyCalendar: React.FC<YearlyCalendarProps> = ({
  currentYear = new Date().getFullYear(),
  selectedMonth,
  setSelectedMonth,
  data = {},
}) => {
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay()
  }

  const getDayPnlClass = (dayOfMonth: number, monthIndex: number): string => {
    const dateKey = new Date(currentYear, monthIndex, dayOfMonth)
      .toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      .replace(/\//g, '-')

    const pnlValue = data?.[dateKey]?.pnl

    if (pnlValue === undefined || pnlValue === null) {
      return 'bg-muted text-muted-foreground'
    } else if (pnlValue > 0) {
      return 'bg-profit text-primary-foreground'
    } else if (pnlValue < 0) {
      return 'bg-loss text-primary-foreground'
    } else {
      return 'bg-primary text-primary-foreground'
    }
  }

  const renderMonth = (monthIndex: number) => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]

    const monthName = monthNames[monthIndex]
    const daysInMonth = getDaysInMonth(currentYear, monthIndex)
    const firstDay = getFirstDayOfMonth(currentYear, monthIndex)
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    const days = []
    let dayCounter = 1

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-4 h-4"></div>)
    }

    while (dayCounter <= daysInMonth) {
      const dayClass = getDayPnlClass(dayCounter, monthIndex)
      days.push(
        <div
          key={dayCounter}
          className={`w-4 h-4 rounded-sm text-[8px] flex items-center justify-center font-medium ${dayClass}`}
        >
          {dayCounter}
        </div>
      )
      dayCounter++
    }

    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7
    for (let i = daysInMonth + firstDay; i < totalCells; i++) {
      days.push(<div key={`empty-end-${i}`} className="w-4 h-4"></div>)
    }

    const isSelected = selectedMonth === monthIndex

    return (
      <div
        key={monthIndex}
        onClick={() => setSelectedMonth(monthIndex)}
        className={`bg-muted/30 rounded-lg p-3 cursor-pointer transition-all border-2 ${
          isSelected 
            ? 'border-primary shadow-lg shadow-primary/10' 
            : 'border-transparent hover:border-border'
        }`}
      >
        <h3 className={`text-xs font-semibold text-center mb-2 ${
          isSelected ? 'text-primary' : 'text-foreground'
        }`}>
          {monthName}
        </h3>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {daysOfWeek.map((day, index) => (
            <div key={index} className="w-4 h-4 text-[8px] font-medium text-muted-foreground text-center">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">{days}</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((monthIndex) =>
        renderMonth(monthIndex)
      )}
    </div>
  )
}

export default YearlyCalendar
