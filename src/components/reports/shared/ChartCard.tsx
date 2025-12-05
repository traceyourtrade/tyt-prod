"use client"

import { Info } from 'lucide-react'

type Props = {
  title?: string
  children?: React.ReactNode
  className?: string
  subtitle?: string
  icon?: React.ReactNode
}

export default function ChartCard({ title, children, className = '', subtitle, icon }: Props) {
  return (
    <div className={`bg-card rounded-xl border border-border overflow-hidden ${className}`}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                {icon}
              </div>
            )}
            <div>
              {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
              {subtitle && <span className="text-xs text-muted-foreground uppercase">{subtitle}</span>}
            </div>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <Info className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}
      
      {/* Content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}
