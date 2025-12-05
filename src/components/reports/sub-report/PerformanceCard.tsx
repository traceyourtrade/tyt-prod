"use client"

import React from 'react'
import { TrendingUp, TrendingDown, Activity, Trophy } from 'lucide-react'

interface PerformanceCardProps {
  title: string
  day: string
  trades: number
  pnl?: string
  icon: 'trending-up' | 'trending-down' | 'activity' | 'user-check'
  variant: 'profit' | 'loss' | 'warning' | 'primary'
}

const PerformanceCard: React.FC<PerformanceCardProps> = ({ title, day, trades, pnl, icon, variant }) => {
  const getIcon = (iconType: string) => {
    const iconClasses: Record<string, string> = {
      profit: 'text-profit',
      loss: 'text-loss',
      warning: 'text-warning',
      primary: 'text-primary',
    }
    const iconColor = iconClasses[variant] || 'text-primary'
    const iconClass = `h-4 w-4 ${iconColor}`

    switch (iconType) {
      case 'trending-up': 
        return <TrendingUp className={iconClass} />
      case 'trending-down': 
        return <TrendingDown className={iconClass} />
      case 'activity': 
        return <Activity className={iconClass} />
      case 'user-check': 
        return <Trophy className={iconClass} />
      default: 
        return <Activity className={iconClass} />
    }
  }

  const accentClasses: Record<string, string> = {
    profit: 'bg-profit',
    loss: 'bg-loss',
    warning: 'bg-warning',
    primary: 'bg-primary',
  }

  const iconBgClasses: Record<string, string> = {
    profit: 'bg-profit/10',
    loss: 'bg-loss/10',
    warning: 'bg-warning/10',
    primary: 'bg-primary/10',
  }

  const isProfit = pnl && !pnl.startsWith('-')
  const isLoss = pnl && pnl.startsWith('-')

  return (
    <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all duration-200">
      {/* Color accent bar */}
      <div className={`h-1 ${accentClasses[variant] || 'bg-primary'}`} />
      
      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBgClasses[variant] || 'bg-primary/10'}`}>
            {getIcon(icon)}
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </span>
        </div>

        {/* Day */}
        <div className="text-lg font-bold text-foreground mb-2">{day}</div>

        {/* Stats */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {trades} trades
          </span>
          {pnl && (
            <span className={`text-sm font-semibold ${
              isLoss ? 'text-loss' : 'text-profit'
            }`}>
              {pnl}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default PerformanceCard
