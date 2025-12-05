"use client"

import { Info } from 'lucide-react'

type Props = {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  children?: React.ReactNode
}

export default function OVChartCard({ title, subtitle, icon, children }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {subtitle && (
              <span className="text-xs text-muted-foreground uppercase">{subtitle}</span>
            )}
          </div>
        </div>
        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <Info className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      
      {/* Chart Content */}
      <div className="p-4">
        <div className="h-72 w-full">
          {children}
        </div>
      </div>
    </div>
  )
}
