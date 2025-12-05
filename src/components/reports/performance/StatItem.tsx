"use client"

import { useState } from 'react'
import { Info } from 'lucide-react'

type Props = {
  label: string
  value: string | number
  icon?: React.ReactNode
  infoTooltip?: string
  variant?: 'default' | 'profit' | 'loss'
}

export default function StatItem({ 
  label, 
  value, 
  icon,
  infoTooltip = '',
  variant = 'default'
}: Props) {
  const [showTooltip, setShowTooltip] = useState(false)

  const valueColorClass = 
    variant === 'profit' ? 'text-profit' :
    variant === 'loss' ? 'text-loss' :
    'text-foreground'

  return (
    <div className="bg-muted/30 hover:bg-muted/50 border border-border rounded-xl p-4 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="text-muted-foreground group-hover:text-primary transition-colors">
              {icon}
            </div>
          )}
          <span className="text-sm text-muted-foreground font-medium">{label}</span>
        </div>
        {infoTooltip && (
          <div 
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors" />
            {showTooltip && (
              <div className="absolute right-0 top-6 z-50 w-48 bg-popover text-popover-foreground text-xs p-2.5 rounded-lg shadow-lg border border-border animate-fade-in">
                {infoTooltip}
              </div>
            )}
          </div>
        )}
      </div>
      <div className={`mt-2 text-xl md:text-2xl font-bold tracking-tight ${valueColorClass}`}>
        {value}
      </div>
    </div>
  )
}
