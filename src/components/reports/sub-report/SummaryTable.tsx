"use client"

import React from 'react'
import { Table } from 'lucide-react'

interface SummaryTableRow {
  day: string
  winPercent: string
  netPnl: string
  tradeCount: number
  avgDailyVolume: string
  avgWin: string
  avgLoss: string
}

interface SummaryTableProps {
  data: SummaryTableRow[]
}

const SummaryTable: React.FC<SummaryTableProps> = ({ data }) => {
  const headers = ['Days', 'Win %', 'Net P&L', 'Trade Count', 'Avg Daily Volume', 'Avg Win', 'Avg Loss']

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Table className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Summary</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              {headers.map((header, index) => (
                <th 
                  key={index} 
                  className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center border-b border-border"
                >
                  {header}
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
                <td className="px-4 py-3 text-sm text-foreground text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {row.winPercent}%
                  </span>
                </td>
                <td className={`px-4 py-3 text-sm font-semibold text-center ${
                  row.netPnl.startsWith('-') ? 'text-loss' : 'text-profit'
                }`}>
                  {row.netPnl}
                </td>
                <td className="px-4 py-3 text-sm text-foreground text-center">
                  {row.tradeCount}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground text-center">
                  {row.avgDailyVolume}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-profit text-center">
                  {row.avgWin}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-loss text-center">
                  {row.avgLoss}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SummaryTable
