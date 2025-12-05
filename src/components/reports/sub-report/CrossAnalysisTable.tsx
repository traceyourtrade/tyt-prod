"use client"

import React, { useState } from 'react'
import { Grid3X3, BarChart2, DollarSign, Activity } from 'lucide-react'

interface CrossAnalysisTableProps {
  data: Array<{
    day: string
    values: string[]
  }>
  symbols: string[]
}

const CrossAnalysisTable: React.FC<CrossAnalysisTableProps> = ({ data, symbols }) => {
  const [selectedOption, setSelectedOption] = useState<string>('Top 10')

  const options = [
    { id: 'Top 10', label: 'Top 10 Symbols', icon: Grid3X3 },
    { id: 'Win Rate', label: 'Win Rate', icon: BarChart2 },
    { id: 'P&L', label: 'P&L', icon: DollarSign },
    { id: 'Trades', label: 'Trades', icon: Activity },
  ]

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Grid3X3 className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Cross Analysis</h3>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const Icon = option.icon
            const isActive = selectedOption === option.id
            return (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center border-b border-border">
                Days
              </th>
              {symbols.map((symbol, index) => (
                <th 
                  key={index} 
                  className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center border-b border-border"
                >
                  {symbol}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3 text-sm font-medium text-foreground text-center">
                  {row.day}
                </td>
                {row.values.map((value, colIndex) => {
                  const isNegative = value.startsWith('-')
                  const isZero = value === '$0' || value === '$0.00'
                  return (
                    <td
                      key={colIndex}
                      className="px-4 py-3 text-center"
                    >
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                        isNegative 
                          ? 'bg-loss/10 text-loss' 
                          : isZero 
                            ? 'bg-muted text-muted-foreground' 
                            : 'bg-profit/10 text-profit'
                      }`}>
                        {value}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CrossAnalysisTable
