"use client"

import React, { useState, useEffect } from "react"
import { FileText } from 'lucide-react'

interface DayData {
  pnl: number
  trades: number
  hasNote: boolean
}

interface MonthlyCalendarWithPnLProps {
  year?: number
  monthIndex?: number
  data?: Record<string, DayData>
}

const MonthlyCalendarWithPnL: React.FC<MonthlyCalendarWithPnLProps> = ({
  year = new Date().getFullYear(),
  monthIndex = new Date().getMonth(),
  data = {},
}) => {
  const [pnlData, setPnlData] = useState<Record<string, DayData>>({})

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  const monthName = monthNames[monthIndex]

  useEffect(() => {
    setPnlData(data)
  }, [data])

  const getDaysInMonth = (): number => {
    return new Date(year, monthIndex + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (): number => {
    return new Date(year, monthIndex, 1).getDay()
  }

  const renderDayCell = (day: number) => {
    if (day <= 0 || day > getDaysInMonth()) {
      return (
        <div key={day} className="aspect-square rounded-lg"></div>
      )
    }

    const dateString = new Date(year, monthIndex, day)
      .toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-")

    const dayData = pnlData[dateString] || {
      pnl: 0,
      trades: 0,
      hasNote: false,
    }

    const { pnl, trades, hasNote } = dayData

    let cellClass = "rounded-lg p-2 aspect-square flex flex-col items-center justify-center cursor-pointer transition-all border"

    if (pnl > 0) {
      cellClass += " bg-profit/10 border-profit/30 hover:bg-profit/20"
    } else if (pnl < 0) {
      cellClass += " bg-loss/10 border-loss/30 hover:bg-loss/20"
    } else if (pnl === 0 && trades !== 0) {
      cellClass += " bg-primary/10 border-primary/30 hover:bg-primary/20"
    } else {
      cellClass += " bg-muted/30 border-border hover:bg-muted/50"
    }

    return (
      <div className={cellClass}>
        <div className="text-muted-foreground text-xs font-medium mb-1">{day}</div>
        <div className="flex flex-col items-center justify-center w-full gap-0.5">
          {hasNote && (
            <div className="mb-1 w-5 h-5 bg-muted rounded-full flex items-center justify-center">
              <FileText className="w-3 h-3 text-muted-foreground" />
            </div>
          )}
          <div
            className={`text-xs font-semibold text-center ${
              pnl > 0 ? "text-profit" : pnl < 0 ? "text-loss" : "text-muted-foreground"
            }`}
          >
            {pnl >= 0 ? "+" : ""}$
            {Math.abs(pnl).toLocaleString("en-US", {
              maximumFractionDigits: 0,
            })}
          </div>
          <div className="text-muted-foreground text-[10px] text-center">
            {trades} trade{trades !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    )
  }

  const daysInMonth = getDaysInMonth()
  const firstDay = getFirstDayOfMonth()
  const weeks = []

  const totalCells = getDaysInMonth() + firstDay
  const totalWeeks = Math.ceil(totalCells / 7)

  let dayCounter = 1 - firstDay

  for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex++) {
    const weekDays = []
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      weekDays.push(renderDayCell(dayCounter))
      dayCounter++
    }
    weeks.push(
      <div key={`week-${weekIndex}`} className="grid grid-cols-7 gap-2">
        {weekDays}
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground text-center">
          {monthName} {year}
        </h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
            <div
              key={index}
              className="bg-muted/50 rounded-lg p-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">{weeks}</div>
      </div>
    </div>
  )
}

export default MonthlyCalendarWithPnL
